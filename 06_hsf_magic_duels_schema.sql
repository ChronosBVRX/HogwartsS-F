-- ============================================================
-- 06_hsf_magic_duels_schema.sql
-- Módulo: Duelos Mágicos
-- Proyecto: Hogwarts Snacks & Foods
-- ============================================================

-- 1. Perfiles de Duelo (Estadísticas y Moneda del juego)
create table if not exists public.hsf_duel_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mmr int not null default 1000,
  wins int not null default 0,
  losses int not null default 0,
  draws int not null default 0,
  duels_played int not null default 0,
  ai_wins int not null default 0,
  ai_losses int not null default 0,
  pvp_wins int not null default 0,
  pvp_losses int not null default 0,
  duel_shards int not null default 0,
  equipped_wand text,
  equipped_title text,
  equipped_arena text,
  equipped_spell_skin text,
  last_daily_bonus date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Duelos (Estado de la partida)
create table if not exists public.hsf_duels (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('ai', 'pvp')),
  status text not null default 'waiting'
    check (status in ('waiting', 'active', 'finished', 'cancelled', 'abandoned')),
  player_one uuid not null references auth.users(id) on delete cascade,
  player_two uuid references auth.users(id) on delete cascade,
  player_one_name text,
  player_two_name text,
  player_one_house text,
  player_two_house text,
  winner_id uuid references auth.users(id),
  loser_id uuid references auth.users(id),
  turn_number int not null default 1,
  current_phase text not null default 'selecting'
    check (current_phase in ('selecting', 'resolving', 'finished')),
  player_one_hp int not null default 100,
  player_two_hp int not null default 100,
  player_one_energy int not null default 3,
  player_two_energy int not null default 3,
  player_one_focus int not null default 0,
  player_two_focus int not null default 0,
  player_one_used_house_power boolean not null default false,
  player_two_used_house_power boolean not null default false,
  player_one_used_item boolean not null default false,
  player_two_used_item boolean not null default false,
  invite_code text unique,
  last_event jsonb,
  metadata jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  finished_at timestamptz
);

-- 3. Turnos (Elecciones de los jugadores)
create table if not exists public.hsf_duel_turns (
  id uuid primary key default gen_random_uuid(),
  duel_id uuid not null references public.hsf_duels(id) on delete cascade,
  turn_number int not null,
  player_id uuid not null references auth.users(id) on delete cascade,
  spell_key text not null,
  item_key text,
  used_focus boolean not null default false,
  created_at timestamptz default now(),
  unique (duel_id, turn_number, player_id)
);

-- 4. Eventos Visuales (Historial de lo que pasó)
create table if not exists public.hsf_duel_events (
  id uuid primary key default gen_random_uuid(),
  duel_id uuid not null references public.hsf_duels(id) on delete cascade,
  turn_number int not null,
  event_type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz default now()
);

-- 5. Tienda de Ítems
create table if not exists public.hsf_duel_items (
  id uuid primary key default gen_random_uuid(),
  item_key text unique not null,
  name text not null,
  description text,
  item_type text not null check (item_type in ('cosmetic', 'utility')),
  category text not null check (category in ('wand', 'title', 'arena', 'spell_skin', 'utility')),
  price_galleons int not null default 0,
  price_shards int not null default 0,
  effect jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- 6. Inventario
create table if not exists public.hsf_duel_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null references public.hsf_duel_items(item_key),
  acquired_at timestamptz default now(),
  unique (user_id, item_key)
);

-- 7. Límites Diarios
create table if not exists public.hsf_duel_daily_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  duel_date date not null default current_date,
  ai_rewarded_duels int not null default 0,
  pvp_rewarded_duels int not null default 0,
  total_shards_awarded int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, duel_date)
);

-- 8. Puntos por Casa (Ranking)
create table if not exists public.hsf_duel_house_points (
  id uuid primary key default gen_random_uuid(),
  house_slug text not null,
  points int not null default 0,
  month_key text not null, -- format YYYY-MM
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (house_slug, month_key)
);

-- Habilitar RLS
alter table public.hsf_duel_profiles enable row level security;
alter table public.hsf_duels enable row level security;
alter table public.hsf_duel_turns enable row level security;
alter table public.hsf_duel_events enable row level security;
alter table public.hsf_duel_items enable row level security;
alter table public.hsf_duel_inventory enable row level security;
alter table public.hsf_duel_daily_limits enable row level security;
alter table public.hsf_duel_house_points enable row level security;

-- Políticas
create policy "Users can view own duel profile" on public.hsf_duel_profiles for select using (auth.uid() = user_id);
create policy "Users can update own cosmetic equipment" on public.hsf_duel_profiles for update using (auth.uid() = user_id);
create policy "Users can view duels where they participate" on public.hsf_duels for select using (auth.uid() = player_one or auth.uid() = player_two);
create policy "Users can create own duels" on public.hsf_duels for insert with check (auth.uid() = player_one);
create policy "Everyone can view active duel items" on public.hsf_duel_items for select using (is_active = true);
create policy "Users can view own inventory" on public.hsf_duel_inventory for select using (auth.uid() = user_id);

-- RPC: Crear Duelo IA
create or replace function public.hsf_create_ai_duel()
returns uuid
language plpgsql
security definer
as $$
declare
  v_user uuid := auth.uid();
  v_profile record;
  v_duel_id uuid;
begin
  if v_user is null then raise exception 'No autenticado'; end if;

  select display_name, house_slug into v_profile
  from hsf_profiles where user_id = v_user;

  insert into hsf_duel_profiles (user_id)
  values (v_user) on conflict (user_id) do nothing;

  insert into public.hsf_duels (
    mode, status, player_one, player_one_name, player_one_house,
    player_two_name, player_two_house, player_two_hp
  )
  values (
    'ai', 'active', v_user, v_profile.display_name, v_profile.house_slug,
    'Rival Encantado', 'ai', 100
  )
  returning id into v_duel_id;

  return v_duel_id;
end;
$$;
