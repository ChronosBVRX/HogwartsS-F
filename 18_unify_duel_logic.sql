
-- ==========================================
-- 18_unify_duel_logic.sql
-- Unificación de reglas de Duelos Mágicos
-- ==========================================

-- 1. Actualizar hsf_submit_duel_strategy para separar AP y Energía
create or replace function hsf_submit_duel_strategy(
  p_duel_id uuid,
  p_turn_number int,
  p_actions jsonb,
  p_stance text default 'neutral'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_duel record;
  v_existing_turn record;
  v_total_ap int := 0;
  v_total_energy_cost int := 0;
  v_action jsonb;
  v_spell_key text;
  v_cd_val int;
  v_primary_spell_key text;
begin
  v_user_id := auth.uid();
  
  -- 1. Validaciones Básicas
  select * into v_duel from hsf_duels where id = p_duel_id;
  if not found then raise exception 'Duelo no encontrado'; end if;
  if v_duel.status != 'active' then raise exception 'El duelo ya no está activo'; end if;
  if v_duel.turn_number != p_turn_number then raise exception 'Número de turno incorrecto'; end if;
  
  -- 1b. Validar Pertenencia
  if v_user_id != v_duel.player_one and v_user_id != v_duel.player_two then
    raise exception 'No perteneces a este duelo';
  end if;
  if v_duel.mode = 'ai' and v_user_id != v_duel.player_one then
    raise exception 'No puedes enviar acciones por la IA';
  end if;

  -- 2. Validar Stance
  if p_stance not in ('neutral', 'offensive', 'defensive', 'concentrated', 'cunning', 'desperate') then
    raise exception 'Postura inválida: %', p_stance;
  end if;

  -- 3. Verificar si ya envió turno
  select * into v_existing_turn from hsf_duel_turns 
  where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_user_id;
  if found then raise exception 'Ya has enviado tu estrategia para este turno'; end if;

  -- 4. Validar Acciones (Formato, AP, Energía, Cooldowns)
  if jsonb_typeof(p_actions) != 'array' then
    raise exception 'Las acciones deben ser un arreglo JSON';
  end if;
  if jsonb_array_length(p_actions) = 0 then raise exception 'Debes elegir al menos una acción'; end if;

  for v_action in select * from jsonb_array_elements(p_actions) loop
    if v_action->>'type' != 'spell' then raise exception 'Solo se permiten acciones tipo spell'; end if;
    v_spell_key := v_action->>'key';
    
    -- Validar Cooldown
    v_cd_val := case 
      when v_user_id = v_duel.player_one then (v_duel.player_one_cooldowns->>v_spell_key)::int
      else (v_duel.player_two_cooldowns->>v_spell_key)::int
    end;
    if coalesce(v_cd_val, 0) > 0 then raise exception 'El hechizo % está en cooldown (% turnos)', v_spell_key, v_cd_val; end if;

    -- Calcular AP y Energía (Nuevas Reglas)
    case v_spell_key
      when 'expelliarmus' then v_total_ap := v_total_ap + 1; v_total_energy_cost := v_total_energy_cost + 1;
      when 'stupefy'      then v_total_ap := v_total_ap + 2; v_total_energy_cost := v_total_energy_cost + 2;
      when 'protego'      then v_total_ap := v_total_ap + 1; v_total_energy_cost := v_total_energy_cost + 1;
      when 'petrificus'   then v_total_ap := v_total_ap + 2; v_total_energy_cost := v_total_energy_cost + 2;
      when 'incendio'     then v_total_ap := v_total_ap + 2; v_total_energy_cost := v_total_energy_cost + 2;
      when 'episkey'      then v_total_ap := v_total_ap + 2; v_total_energy_cost := v_total_energy_cost + 2;
      when 'accio'        then v_total_ap := v_total_ap + 1; v_total_energy_cost := v_total_energy_cost + 0;
      when 'finite'       then v_total_ap := v_total_ap + 1; v_total_energy_cost := v_total_energy_cost + 1;
      when 'confundus'    then v_total_ap := v_total_ap + 2; v_total_energy_cost := v_total_energy_cost + 2;
      when 'rictusempra'  then v_total_ap := v_total_ap + 1; v_total_energy_cost := v_total_energy_cost + 1;
      else raise exception 'Hechizo desconocido: %', v_spell_key;
    end case;
  end loop;

  if v_total_ap > 2 then raise exception 'Has excedido los 2 AP permitidos'; end if;
  
  if v_user_id = v_duel.player_one then
    if v_total_energy_cost > v_duel.player_one_energy then raise exception 'Energía insuficiente'; end if;
  else
    if v_total_energy_cost > v_duel.player_two_energy then raise exception 'Energía insuficiente'; end if;
  end if;

  -- 5. Insertar
  v_primary_spell_key := p_actions->0->>'key';
  insert into hsf_duel_turns (duel_id, turn_number, player_id, spell_key, actions, stance)
  values (p_duel_id, p_turn_number, v_user_id, v_primary_spell_key, p_actions, p_stance);

  -- 6. Resolución
  if v_duel.mode = 'ai' then
    perform hsf_resolve_duel_turn(p_duel_id, p_turn_number);
    return jsonb_build_object('status', 'resolved_ai');
  end if;

  select count(*) into v_total_ap from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number;
  if v_total_ap >= 2 then
    perform hsf_resolve_duel_turn(p_duel_id, p_turn_number);
    return jsonb_build_object('status', 'resolved_pvp');
  end if;

  return jsonb_build_object('status', 'waiting');
end;
$$;


-- 2. Actualizar hsf_resolve_duel_turn con valores de postura unificados y payload enriquecido
create or replace function hsf_resolve_duel_turn(p_duel_id uuid, p_turn_number int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_duel record;
  v_p1_turn record; v_p2_turn record;
  v_p1_house text; v_p2_house text;
  v_p2_actions jsonb; v_p2_stance text;
  
  -- Stats acumuladas P1
  v_p1_dmg int := 0; v_p1_blk int := 0; v_p1_heal int := 0; v_p1_cost int := 0; v_p1_gain int := 0;
  -- Stats acumuladas P2
  v_p2_dmg int := 0; v_p2_blk int := 0; v_p2_heal int := 0; v_p2_cost int := 0; v_p2_gain int := 0;
  
  -- Familias (para ventajas)
  v_p1_fams text[] := '{}'; v_p2_fams text[] := '{}';
  v_p1_beats text[] := '{}'; v_p2_beats text[] := '{}';
  v_p1_loses text[] := '{}'; v_p2_loses text[] := '{}';
  
  -- Modificadores de Postura
  v_p1_stance_dmg_bonus int := 0; v_p1_stance_blk_bonus int := 0; v_p1_stance_dmg_taken_penalty int := 0; v_p1_stance_dmg_penalty int := 0;
  v_p2_stance_dmg_bonus int := 0; v_p2_stance_blk_bonus int := 0; v_p2_stance_dmg_taken_penalty int := 0; v_p2_stance_dmg_penalty int := 0;
  
  v_p1_cd jsonb := '{}'::jsonb; v_p2_cd jsonb := '{}'::jsonb;
  v_cd_key text; v_cd_val int;
  
  v_p1_total_dmg int := 0; v_p2_total_dmg int := 0;
  v_p1_final_blk int := 0; v_p2_final_blk int := 0;
  v_p1_strategy_bonus int := 0; v_p2_strategy_bonus int := 0;
  v_p1_total_penalty int := 0; v_p2_total_penalty int := 0;
  
  v_action jsonb; v_spell_key text;
  v_p1_interrupted boolean := false; v_p2_interrupted boolean := false;
  v_ai_rand float;
  v_winner_id uuid := NULL;
begin
  select * into v_duel from hsf_duels where id = p_duel_id;
  
  -- IA DINÁMICA
  if v_duel.mode = 'ai' then 
    v_ai_rand := random();
    if v_duel.player_two_hp < 30 and v_duel.player_two_energy >= 2 then v_p2_actions := '[{"type": "spell", "key": "episkey"}]'::jsonb; v_p2_stance := 'defensive';
    elsif v_duel.player_two_energy < 1 then v_p2_actions := '[{"type": "spell", "key": "accio"}]'::jsonb; v_p2_stance := 'concentrated';
    elsif v_duel.player_one_energy >= 2 and v_ai_rand < 0.5 then v_p2_actions := '[{"type": "spell", "key": "protego"}]'::jsonb; v_p2_stance := 'defensive';
    elsif v_duel.player_two_energy >= 2 and v_ai_rand < 0.6 then v_p2_actions := '[{"type": "spell", "key": "stupefy"}]'::jsonb; v_p2_stance := 'offensive';
    else v_p2_actions := '[{"type": "spell", "key": "rictusempra"}]'::jsonb; v_p2_stance := 'neutral'; end if;
  else
    select * into v_p2_turn from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_duel.player_two;
    v_p2_actions := coalesce(v_p2_turn.actions, '[]'::jsonb);
    v_p2_stance := coalesce(v_p2_turn.stance, 'neutral');
  end if;

  select * into v_p1_turn from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_duel.player_one;

  -- 1. Posturas (Nuevos Valores Unificados)
  -- P1
  case v_p1_turn.stance
    when 'offensive' then v_p1_stance_dmg_bonus := 5; v_p1_stance_dmg_taken_penalty := 4;
    when 'defensive' then v_p1_stance_blk_bonus := 8; v_p1_stance_dmg_penalty := 4;
    when 'desperate' then 
      if v_duel.player_one_hp < 25 then v_p1_stance_dmg_bonus := 6; else v_p1_stance_dmg_penalty := 3; end if;
    else null;
  end case;
  -- P2
  case v_p2_stance
    when 'offensive' then v_p2_stance_dmg_bonus := 5; v_p2_stance_dmg_taken_penalty := 4;
    when 'defensive' then v_p2_stance_blk_bonus := 8; v_p2_stance_dmg_penalty := 4;
    when 'desperate' then 
      if v_duel.player_two_hp < 25 then v_p2_stance_dmg_bonus := 6; else v_p2_stance_dmg_penalty := 3; end if;
    else null;
  end case;

  -- 2. Procesar Hechizos y Cooldowns
  -- P1
  for v_action in select * from jsonb_array_elements(v_p1_turn.actions) loop
    v_spell_key := v_action->>'key';
    if v_spell_key = 'expelliarmus' then v_p1_dmg := v_p1_dmg + 12; v_p1_cost := v_p1_cost + 1; v_p1_fams := array_append(v_p1_fams, 'disarm'); v_p1_beats := v_p1_beats || '{heavy, attack}'::text[]; v_p1_loses := v_p1_loses || '{defense}'::text[];
    elsif v_spell_key = 'stupefy' then v_p1_dmg := v_p1_dmg + 30; v_p1_cost := v_p1_cost + 2; v_p1_cd := v_p1_cd || '{"stupefy": 2}'::jsonb; v_p1_fams := array_append(v_p1_fams, 'heavy'); v_p1_beats := v_p1_beats || '{heal, charge}'::text[]; v_p1_loses := v_p1_loses || '{disarm, defense}'::text[];
    elsif v_spell_key = 'protego' then v_p1_blk := v_p1_blk + 22; v_p1_cost := v_p1_cost + 1; v_p1_fams := array_append(v_p1_fams, 'defense'); v_p1_beats := v_p1_beats || '{attack, heavy}'::text[]; v_p1_loses := v_p1_loses || '{control}'::text[];
    elsif v_spell_key = 'accio' then v_p1_gain := v_p1_gain + 2; if v_p1_turn.stance = 'concentrated' then v_p1_gain := v_p1_gain + 1; end if; v_p1_fams := array_append(v_p1_fams, 'charge'); v_p1_beats := v_p1_beats || '{counter}'::text[]; v_p1_loses := v_p1_loses || '{attack, heavy}'::text[];
    elsif v_spell_key = 'episkey' then v_p1_heal := v_p1_heal + 20; v_p1_cost := v_p1_cost + 2; v_p1_cd := v_p1_cd || '{"episkey": 3}'::jsonb; v_p1_fams := array_append(v_p1_fams, 'heal'); v_p1_beats := v_p1_beats || '{defense}'::text[]; v_p1_loses := v_p1_loses || '{heavy}'::text[];
    elsif v_spell_key = 'incendio' then v_p1_dmg := v_p1_dmg + 14; v_p1_cost := v_p1_cost + 2; v_p1_fams := array_append(v_p1_fams, 'attack'); v_p1_beats := v_p1_beats || '{charge}'::text[]; v_p1_loses := v_p1_loses || '{defense}'::text[];
    elsif v_spell_key = 'finite' then v_p1_dmg := v_p1_dmg + 8; v_p1_cost := v_p1_cost + 1; v_p1_gain := v_p1_gain + 1; v_p1_fams := array_append(v_p1_fams, 'counter'); v_p1_beats := v_p1_beats || '{control}'::text[]; v_p1_loses := v_p1_loses || '{attack}'::text[];
    elsif v_spell_key = 'rictusempra' then v_p1_dmg := v_p1_dmg + 12; v_p1_cost := v_p1_cost + 1; v_p1_fams := array_append(v_p1_fams, 'attack'); v_p1_beats := v_p1_beats || '{charge}'::text[]; v_p1_loses := v_p1_loses || '{defense}'::text[];
    end if;
  end loop;
  -- P2
  for v_action in select * from jsonb_array_elements(v_p2_actions) loop
    v_spell_key := v_action->>'key';
    if v_spell_key = 'expelliarmus' then v_p2_dmg := v_p2_dmg + 12; v_p2_cost := v_p2_cost + 1; v_p2_fams := array_append(v_p2_fams, 'disarm'); v_p2_beats := v_p2_beats || '{heavy, attack}'::text[]; v_p2_loses := v_p2_loses || '{defense}'::text[];
    elsif v_spell_key = 'stupefy' then v_p2_dmg := v_p2_dmg + 30; v_p2_cost := v_p2_cost + 2; v_p2_cd := v_p2_cd || '{"stupefy": 2}'::jsonb; v_p2_fams := array_append(v_p2_fams, 'heavy'); v_p2_beats := v_p2_beats || '{heal, charge}'::text[]; v_p2_loses := v_p2_loses || '{disarm, defense}'::text[];
    elsif v_spell_key = 'protego' then v_p2_blk := v_p2_blk + 22; v_p2_cost := v_p2_cost + 1; v_p2_fams := array_append(v_p2_fams, 'defense'); v_p2_beats := v_p2_beats || '{attack, heavy}'::text[]; v_p2_loses := v_p2_loses || '{control}'::text[];
    elsif v_spell_key = 'accio' then v_p2_gain := v_p2_gain + 2; if v_p2_stance = 'concentrated' then v_p2_gain := v_p2_gain + 1; end if; v_p2_fams := array_append(v_p2_fams, 'charge'); v_p2_beats := v_p2_beats || '{counter}'::text[]; v_p2_loses := v_p2_loses || '{attack, heavy}'::text[];
    elsif v_spell_key = 'episkey' then v_p2_heal := v_p2_heal + 20; v_p2_cost := v_p2_cost + 2; v_p2_cd := v_p2_cd || '{"episkey": 3}'::jsonb; v_p2_fams := array_append(v_p2_fams, 'heal'); v_p2_beats := v_p2_beats || '{defense}'::text[]; v_p2_loses := v_p2_loses || '{heavy}'::text[];
    elsif v_spell_key = 'incendio' then v_p2_dmg := v_p2_dmg + 14; v_p2_cost := v_p2_cost + 2; v_p2_fams := array_append(v_p2_fams, 'attack'); v_p2_beats := v_p2_beats || '{charge}'::text[]; v_p2_loses := v_p2_loses || '{defense}'::text[];
    elsif v_spell_key = 'finite' then v_p2_dmg := v_p2_dmg + 8; v_p2_cost := v_p2_cost + 1; v_p2_gain := v_p2_gain + 1; v_p2_fams := array_append(v_p2_fams, 'counter'); v_p2_beats := v_p2_beats || '{control}'::text[]; v_p2_loses := v_p2_loses || '{attack}'::text[];
    elsif v_spell_key = 'rictusempra' then v_p2_dmg := v_p2_dmg + 12; v_p2_cost := v_p2_cost + 1; v_p2_fams := array_append(v_p2_fams, 'attack'); v_p2_beats := v_p2_beats || '{charge}'::text[]; v_p2_loses := v_p2_loses || '{defense}'::text[];
    end if;
  end loop;

  -- 3. Ventaja Estratégica
  -- P1 vs P2
  if v_p2_fams && v_p1_beats then 
    v_p1_strategy_bonus := 10;
    if v_p1_turn.stance = 'cunning' then v_p1_strategy_bonus := v_p1_strategy_bonus + 4; end if;
    if (v_p1_fams && '{disarm}'::text[]) and (v_p2_fams && '{heavy}'::text[]) then v_p2_dmg := floor(v_p2_dmg * 0.5); v_p2_interrupted := true; end if;
    if (v_p1_fams && '{control}'::text[]) and (v_p2_fams && '{defense}'::text[]) then v_p2_blk := 0; end if;
  end if;
  -- P2 vs P1
  if v_p1_fams && v_p2_beats then 
    v_p2_strategy_bonus := 10;
    if v_p2_stance = 'cunning' then v_p2_strategy_bonus := v_p2_strategy_bonus + 4; end if;
    if (v_p2_fams && '{disarm}'::text[]) and (v_p1_fams && '{heavy}'::text[]) then v_p1_dmg := floor(v_p1_dmg * 0.5); v_p1_interrupted := true; end if;
    if (v_p2_fams && '{control}'::text[]) and (v_p1_fams && '{defense}'::text[]) then v_p1_blk := 0; end if;
  end if;

  -- 4. Cálculo Final
  v_p1_final_blk := v_p1_blk + v_p1_stance_blk_bonus;
  v_p2_final_blk := v_p2_blk + v_p2_stance_blk_bonus;
  
  v_p1_total_dmg := greatest(0, v_p1_dmg + v_p1_stance_dmg_bonus + v_p1_strategy_bonus - v_p1_stance_dmg_penalty - v_p2_final_blk);
  v_p2_total_dmg := greatest(0, v_p2_dmg + v_p2_stance_dmg_bonus + v_p2_strategy_bonus - v_p2_stance_dmg_penalty - v_p1_final_blk);

  -- Si no hay hechizo de ataque, no hay daño total
  if v_p1_dmg <= 0 then v_p1_total_dmg := 0; end if;
  if v_p2_dmg <= 0 then v_p2_total_dmg := 0; end if;

  -- 5. Aplicar a Tabla
  update hsf_duels set 
    player_one_hp = least(100, greatest(0, player_one_hp - v_p2_total_dmg + v_p1_heal)),
    player_two_hp = least(100, greatest(0, player_two_hp - v_p1_total_dmg + v_p2_heal)),
    player_one_energy = least(5, greatest(0, player_one_energy - v_p1_cost + v_p1_gain)),
    player_two_energy = least(5, greatest(0, player_two_energy - v_p2_cost + v_p2_gain)),
    turn_number = turn_number + 1
  where id = p_duel_id returning * into v_duel;

  -- 6. Evento de Turno Enriquecido
  insert into hsf_duel_events (duel_id, turn_number, event_type, payload)
  values (p_duel_id, p_turn_number, 'turn_resolved', jsonb_build_object(
    'p1_actions', v_p1_turn.actions, 
    'p2_actions', v_p2_actions,
    'p1_stance', v_p1_turn.stance,
    'p2_stance', v_p2_stance,
    'p1_damage', v_p2_total_dmg, 
    'p2_damage', v_p1_total_dmg,
    'p1_damage_dealt', v_p1_total_dmg,
    'p2_damage_dealt', v_p2_total_dmg,
    'p1_blocked', v_p1_final_blk,
    'p2_blocked', v_p2_final_blk,
    'p1_heal', v_p1_heal, 
    'p2_heal', v_p2_heal,
    'p1_energy_change', v_p1_gain - v_p1_cost,
    'p2_energy_change', v_p2_gain - v_p2_cost,
    'p1_strategy_bonus', v_p1_strategy_bonus,
    'p2_strategy_bonus', v_p2_strategy_bonus,
    'p1_stance_bonus', v_p1_stance_dmg_bonus,
    'p2_stance_bonus', v_p2_stance_dmg_bonus,
    'p1_penalty', v_p1_stance_dmg_taken_penalty + v_p1_stance_dmg_penalty,
    'p2_penalty', v_p2_stance_dmg_taken_penalty + v_p2_stance_dmg_penalty,
    'p1_interrupted', v_p1_interrupted,
    'p2_interrupted', v_p2_interrupted,
    'message', '¡Intercambio mágico resuelto!'
  ));

  -- 7. Verificar Ganador
  if v_duel.player_one_hp <= 0 or v_duel.player_two_hp <= 0 or v_duel.turn_number > 12 then
    if v_duel.player_one_hp > v_duel.player_two_hp then v_winner_id := v_duel.player_one;
    elsif v_duel.player_two_hp > v_duel.player_one_hp then v_winner_id := v_duel.player_two; end if;
    update hsf_duels set status = 'finished', winner_id = v_winner_id where id = p_duel_id;
    perform hsf_finish_duel_rewards(p_duel_id);
  end if;

  return jsonb_build_object('status', 'resolved');
end;
$$;
