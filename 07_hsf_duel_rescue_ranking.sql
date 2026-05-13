-- ==========================================
-- SCRIPT DE RESCATE: SISTEMA DE DUELOS MAGICOS
-- Ejecuta esto en el SQL Editor de Supabase
-- ==========================================

-- 1. Crear tablas si no existen
create table if not exists public.hsf_duel_profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    mmr int default 1000,
    wins int default 0,
    losses int default 0,
    duels_played int default 0,
    duel_shards int default 0,
    updated_at timestamp with time zone default now()
);

create table if not exists public.hsf_duel_house_points (
    id uuid primary key default gen_random_uuid(),
    month_key text not null, -- Formato YYYY-MM
    house_slug text not null,
    points int default 0,
    updated_at timestamp with time zone default now(),
    unique(month_key, house_slug)
);

-- 2. Habilitar RLS y permisos (Lectura pública para ranking)
alter table public.hsf_duel_profiles enable row level security;
alter table public.hsf_duel_house_points enable row level security;

drop policy if exists "Lectura pública de perfiles de duelo" on hsf_duel_profiles;
create policy "Lectura pública de perfiles de duelo" on hsf_duel_profiles for select using (true);

drop policy if exists "Lectura pública de puntos de casa" on hsf_duel_house_points;
create policy "Lectura pública de puntos de casa" on hsf_duel_house_points for select using (true);

-- 3. Función de Recompensas Mejorada
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

  -- Actualizar perfiles de duelo
  insert into hsf_duel_profiles (user_id, mmr, wins, losses, duels_played)
  values (v_duel.player_one, 1000, 0, 0, 0)
  on conflict (user_id) do nothing;

  if v_duel.winner_id = v_duel.player_one then
    update hsf_duel_profiles set mmr = mmr + v_winner_points, wins = wins + 1, duels_played = duels_played + 1 where user_id = v_duel.player_one;
  elsif v_duel.winner_id is null and v_duel.status = 'finished' then
    update hsf_duel_profiles set mmr = mmr + v_draw_points, duels_played = duels_played + 1 where user_id = v_duel.player_one;
  else
    update hsf_duel_profiles set mmr = mmr + v_loser_points, losses = losses + 1, duels_played = duels_played + 1 where user_id = v_duel.player_one;
  end if;

  if v_duel.mode = 'pvp' then
    insert into hsf_duel_profiles (user_id, mmr, wins, losses, duels_played)
    values (v_duel.player_two, 1000, 0, 0, 0)
    on conflict (user_id) do nothing;

    if v_duel.winner_id = v_duel.player_two then
      update hsf_duel_profiles set mmr = mmr + v_winner_points, wins = wins + 1, duels_played = duels_played + 1 where user_id = v_duel.player_two;
    elsif v_duel.winner_id is null and v_duel.status = 'finished' then
      update hsf_duel_profiles set mmr = mmr + v_draw_points, duels_played = duels_played + 1 where user_id = v_duel.player_two;
    else
      update hsf_duel_profiles set mmr = mmr + v_loser_points, losses = losses + 1, duels_played = duels_played + 1 where user_id = v_duel.player_two;
    end if;
  end if;

  -- Copa de las Casas
  if v_duel.winner_id is not null then
    select coalesce(p.house_slug, h.slug) into v_winner_house 
    from hsf_profiles p
    left join hsf_houses h on p.house_slug = h.slug
    where p.user_id = v_duel.winner_id;
    
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
    end if;
  end if;
end;
$$;

-- 4. PARCHE MANUAL: Forzar puntos de Ravenclaw
insert into hsf_duel_house_points (month_key, house_slug, points)
values (to_char(now(), 'YYYY-MM'), 'ravenclaw', 15)
on conflict (month_key, house_slug) 
do update set points = hsf_duel_house_points.points + 15;
