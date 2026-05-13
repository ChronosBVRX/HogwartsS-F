
-- ============================================================
-- 09_hsf_active_zones_protection.sql
-- Restricción de zonas mágicas a solo las 5 operativas.
-- Implementación de Vista y Refuerzo de Seguridad.
-- ============================================================

-- 1. Crear Vista Protegida para el Panel de Administrador
-- Esta vista filtra automáticamente las zonas inactivas.
CREATE OR REPLACE VIEW public.hsf_active_adventure_zones AS
SELECT
  id,
  slug,
  name,
  floor_number,
  description,
  qr_token,
  poster_title,
  poster_subtitle,
  active,
  created_at,
  updated_at
FROM public.hsf_adventure_zones
WHERE active = true
ORDER BY
  floor_number ASC NULLS LAST,
  name ASC;

-- 2. Sincronizar Zonas Operativas (Gryffindor, Slytherin, Gran Comedor, Callejón Diagon, Disney)
-- Desactivamos cualquier zona que no sea una de estas 5.
UPDATE public.hsf_adventure_zones
SET
  active = CASE
    WHEN slug IN (
      'gryffindor',
      'slytherin',
      'gran-comedor',
      'callejon-diagon',
      'disney'
    )
    THEN true
    ELSE false
  END,
  updated_at = now();

-- 3. Reforzar hsf_scan_adventure_zone para bloquear zonas inactivas
-- Si intentan escanear un token o slug de una zona 'active = false', la función fallará.
-- Nota: Usamos CREATE OR REPLACE para actualizar la lógica interna.
CREATE OR REPLACE FUNCTION public.hsf_scan_adventure_zone(
  p_zone_slug text,
  p_zone_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_zone record;
  v_run record;
  v_step record;
  v_customer_id uuid;
  v_adv_id uuid;
  v_today_completed boolean;
begin
  v_customer_id := auth.uid();
  if v_customer_id is null then
    return jsonb_build_object('ok', false, 'message', 'Debes iniciar sesión.');
  end if;

  -- 1. Validar Zona y que esté ACTIVA
  select * into v_zone from public.hsf_adventure_zones 
  where slug = p_zone_slug and qr_token = p_zone_token;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Portal no encontrado o token inválido.');
  end if;

  if v_zone.active = false then
    return jsonb_build_object('ok', false, 'message', 'Esta zona mágica no está activa actualmente.');
  end if;

  -- 2. Verificar límites diarios (Límite 1 vez al día)
  select exists (
    select 1 from public.hsf_adventure_runs 
    where customer_id = v_customer_id 
      and (status = 'completed' or status = 'abandoned')
      and created_at::date = now()::date
  ) into v_today_completed;

  if v_today_completed then
    return jsonb_build_object('ok', false, 'message', 'Ya has realizado tu aventura del día. Vuelve mañana.');
  end if;

  -- 3. Buscar o Crear Corrida
  select * into v_run from public.hsf_adventure_runs 
  where customer_id = v_customer_id and status = 'active'
  order by created_at desc limit 1;

  if not found then
    -- Elegir una aventura al azar que requiera esta zona como inicio (order 1)
    -- O simplemente una aventura que use esta zona.
    select adventure_id into v_adv_id from public.hsf_adventure_steps 
    where required_zone_id = v_zone.id and step_order = 1 
    order by random() limit 1;

    if v_adv_id is null then
      -- Fallback: cualquier aventura que empiece en esta zona
      select adventure_id into v_adv_id from public.hsf_adventure_steps 
      where required_zone_id = v_zone.id order by random() limit 1;
    end if;

    if v_adv_id is null then
       return jsonb_build_object('ok', false, 'message', 'No hay aventuras disponibles para esta zona.');
    end if;

    insert into public.hsf_adventure_runs (customer_id, adventure_id, current_step_order, last_scanned_step_order, status)
    values (v_customer_id, v_adv_id, 1, 1, 'active')
    returning * into v_run;
  else
    -- Validar si esta zona es la que toca escanear
    select * into v_step from public.hsf_adventure_steps 
    where adventure_id = v_run.adventure_id and step_order = v_run.current_step_order;

    if v_step.required_zone_id <> v_zone.id then
      return jsonb_build_object('ok', false, 'message', 'Este no es el portal que buscas. Revisa tu pista.');
    end if;

    update public.hsf_adventure_runs 
    set last_scanned_step_order = v_run.current_step_order, updated_at = now() 
    where id = v_run.id
    returning * into v_run;
  end if;

  -- Devolver el paso actual
  select * into v_step from public.hsf_adventure_steps 
  where adventure_id = v_run.adventure_id and step_order = v_run.current_step_order;

  return jsonb_build_object(
    'ok', true,
    'run_id', v_run.id,
    'message', '¡Portal abierto!',
    'step', jsonb_build_object(
      'id', v_step.id,
      'step_order', v_step.step_order,
      'narrator_name', v_step.narrator_name,
      'narrator_line', v_step.narrator_line,
      'story_text', v_step.story_text,
      'question', v_step.question,
      'options', v_step.options,
      'difficulty', v_step.difficulty
    )
  );
end;
$$;

-- 4. Verificación
SELECT
  slug,
  name,
  floor_number,
  active,
  qr_token,
  poster_title,
  poster_subtitle
FROM public.hsf_adventure_zones
ORDER BY
  active DESC,
  floor_number ASC NULLS LAST,
  name ASC;
