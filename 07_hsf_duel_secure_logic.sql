
-- ==========================================
-- 2. LÓGICA DE CÁLCULO DE DAÑO (BACKEND ACTUALIZADO Y CORREGIDO)
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
  
  -- Spell Metadata (Match con duelSpells.js)
  v_s1_dmg int := 0; v_s1_fam text; v_s1_beats text[]; v_s1_loses text[]; v_s1_blk int := 0;
  v_s2_dmg int := 0; v_s2_fam text; v_s2_beats text[]; v_s2_loses text[]; v_s2_blk int := 0;
  
  v_p1_final_dmg int := 0; v_p2_final_dmg int := 0;
  v_p1_bonus int := 0; v_p2_bonus int := 0;
  v_p1_penalty int := 0; v_p2_penalty int := 0;
  
  v_adv_bonus int := 14;
  v_dis_penalty int := 8;
  v_same_penalty int := 6;
  
  v_winner_id uuid := null;
  v_ai_rand float;
begin
  select * into v_duel from hsf_duels where id = p_duel_id;
  
  -- 1. IA DINÁMICA (Si el modo es AI)
  if v_duel.mode = 'ai' then
    v_ai_rand := random();
    
    -- Lógica reactiva de IA
    if v_duel.player_two_hp < 35 and v_ai_rand < 0.6 then
      v_p2_spell_key := 'episkey'; -- Priorizar curación
    elsif v_duel.player_two_energy < 1 then
      v_p2_spell_key := 'accio'; -- Cargar energía
    elsif v_duel.player_one_energy < 2 and v_ai_rand < 0.7 then
      v_p2_spell_key := 'stupefy'; -- Presión agresiva
    elsif v_ai_rand < 0.3 then
      v_p2_spell_key := 'protego'; 
    elsif v_ai_rand < 0.6 then
      v_p2_spell_key := 'incendio'; 
    elsif v_ai_rand < 0.8 then
      v_p2_spell_key := 'petrificus'; 
    else
      v_p2_spell_key := 'expelliarmus'; 
    end if;
  else
    -- Para PvP, obtenemos el hechizo del oponente de hsf_duel_turns
    select spell_key into v_p2_spell_key from hsf_duel_turns 
    where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_duel.player_two;
  end if;

  -- 2. Obtener turno del P1
  select * into v_p1_turn from hsf_duel_turns where duel_id = p_duel_id and turn_number = p_turn_number and player_id = v_duel.player_one;
  
  if v_p1_turn is null or v_p2_spell_key is null then
    raise exception 'Faltan movimientos para resolver el turno';
  end if;

  -- 3. Mapeo de Hechizos (P1)
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

  -- Mapeo de Hechizos (P2/IA)
  case v_p2_spell_key
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
    player_two_hp = max(0, player_two_hp - v_p1_final_dmg + (case when v_p2_spell_key = 'episkey' then 18 else 0 end)),
    player_one_energy = case when v_p1_turn.spell_key = 'accio' then min(5, player_one_energy + 2) else min(5, player_one_energy + 1) end,
    player_two_energy = case when v_p2_spell_key = 'accio' then min(5, player_two_energy + 2) else min(5, player_two_energy + 1) end,
    turn_number = turn_number + 1
  where id = p_duel_id
  returning * into v_duel;

  -- 6. Registrar Evento Narrativo para el Cliente
  insert into hsf_duel_events (duel_id, turn_number, event_type, payload)
  values (p_duel_id, p_turn_number, 'turn_resolved', jsonb_build_object(
    'p1_spell', v_p1_turn.spell_key,
    'p2_spell', v_p2_spell_key,
    'p1_damage', v_p2_final_dmg,
    'p2_damage', v_p1_final_dmg,
    'message', '¡El choque de magias ha sido resuelto!'
  ));

  -- 7. Revisar fin de duelo
  if v_duel.player_one_hp <= 0 or v_duel.player_two_hp <= 0 or v_duel.turn_number > 12 then
    -- El ganador es quien tiene más vida (o el que no murió)
    if v_duel.player_one_hp > v_duel.player_two_hp then 
      v_winner_id := v_duel.player_one;
    elsif v_duel.player_two_hp > v_duel.player_one_hp then 
      v_winner_id := v_duel.player_two; -- Será null si es AI
    end if;
    
    update hsf_duels 
    set status = 'finished', finished_at = now(), winner_id = v_winner_id 
    where id = p_duel_id;
    
    perform hsf_finish_duel_rewards(p_duel_id);
  end if;

  return jsonb_build_object('status', 'resolved');
end;
$$;


-- ==========================================
-- 3. RECOMPENSAS ATÓMICAS (ACTUALIZADO PARA MMR Y AI)
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

  -- Recompensas Player One (Siempre es el usuario humano)
  v_shard_gain := case when v_duel.winner_id = v_duel.player_one then 15 else 5 end;
  
  update hsf_duel_profiles
  set 
    wins = wins + (case when v_duel.winner_id = v_duel.player_one then 1 else 0 end),
    losses = losses + (case when v_duel.winner_id = v_duel.player_one then 0 else 1 end),
    ai_wins = ai_wins + (case when v_duel.mode = 'ai' and v_duel.winner_id = v_duel.player_one then 1 else 0 end),
    ai_losses = ai_losses + (case when v_duel.mode = 'ai' and v_duel.winner_id != v_duel.player_one then 1 else 0 end),
    pvp_wins = pvp_wins + (case when v_duel.mode = 'pvp' and v_duel.winner_id = v_duel.player_one then 1 else 0 end),
    pvp_losses = pvp_losses + (case when v_duel.mode = 'pvp' and v_duel.winner_id != v_duel.player_one then 1 else 0 end),
    duel_shards = duel_shards + v_shard_gain,
    mmr = mmr + (case when v_duel.winner_id = v_duel.player_one then v_mmr_gain else -10 end),
    duels_played = duels_played + 1
  where user_id = v_duel.player_one;

  -- Puntos para la casa
  insert into hsf_duel_house_points (house_slug, month_key, points)
  values (v_duel.player_one_house, to_char(now(), 'YYYY-MM'), v_shard_gain)
  on conflict (house_slug, month_key) 
  do update set points = hsf_duel_house_points.points + v_shard_gain;

  -- Recompensas Player Two (Solo si es PvP humano)
  if v_duel.mode = 'pvp' and v_duel.player_two is not null then
    v_shard_gain := case when v_duel.winner_id = v_duel.player_two then 15 else 5 end;
    
    update hsf_duel_profiles
    set 
      wins = wins + (case when v_duel.winner_id = v_duel.player_two then 1 else 0 end),
      losses = losses + (case when v_duel.winner_id = v_duel.player_two then 0 else 1 end),
      pvp_wins = pvp_wins + (case when v_duel.winner_id = v_duel.player_two then 1 else 0 end),
      pvp_losses = pvp_losses + (case when v_duel.winner_id != v_duel.player_two then 1 else 0 end),
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
