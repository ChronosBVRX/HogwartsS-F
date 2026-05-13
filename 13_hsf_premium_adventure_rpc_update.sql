
-- ============================================================
-- 13_hsf_premium_adventure_rpc_update.sql
-- Actualización de la lógica de escaneo para el sistema premium.
-- Incluye asignación automática de variantes.
-- ============================================================

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
    -- Elegir una aventura al azar de la temporada actual que empiece en esta zona
    select adventure_id into v_adv_id 
    from public.hsf_current_season_available_adventures v
    join public.hsf_adventure_steps s on s.adventure_id = v.adventure_id
    where s.required_zone_id = v_zone.id and s.step_order = 1 
    order by random() limit 1;

    if v_adv_id is null then
       return jsonb_build_object('ok', false, 'message', 'No hay aventuras de temporada disponibles para esta zona.');
    end if;

    insert into public.hsf_adventure_runs (customer_id, adventure_id, current_step_order, last_scanned_step_order, status)
    values (v_customer_id, v_adv_id, 1, 1, 'active')
    returning * into v_run;
    
    -- ASIGNAR VARIANTES PREMIUM (Obligatorio en sistema premium)
    perform public.hsf_assign_run_step_variants(v_run.id);
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

  -- Devolver el paso actual (usando la vista de resueltos para variantes)
  select * into v_step from public.hsf_adventure_run_steps_resolved 
  where run_id = v_run.id and step_order = v_run.current_step_order;

  return jsonb_build_object(
    'ok', true,
    'run_id', v_run.id,
    'message', '¡Portal abierto!',
    'step', jsonb_build_object(
      'id', v_step.step_id,
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
