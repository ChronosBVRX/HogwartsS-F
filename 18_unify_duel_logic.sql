
-- ==========================================
-- 18_unify_duel_logic.sql
-- Unificación de reglas de Duelos Mágicos v4 (MAESTRO)
-- ==========================================

-- 1. hsf_submit_duel_strategy: Validaciones y procesamiento de energía
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
begin
  v_user_id := auth.uid();
  
  -- Validaciones de Payload
  if jsonb_typeof(p_actions) != 'array' then raise exception 'Las acciones deben ser un arreglo JSON'; end if;
  if jsonb_array_length(p_actions) = 0 then raise exception 'Debes elegir al menos una acción'; end if;

  select * into v_duel from hsf_duels where id = p_duel_id;
  if not found then raise exception 'Duelo no encontrado'; end if;
  if v_duel.status != 'active' then raise exception 'El duelo ya no está activo'; end if;
  if v_duel.turn_number != p_turn_number then raise exception 'Número de turno incorrecto'; end if;
  
  if v_user_id != v_duel.player_one and v_user_id != v_duel.player_two then
    raise exception 'No perteneces a este duelo';
  end if;

  select * into v_existing_turn from hsf_duel_turns 
  where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_user_id;
  if found then raise exception 'Ya has enviado tu estrategia para este turno'; end if;

  for v_action in select * from jsonb_array_elements(p_actions) loop
    v_spell_key := v_action->>'key';
    if v_action->>'type' != 'spell' then raise exception 'Solo se permiten acciones tipo spell'; end if;
    
    v_cd_val := case 
      when v_user_id = v_duel.player_one then (v_duel.player_one_cooldowns->>v_spell_key)::int
      else (v_duel.player_two_cooldowns->>v_spell_key)::int
    end;
    if coalesce(v_cd_val, 0) > 0 then raise exception 'El hechizo % está en cooldown', v_spell_key; end if;

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
  if v_user_id = v_duel.player_one and v_total_energy_cost > v_duel.player_one_energy then raise exception 'Energía insuficiente'; end if;
  if v_user_id = v_duel.player_two and v_total_energy_cost > v_duel.player_two_energy then raise exception 'Energía insuficiente'; end if;

  insert into hsf_duel_turns (duel_id, turn_number, player_id, spell_key, actions, stance)
  values (p_duel_id, p_turn_number, v_user_id, coalesce(p_actions->0->>'key', 'none'), p_actions, p_stance);

  if v_duel.mode = 'ai' then perform hsf_resolve_duel_turn(p_duel_id, p_turn_number); return jsonb_build_object('status', 'resolved_ai'); end if;
  select count(*) into v_total_ap from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number;
  if v_total_ap >= 2 then perform hsf_resolve_duel_turn(p_duel_id, p_turn_number); return jsonb_build_object('status', 'resolved_pvp'); end if;
  return jsonb_build_object('status', 'waiting');
end;
$$;


