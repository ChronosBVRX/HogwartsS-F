-- 1. Unificar columnas de poder de casa
-- Mantener convencion: player_one_house_power_used
ALTER TABLE public.hsf_duels DROP COLUMN IF EXISTS player_one_used_house_power;
ALTER TABLE public.hsf_duels DROP COLUMN IF EXISTS player_two_used_house_power;

-- 2. Asegurar que las columnas recomendadas existen
ALTER TABLE public.hsf_duels 
ADD COLUMN IF NOT EXISTS player_one_house_power_used boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS player_two_house_power_used boolean DEFAULT false;

-- 3. Actualizar la lógica de resolución para manejar TODOS los hechizos y el nuevo modelo
CREATE OR REPLACE FUNCTION hsf_resolve_duel_turn(p_duel_id uuid, p_turn_number int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_duel record;
  v_p1_turn record; v_p2_turn record;
  v_p1_house text; v_p2_house text;
  v_p2_actions jsonb; v_p2_stance text;
  
  -- Stats acumuladas P1
  v_p1_dmg int := 0; v_p1_blk int := 0; v_p1_heal int := 0; v_p1_cost int := 0; v_p1_gain int := 0;
  -- Stats acumuladas P2
  v_p2_dmg int := 0; v_p2_blk int := 0; v_p2_heal int := 0; v_p2_cost int := 0; v_p2_gain int := 0;
  
  -- Modificadores de Postura
  v_p1_stance_dmg int := 0; v_p1_stance_blk int := 0;
  v_p2_stance_dmg int := 0; v_p2_stance_blk int := 0;
  
  -- Cooldowns
  v_p1_cd jsonb; v_p2_cd jsonb;
  v_cd_key text; v_cd_val int;
  
  -- Cálculos finales
  v_p1_total_dmg int := 0; v_p2_total_dmg int := 0;
  v_p1_final_blk int := 0; v_p2_final_blk int := 0;
  
  v_action jsonb; v_spell_key text;
  v_winner_id uuid := NULL;
  v_p1_interrupted boolean := false; v_p2_interrupted boolean := false;
BEGIN
  SELECT * INTO v_duel FROM hsf_duels WHERE id = p_duel_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Duelo no encontrado'; END IF;

  -- 1. Reducir Cooldowns existentes
  v_p1_cd := '{}'::jsonb;
  FOR v_cd_key, v_cd_val IN SELECT * FROM jsonb_each_text(v_duel.player_one_cooldowns) LOOP
    IF v_cd_val::int > 1 THEN v_p1_cd := v_p1_cd || jsonb_build_object(v_cd_key, v_cd_val::int - 1); END IF;
  END LOOP;
  v_p2_cd := '{}'::jsonb;
  FOR v_cd_key, v_cd_val IN SELECT * FROM jsonb_each_text(v_duel.player_two_cooldowns) LOOP
    IF v_cd_val::int > 1 THEN v_p2_cd := v_p2_cd || jsonb_build_object(v_cd_key, v_cd_val::int - 1); END IF;
  END LOOP;

  -- 2. IA y Acciones
  IF v_duel.mode = 'ai' THEN 
    -- IA Mejorada: Elige según energía
    IF v_duel.player_two_energy >= 2 THEN
       v_p2_actions := jsonb_build_array(jsonb_build_object('type', 'spell', 'key', 'stupefy'));
    ELSE
       v_p2_actions := jsonb_build_array(jsonb_build_object('type', 'spell', 'key', 'expelliarmus'));
    END IF;
    v_p2_stance := 'neutral';
  ELSE
    SELECT * INTO v_p2_turn FROM hsf_duel_turns WHERE duel_id = p_duel_id AND turn_number = p_turn_number AND player_id = v_duel.player_two;
    v_p2_actions := COALESCE(v_p2_turn.actions, '[]'::jsonb);
    v_p2_stance := COALESCE(v_p2_turn.stance, 'neutral');
  END IF;
  
  SELECT * INTO v_p1_turn FROM hsf_duel_turns WHERE duel_id = p_duel_id AND turn_number = p_turn_number AND player_id = v_duel.player_one;
  IF v_p1_turn IS NULL THEN RAISE EXCEPTION 'Turno de P1 no encontrado'; END IF;

  -- 3. Posturas y Casas
  SELECT house_slug INTO v_p1_house FROM hsf_profiles WHERE user_id = v_duel.player_one;
  SELECT house_slug INTO v_p2_house FROM hsf_profiles WHERE user_id = v_duel.player_two;
  v_p1_house := COALESCE(v_p1_house, 'gryffindor');
  v_p2_house := COALESCE(v_p2_house, 'slytherin');
  
  -- P1 Stance logic
  IF v_p1_turn.stance = 'offensive' THEN v_p1_stance_dmg := 4; v_p2_dmg := v_p2_dmg + 3; -- Recibe más daño
  ELSIF v_p1_turn.stance = 'defensive' THEN v_p1_stance_blk := 6; v_p1_dmg := v_p1_dmg - 3; -- Pega menos
  END IF;

  -- P2 Stance logic
  IF v_p2_stance = 'offensive' THEN v_p2_stance_dmg := 4; v_p1_dmg := v_p1_dmg + 3;
  ELSIF v_p2_stance = 'defensive' THEN v_p2_stance_blk := 6; v_p2_dmg := v_p2_dmg - 3;
  END IF;

  -- Bonus de Casa (Gryffindor)
  IF v_p1_house = 'gryffindor' AND v_duel.player_one_hp < 35 THEN v_p1_stance_dmg := v_p1_stance_dmg + 6; END IF;
  IF v_p2_house = 'gryffindor' AND v_duel.player_two_hp < 35 THEN v_p2_stance_dmg := v_p2_stance_dmg + 6; END IF;

  -- 4. Procesar Hechizos P1 (Sincronizado con duelSpells.js)
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_p1_turn.actions) LOOP
    v_spell_key := v_action->>'key';
    IF v_spell_key = 'expelliarmus' THEN v_p1_dmg := v_p1_dmg + 12; v_p1_cost := v_p1_cost + 1;
    ELSIF v_spell_key = 'stupefy' THEN v_p1_dmg := v_p1_dmg + 30; v_p1_cost := v_p1_cost + 2; v_p1_cd := v_p1_cd || '{"stupefy": 2}';
    ELSIF v_spell_key = 'protego' THEN v_p1_blk := v_p1_blk + 22; v_p1_cost := v_p1_cost + 1;
    ELSIF v_spell_key = 'accio' THEN v_p1_gain := v_p1_gain + 2; IF v_p1_turn.stance = 'concentrated' THEN v_p1_gain := v_p1_gain + 1; END IF;
    ELSIF v_spell_key = 'episkey' THEN v_p1_heal := v_p1_heal + 20; v_p1_cost := v_p1_cost + 2; v_p1_cd := v_p1_cd || '{"episkey": 3}';
    ELSIF v_spell_key = 'incendio' THEN v_p1_dmg := v_p1_dmg + 14; v_p1_cost := v_p1_cost + 2; v_p1_cd := v_p1_cd || '{"incendio": 2}';
    ELSIF v_spell_key = 'petrificus' THEN v_p1_dmg := v_p1_dmg + 10; v_p1_cost := v_p1_cost + 2; v_p1_cd := v_p1_cd || '{"petrificus": 2}';
    ELSIF v_spell_key = 'confundus' THEN v_p1_dmg := v_p1_dmg + 6; v_p1_cost := v_p1_cost + 2; v_p1_cd := v_p1_cd || '{"confundus": 3}';
    ELSIF v_spell_key = 'finite' THEN v_p1_dmg := v_p1_dmg + 8; v_p1_cost := v_p1_cost + 1;
    ELSIF v_spell_key = 'rictusempra' THEN v_p1_dmg := v_p1_dmg + 12; v_p1_cost := v_p1_cost + 1;
    END IF;
  END LOOP;

  -- 5. Procesar Hechizos P2
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_p2_actions) LOOP
    v_spell_key := v_action->>'key';
    IF v_spell_key = 'expelliarmus' THEN v_p2_dmg := v_p2_dmg + 12; v_p2_cost := v_p2_cost + 1;
    ELSIF v_spell_key = 'stupefy' THEN v_p2_dmg := v_p2_dmg + 30; v_p2_cost := v_p2_cost + 2; v_p2_cd := v_p2_cd || '{"stupefy": 2}';
    ELSIF v_spell_key = 'protego' THEN v_p2_blk := v_p2_blk + 22; v_p2_cost := v_p2_cost + 1;
    ELSIF v_spell_key = 'accio' THEN v_p2_gain := v_p2_gain + 2;
    ELSIF v_spell_key = 'episkey' THEN v_p2_heal := v_p2_heal + 20; v_p2_cost := v_p2_cost + 2; v_p2_cd := v_p2_cd || '{"episkey": 3}';
    ELSIF v_spell_key = 'incendio' THEN v_p2_dmg := v_p2_dmg + 14; v_p2_cost := v_p2_cost + 2; v_p2_cd := v_p2_cd || '{"incendio": 2}';
    ELSIF v_spell_key = 'petrificus' THEN v_p2_dmg := v_p2_dmg + 10; v_p2_cost := v_p2_cost + 2; v_p2_cd := v_p2_cd || '{"petrificus": 2}';
    ELSIF v_spell_key = 'confundus' THEN v_p2_dmg := v_p2_dmg + 6; v_p2_cost := v_p2_cost + 2; v_p2_cd := v_p2_cd || '{"confundus": 3}';
    ELSIF v_spell_key = 'finite' THEN v_p2_dmg := v_p2_dmg + 8; v_p2_cost := v_p2_cost + 1;
    ELSIF v_spell_key = 'rictusempra' THEN v_p2_dmg := v_p2_dmg + 12; v_p2_cost := v_p2_cost + 1;
    END IF;
  END LOOP;

  -- 6. Bonus de Casa (Hufflepuff: +25% Defensa/Cura)
  IF v_p1_house = 'hufflepuff' THEN v_p1_blk := floor(v_p1_blk * 1.25); v_p1_heal := floor(v_p1_heal * 1.25); END IF;
  IF v_p2_house = 'hufflepuff' THEN v_p2_blk := floor(v_p2_blk * 1.25); v_p2_heal := floor(v_p2_heal * 1.25); END IF;

  v_p1_final_blk := v_p1_blk + v_p1_stance_blk;
  v_p2_final_blk := v_p2_blk + v_p2_stance_blk;

  -- 7. Mecánicas Especiales (Interrupción y Parry)
  -- Interrupción: Expelliarmus contra hechizos pesados (cost >= 2)
  IF (v_p1_turn.actions @> '[{"key": "expelliarmus"}]') AND (v_p2_cost >= 2) THEN 
    v_p2_dmg := floor(v_p2_dmg * 0.5); 
    v_p2_interrupted := true;
  END IF;
  IF (v_p2_actions @> '[{"key": "expelliarmus"}]') AND (v_p1_cost >= 2) THEN 
    v_p1_dmg := floor(v_p1_dmg * 0.5); 
    v_p1_interrupted := true;
  END IF;

  -- Parry: Gana energía si bloqueas un gran ataque
  IF v_p1_final_blk > 20 AND v_p2_dmg > 15 THEN v_p1_gain := v_p1_gain + 1; END IF;
  IF v_p2_final_blk > 20 AND v_p1_dmg > 15 THEN v_p2_gain := v_p2_gain + 1; END IF;

  -- 8. Cálculos Finales
  v_p1_total_dmg := GREATEST(0, v_p1_dmg + v_p1_stance_dmg - v_p2_final_blk);
  v_p2_total_dmg := GREATEST(0, v_p2_dmg + v_p2_stance_dmg - v_p1_final_blk);

  -- 9. Actualizar Estado de Duelo
  UPDATE hsf_duels
  SET 
    player_one_hp = LEAST(100, GREATEST(0, player_one_hp - v_p2_total_dmg + v_p1_heal)),
    player_two_hp = LEAST(100, GREATEST(0, player_two_hp - v_p1_total_dmg + v_p2_heal)),
    player_one_energy = LEAST(5, GREATEST(0, player_one_energy - v_p1_cost + v_p1_gain)),
    player_two_energy = LEAST(5, GREATEST(0, player_two_energy - v_p2_cost + v_p2_gain)),
    player_one_cooldowns = v_p1_cd,
    player_two_cooldowns = v_p2_cd,
    turn_number = turn_number + 1
  WHERE id = p_duel_id RETURNING * INTO v_duel;

  -- 10. Registro de Evento con Payload Avanzado (Sincronizado con duelNarration.js)
  INSERT INTO hsf_duel_events (duel_id, turn_number, event_type, payload)
  VALUES (p_duel_id, p_turn_number, 'turn_resolved', jsonb_build_object(
    'p1_actions', v_p1_turn.actions, 
    'p2_actions', v_p2_actions,
    'p1_stance', v_p1_turn.stance,
    'p2_stance', v_p2_stance,
    'p1_damage', v_p2_total_dmg, -- Daño que P1 RECIBE
    'p2_damage', v_p1_total_dmg, -- Daño que P2 RECIBE
    'p1_damage_dealt', v_p1_total_dmg,
    'p2_damage_dealt', v_p2_total_dmg,
    'p1_blocked', v_p1_final_blk,
    'p2_blocked', v_p2_final_blk,
    'p1_heal', v_p1_heal, 
    'p2_heal', v_p2_heal,
    'p1_interrupted', v_p1_interrupted,
    'p2_interrupted', v_p2_interrupted,
    'p1_energy_change', v_p1_gain - v_p1_cost,
    'p2_energy_change', v_p2_gain - v_p2_cost,
    'p1_bonus', v_p1_stance_dmg,
    'p2_bonus', v_p2_stance_dmg,
    'p1_penalty', CASE WHEN v_p1_turn.stance = 'offensive' THEN 3 ELSE 0 END,
    'p2_penalty', CASE WHEN v_p2_stance = 'offensive' THEN 3 ELSE 0 END,
    'turn_number', p_turn_number
  ));

  -- Finalizar duelo si corresponde
  IF v_duel.player_one_hp <= 0 OR v_duel.player_two_hp <= 0 OR v_duel.turn_number > 12 THEN
    UPDATE hsf_duels SET status = 'finished', finished_at = NOW() WHERE id = p_duel_id;
    PERFORM hsf_finish_duel_rewards(p_duel_id);
  END IF;

  RETURN jsonb_build_object('status', 'resolved');
END;
$$;
