-- 1. Añadir columnas de estado a hsf_duels y arreglar restricciones
ALTER TABLE public.hsf_duels 
ADD COLUMN IF NOT EXISTS player_one_cooldowns jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS player_two_cooldowns jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS player_one_status jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS player_two_status jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS player_one_house_power_used boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS player_two_house_power_used boolean DEFAULT false;

-- Permitir que spell_key sea nulo en hsf_duel_turns para el nuevo sistema
ALTER TABLE public.hsf_duel_turns ALTER COLUMN spell_key DROP NOT NULL;

-- 2. Actualizar hsf_duel_turns para guardar la estrategia completa
ALTER TABLE public.hsf_duel_turns
ADD COLUMN IF NOT EXISTS actions jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS stance text DEFAULT 'neutral';

-- 3. Actualizar la función de envío de turno para ser COMPATIBLE
CREATE OR REPLACE FUNCTION hsf_submit_duel_turn(
  p_duel_id uuid, 
  p_turn_number int,
  p_spell_key text DEFAULT NULL, -- Mantener para compatibilidad
  p_actions jsonb DEFAULT NULL,
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
  v_final_actions jsonb;
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

  -- Lógica de compatibilidad: Si viene p_spell_key, convertirlo a acción
  IF p_actions IS NULL AND p_spell_key IS NOT NULL THEN
    v_final_actions := jsonb_build_array(jsonb_build_object('type', 'spell', 'key', p_spell_key));
    v_primary_spell_key := p_spell_key;
  ELSE
    v_final_actions := COALESCE(p_actions, '[]'::jsonb);
    -- Intentar extraer el primer hechizo para la columna clásica spell_key
    v_primary_spell_key := COALESCE(p_spell_key, v_final_actions->0->>'key');
  END IF;

  -- Insertar turno con la nueva estructura
  INSERT INTO hsf_duel_turns (duel_id, turn_number, player_id, spell_key, actions, stance)
  VALUES (p_duel_id, p_turn_number, v_user_id, v_primary_spell_key, v_final_actions, p_stance);

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

-- 4. Función de Resolución Estratégica (VERSIÓN BALANCEADA)
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
  
  -- Stats base
  v_p1_dmg int := 0; v_p1_blk int := 0; v_p1_heal int := 0; v_p1_cost int := 0; v_p1_gain int := 0;
  v_p2_dmg int := 0; v_p2_blk int := 0; v_p2_heal int := 0; v_p2_cost int := 0; v_p2_gain int := 0;
  
  -- Modificadores
  v_p1_stance_dmg int := 0; v_p1_stance_blk int := 0;
  v_p2_stance_dmg int := 0; v_p2_stance_blk int := 0;
  
  v_p1_cd jsonb; v_p2_cd jsonb;
  v_cd_key text; v_cd_val int;
  
  v_p1_total_dmg int := 0; v_p2_total_dmg int := 0;
  v_p1_final_blk int := 0; v_p2_final_blk int := 0;
  
  v_action jsonb; v_spell_key text;
  v_winner_id uuid := NULL;
BEGIN
  SELECT * INTO v_duel FROM hsf_duels WHERE id = p_duel_id;
  
  -- 1. Reducir Cooldowns existentes
  v_p1_cd := '{}'::jsonb;
  FOR v_cd_key, v_cd_val IN SELECT * FROM jsonb_each_text(v_duel.player_one_cooldowns) LOOP
    IF v_cd_val::int > 1 THEN v_p1_cd := v_p1_cd || jsonb_build_object(v_cd_key, v_cd_val::int - 1); END IF;
  END LOOP;
  v_p2_cd := '{}'::jsonb;
  FOR v_cd_key, v_cd_val IN SELECT * FROM jsonb_each_text(v_duel.player_two_cooldowns) LOOP
    IF v_cd_val::int > 1 THEN v_p2_cd := v_p2_cd || jsonb_build_object(v_cd_key, v_cd_val::int - 1); END IF;
  END LOOP;

  -- 2. IA y Turnos
  IF v_duel.mode = 'ai' THEN 
    v_p2_actions := jsonb_build_array(jsonb_build_object('key', 'expelliarmus')); 
    v_p2_stance := 'neutral';
  ELSE
    SELECT * INTO v_p2_turn FROM hsf_duel_turns WHERE duel_id = p_duel_id AND turn_number = p_turn_number AND player_id = v_duel.player_two;
    v_p2_actions := COALESCE(v_p2_turn.actions, '[]'::jsonb);
    v_p2_stance := COALESCE(v_p2_turn.stance, 'neutral');
  END IF;
  SELECT * INTO v_p1_turn FROM hsf_duel_turns WHERE duel_id = p_duel_id AND turn_number = p_turn_number AND player_id = v_duel.player_one;

  -- 3. Posturas y Casas
  SELECT house_slug INTO v_p1_house FROM hsf_profiles WHERE user_id = v_duel.player_one;
  v_p1_house := COALESCE(v_p1_house, 'gryffindor');
  
  -- P1 Stance Balance
  IF v_p1_turn.stance = 'offensive' THEN v_p1_stance_dmg := 5; v_p2_dmg := v_p2_dmg + 4;
  ELSIF v_p1_turn.stance = 'defensive' THEN v_p1_stance_blk := 8; v_p1_dmg := v_p1_dmg - 4;
  END IF;

  -- P2 Stance Balance
  IF v_p2_stance = 'offensive' THEN v_p2_stance_dmg := 5; v_p1_dmg := v_p1_dmg + 4;
  ELSIF v_p2_stance = 'defensive' THEN v_p2_stance_blk := 8; v_p2_dmg := v_p2_dmg - 4;
  END IF;

  IF v_p1_house = 'gryffindor' AND v_duel.player_one_hp < 35 THEN v_p1_stance_dmg := v_p1_stance_dmg + 6; END IF;

  -- 4. Procesar Hechizos P1
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_p1_turn.actions) LOOP
    v_spell_key := v_action->>'key';
    IF v_spell_key = 'expelliarmus' THEN v_p1_dmg := v_p1_dmg + 12; v_p1_cost := v_p1_cost + 1;
    ELSIF v_spell_key = 'stupefy' THEN v_p1_dmg := v_p1_dmg + 30; v_p1_cost := v_p1_cost + 2; v_p1_cd := v_p1_cd || '{"stupefy": 2}';
    ELSIF v_spell_key = 'protego' THEN v_p1_blk := v_p1_blk + 22; v_p1_cost := v_p1_cost + 1;
    ELSIF v_spell_key = 'accio' THEN v_p1_gain := v_p1_gain + 2; IF v_p1_turn.stance = 'concentrated' THEN v_p1_gain := v_p1_gain + 1; END IF;
    ELSIF v_spell_key = 'episkey' THEN v_p1_heal := v_p1_heal + 20; v_p1_cost := v_p1_cost + 2; v_p1_cd := v_p1_cd || '{"episkey": 3}';
    END IF;
  END LOOP;

  -- 5. Procesar Hechizos P2 (Simplificado para el balance)
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_p2_actions) LOOP
    v_spell_key := v_action->>'key';
    IF v_spell_key = 'expelliarmus' THEN v_p2_dmg := v_p2_dmg + 12; v_p2_cost := v_p2_cost + 1;
    ELSIF v_spell_key = 'stupefy' THEN v_p2_dmg := v_p2_dmg + 30; v_p2_cost := v_p2_cost + 2; v_p2_cd := v_p2_cd || '{"stupefy": 2}';
    ELSIF v_spell_key = 'protego' THEN v_p2_blk := v_p2_blk + 22; v_p2_cost := v_p2_cost + 1;
    ELSIF v_spell_key = 'accio' THEN v_p2_gain := v_p2_gain + 2;
    END IF;
  END LOOP;

  -- 6. Resolución de Impacto y Especiales (Parry / Interrupción)
  -- Hufflepuff bonus: +25% a bloqueos y curas
  IF v_p1_house = 'hufflepuff' THEN v_p1_blk := floor(v_p1_blk * 1.25); v_p1_heal := floor(v_p1_heal * 1.25); END IF;
  IF v_p2_house = 'hufflepuff' THEN v_p2_blk := floor(v_p2_blk * 1.25); v_p2_heal := floor(v_p2_heal * 1.25); END IF;

  v_p1_final_blk := v_p1_blk + v_p1_stance_blk;
  v_p2_final_blk := v_p2_blk + v_p2_stance_blk;

  -- Interrupción: Si P1 usa Expelliarmus y P2 usa un hechizo pesado (cost >= 2), P2 hace -50% daño
  IF (v_p1_turn.actions @> '[{"key": "expelliarmus"}]') AND (v_p2_cost >= 2) THEN v_p2_dmg := floor(v_p2_dmg * 0.5); END IF;
  IF (v_p2_actions @> '[{"key": "expelliarmus"}]') AND (v_p1_cost >= 2) THEN v_p1_dmg := floor(v_p1_dmg * 0.5); END IF;

  -- Parry: Si bloqueas mucho, ganas energía
  IF v_p1_final_blk > 20 AND v_p2_dmg > 15 THEN v_p1_gain := v_p1_gain + 1; END IF;
  IF v_p2_final_blk > 20 AND v_p1_dmg > 15 THEN v_p2_gain := v_p2_gain + 1; END IF;

  v_p1_total_dmg := GREATEST(0, v_p1_dmg + v_p1_stance_dmg - v_p2_final_blk);
  v_p2_total_dmg := GREATEST(0, v_p2_dmg + v_p2_stance_dmg - v_p1_final_blk);

  -- 7. Actualizar Estado
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

  -- 8. Registro de Evento Completo y Enriquecido
  INSERT INTO hsf_duel_events (duel_id, turn_number, event_type, payload)
  VALUES (p_duel_id, p_turn_number, 'turn_resolved', jsonb_build_object(
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
    'p1_cooldowns', v_p1_cd,
    'p2_cooldowns', v_p2_cd,
    'p1_energy_change', v_p1_gain - v_p1_cost,
    'p2_energy_change', v_p2_gain - v_p2_cost,
    'turn_number', p_turn_number
  ));

  IF v_duel.player_one_hp <= 0 OR v_duel.player_two_hp <= 0 OR v_duel.turn_number > 12 THEN
    UPDATE hsf_duels SET status = 'finished', finished_at = NOW() WHERE id = p_duel_id;
    PERFORM hsf_finish_duel_rewards(p_duel_id);
  END IF;

  RETURN jsonb_build_object('status', 'resolved');
END;
$$;