-- 2. Motor de Resolución Maestro
create or replace function hsf_resolve_duel_turn(p_duel_id uuid, p_turn_number int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_duel record;
  v_p1_turn record; v_p2_turn record;
  v_p2_actions jsonb; v_p2_stance text;
  
  -- Stats
  v_p1_dmg int := 0; v_p1_blk int := 0; v_p1_heal int := 0; v_p1_cost int := 0; v_p1_gain int := 0; v_p1_status_dmg int := 0;
  v_p2_dmg int := 0; v_p2_blk int := 0; v_p2_heal int := 0; v_p2_cost int := 0; v_p2_gain int := 0; v_p2_status_dmg int := 0;
  
  -- Familias y Ventajas
  v_p1_fams text[] := '{}'; v_p2_fams text[] := '{}';
  v_p1_beats text[] := '{}'; v_p2_beats text[] := '{}';
  v_p1_strategy_bonus int := 0; v_p2_strategy_bonus int := 0;
  
  -- Posturas
  v_p1_s_bonus int := 0; v_p1_s_vuln int := 0; v_p1_s_pen int := 0; v_p1_s_blk int := 0;
  v_p2_s_bonus int := 0; v_p2_s_vuln int := 0; v_p2_s_pen int := 0; v_p2_s_blk int := 0;
  
  v_meta jsonb;
  v_p1_burn int := 0; v_p2_burn int := 0; v_p1_weakness int := 0; v_p2_weakness int := 0;
  v_p1_cd jsonb := '{}'::jsonb; v_p2_cd jsonb := '{}'::jsonb;
  v_cd_key text; v_cd_val int;
  
  v_p1_total_dmg int := 0; v_p2_total_dmg int := 0;
  v_p1_pre_blk_dmg int := 0; v_p2_pre_blk_dmg int := 0;
  
  v_action jsonb; v_spell_key text; v_idx int := 0;
  v_p1_interrupted boolean := false; v_p2_interrupted boolean := false;
  v_p1_blocks_action2 boolean := false; v_p2_blocks_action2 boolean := false;
  v_ai_rand float;
begin
  select * into v_duel from hsf_duels where id = p_duel_id;
  v_meta := coalesce(v_duel.metadata, '{}'::jsonb);
  
  -- 1. Estados (True Damage) y Cooldowns
  v_p1_burn := coalesce((v_meta->>'p1_burn')::int, 0); v_p2_burn := coalesce((v_meta->>'p2_burn')::int, 0);
  v_p1_weakness := coalesce((v_meta->>'p1_weakness')::int, 0); v_p2_weakness := coalesce((v_meta->>'p2_weakness')::int, 0);

  if v_p1_burn > 0 then v_p1_status_dmg := 5; v_p1_burn := v_p1_burn - 1; end if;
  if v_p2_burn > 0 then v_p2_status_dmg := 5; v_p2_burn := v_p2_burn - 1; end if;

  for v_cd_key, v_cd_val in select * from jsonb_each_text(v_duel.player_one_cooldowns) loop if v_cd_val::int > 1 then v_p1_cd := v_p1_cd || jsonb_build_object(v_cd_key, v_cd_val::int - 1); end if; end loop;
  for v_cd_key, v_cd_val in select * from jsonb_each_text(v_duel.player_two_cooldowns) loop if v_cd_val::int > 1 then v_p2_cd := v_p2_cd || jsonb_build_object(v_cd_key, v_cd_val::int - 1); end if; end loop;

  -- 2. Turnos e IA
  if v_duel.mode = 'ai' then 
    v_ai_rand := random();
    if v_duel.player_two_hp < 35 then v_p2_actions := '[{"type": "spell", "key": "episkey"}]'::jsonb; v_p2_stance := 'defensive';
    elsif v_duel.player_two_energy < 1 then v_p2_actions := '[{"type": "spell", "key": "accio"}]'::jsonb; v_p2_stance := 'concentrated';
    else v_p2_actions := '[{"type": "spell", "key": "rictusempra"}]'::jsonb; v_p2_stance := 'neutral'; end if;
  else
    select * into v_p2_turn from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_duel.player_two;
    v_p2_actions := coalesce(v_p2_turn.actions, '[]'::jsonb); v_p2_stance := coalesce(v_p2_turn.stance, 'neutral');
  end if;
  select * into v_p1_turn from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_duel.player_one;

  -- 3. Pre-análisis Petrificus
  for v_action in select * from jsonb_array_elements(v_p1_turn.actions) loop if v_action->>'key' = 'petrificus' then v_p2_blocks_action2 := true; end if; end loop;
  for v_action in select * from jsonb_array_elements(v_p2_actions) loop if v_action->>'key' = 'petrificus' then v_p1_blocks_action2 := true; end if; end loop;

  -- 4. Procesar P1
  v_idx := 0;
  for v_action in select * from jsonb_array_elements(v_p1_turn.actions) loop
    v_idx := v_idx + 1;
    if v_idx = 2 and v_p1_blocks_action2 then v_p1_interrupted := true; continue; end if;
    v_spell_key := v_action->>'key';
    if v_spell_key = 'expelliarmus' then v_p1_dmg := v_p1_dmg + 12; v_p1_cost := v_p1_cost + 1; v_p1_fams := array_append(v_p1_fams, 'disarm'); v_p1_beats := v_p1_beats || '{heavy, attack}'::text[]; v_p1_cd := v_p1_cd || '{"expelliarmus": 1}'::jsonb;
    elsif v_spell_key = 'stupefy' then v_p1_dmg := v_p1_dmg + 30; v_p1_cost := v_p1_cost + 2; v_p1_fams := array_append(v_p1_fams, 'heavy'); v_p1_beats := v_p1_beats || '{heal, charge}'::text[]; v_p1_cd := v_p1_cd || '{"stupefy": 2}'::jsonb;
    elsif v_spell_key = 'protego' then v_p1_blk := v_p1_blk + 22; v_p1_cost := v_p1_cost + 1; v_p1_fams := array_append(v_p1_fams, 'defense'); v_p1_beats := v_p1_beats || '{attack, heavy}'::text[]; v_p1_cd := v_p1_cd || '{"protego": 1}'::jsonb;
    elsif v_spell_key = 'petrificus' then v_p1_dmg := v_p1_dmg + 15; v_p1_cost := v_p1_cost + 2; v_p1_fams := array_append(v_p1_fams, 'control'); v_p1_beats := v_p1_beats || '{defense}'::text[]; v_p1_cd := v_p1_cd || '{"petrificus": 2}'::jsonb; v_p2_cost := v_p2_cost + 1;
    elsif v_spell_key = 'incendio' then v_p1_dmg := v_p1_dmg + 14; v_p1_cost := v_p1_cost + 2; v_p1_fams := array_append(v_p1_fams, 'attack'); v_p2_burn := 2; v_p1_cd := v_p1_cd || '{"incendio": 2}'::jsonb;
    elsif v_spell_key = 'episkey' then v_p1_heal := v_p1_heal + 20; v_p1_cost := v_p1_cost + 2; v_p1_fams := array_append(v_p1_fams, 'heal'); v_p1_cd := v_p1_cd || '{"episkey": 3}'::jsonb;
    elsif v_spell_key = 'accio' then v_p1_gain := v_p1_gain + 2; if v_p1_turn.stance = 'concentrated' then v_p1_gain := v_p1_gain + 1; end if; v_p1_fams := array_append(v_p1_fams, 'charge'); v_p1_cd := v_p1_cd || '{"accio": 2}'::jsonb;
    elsif v_spell_key = 'finite' then v_p1_gain := v_p1_gain + 1; v_p1_burn := 0; v_p1_weakness := 0; v_p1_cd := v_p1_cd || '{"finite": 1}'::jsonb;
    elsif v_spell_key = 'confundus' then v_p1_dmg := v_p1_dmg + 6; v_p1_cost := v_p1_cost + 2; v_p1_fams := array_append(v_p1_fams, 'control'); v_p1_cd := v_p1_cd || '{"confundus": 3}'::jsonb;
    elsif v_spell_key = 'rictusempra' then v_p1_dmg := v_p1_dmg + 12; v_p1_cost := v_p1_cost + 1; v_p1_fams := array_append(v_p1_fams, 'attack'); v_p2_weakness := 1; v_p1_cd := v_p1_cd || '{"rictusempra": 1}'::jsonb;
    end if;
  end loop;
  -- Procesar P2
  v_idx := 0;
  for v_action in select * from jsonb_array_elements(v_p2_actions) loop
    v_idx := v_idx + 1;
    if v_idx = 2 and v_p2_blocks_action2 then v_p2_interrupted := true; continue; end if;
    v_spell_key := v_action->>'key';
    if v_spell_key = 'expelliarmus' then v_p2_dmg := v_p2_dmg + 12; v_p2_cost := v_p2_cost + 1; v_p2_fams := array_append(v_p2_fams, 'disarm'); v_p2_beats := v_p2_beats || '{heavy, attack}'::text[]; v_p2_cd := v_p2_cd || '{"expelliarmus": 1}'::jsonb;
    elsif v_spell_key = 'stupefy' then v_p2_dmg := v_p2_dmg + 30; v_p2_cost := v_p2_cost + 2; v_p2_fams := array_append(v_p2_fams, 'heavy'); v_p2_beats := v_p2_beats || '{heal, charge}'::text[]; v_p2_cd := v_p2_cd || '{"stupefy": 2}'::jsonb;
    elsif v_spell_key = 'protego' then v_p2_blk := v_p2_blk + 22; v_p2_cost := v_p2_cost + 1; v_p2_fams := array_append(v_p2_fams, 'defense'); v_p2_beats := v_p2_beats || '{attack, heavy}'::text[]; v_p2_cd := v_p2_cd || '{"protego": 1}'::jsonb;
    elsif v_spell_key = 'petrificus' then v_p2_dmg := v_p2_dmg + 15; v_p2_cost := v_p2_cost + 2; v_p2_fams := array_append(v_p2_fams, 'control'); v_p2_beats := v_p2_beats || '{defense}'::text[]; v_p2_cd := v_p2_cd || '{"petrificus": 2}'::jsonb; v_p1_cost := v_p1_cost + 1;
    elsif v_spell_key = 'incendio' then v_p2_dmg := v_p2_dmg + 14; v_p2_cost := v_p2_cost + 2; v_p2_fams := array_append(v_p2_fams, 'attack'); v_p1_burn := 2; v_p2_cd := v_p2_cd || '{"incendio": 2}'::jsonb;
    elsif v_spell_key = 'episkey' then v_p2_heal := v_p2_heal + 20; v_p2_cost := v_p2_cost + 2; v_p2_fams := array_append(v_p2_fams, 'heal'); v_p2_cd := v_p2_cd || '{"episkey": 3}'::jsonb;
    elsif v_spell_key = 'accio' then v_p2_gain := v_p2_gain + 2; if v_p2_stance = 'concentrated' then v_p2_gain := v_p2_gain + 1; end if; v_p2_fams := array_append(v_p2_fams, 'charge'); v_p2_cd := v_p2_cd || '{"accio": 2}'::jsonb;
    elsif v_spell_key = 'finite' then v_p2_gain := v_p2_gain + 1; v_p2_burn := 0; v_p2_weakness := 0; v_p2_cd := v_p2_cd || '{"finite": 1}'::jsonb;
    elsif v_spell_key = 'confundus' then v_p2_dmg := v_p2_dmg + 6; v_p2_cost := v_p2_cost + 2; v_p2_fams := array_append(v_p2_fams, 'control'); v_p2_cd := v_p2_cd || '{"confundus": 3}'::jsonb;
    elsif v_spell_key = 'rictusempra' then v_p2_dmg := v_p2_dmg + 12; v_p2_cost := v_p2_cost + 1; v_p2_fams := array_append(v_p2_fams, 'attack'); v_p1_weakness := 1; v_p2_cd := v_p2_cd || '{"rictusempra": 1}'::jsonb;
    end if;
  end loop;

  -- 5. Ventaja Estratégica y Posturas
  if v_p2_fams && v_p1_beats then v_p1_strategy_bonus := 10; end if;
  if v_p1_fams && v_p2_beats then v_p2_strategy_bonus := 10; end if;

  case v_p1_turn.stance
    when 'offensive' then v_p1_s_bonus := 5; v_p1_s_vuln := 4;
    when 'defensive' then v_p1_s_blk := 8; v_p1_s_pen := 4;
    when 'cunning' then if v_p1_strategy_bonus > 0 then v_p1_strategy_bonus := v_p1_strategy_bonus + 4; end if;
    when 'desperate' then if v_duel.player_one_hp < 25 then v_p1_s_bonus := 6; else v_p1_s_pen := 3; end if;
    else null;
  end case;
  case v_p2_stance
    when 'offensive' then v_p2_s_bonus := 5; v_p2_s_vuln := 4;
    when 'defensive' then v_p2_s_blk := 8; v_p2_s_pen := 4;
    when 'cunning' then if v_p2_strategy_bonus > 0 then v_p2_strategy_bonus := v_p2_strategy_bonus + 4; end if;
    when 'desperate' then if v_duel.player_two_hp < 25 then v_p2_s_bonus := 6; else v_p2_s_pen := 3; end if;
    else null;
  end case;

  if coalesce((v_meta->>'p1_weakness')::int, 0) > 0 then v_p1_dmg := greatest(0, v_p1_dmg - 8); v_p1_weakness := greatest(0, v_p1_weakness - 1); end if;
  if coalesce((v_meta->>'p2_weakness')::int, 0) > 0 then v_p2_dmg := greatest(0, v_p2_dmg - 8); v_p2_weakness := greatest(0, v_p2_weakness - 1); end if;

  -- 6. Cálculos Finales
  v_p1_pre_blk_dmg := greatest(0, v_p2_dmg + v_p2_s_bonus + v_p2_strategy_bonus + v_p1_s_vuln - v_p2_s_pen);
  v_p2_pre_blk_dmg := greatest(0, v_p1_dmg + v_p1_s_bonus + v_p1_strategy_bonus + v_p2_s_vuln - v_p1_s_pen);
  
  v_p1_total_dmg := greatest(0, v_p1_pre_blk_dmg - (v_p1_blk + v_p1_s_blk));
  v_p2_total_dmg := greatest(0, v_p2_pre_blk_dmg - (v_p2_blk + v_p2_s_blk));

  -- 7. Actualizar
  v_meta := v_meta || jsonb_build_object('p1_burn', v_p1_burn, 'p2_burn', v_p2_burn, 'p1_weakness', v_p1_weakness, 'p2_weakness', v_p2_weakness);
  update hsf_duels set 
    player_one_hp = least(100, greatest(0, player_one_hp - v_p1_total_dmg - v_p1_status_dmg + v_p1_heal)),
    player_two_hp = least(100, greatest(0, player_two_hp - v_p2_total_dmg - v_p2_status_dmg + v_p2_heal)),
    player_one_energy = least(5, greatest(0, player_one_energy - v_p1_cost + v_p1_gain)),
    player_two_energy = least(5, greatest(0, player_two_energy - v_p2_cost + v_p2_gain)),
    player_one_cooldowns = v_p1_cd, player_two_cooldowns = v_p2_cd,
    metadata = v_meta, turn_number = turn_number + 1
  where id = p_duel_id returning * into v_duel;

  -- 8. Evento (Payload Full)
  insert into hsf_duel_events (duel_id, turn_number, event_type, payload)
  values (p_duel_id, p_turn_number, 'turn_resolved', jsonb_build_object(
    'p1_actions', v_p1_turn.actions, 'p2_actions', v_p2_actions,
    'p1_stance', v_p1_turn.stance, 'p2_stance', v_p2_stance,
    'p1_damage', v_p1_total_dmg + v_p1_status_dmg, 'p2_damage', v_p2_total_dmg + v_p2_status_dmg,
    'p1_damage_dealt', v_p2_total_dmg + v_p2_status_dmg, 'p2_damage_dealt', v_p1_total_dmg + v_p1_status_dmg,
    'p1_heal', v_p1_heal, 'p2_heal', v_p2_heal,
    'p1_energy_change', v_p1_gain - v_p1_cost, 'p2_energy_change', v_p2_gain - v_p2_cost,
    'p1_strategy_bonus', v_p1_strategy_bonus, 'p2_strategy_bonus', v_p2_strategy_bonus,
    'p1_stance_bonus', v_p1_s_bonus, 'p2_stance_bonus', v_p2_s_bonus,
    'p1_damage_taken_bonus', v_p1_s_vuln, 'p1_damage_dealt_penalty', v_p1_s_pen,
    'p2_damage_taken_bonus', v_p2_s_vuln, 'p2_damage_dealt_penalty', v_p2_s_pen,
    'p1_cancelled_damage', least(v_p1_pre_blk_dmg, v_p1_blk + v_p1_s_blk),
    'p2_cancelled_damage', least(v_p2_pre_blk_dmg, v_p2_blk + v_p2_s_blk),
    'p1_pre_block_dmg', v_p1_pre_blk_dmg, 'p2_pre_block_dmg', v_p2_pre_blk_dmg,
    'p1_burn', v_p1_burn, 'p2_burn', v_p2_burn,
    'p1_weakness', v_p1_weakness, 'p2_weakness', v_p2_weakness,
    'p1_interrupted', v_p1_interrupted, 'p2_interrupted', v_p2_interrupted
  ));

  if v_duel.player_one_hp <= 0 or v_duel.player_two_hp <= 0 or v_duel.turn_number > 12 then
    update hsf_duels set status = 'finished', winner_id = case when player_one_hp > player_two_hp then player_one else player_two end where id = p_duel_id;
    perform hsf_finish_duel_rewards(p_duel_id);
  end if;
  return jsonb_build_object('status', 'resolved');
end;
$$;
