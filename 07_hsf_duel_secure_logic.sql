
-- ==========================================
-- 2. LÓGICA DE CÁLCULO DE DAÑO (BACKEND ACTUALIZADO)
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
  
  -- Spell Metadata (Simulated to avoid complex joins in this version)
  -- En producción esto vendría de hsf_spells
  v_s1_dmg int := 0; v_s1_fam text; v_s1_beats text[]; v_s1_loses text[]; v_s1_blk int := 0;
  v_s2_dmg int := 0; v_s2_fam text; v_s2_beats text[]; v_s2_loses text[]; v_s2_blk int := 0;
  
  v_p1_final_dmg int := 0; v_p2_final_dmg int := 0;
  v_p1_bonus int := 0; v_p2_bonus int := 0;
  v_p1_penalty int := 0; v_p2_penalty int := 0;
  
  v_adv_bonus int := 14;
  v_dis_penalty int := 8;
  v_same_penalty int := 6;
  
  v_winner_id uuid := null;
  v_ai_spell_key text := 'protego';
  v_ai_rand float;
begin
  select * into v_duel from hsf_duels where id = p_duel_id;
  
  -- 1. MEJORA DE IA (Si el modo es AI y no existe el turno de P2)
  if v_duel.mode = 'ai' then
    v_ai_rand := random();
    
    -- Lógica de decisión IA
    if v_duel.player_two_hp < 35 and v_ai_rand < 0.6 then
      v_ai_spell_key := 'episkey'; -- Priorizar curación
    elsif v_duel.player_two_energy < 1 then
      v_ai_spell_key := 'accio'; -- Cargar energía obligatoriamente
    elsif v_duel.player_one_energy < 2 and v_ai_rand < 0.7 then
      v_ai_spell_key := 'stupefy'; -- Castigar falta de energía del jugador
    elsif v_ai_rand < 0.3 then
      v_ai_spell_key := 'protego'; -- Táctico defensivo
    elsif v_ai_rand < 0.6 then
      v_ai_spell_key := 'incendio'; -- Ataque balanceado
    elsif v_ai_rand < 0.8 then
      v_ai_spell_key := 'petrificus'; -- Control
    else
      v_ai_spell_key := 'expelliarmus'; -- Desarme
    end if;

    -- Insertar turno de IA para que quede registrado
    insert into hsf_duel_turns (duel_id, turn_number, player_id, spell_key)
    values (p_duel_id, p_turn_number, '00000000-0000-0000-0000-000000000000', v_ai_spell_key)
    on conflict do nothing;
  end if;

  -- 2. Obtener turnos definitivos
  select * into v_p1_turn from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_duel.player_one;
  
  if v_duel.mode = 'ai' then
    select * into v_p2_turn from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number and player_id = '00000000-0000-0000-0000-000000000000';
  else
    select * into v_p2_turn from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_duel.player_two;
  end if;

  -- 3. Mapeo de Hechizos (Hardcoded para match con duelSpells.js)
  -- P1 Spell
  case v_p1_turn.spell_key
    when 'expelliarmus' then v_s1_dmg := 14; v_s1_fam := 'disarm'; v_s1_beats := array['heavy']; v_s1_loses := array['defense'];
    when 'stupefy'      then v_s1_dmg := 26; v_s1_fam := 'heavy';  v_s1_beats := array['heal', 'charge']; v_s1_loses := array['disarm', 'defense'];
    when 'protego'      then v_s1_blk := 20; v_s1_fam := 'defense'; v_s1_beats := array['attack', 'heavy']; v_s1_loses := array['control'];
    when 'petrificus'   then v_s1_dmg := 10; v_s1_fam := 'control'; v_s1_beats := array['defense']; v_s1_loses := array['counter'];
    when 'incendio'     then v_s1_dmg := 16; v_s1_fam := 'attack'; v_s1_beats := array['charge']; v_s1_loses := array['defense'];
    when 'episkey'      then v_s1_fam := 'heal'; v_s1_beats := array['defense']; v_s1_loses := array['heavy'];
    when 'accio'        then v_s1_fam := 'charge'; v_s1_beats := array['counter']; v_s1_loses := array['attack', 'heavy'];
    else v_s1_dmg := 10; v_s1_fam := 'attack';
  end case;

  -- P2 Spell
  case v_p2_turn.spell_key
    when 'expelliarmus' then v_s2_dmg := 14; v_s2_fam := 'disarm'; v_s2_beats := array['heavy']; v_s2_loses := array['defense'];
    when 'stupefy'      then v_s2_dmg := 26; v_s2_fam := 'heavy';  v_s2_beats := array['heal', 'charge']; v_s2_loses := array['disarm', 'defense'];
    when 'protego'      then v_s2_blk := 20; v_s2_fam := 'defense'; v_s2_beats := array['attack', 'heavy']; v_s2_loses := array['control'];
    when 'petrificus'   then v_s2_dmg := 10; v_s2_fam := 'control'; v_s2_beats := array['defense']; v_s2_loses := array['counter'];
    when 'incendio'     then v_s2_dmg := 16; v_s2_fam := 'attack'; v_s2_beats := array['charge']; v_s2_loses := array['defense'];
    when 'episkey'      then v_s2_fam := 'heal'; v_s2_beats := array['defense']; v_s2_loses := array['heavy'];
    when 'accio'        then v_s2_fam := 'charge'; v_s2_beats := array['counter']; v_s2_loses := array['attack', 'heavy'];
    else v_s2_dmg := 10; v_s2_fam := 'attack';
  end case;

  -- 4. Cálculo de Modificadores (Match con duelBalance.js)
  if v_s2_fam = any(v_s1_beats) then v_p1_bonus := v_adv_bonus; end if;
  if v_s1_fam = any(v_s2_beats) then v_p2_bonus := v_adv_bonus; end if;
  if v_s2_fam = any(v_s1_loses) then v_p1_penalty := v_dis_penalty; end if;
  if v_s1_fam = any(v_s2_loses) then v_p2_penalty := v_dis_penalty; end if;
  if v_s1_fam = v_s2_fam then v_p1_penalty := v_p1_penalty + v_same_penalty; v_p2_penalty := v_p2_penalty + v_same_penalty; end if;

  v_p1_final_dmg := max(0, v_s1_dmg + v_p1_bonus - v_p1_penalty - v_s2_blk);
  v_p2_final_dmg := max(0, v_s2_dmg + v_p2_bonus - v_p2_penalty - v_s1_blk);

  -- 5. Actualizar Duelo
  update hsf_duels
  set 
    player_one_hp = max(0, player_one_hp - v_p2_final_dmg + (case when v_p1_turn.spell_key = 'episkey' then 18 else 0 end)),
    player_two_hp = max(0, player_two_hp - v_p1_final_dmg + (case when v_p2_turn.spell_key = 'episkey' then 18 else 0 end)),
    player_one_energy = case when v_p1_turn.spell_key = 'accio' then min(5, player_one_energy + 2) else min(5, player_one_energy + 1) end,
    player_two_energy = case when v_p2_turn.spell_key = 'accio' then min(5, player_two_energy + 2) else min(5, player_two_energy + 1) end,
    turn_number = turn_number + 1
  where id = p_duel_id
  returning * into v_duel;

  -- 6. Registrar Evento Narrativo
  insert into hsf_duel_events (duel_id, turn_number, event_type, payload)
  values (p_duel_id, p_turn_number, 'turn_resolved', jsonb_build_object(
    'p1_spell', v_p1_turn.spell_key,
    'p2_spell', v_p2_turn.spell_key,
    'p1_damage', v_p2_final_dmg,
    'p2_damage', v_p1_final_dmg,
    'message', '¡El choque de magias ha sido resuelto!'
  ));

  -- 7. Revisar fin de duelo
  if v_duel.player_one_hp <= 0 or v_duel.player_two_hp <= 0 or v_duel.turn_number > 12 then
    update hsf_duels set status = 'finished', finished_at = now(), winner_id = (case when player_one_hp > player_two_hp then player_one else player_two end) where id = p_duel_id;
    perform hsf_finish_duel_rewards(p_duel_id);
  end if;

  return jsonb_build_object('status', 'resolved');
end;
$$;
