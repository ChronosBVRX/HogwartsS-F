
-- ==========================================
-- 08_HSF_DUEL_PVP_FLOW.SQL
-- Implementación del flujo de sala de espera PvP
-- ==========================================

-- 1. Limpiar funciones anteriores para evitar error de tipos
-- (Importante para cambiar el retorno de UUID a JSONB)
drop function if exists public.hsf_create_pvp_duel();
drop function if exists public.hsf_join_pvp_duel(text);

-- 2. Actualizar tabla hsf_duels
alter table public.hsf_duels
add column if not exists player_one_ready boolean not null default false,
add column if not exists player_two_ready boolean not null default false;

-- 3. Nueva hsf_create_pvp_duel
create or replace function hsf_create_pvp_duel()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_duel_id uuid;
  v_invite_code text;
begin
  -- Generar código aleatorio de 6 caracteres
  v_invite_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  
  insert into hsf_duels (
    mode, 
    status, 
    player_one, 
    invite_code, 
    player_one_hp, 
    player_two_hp, 
    player_one_energy, 
    player_two_energy,
    turn_number
  )
  values (
    'pvp', 
    'waiting', 
    auth.uid(), 
    v_invite_code, 
    100, 
    100, 
    1, 
    1,
    1
  )
  returning id into v_duel_id;

  return jsonb_build_object(
    'duel_id', v_duel_id,
    'invite_code', v_invite_code
  );
end;
$$;

-- 4. Nueva hsf_join_pvp_duel
create or replace function hsf_join_pvp_duel(p_invite_code text)
returns uuid
language plpgsql
security definer
as $$
declare
  v_duel_id uuid;
begin
  select id into v_duel_id 
  from hsf_duels 
  where invite_code = upper(p_invite_code) 
    and status = 'waiting' 
    and player_two is null
    and player_one != auth.uid();

  if not found then
    raise exception 'Código inválido o sala llena';
  end if;

  update hsf_duels 
  set player_two = auth.uid(),
      player_two_ready = false
  where id = v_duel_id;

  return v_duel_id;
end;
$$;

-- 5. Nueva hsf_set_duel_ready
create or replace function hsf_set_duel_ready(p_duel_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_duel record;
begin
  select * into v_duel from hsf_duels where id = p_duel_id;
  
  if not found then raise exception 'Duelo no encontrado'; end if;
  
  if auth.uid() = v_duel.player_one then
    update hsf_duels set player_one_ready = true where id = p_duel_id;
  elsif auth.uid() = v_duel.player_two then
    update hsf_duels set player_two_ready = true where id = p_duel_id;
  else
    raise exception 'No eres parte de este duelo';
  end if;

  -- Refrescar v_duel
  select * into v_duel from hsf_duels where id = p_duel_id;

  -- Si ambos están listos, activar duelo
  if v_duel.player_one_ready and v_duel.player_two_ready and v_duel.player_two is not null then
    update hsf_duels 
    set status = 'active',
        turn_number = 1,
        updated_at = now()
    where id = p_duel_id;
  end if;

  return jsonb_build_object('status', 'success');
end;
$$;
