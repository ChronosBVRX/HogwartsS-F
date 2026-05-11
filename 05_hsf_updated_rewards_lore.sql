-- ============================================================
-- 05_hsf_updated_rewards_lore.sql
-- Actualización de recompensas con Lore y QR único de casa.
-- ============================================================

-- 1. Modificar hsf_adventure_rewards para manejar mejor el lore y QRs únicos
-- (Ya tenemos status para evitar doble canje)

-- 2. Actualizar Lore de las aventuras existentes (Recompensa de aventura)
-- Agregamos la instrucción de "Reclamar con gerencia"
update public.hsf_adventures 
set completion_text = '¡Felicidades, mago! Has demostrado una astucia e inteligencia dignas de los grandes. Ve y reclama tu recompensa con la gerencia mostrando este pergamino digital.'
where active = true;

-- 3. Función para generar la recompensa de bienvenida de casa (Soda Italiana)
-- Esta función se llamará cuando se asigne una casa por primera vez.
create or replace function public.hsf_grant_house_welcome_reward(p_user_id uuid, p_house_slug text)
returns void
language plpgsql
security definer
as $$
declare
  v_reward_title text;
  v_reward_desc text;
  v_exists boolean;
begin
  -- Verificar si ya recibió una recompensa de bienvenida
  select exists (
    select 1 from public.hsf_adventure_rewards 
    where customer_id = p_user_id and reward_title like '%Bienvenida de Casa%'
  ) into v_exists;

  if v_exists then
    return;
  end if;

  v_reward_title := 'Soda Italiana de Bienvenida: ' || initcap(p_house_slug);
  v_reward_desc := '“No importa lo que somos por nacimiento, sino lo que llegamos a ser”. Disfruta de esta esencia mágica burbujeante para celebrar tu llegada a ' || initcap(p_house_slug) || '. Reclama con gerencia.';

  insert into public.hsf_adventure_rewards (
    run_id, 
    customer_id, 
    reward_title, 
    reward_description, 
    reward_points, 
    min_consumption, 
    status
  )
  values (
    null, -- Recompensa de sistema, no de aventura
    p_user_id,
    v_reward_title,
    v_reward_desc,
    0,
    0,
    'available'
  );
end;
$$;

-- 4. Trigger para otorgar recompensa automáticamente al asignar casa
create or replace function public.tr_hsf_on_house_assignment()
returns trigger
language plpgsql
security definer
as $$
begin
  if (old.house_slug is null and new.house_slug is not null) or (old.house_slug is distinct from new.house_slug) then
    perform public.hsf_grant_house_welcome_reward(new.user_id, new.house_slug);
  end if;
  return new;
end;
$$;

drop trigger if exists hsf_on_house_assignment_trigger on public.hsf_profiles;
create trigger hsf_on_house_assignment_trigger
after update on public.hsf_profiles
for each row execute function public.tr_hsf_on_house_assignment();

-- 5. Actualizar el Mapa del Merodeador (Meta 1,200)
-- No hay una tabla de "metas de mapa" estática, se maneja por lógica de puntos.
-- Pero podemos actualizar la descripción visual en el frontend.
-- Aquí solo aseguramos que el sistema sepa que a los 1,200 hay algo especial.
