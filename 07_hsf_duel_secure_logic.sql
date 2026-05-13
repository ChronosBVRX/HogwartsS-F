
-- ==========================================
-- 1. SUBMIT TURN FUNCTION
-- ==========================================

-- ==========================================
-- 1. SUBMIT TURN FUNCTION
-- ==========================================

create or replace function hsf_submit_duel_turn(
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
  v_total_cost int := 0;
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
  
  -- 2. Validar Stance
  if p_stance not in ('neutral', 'offensive', 'defensive', 'concentrated', 'cunning', 'desperate') then
    raise exception 'Postura inválida: %', p_stance;
  end if;

  -- 3. Verificar si ya envió turno
  select * into v_existing_turn from hsf_duel_turns 
  where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_user_id;
  if found then raise exception 'Ya has enviado tu estrategia para este turno'; end if;

  -- 4. Validar Acciones (AP, Energía, Cooldowns)
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

    -- Calcular AP y Costo
    case v_spell_key
      when 'expelliarmus' then v_total_ap := v_total_ap + 1; v_total_cost := v_total_cost + 1;
      when 'stupefy'      then v_total_ap := v_total_ap + 2; v_total_cost := v_total_cost + 2;
      when 'protego'      then v_total_ap := v_total_ap + 1; v_total_cost := v_total_cost + 1;
      when 'petrificus'   then v_total_ap := v_total_ap + 2; v_total_cost := v_total_cost + 2;
      when 'incendio'     then v_total_ap := v_total_ap + 2; v_total_cost := v_total_cost + 2;
      when 'episkey'      then v_total_ap := v_total_ap + 2; v_total_cost := v_total_cost + 2;
      when 'accio'        then v_total_ap := v_total_ap + 1; v_total_cost := v_total_cost + 0;
      when 'finite'       then v_total_ap := v_total_ap + 1; v_total_cost := v_total_cost + 1;
      when 'confundus'    then v_total_ap := v_total_ap + 2; v_total_cost := v_total_cost + 2;
      when 'rictusempra'  then v_total_ap := v_total_ap + 1; v_total_cost := v_total_cost + 1;
      else raise exception 'Hechizo desconocido: %', v_spell_key;
    end case;
  end loop;

  if v_total_ap > 2 then raise exception 'Has excedido los 2 AP permitidos'; end if;
  
  if v_user_id = v_duel.player_one then
    if v_total_cost > v_duel.player_one_energy then raise exception 'Energía insuficiente (Necesitas %, tienes %)', v_total_cost, v_duel.player_one_energy; end if;
  else
    if v_total_cost > v_duel.player_two_energy then raise exception 'Energía insuficiente'; end if;
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

-- ==========================================
-- 2. LÓGICA DE RESOLUCIÓN (MODELO AVANZADO)
-- ==========================================

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
  
  -- Modificadores
  v_p1_stance_dmg int := 0; v_p1_stance_blk int := 0;
  v_p2_stance_dmg int := 0; v_p2_stance_blk int := 0;
  
  v_p1_cd jsonb; v_p2_cd jsonb;
  v_cd_key text; v_cd_val int;
  
  v_p1_total_dmg int := 0; v_p2_total_dmg int := 0;
  v_p1_final_blk int := 0; v_p2_final_blk int := 0;
  v_p1_bonus int := 0; v_p2_bonus int := 0;
  v_p1_penalty int := 0; v_p2_penalty int := 0;
  
  v_action jsonb; v_spell_key text;
  v_p1_interrupted boolean := false; v_p2_interrupted boolean := false;
  v_ai_rand float;
  v_winner_id uuid := NULL;
begin
  select * into v_duel from hsf_duels where id = p_duel_id;
  
  -- 1. IA DINÁMICA (Estrategia Ponderada)
  if v_duel.mode = 'ai' then 
    v_ai_rand := random();
    -- Prioridad 1: Curar si tiene poca vida
    if v_duel.player_two_hp < 40 and v_duel.player_two_energy >= 2 and v_ai_rand < 0.7 then
      v_p2_actions := '[{"type": "spell", "key": "episkey"}]'::jsonb;
      v_p2_stance := 'defensive';
    -- Prioridad 2: Cargar energía si no tiene nada
    elsif v_duel.player_two_energy < 1 then
      v_p2_actions := '[{"type": "spell", "key": "accio"}]'::jsonb;
      v_p2_stance := 'concentrated';
    -- Prioridad 3: Defender si espera ataque fuerte (P1 tiene mucha energía)
    elsif v_duel.player_one_energy >= 2 and v_ai_rand < 0.4 then
      v_p2_actions := '[{"type": "spell", "key": "protego"}]'::jsonb;
      v_p2_stance := 'defensive';
    -- Prioridad 4: Ataque pesado si puede permitírselo
    elsif v_duel.player_two_energy >= 2 and v_ai_rand < 0.6 then
      v_p2_actions := '[{"type": "spell", "key": "stupefy"}]'::jsonb;
      v_p2_stance := 'offensive';
    -- Prioridad 5: Control / Disarm
    elsif v_duel.player_two_energy >= 1 and v_ai_rand < 0.5 then
      v_p2_actions := '[{"type": "spell", "key": "expelliarmus"}]'::jsonb;
      v_p2_stance := 'cunning';
    -- Default: Ataque ligero o carga
    else
      v_p2_actions := '[{"type": "spell", "key": "rictusempra"}]'::jsonb;
      v_p2_stance := 'neutral';
    end if;
  else
    select * into v_p2_turn from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_duel.player_two;
    v_p2_actions := coalesce(v_p2_turn.actions, '[]'::jsonb);
    v_p2_stance := coalesce(v_p2_turn.stance, 'neutral');
  end if;

  -- 2. Reducir Cooldowns
  v_p1_cd := '{}'::jsonb;
  for v_cd_key, v_cd_val in select * from jsonb_each_text(v_duel.player_one_cooldowns) loop
    if v_cd_val::int > 1 then v_p1_cd := v_p1_cd || jsonb_build_object(v_cd_key, v_cd_val::int - 1); end if;
  end loop;
  v_p2_cd := '{}'::jsonb;
  for v_cd_key, v_cd_val in select * from jsonb_each_text(v_duel.player_two_cooldowns) loop
    if v_cd_val::int > 1 then v_p2_cd := v_p2_cd || jsonb_build_object(v_cd_key, v_cd_val::int - 1); end if;
  end loop;

  -- 3. Posturas y Casas
  select house_slug into v_p1_house from hsf_profiles where user_id = v_duel.player_one;
  select house_slug into v_p2_house from hsf_profiles where user_id = v_duel.player_two;
  v_p1_house := coalesce(v_p1_house, 'gryffindor');
  v_p2_house := coalesce(v_p2_house, 'slytherin');
  
  select * into v_p1_turn from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_duel.player_one;

  -- P1 Stance
  if v_p1_turn.stance = 'offensive' then v_p1_stance_dmg := 4; v_p2_dmg := v_p2_dmg + 3;
  elsif v_p1_turn.stance = 'defensive' then v_p1_stance_blk := 6; v_p1_dmg := v_p1_dmg - 3;
  end if;
  -- P2 Stance
  if v_p2_stance = 'offensive' then v_p2_stance_dmg := 4; v_p1_dmg := v_p1_dmg + 3;
  elsif v_p2_stance = 'defensive' then v_p2_stance_blk := 6; v_p2_dmg := v_p2_dmg - 3;
  end if;

  -- Bonus Gryffindor
  if v_p1_house = 'gryffindor' and v_duel.player_one_hp < 35 then v_p1_stance_dmg := v_p1_stance_dmg + 6; end if;
  if v_p2_house = 'gryffindor' and v_duel.player_two_hp < 35 then v_p2_stance_dmg := v_p2_stance_dmg + 6; end if;

  -- 4. Procesar Hechizos P1
  for v_action in select * from jsonb_array_elements(v_p1_turn.actions) loop
    v_spell_key := v_action->>'key';
    if v_spell_key = 'expelliarmus' then v_p1_dmg := v_p1_dmg + 12; v_p1_cost := v_p1_cost + 1; v_p1_fams := v_p1_fams || 'disarm'; v_p1_beats := v_p1_beats || '{heavy, attack}'; v_p1_loses := v_p1_loses || '{defense}';
    elsif v_spell_key = 'stupefy' then v_p1_dmg := v_p1_dmg + 30; v_p1_cost := v_p1_cost + 2; v_p1_cd := v_p1_cd || '{"stupefy": 2}'; v_p1_fams := v_p1_fams || 'heavy'; v_p1_beats := v_p1_beats || '{heal, charge}'; v_p1_loses := v_p1_loses || '{disarm, defense}';
    elsif v_spell_key = 'protego' then v_p1_blk := v_p1_blk + 22; v_p1_cost := v_p1_cost + 1; v_p1_fams := v_p1_fams || 'defense'; v_p1_beats := v_p1_beats || '{attack, heavy}'; v_p1_loses := v_p1_loses || '{control}';
    elsif v_spell_key = 'accio' then v_p1_gain := v_p1_gain + 2; if v_p1_turn.stance = 'concentrated' then v_p1_gain := v_p1_gain + 1; end if; v_p1_fams := v_p1_fams || 'charge'; v_p1_beats := v_p1_beats || '{counter}'; v_p1_loses := v_p1_loses || '{attack, heavy}';
    elsif v_spell_key = 'episkey' then v_p1_heal := v_p1_heal + 20; v_p1_cost := v_p1_cost + 2; v_p1_cd := v_p1_cd || '{"episkey": 3}'; v_p1_fams := v_p1_fams || 'heal'; v_p1_beats := v_p1_beats || '{defense}'; v_p1_loses := v_p1_loses || '{heavy}';
    elsif v_spell_key = 'incendio' then v_p1_dmg := v_p1_dmg + 14; v_p1_cost := v_p1_cost + 2; v_p1_fams := v_p1_fams || 'attack'; v_p1_beats := v_p1_beats || '{charge}'; v_p1_loses := v_p1_loses || '{defense}';
    elsif v_spell_key = 'petrificus' then v_p1_dmg := v_p1_dmg + 10; v_p1_cost := v_p1_cost + 2; v_p1_fams := v_p1_fams || 'control'; v_p1_beats := v_p1_beats || '{defense}'; v_p1_loses := v_p1_loses || '{counter}';
    elsif v_spell_key = 'confundus' then v_p1_dmg := v_p1_dmg + 6; v_p1_cost := v_p1_cost + 2; v_p1_fams := v_p1_fams || 'control'; v_p1_beats := v_p1_beats || '{defense}'; v_p1_loses := v_p1_loses || '{counter}';
    elsif v_spell_key = 'finite' then v_p1_dmg := v_p1_dmg + 8; v_p1_cost := v_p1_cost + 1; v_p1_fams := v_p1_fams || 'counter'; v_p1_beats := v_p1_beats || '{control}'; v_p1_loses := v_p1_loses || '{attack}';
    elsif v_spell_key = 'rictusempra' then v_p1_dmg := v_p1_dmg + 12; v_p1_cost := v_p1_cost + 1; v_p1_fams := v_p1_fams || 'attack'; v_p1_beats := v_p1_beats || '{charge}'; v_p1_loses := v_p1_loses || '{defense}';
    end if;
  end loop;

  -- 5. Procesar Hechizos P2
  for v_action in select * from jsonb_array_elements(v_p2_actions) loop
    v_spell_key := v_action->>'key';
    if v_spell_key = 'expelliarmus' then v_p2_dmg := v_p2_dmg + 12; v_p2_cost := v_p2_cost + 1; v_p2_fams := v_p2_fams || 'disarm'; v_p2_beats := v_p2_beats || '{heavy, attack}'; v_p2_loses := v_p2_loses || '{defense}';
    elsif v_spell_key = 'stupefy' then v_p2_dmg := v_p2_dmg + 30; v_p2_cost := v_p2_cost + 2; v_p2_cd := v_p2_cd || '{"stupefy": 2}'; v_p2_fams := v_p2_fams || 'heavy'; v_p2_beats := v_p2_beats || '{heal, charge}'; v_p2_loses := v_p2_loses || '{disarm, defense}';
    elsif v_spell_key = 'protego' then v_p2_blk := v_p2_blk + 22; v_p2_cost := v_p2_cost + 1; v_p2_fams := v_p2_fams || 'defense'; v_p2_beats := v_p2_beats || '{attack, heavy}'; v_p2_loses := v_p2_loses || '{control}';
    elsif v_spell_key = 'accio' then v_p2_gain := v_p2_gain + 2; if v_p2_stance = 'concentrated' then v_p2_gain := v_p2_gain + 1; end if; v_p2_fams := v_p2_fams || 'charge'; v_p2_beats := v_p2_beats || '{counter}'; v_p2_loses := v_p2_loses || '{attack, heavy}';
    elsif v_spell_key = 'episkey' then v_p2_heal := v_p2_heal + 20; v_p2_cost := v_p2_cost + 2; v_p2_cd := v_p2_cd || '{"episkey": 3}'; v_p2_fams := v_p2_fams || 'heal'; v_p2_beats := v_p2_beats || '{defense}'; v_p2_loses := v_p2_loses || '{heavy}';
    elsif v_spell_key = 'incendio' then v_p2_dmg := v_p2_dmg + 14; v_p2_cost := v_p2_cost + 2; v_p2_fams := v_p2_fams || 'attack'; v_p2_beats := v_p2_beats || '{charge}'; v_p2_loses := v_p2_loses || '{defense}';
    elsif v_spell_key = 'petrificus' then v_p2_dmg := v_p2_dmg + 10; v_p2_cost := v_p2_cost + 2; v_p2_fams := v_p2_fams || 'control'; v_p2_beats := v_p2_beats || '{defense}'; v_p2_loses := v_p2_loses || '{counter}';
    elsif v_spell_key = 'confundus' then v_p2_dmg := v_p2_dmg + 6; v_p2_cost := v_p2_cost + 2; v_p2_fams := v_p2_fams || 'control'; v_p2_beats := v_p2_beats || '{defense}'; v_p2_loses := v_p2_loses || '{counter}';
    elsif v_spell_key = 'finite' then v_p2_dmg := v_p2_dmg + 8; v_p2_cost := v_p2_cost + 1; v_p2_fams := v_p2_fams || 'counter'; v_p2_beats := v_p2_beats || '{control}'; v_p2_loses := v_p2_loses || '{attack}';
    elsif v_spell_key = 'rictusempra' then v_p2_dmg := v_p2_dmg + 12; v_p2_cost := v_p2_cost + 1; v_p2_fams := v_p2_fams || 'attack'; v_p2_beats := v_p2_beats || '{charge}'; v_p2_loses := v_p2_loses || '{defense}';
    end if;
  end loop;

  -- 6. Resolución Estratégica (Matriz beats/losesTo)
  -- Ventaja P1 sobre P2
  if v_p2_fams && v_p1_beats then 
    v_p1_bonus := 14; 
    v_p2_final_blk := floor(v_p2_blk * 0.5); 
    if (v_p1_fams @> '{disarm}') and (v_p2_fams @> '{heavy}') then v_p2_dmg := floor(v_p2_dmg * 0.5); v_p2_interrupted := true; end if;
    if (v_p1_fams @> '{attack, heavy}') and (v_p2_fams @> '{charge}') then v_p2_gain := 0; v_p2_interrupted := true; end if;
    if (v_p1_fams @> '{control}') and (v_p2_fams @> '{defense}') then v_p2_final_blk := 0; end if;
  end if;
  
  -- Ventaja P2 sobre P1
  if v_p1_fams && v_p2_beats then 
    v_p2_bonus := 14; 
    v_p1_final_blk := floor(v_p1_blk * 0.5);
    if (v_p2_fams @> '{disarm}') and (v_p1_fams @> '{heavy}') then v_p1_dmg := floor(v_p1_dmg * 0.5); v_p1_interrupted := true; end if;
    if (v_p2_fams @> '{attack, heavy}') and (v_p1_fams @> '{charge}') then v_p1_gain := 0; v_p1_interrupted := true; end if;
    if (v_p2_fams @> '{control}') and (v_p1_fams @> '{defense}') then v_p1_final_blk := 0; end if;
  end if;

  -- Penalizaciones por desventaja o misma familia
  if v_p2_fams && v_p1_loses then v_p1_penalty := 8; end if;
  if v_p1_fams && v_p2_loses then v_p2_penalty := 8; end if;
  if v_p1_fams && v_p2_fams then v_p1_penalty := v_p1_penalty + 6; v_p2_penalty := v_p2_penalty + 6; end if;

  -- 7. Bonus Hufflepuff (+25% defensa/cura)
  if v_p1_house = 'hufflepuff' then v_p1_blk := floor(v_p1_blk * 1.25); v_p1_heal := floor(v_p1_heal * 1.25); end if;
  if v_p2_house = 'hufflepuff' then v_p2_blk := floor(v_p2_blk * 1.25); v_p2_heal := floor(v_p2_heal * 1.25); end if;

  v_p1_final_blk := coalesce(v_p1_final_blk, v_p1_blk + v_p1_stance_blk);
  v_p2_final_blk := coalesce(v_p2_final_blk, v_p2_blk + v_p2_stance_blk);

  -- 8. Cálculos Finales
  v_p1_total_dmg := greatest(0, v_p1_dmg + v_p1_stance_dmg + v_p1_bonus - v_p1_penalty - v_p2_final_blk);
  v_p2_total_dmg := greatest(0, v_p2_dmg + v_p2_stance_dmg + v_p2_bonus - v_p2_penalty - v_p1_final_blk);
  
  if v_p1_dmg = 0 then v_p2_total_dmg := 0; end if;
  if v_p2_dmg = 0 then v_p1_total_dmg := 0; end if;

  -- 9. Actualizar Estado
  update hsf_duels
  set 
    player_one_hp = least(100, greatest(0, player_one_hp - v_p2_total_dmg + v_p1_heal)),
    player_two_hp = least(100, greatest(0, player_two_hp - v_p1_total_dmg + v_p2_heal)),
    player_one_energy = least(5, greatest(0, player_one_energy - v_p1_cost + v_p1_gain)),
    player_two_energy = least(5, greatest(0, player_two_energy - v_p2_cost + v_p2_gain)),
    player_one_cooldowns = v_p1_cd,
    player_two_cooldowns = v_p2_cd,
    turn_number = turn_number + 1
  where id = p_duel_id returning * into v_duel;

  -- 10. Payload Enriquecido Completo
  insert into hsf_duel_events (duel_id, turn_number, event_type, payload)
  values (p_duel_id, p_turn_number, 'turn_resolved', jsonb_build_object(
    'p1_actions', v_p1_turn.actions, 
    'p2_actions', v_p2_actions,
    'p1_stance', v_p1_turn.stance,
    'p2_stance', v_p2_stance,
    'p1_spell', v_p1_turn.spell_key,
    'p2_spell', v_p2_actions->0->>'key',
    'p1_damage', v_p2_total_dmg, 
    'p2_damage', v_p1_total_dmg,
    'p1_damage_dealt', v_p1_total_dmg,
    'p2_damage_dealt', v_p2_total_dmg,
    'p1_blocked', v_p1_final_blk,
    'p2_blocked', v_p2_final_blk,
    'p1_heal', v_p1_heal, 
    'p2_heal', v_p2_heal,
    'p1_energy_cost', v_p1_cost,
    'p2_energy_cost', v_p2_cost,
    'p1_energy_gain', v_p1_gain,
    'p2_energy_gain', v_p2_gain,
    'p1_energy_change', v_p1_gain - v_p1_cost,
    'p2_energy_change', v_p2_gain - v_p2_cost,
    'p1_interrupted', v_p1_interrupted,
    'p2_interrupted', v_p2_interrupted,
    'p1_bonus', v_p1_bonus + v_p1_stance_dmg,
    'p2_bonus', v_p2_bonus + v_p2_stance_dmg,
    'p1_penalty', v_p1_penalty + case when v_p1_turn.stance = 'offensive' then 3 else 0 end,
    'p2_penalty', v_p2_penalty + case when v_p2_stance = 'offensive' then 3 else 0 end,
    'message', '¡Turno resuelto!'
  ));

  -- 7. Fin de duelo
  if v_duel.player_one_hp <= 0 or v_duel.player_two_hp <= 0 or v_duel.turn_number > 12 then
    if v_duel.player_one_hp > v_duel.player_two_hp then v_winner_id := v_duel.player_one;
    elsif v_duel.player_two_hp > v_duel.player_one_hp then v_winner_id := v_duel.player_two;
    end if;
    update hsf_duels set status = 'finished', finished_at = now(), winner_id = v_winner_id where id = p_duel_id;
    perform hsf_finish_duel_rewards(p_duel_id);
  end if;

  return jsonb_build_object('status', 'resolved');
end;
$$;

-- ==========================================
-- 3. RECOMPENSAS Y RANKING
-- ==========================================

create or replace function hsf_finish_duel_rewards(p_duel_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_duel record;
  v_winner_house text;
  v_month_key text;
  v_winner_points int := 15;
  v_loser_points int := 5;
  v_draw_points int := 8;
begin
  select * into v_duel from hsf_duels where id = p_duel_id;
  v_month_key := to_char(now(), 'YYYY-MM');

  -- 1. Actualizar perfiles de duelo (MMR y Estadísticas)
  -- Jugador 1
  insert into hsf_duel_profiles (user_id, mmr, wins, losses, duels_played)
  values (v_duel.player_one, 100, 0, 0, 0)
  on conflict (user_id) do nothing;

  if v_duel.winner_id = v_duel.player_one then
    update hsf_duel_profiles set mmr = mmr + v_winner_points, wins = wins + 1, duels_played = duels_played + 1 where user_id = v_duel.player_one;
  elsif v_duel.winner_id is null and v_duel.status = 'finished' then
    update hsf_duel_profiles set mmr = mmr + v_draw_points, duels_played = duels_played + 1 where user_id = v_duel.player_one;
  else
    update hsf_duel_profiles set mmr = mmr + v_loser_points, losses = losses + 1, duels_played = duels_played + 1 where user_id = v_duel.player_one;
  end if;

  -- Jugador 2 (Si no es AI)
  if v_duel.mode = 'pvp' then
    insert into hsf_duel_profiles (user_id, mmr, wins, losses, duels_played)
    values (v_duel.player_two, 100, 0, 0, 0)
    on conflict (user_id) do nothing;

    if v_duel.winner_id = v_duel.player_two then
      update hsf_duel_profiles set mmr = mmr + v_winner_points, wins = wins + 1, duels_played = duels_played + 1 where user_id = v_duel.player_two;
    elsif v_duel.winner_id is null and v_duel.status = 'finished' then
      update hsf_duel_profiles set mmr = mmr + v_draw_points, duels_played = duels_played + 1 where user_id = v_duel.player_two;
    else
      update hsf_duel_profiles set mmr = mmr + v_loser_points, losses = losses + 1, duels_played = duels_played + 1 where user_id = v_duel.player_two;
    end if;
  end if;

  -- 2. Copa de las Casas (Solo si hay un ganador y es un jugador)
  if v_duel.winner_id is not null then
    -- Intentar obtener slug directo o vía relación con hsf_houses
    select coalesce(p.house_slug, h.slug) into v_winner_house 
    from hsf_profiles p
    left join hsf_houses h on p.house_id = h.id
    where p.user_id = v_duel.winner_id;
    
    -- Normalizar slug
    v_winner_house := case 
      when lower(v_winner_house) in ('red', 'gryffindor') then 'gryffindor'
      when lower(v_winner_house) in ('green', 'slytherin') then 'slytherin'
      when lower(v_winner_house) in ('blue', 'ravenclaw') then 'ravenclaw'
      when lower(v_winner_house) in ('yellow', 'hufflepuff') then 'hufflepuff'
      else lower(v_winner_house)
    end;
    
    if v_winner_house is not null and v_winner_house != '' then
      insert into hsf_duel_house_points (month_key, house_slug, points)
      values (v_month_key, v_winner_house, v_winner_points)
      on conflict (month_key, house_slug) 
      do update set points = hsf_duel_house_points.points + v_winner_points;
      
      raise notice 'Puntos otorgados a la casa: %', v_winner_house;
    end if;
  end if;
end;
$$;

-- PARCHE MANUAL: Si Ravenclaw ya ganó pero no se sumó, ejecutamos este bloque una vez
-- para sincronizar los puntos de la victoria actual.
do $$
begin
  insert into hsf_duel_house_points (month_key, house_slug, points)
  values (to_char(now(), 'YYYY-MM'), 'ravenclaw', 15)
  on conflict (month_key, house_slug) 
  do update set points = hsf_duel_house_points.points + 15;
end $$;
