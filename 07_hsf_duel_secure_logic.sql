
-- ==========================================
-- 2. LÓGICA DE CÁLCULO DE DAÑO (CORRECCIÓN DE VENTAJA Y ENERGÍA)
-- ==========================================

create or replace function hsf_resolve_duel_turn(p_duel_id uuid, p_turn_number int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_duel record;
  v_p1_turn record;
  v_p2_spell_key text;
  
  -- Spell Metadata (Sincronizado con duelSpells.js)
  v_s1_dmg int := 0; v_s1_fam text; v_s1_beats text[]; v_s1_loses text[]; v_s1_blk int := 0; v_s1_heal int := 0; v_s1_cost int := 0; v_s1_gain int := 0;
  v_s2_dmg int := 0; v_s2_fam text; v_s2_beats text[]; v_s2_loses text[]; v_s2_blk int := 0; v_s2_heal int := 0; v_s2_cost int := 0; v_s2_gain int := 0;
  
  v_p1_final_dmg int := 0; v_p2_final_dmg int := 0;
  v_p1_bonus int := 0; v_p2_bonus int := 0;
  v_p1_penalty int := 0; v_p2_penalty int := 0;
  
  v_s1_final_blk int := 0; v_s2_final_blk int := 0;
  
  v_adv_bonus int := 14;
  v_dis_penalty int := 8;
  v_same_penalty int := 6;
  
  v_winner_id uuid := null;
  v_ai_rand float;
begin
  select * into v_duel from hsf_duels where id = p_duel_id;
  
  -- 1. IA DINÁMICA
  if v_duel.mode = 'ai' then
    v_ai_rand := random();
    if v_duel.player_two_hp < 35 and v_duel.player_two_energy >= 2 and v_ai_rand < 0.6 then v_p2_spell_key := 'episkey'; 
    elsif v_duel.player_two_energy < 1 then v_p2_spell_key := 'accio'; 
    elsif v_duel.player_one_energy < 2 and v_duel.player_two_energy >= 2 and v_ai_rand < 0.7 then v_p2_spell_key := 'stupefy'; 
    elsif v_ai_rand < 0.3 and v_duel.player_two_energy >= 1 then v_p2_spell_key := 'protego'; 
    elsif v_ai_rand < 0.6 and v_duel.player_two_energy >= 2 then v_p2_spell_key := 'incendio'; 
    elsif v_ai_rand < 0.8 and v_duel.player_two_energy >= 2 then v_p2_spell_key := 'petrificus'; 
    elsif v_duel.player_two_energy >= 1 then v_p2_spell_key := 'expelliarmus'; 
    else v_p2_spell_key := 'accio';
    end if;
  else
    select spell_key into v_p2_spell_key from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_duel.player_two;
  end if;

  -- 2. Obtener turno del P1
  select * into v_p1_turn from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_duel.player_one;
  
  if v_p1_turn is null or v_p2_spell_key is null then raise exception 'Faltan movimientos'; end if;

  -- 3. Mapeo de Hechizos
  case v_p1_turn.spell_key
    when 'expelliarmus' then v_s1_dmg := 14; v_s1_fam := 'disarm'; v_s1_beats := array['heavy']; v_s1_loses := array['defense']; v_s1_cost := 1;
    when 'stupefy'      then v_s1_dmg := 26; v_s1_fam := 'heavy';  v_s1_beats := array['heal', 'charge']; v_s1_loses := array['disarm', 'defense']; v_s1_cost := 2;
    when 'protego'      then v_s1_blk := 20; v_s1_fam := 'defense'; v_s1_beats := array['attack', 'heavy']; v_s1_loses := array['control']; v_s1_cost := 1;
    when 'petrificus'   then v_s1_dmg := 10; v_s1_fam := 'control'; v_s1_beats := array['defense']; v_s1_loses := array['counter']; v_s1_cost := 2;
    when 'incendio'     then v_s1_dmg := 16; v_s1_fam := 'attack'; v_s1_beats := array['charge']; v_s1_loses := array['defense']; v_s1_cost := 2;
    when 'episkey'      then v_s1_heal := 18; v_s1_fam := 'heal'; v_s1_beats := array['defense']; v_s1_loses := array['heavy']; v_s1_cost := 2;
    when 'accio'        then v_s1_gain := 2; v_s1_fam := 'charge'; v_s1_beats := array['counter']; v_s1_loses := array['attack', 'heavy']; v_s1_cost := 0;
    when 'finite'       then v_s1_dmg := 8; v_s1_fam := 'counter'; v_s1_beats := array['control']; v_s1_loses := array['attack']; v_s1_cost := 1;
    when 'confundus'    then v_s1_dmg := 6; v_s1_fam := 'control'; v_s1_beats := array['defense']; v_s1_loses := array['counter']; v_s1_cost := 2;
    when 'rictusempra'  then v_s1_dmg := 12; v_s1_fam := 'attack'; v_s1_beats := array['charge']; v_s1_loses := array['defense']; v_s1_cost := 1;
    else v_s1_dmg := 10; v_s1_fam := 'attack'; v_s1_cost := 1;
  end case;

  case v_p2_spell_key
    when 'expelliarmus' then v_s2_dmg := 14; v_s2_fam := 'disarm'; v_s2_beats := array['heavy']; v_s2_loses := array['defense']; v_s2_cost := 1;
    when 'stupefy'      then v_s2_dmg := 26; v_s2_fam := 'heavy';  v_s2_beats := array['heal', 'charge']; v_s2_loses := array['disarm', 'defense']; v_s2_cost := 2;
    when 'protego'      then v_s2_blk := 20; v_s2_fam := 'defense'; v_s2_beats := array['attack', 'heavy']; v_s2_loses := array['control']; v_s2_cost := 1;
    when 'petrificus'   then v_s2_dmg := 10; v_s2_fam := 'control'; v_s2_beats := array['defense']; v_s2_loses := array['counter']; v_s2_cost := 2;
    when 'incendio'     then v_s2_dmg := 16; v_s2_fam := 'attack'; v_s2_beats := array['charge']; v_s2_loses := array['defense']; v_s2_cost := 2;
    when 'episkey'      then v_s2_heal := 18; v_s2_fam := 'heal'; v_s2_beats := array['defense']; v_s2_loses := array['heavy']; v_s2_cost := 2;
    when 'accio'        then v_s2_gain := 2; v_s2_fam := 'charge'; v_s2_beats := array['counter']; v_s2_loses := array['attack', 'heavy']; v_s2_cost := 0;
    when 'finite'       then v_s2_dmg := 8; v_s2_fam := 'counter'; v_s2_beats := array['control']; v_s2_loses := array['attack']; v_s2_cost := 1;
    when 'confundus'    then v_s2_dmg := 6; v_s2_fam := 'control'; v_s2_beats := array['defense']; v_s2_loses := array['counter']; v_s2_cost := 2;
    when 'rictusempra'  then v_s2_dmg := 12; v_s2_fam := 'attack'; v_s2_beats := array['charge']; v_s2_loses := array['defense']; v_s2_cost := 1;
    else v_s2_dmg := 10; v_s2_fam := 'attack'; v_s2_cost := 1;
  end case;

  -- 4. Cálculo de Modificadores (Ventaja solo aplica si hay daño base)
  if v_s2_fam = any(v_s1_beats) then 
    if v_s1_dmg > 0 then v_p1_bonus := v_adv_bonus; end if;
    v_s2_final_blk := floor(v_s2_blk * 0.5);
  else
    v_s2_final_blk := v_s2_blk;
  end if;
  
  if v_s1_fam = any(v_s2_beats) then 
    if v_s2_dmg > 0 then v_p2_bonus := v_adv_bonus; end if;
    v_s1_final_blk := floor(v_s1_blk * 0.5);
  else
    v_s1_final_blk := v_s1_blk;
  end if;

  if v_s2_fam = any(v_s1_loses) then v_p1_penalty := v_dis_penalty; end if;
  if v_s1_fam = any(v_s2_loses) then v_p2_penalty := v_dis_penalty; end if;
  if v_s1_fam = v_s2_fam then v_p1_penalty := v_p1_penalty + v_same_penalty; v_p2_penalty := v_p2_penalty + v_same_penalty; end if;

  v_p1_final_dmg := greatest(0, v_s1_dmg + v_p1_bonus - v_p1_penalty - v_s2_final_blk);
  v_p2_final_dmg := greatest(0, v_s2_dmg + v_p2_bonus - v_p2_penalty - v_s1_final_blk);

  -- 5. Actualizar Estado
  update hsf_duels
  set 
    player_one_hp = least(100, greatest(0, player_one_hp - v_p2_final_dmg + v_s1_heal)),
    player_two_hp = least(100, greatest(0, player_two_hp - v_p1_final_dmg + v_s2_heal)),
    player_one_energy = least(5, greatest(0, player_one_energy - v_s1_cost + v_s1_gain)),
    player_two_energy = least(5, greatest(0, player_two_energy - v_s2_cost + v_s2_gain)),
    turn_number = turn_number + 1
  where id = p_duel_id
  returning * into v_duel;

  -- 6. Registrar Evento (Nombres de llaves corregidos para el frontend)
  insert into hsf_duel_events (duel_id, turn_number, event_type, payload)
  values (p_duel_id, p_turn_number, 'turn_resolved', jsonb_build_object(
    'p1_spell', v_p1_turn.spell_key, 'p2_spell', v_p2_spell_key,
    'p1_damage', v_p2_final_dmg, 'p2_damage', v_p1_final_dmg,
    'p1_blocked', v_s1_final_blk, 'p2_blocked', v_s2_final_blk,
    'p1_heal', v_s1_heal, 'p2_heal', v_s2_heal,
    'p1_energy_cost', v_s1_cost, 'p2_energy_cost', v_s2_cost,
    'p1_energy_gain', v_s1_gain, 'p2_energy_gain', v_s2_gain,
    'p1_bonus', v_p1_bonus, 'p2_bonus', v_p2_bonus,
    'p1_penalty', v_p1_penalty, 'p2_penalty', v_p2_penalty,
    'message', '¡Impacto mágico procesado!'
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
