
-- ==========================================
-- 1. RESOLUCIÓN DE TURNOS (SEGURIDAD)
-- ==========================================

create or replace function hsf_submit_duel_action(
  p_duel_id uuid,
  p_spell_key text,
  p_item_key text default null,
  p_used_focus boolean default false
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user uuid := auth.uid();
  v_duel record;
  v_is_p1 boolean;
  v_spell record;
  v_opponent_spell_key text;
  v_result jsonb;
begin
  -- 1. Validaciones básicas
  select * into v_duel from hsf_duels where id = p_duel_id;
  if not found then raise exception 'Duelo no encontrado'; end if;
  if v_duel.status != 'active' then raise exception 'El duelo no está activo'; end if;
  
  v_is_p1 := (v_user = v_duel.player_one);
  if not v_is_p1 and v_user != v_duel.player_two then
    raise exception 'No participas en este duelo';
  end if;

  -- 2. Guardar elección de turno
  insert into hsf_duel_turns (duel_id, turn_number, player_id, spell_key, item_key, used_focus)
  values (p_duel_id, v_duel.turn_number, v_user, p_spell_key, p_item_key, p_used_focus)
  on conflict (duel_id, turn_number, player_id) 
  do update set spell_key = p_spell_key;

  -- 3. Si es modo AI, generar respuesta automática y resolver inmediatamente
  if v_duel.mode = 'ai' then
    -- Aquí podrías llamar a una lógica de IA más compleja, 
    -- por ahora usamos una simplificada o 'protego' por defecto si no hay motor en SQL
    v_opponent_spell_key := 'protego'; 
    
    -- Insertar turno de la IA (un bot fijo o uuid nulo)
    -- Para IA simplificamos: el RPC resuelve directamente contra el jugador
    
    -- Llamar a la función de resolución (se define abajo)
    v_result := hsf_resolve_duel_turn(p_duel_id, v_duel.turn_number);
    return v_result;
  end if;

  -- 4. Si es PvP, revisar si el oponente ya envió su turno
  if exists (
    select 1 from hsf_duel_turns 
    where duel_id = p_duel_id 
    and turn_number = v_duel.turn_number 
    and player_id != v_user
  ) then
    -- Ambos listos, resolver
    v_result := hsf_resolve_duel_turn(p_duel_id, v_duel.turn_number);
    return v_result;
  else
    return jsonb_build_object('status', 'waiting_opponent');
  end if;
end;
$$;

-- ==========================================
-- 2. LÓGICA DE CÁLCULO DE DAÑO (BACKEND)
-- ==========================================

create or replace function hsf_resolve_duel_turn(p_duel_id uuid, p_turn_number int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_duel record;
  v_p1_turn record;
  v_p2_turn record;
  v_p1_dmg int := 0;
  v_p2_dmg int := 0;
  v_p1_heal int := 0;
  v_p2_heal int := 0;
  v_msg text;
  v_winner_id uuid := null;
  v_new_status text := 'active';
begin
  select * into v_duel from hsf_duels where id = p_duel_id;
  
  -- Obtener turnos
  select * into v_p1_turn from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_duel.player_one;
  
  if v_duel.mode = 'ai' then
     -- Simular turno de IA si no existe en hsf_duel_turns
     v_p2_turn := row(null, p_duel_id, p_turn_number, null, 'stupefy', null, false);
  else
     select * into v_p2_turn from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_duel.player_two;
  end if;

  -- LÓGICA SIMPLIFICADA DE DAÑO (Debe expandirse con la tabla de hechizos)
  -- Aquí implementamos una base, en producción se cruza con hsf_duel_items o una tabla de spells
  v_p1_dmg := 15; -- Base para ejemplo
  v_p2_dmg := 15;

  -- Aplicar ventajas básicas (Piedra papel tijera interno)
  -- (Simulado: Stupefy > Expelliarmus > Protego > Stupefy)
  if v_p1_turn.spell_key = 'stupefy' and v_p2_turn.spell_key = 'expelliarmus' then v_p1_dmg := 25; v_p2_dmg := 5; end if;
  if v_p1_turn.spell_key = 'protego' then v_p2_dmg := v_p2_dmg - 10; end if;

  -- Actualizar vidas
  update hsf_duels
  set 
    player_one_hp = max(0, player_one_hp - v_p2_dmg + v_p1_heal),
    player_two_hp = max(0, player_two_hp - v_p1_dmg + v_p2_heal),
    player_one_energy = min(5, player_one_energy + 1),
    player_two_energy = min(5, player_two_energy + 1),
    turn_number = turn_number + 1,
    last_event = jsonb_build_object(
      'message', 'Hechizos lanzados: ' || v_p1_turn.spell_key || ' vs ' || v_p2_turn.spell_key,
      'p1_dmg', v_p2_dmg,
      'p2_dmg', v_p1_dmg
    )
  where id = p_duel_id
  returning * into v_duel;

  -- Revisar fin de duelo
  if v_duel.player_one_hp <= 0 or v_duel.player_two_hp <= 0 or v_duel.turn_number > 12 then
    v_new_status := 'finished';
    if v_duel.player_one_hp > v_duel.player_two_hp then v_winner_id := v_duel.player_one;
    elsif v_duel.player_two_hp > v_duel.player_one_hp then v_winner_id := v_duel.player_two;
    end if;
    
    update hsf_duels set status = 'finished', winner_id = v_winner_id, finished_at = now() where id = p_duel_id;
    
    -- Dar recompensas
    perform hsf_finish_duel_rewards(p_duel_id);
  end if;

  -- Registrar evento
  insert into hsf_duel_events (duel_id, turn_number, event_type, payload)
  values (p_duel_id, p_turn_number, 'turn_resolved', jsonb_build_object(
    'p1_spell', v_p1_turn.spell_key,
    'p2_spell', v_p2_turn.spell_key,
    'p1_damage', v_p2_dmg,
    'p2_damage', v_p1_dmg,
    'message', '¡El choque de magias resuena en la arena!'
  ));

  return jsonb_build_object('status', 'resolved');
end;
$$;

-- ==========================================
-- 3. RECOMPENSAS ATÓMICAS (SEGURIDAD)
-- ==========================================

create or replace function hsf_finish_duel_rewards(p_duel_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_duel record;
  v_shard_gain int;
  v_mmr_gain int := 20;
begin
  select * into v_duel from hsf_duels where id = p_duel_id;
  if v_duel.status != 'finished' then return; end if;

  -- Recompensas Player One
  v_shard_gain := case when v_duel.winner_id = v_duel.player_one then 15 else 5 end;
  
  update hsf_duel_profiles
  set 
    wins = wins + (case when v_duel.winner_id = v_duel.player_one then 1 else 0 end),
    losses = losses + (case when v_duel.winner_id = v_duel.player_one then 0 else 1 end),
    duel_shards = duel_shards + v_shard_gain,
    mmr = mmr + (case when v_duel.winner_id = v_duel.player_one then v_mmr_gain else -10 end),
    duels_played = duels_played + 1
  where user_id = v_duel.player_one;

  -- Sumar puntos a la casa
  insert into hsf_duel_house_points (house_slug, month_key, points)
  values (v_duel.player_one_house, to_char(now(), 'YYYY-MM'), v_shard_gain)
  on conflict (house_slug, month_key) 
  do update set points = hsf_duel_house_points.points + v_shard_gain;

  -- Repetir para Player Two si no es AI
  if v_duel.mode = 'pvp' then
    v_shard_gain := case when v_duel.winner_id = v_duel.player_two then 15 else 5 end;
    
    update hsf_duel_profiles
    set 
      wins = wins + (case when v_duel.winner_id = v_duel.player_two then 1 else 0 end),
      losses = losses + (case when v_duel.winner_id = v_duel.player_two then 0 else 1 end),
      duel_shards = duel_shards + v_shard_gain,
      mmr = mmr + (case when v_duel.winner_id = v_duel.player_two then v_mmr_gain else -10 end),
      duels_played = duels_played + 1
    where user_id = v_duel.player_two;

    insert into hsf_duel_house_points (house_slug, month_key, points)
    values (v_duel.player_two_house, to_char(now(), 'YYYY-MM'), v_shard_gain)
    on conflict (house_slug, month_key) 
    do update set points = hsf_duel_house_points.points + v_shard_gain;
  end if;
end;
$$;

-- ==========================================
-- 4. COMPRA SEGURA (TIENDA)
-- ==========================================

create or replace function hsf_purchase_duel_item(p_item_key text, p_currency text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user uuid := auth.uid();
  v_item record;
  v_profile record;
  v_duel_profile record;
begin
  select * into v_item from hsf_duel_items where item_key = p_item_key and is_active = true;
  if not found then return jsonb_build_object('success', false, 'error', 'Item no disponible'); end if;

  select * into v_profile from hsf_profiles where user_id = v_user;
  select * into v_duel_profile from hsf_duel_profiles where user_id = v_user;

  if p_currency = 'shards' then
    if v_duel_profile.duel_shards < v_item.price_shards then
       return jsonb_build_object('success', false, 'error', 'Fragmentos insuficientes');
    end if;
    update hsf_duel_profiles set duel_shards = duel_shards - v_item.price_shards where user_id = v_user;
  elsif p_currency = 'galleons' then
    if v_profile.loyalty_points < v_item.price_galleons then
       return jsonb_build_object('success', false, 'error', 'Galeones insuficientes');
    end if;
    update hsf_profiles set loyalty_points = loyalty_points - v_item.price_galleons where user_id = v_user;
  else
    return jsonb_build_object('success', false, 'error', 'Moneda no válida');
  end if;

  insert into hsf_duel_inventory (user_id, item_key)
  values (v_user, p_item_key)
  on conflict do nothing;

  return jsonb_build_object('success', true);
end;
$$;
