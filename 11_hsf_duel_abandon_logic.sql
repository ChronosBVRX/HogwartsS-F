-- ============================================================
-- 11_hsf_duel_abandon_logic.sql
-- Proporciona la funcionalidad para abandonar un duelo (IA o PvP)
-- ============================================================

create or replace function public.hsf_abandon_duel(p_duel_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_user uuid := auth.uid();
  v_duel record;
  v_opponent_id uuid;
begin
  -- 1. Validar sesión
  if v_user is null then 
    raise exception 'No autenticado'; 
  end if;

  -- 2. Obtener el duelo y validar participación
  select * into v_duel 
  from public.hsf_duels 
  where id = p_duel_id;

  if not found then
    raise exception 'Duelo no encontrado';
  end if;

  if v_duel.player_one != v_user and (v_duel.player_two is null or v_duel.player_two != v_user) then
    raise exception 'No participas en este duelo';
  end if;

  -- 3. Validar estado (solo se puede abandonar si está activo o esperando)
  if v_duel.status not in ('active', 'waiting') then
    raise exception 'El duelo ya ha terminado o no ha comenzado';
  end if;

  -- 4. Identificar al oponente
  if v_duel.player_one = v_user then
    v_opponent_id := v_duel.player_two;
  else
    v_opponent_id := v_duel.player_one;
  end if;

  -- 5. Actualizar el duelo
  update public.hsf_duels
  set 
    status = 'finished',
    winner_id = v_opponent_id,
    loser_id = v_user,
    finished_at = now(),
    updated_at = now(),
    last_event = jsonb_build_object(
      'type', 'abandon',
      'player_id', v_user,
      'description', 'Un jugador ha abandonado el duelo'
    )
  where id = p_duel_id;

  -- 6. Registrar evento
  insert into public.hsf_duel_events (duel_id, turn_number, event_type, payload)
  values (
    p_duel_id, 
    v_duel.turn_number, 
    'abandon', 
    jsonb_build_object(
      'abandoning_player_id', v_user,
      'winner_id', v_opponent_id,
      'message', 'El duelo terminó por abandono'
    )
  );

  -- 7. Actualizar estadísticas y MMR
  -- Perdedor (quien abandona)
  update public.hsf_duel_profiles
  set 
    losses = case when v_duel.mode = 'pvp' then losses + 1 else losses end,
    ai_losses = case when v_duel.mode = 'ai' then ai_losses + 1 else ai_losses end,
    duels_played = duels_played + 1,
    mmr = case when v_duel.mode = 'pvp' then greatest(800, mmr - 20) else mmr end,
    updated_at = now()
  where user_id = v_user;

  -- Ganador (el oponente, solo si es PvP)
  if v_duel.mode = 'pvp' and v_opponent_id is not null then
    update public.hsf_duel_profiles
    set 
      wins = wins + 1,
      duels_played = duels_played + 1,
      mmr = mmr + 15,
      updated_at = now()
    where user_id = v_opponent_id;
  end if;

end;
$$;
