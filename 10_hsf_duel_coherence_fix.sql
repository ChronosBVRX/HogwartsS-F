-- 1. Unificar columnas de poder de casa
ALTER TABLE public.hsf_duels DROP COLUMN IF EXISTS player_one_used_house_power;
ALTER TABLE public.hsf_duels DROP COLUMN IF EXISTS player_two_used_house_power;

ALTER TABLE public.hsf_duels 
ADD COLUMN IF NOT EXISTS player_one_house_power_used boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS player_two_house_power_used boolean DEFAULT false;

-- 2. Función de envío de turno SINCRONIZADA con el frontend
CREATE OR REPLACE FUNCTION hsf_submit_duel_turn(
  p_duel_id uuid,
  p_turn_number int,
  p_actions jsonb,
  p_stance text DEFAULT 'neutral'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_duel record;
  v_existing_turn record;
  v_p2_turn record;
  v_primary_spell_key text;
BEGIN
  v_user_id := auth.uid();
  
  SELECT * INTO v_duel FROM hsf_duels WHERE id = p_duel_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Duelo no encontrado'; END IF;
  IF v_duel.status != 'active' THEN RAISE EXCEPTION 'El duelo ya no está activo'; END IF;
  IF v_duel.turn_number != p_turn_number THEN RAISE EXCEPTION 'Número de turno incorrecto'; END IF;
  
  -- Verificar si ya envió turno
  SELECT * INTO v_existing_turn FROM hsf_duel_turns 
  WHERE duel_id = p_duel_id AND turn_number = p_turn_number AND player_id = v_user_id;
  
  IF FOUND THEN RAISE EXCEPTION 'Ya has enviado tu estrategia para este turno'; END IF;

  -- Extraer el primer hechizo para compatibilidad con la columna clásica spell_key
  v_primary_spell_key := p_actions->0->>'key';

  -- Insertar turno con la nueva estructura
  INSERT INTO hsf_duel_turns (duel_id, turn_number, player_id, spell_key, actions, stance)
  VALUES (p_duel_id, p_turn_number, v_user_id, v_primary_spell_key, p_actions, p_stance);

  -- Si es modo AI, resolver inmediatamente
  IF v_duel.mode = 'ai' THEN
    PERFORM hsf_resolve_duel_turn(p_duel_id, p_turn_number);
    RETURN jsonb_build_object('status', 'resolved_ai');
  END IF;

  -- Si es PvP, ver si el otro ya envió
  SELECT * INTO v_p2_turn FROM hsf_duel_turns 
  WHERE duel_id = p_duel_id AND turn_number = p_turn_number AND player_id != v_user_id;

  IF FOUND THEN
    PERFORM hsf_resolve_duel_turn(p_duel_id, p_turn_number);
    RETURN jsonb_build_object('status', 'resolved_pvp');
  END IF;

  RETURN jsonb_build_object('status', 'waiting');
END;
$$;

-- 3. Función de Resolución Estratégica (Sincronizada con duelSpells.js)
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
  
  -- Familias (para ventajas)
  v_p1_fams text[] := '{}'; v_p2_fams text[] := '{}';
  
  -- Modificadores
  v_p1_stance_dmg int := 0; v_p1_stance_blk int := 0;
  v_p2_stance_dmg int := 0; v_p2_stance_blk int := 0;
  
  v_p1_cd jsonb; v_p2_cd jsonb;
  v_cd_key text; v_cd_val int;
  
  v_p1_total_dmg int := 0; v_p2_total_dmg int := 0;
  v_p1_final_blk int := 0; v_p2_final_blk int := 0;
  
  v_action jsonb; v_spell_key text;
  v_p1_interrupted boolean := false; v_p2_interrupted boolean := false;
BEGIN
  SELECT * INTO v_duel FROM hsf_duels WHERE id = p_duel_id;
  
  -- 1. Reducir Cooldowns
  v_p1_cd := '{}'::jsonb;
  FOR v_cd_key, v_cd_val IN SELECT * FROM jsonb_each_text(v_duel.player_one_cooldowns) LOOP
    IF v_cd_val::int > 1 THEN v_p1_cd := v_p1_cd || jsonb_build_object(v_cd_key, v_cd_val::int - 1); END IF;
  END LOOP;
  v_p2_cd := '{}'::jsonb;
  FOR v_cd_key, v_cd_val IN SELECT * FROM jsonb_each_text(v_duel.player_two_cooldowns) LOOP
    IF v_cd_val::int > 1 THEN v_p2_cd := v_p2_cd || jsonb_build_object(v_cd_key, v_cd_val::int - 1); END IF;
  END LOOP;

  -- 2. Obtener Acciones
  SELECT * INTO v_p1_turn FROM hsf_duel_turns WHERE duel_id = p_duel_id AND turn_number = p_turn_number AND player_id = v_duel.player_one;
  
  IF v_duel.mode = 'ai' THEN 
    -- IA simplificada pero coherente
    IF v_duel.player_two_energy >= 2 THEN
      v_p2_actions := '[{"type": "spell", "key": "stupefy"}]'::jsonb;
    ELSE
      v_p2_actions := '[{"type": "spell", "key": "expelliarmus"}]'::jsonb;
    END IF;
    v_p2_stance := 'neutral';
  ELSE
    SELECT * INTO v_p2_turn FROM hsf_duel_turns WHERE duel_id = p_duel_id AND turn_number = p_turn_number AND player_id = v_duel.player_two;
    v_p2_actions := COALESCE(v_p2_turn.actions, '[]'::jsonb);
    v_p2_stance := COALESCE(v_p2_turn.stance, 'neutral');
  END IF;

  -- 3. Posturas y Casas
  SELECT house_slug INTO v_p1_house FROM hsf_profiles WHERE user_id = v_duel.player_one;
  SELECT house_slug INTO v_p2_house FROM hsf_profiles WHERE user_id = v_duel.player_two;
  v_p1_house := COALESCE(v_p1_house, 'gryffindor');
  v_p2_house := COALESCE(v_p2_house, 'slytherin');
  
  -- P1 Stance
  IF v_p1_turn.stance = 'offensive' THEN v_p1_stance_dmg := 4; v_p2_dmg := v_p2_dmg + 3;
  ELSIF v_p1_turn.stance = 'defensive' THEN v_p1_stance_blk := 6; v_p1_dmg := v_p1_dmg - 3;
  END IF;

  -- P2 Stance
  IF v_p2_stance = 'offensive' THEN v_p2_stance_dmg := 4; v_p1_dmg := v_p1_dmg + 3;
  ELSIF v_p2_stance = 'defensive' THEN v_p2_stance_blk := 6; v_p2_dmg := v_p2_dmg - 3;
  END IF;

  -- Bonus Gryffindor
  IF v_p1_house = 'gryffindor' AND v_duel.player_one_hp < 35 THEN v_p1_stance_dmg := v_p1_stance_dmg + 6; END IF;
  IF v_p2_house = 'gryffindor' AND v_duel.player_two_hp < 35 THEN v_p2_stance_dmg := v_p2_stance_dmg + 6; END IF;

  -- 4. Procesar Hechizos P1 (Valores de duelSpells.js)
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_p1_turn.actions) LOOP
    v_spell_key := v_action->>'key';
    IF v_spell_key = 'expelliarmus' THEN v_p1_dmg := v_p1_dmg + 12; v_p1_cost := v_p1_cost + 1; v_p1_fams := v_p1_fams || 'disarm';
    ELSIF v_spell_key = 'stupefy' THEN v_p1_dmg := v_p1_dmg + 30; v_p1_cost := v_p1_cost + 2; v_p1_cd := v_p1_cd || '{"stupefy": 2}'; v_p1_fams := v_p1_fams || 'heavy';
    ELSIF v_spell_key = 'protego' THEN v_p1_blk := v_p1_blk + 22; v_p1_cost := v_p1_cost + 1; v_p1_fams := v_p1_fams || 'defense';
    ELSIF v_spell_key = 'accio' THEN v_p1_gain := v_p1_gain + 2; IF v_p1_turn.stance = 'concentrated' THEN v_p1_gain := v_p1_gain + 1; END IF; v_p1_fams := v_p1_fams || 'charge';
    ELSIF v_spell_key = 'episkey' THEN v_p1_heal := v_p1_heal + 20; v_p1_cost := v_p1_cost + 2; v_p1_cd := v_p1_cd || '{"episkey": 3}'; v_p1_fams := v_p1_fams || 'heal';
    ELSIF v_spell_key = 'incendio' THEN v_p1_dmg := v_p1_dmg + 14; v_p1_cost := v_p1_cost + 2; v_p1_fams := v_p1_fams || 'attack';
    ELSIF v_spell_key = 'petrificus' THEN v_p1_dmg := v_p1_dmg + 10; v_p1_cost := v_p1_cost + 2; v_p1_fams := v_p1_fams || 'control';
    ELSIF v_spell_key = 'confundus' THEN v_p1_dmg := v_p1_dmg + 6; v_p1_cost := v_p1_cost + 2; v_p1_fams := v_p1_fams || 'control';
    ELSIF v_spell_key = 'finite' THEN v_p1_dmg := v_p1_dmg + 8; v_p1_cost := v_p1_cost + 1; v_p1_fams := v_p1_fams || 'counter';
    ELSIF v_spell_key = 'rictusempra' THEN v_p1_dmg := v_p1_dmg + 12; v_p1_cost := v_p1_cost + 1; v_p1_fams := v_p1_fams || 'attack';
    END IF;
  END LOOP;

  -- 5. Procesar Hechizos P2
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_p2_actions) LOOP
    v_spell_key := v_action->>'key';
    IF v_spell_key = 'expelliarmus' THEN v_p2_dmg := v_p2_dmg + 12; v_p2_cost := v_p2_cost + 1; v_p2_fams := v_p2_fams || 'disarm';
    ELSIF v_spell_key = 'stupefy' THEN v_p2_dmg := v_p2_dmg + 30; v_p2_cost := v_p2_cost + 2; v_p2_cd := v_p2_cd || '{"stupefy": 2}'; v_p2_fams := v_p2_fams || 'heavy';
    ELSIF v_spell_key = 'protego' THEN v_p2_blk := v_p2_blk + 22; v_p2_cost := v_p2_cost + 1; v_p2_fams := v_p2_fams || 'defense';
    ELSIF v_spell_key = 'accio' THEN v_p2_gain := v_p2_gain + 2; v_p2_fams := v_p2_fams || 'charge';
    ELSIF v_spell_key = 'episkey' THEN v_p2_heal := v_p2_heal + 20; v_p2_cost := v_p2_cost + 2; v_p2_fams := v_p2_fams || 'heal';
    ELSIF v_spell_key = 'incendio' THEN v_p2_dmg := v_p2_dmg + 14; v_p2_cost := v_p2_cost + 2; v_p2_fams := v_p2_fams || 'attack';
    ELSIF v_spell_key = 'petrificus' THEN v_p2_dmg := v_p2_dmg + 10; v_p2_cost := v_p2_cost + 2; v_p2_fams := v_p2_fams || 'control';
    ELSIF v_spell_key = 'confundus' THEN v_p2_dmg := v_p2_dmg + 6; v_p2_cost := v_p2_cost + 2; v_p2_fams := v_p2_fams || 'control';
    ELSIF v_spell_key = 'finite' THEN v_p2_dmg := v_p2_dmg + 8; v_p2_cost := v_p2_cost + 1; v_p2_fams := v_p2_fams || 'counter';
    ELSIF v_spell_key = 'rictusempra' THEN v_p2_dmg := v_p2_dmg + 12; v_p2_cost := v_p2_cost + 1; v_p2_fams := v_p2_fams || 'attack';
    END IF;
  END LOOP;

  -- 6. Bonus Hufflepuff (+25% defensa/cura)
  IF v_p1_house = 'hufflepuff' THEN v_p1_blk := floor(v_p1_blk * 1.25); v_p1_heal := floor(v_p1_heal * 1.25); END IF;
  IF v_p2_house = 'hufflepuff' THEN v_p2_blk := floor(v_p2_blk * 1.25); v_p2_heal := floor(v_p2_heal * 1.25); END IF;

  v_p1_final_blk := v_p1_blk + v_p1_stance_blk;
  v_p2_final_blk := v_p2_blk + v_p2_stance_blk;

  -- 7. Interrupción (Expelliarmus vs Heavy)
  IF (v_p1_fams @> '{disarm}') AND (v_p2_fams @> '{heavy}') THEN v_p2_dmg := floor(v_p2_dmg * 0.5); v_p2_interrupted := true; END IF;
  IF (v_p2_fams @> '{disarm}') AND (v_p1_fams @> '{heavy}') THEN v_p1_dmg := floor(v_p1_dmg * 0.5); v_p1_interrupted := true; END IF;

  -- 8. Cálculos Finales
  v_p1_total_dmg := GREATEST(0, v_p1_dmg + v_p1_stance_dmg - v_p2_final_blk);
  v_p2_total_dmg := GREATEST(0, v_p2_dmg + v_p2_stance_dmg - v_p1_final_blk);

  -- 9. Actualizar Estado
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

  -- 10. Payload Completo para duelNarration.js
  INSERT INTO hsf_duel_events (duel_id, turn_number, event_type, payload)
  VALUES (p_duel_id, p_turn_number, 'turn_resolved', jsonb_build_object(
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
    'p1_bonus', v_p1_stance_dmg,
    'p2_bonus', v_p2_stance_dmg,
    'p1_penalty', CASE WHEN v_p1_turn.stance = 'offensive' THEN 3 ELSE 0 END,
    'p2_penalty', CASE WHEN v_p2_stance = 'offensive' THEN 3 ELSE 0 END,
    'p1_heal', v_p1_heal, 
    'p2_heal', v_p2_heal,
    'p1_energy_cost', v_p1_cost,
    'p2_energy_cost', v_p2_cost,
    'p1_energy_gain', v_p1_gain,
    'p2_energy_gain', v_p2_gain,
    'p1_energy_change', v_p1_gain - v_p1_cost,
    'p2_energy_change', v_p2_gain - v_p2_cost,
    'p1_interrupted', v_p1_interrupted,
    'p2_interrupted', v_p2_interrupted
  ));

  IF v_duel.player_one_hp <= 0 OR v_duel.player_two_hp <= 0 OR v_duel.turn_number > 12 THEN
    UPDATE hsf_duels SET status = 'finished', finished_at = NOW() WHERE id = p_duel_id;
    PERFORM hsf_finish_duel_rewards(p_duel_id);
  END IF;

  RETURN jsonb_build_object('status', 'resolved');
END;
$$;
