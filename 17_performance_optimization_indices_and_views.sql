
-- ============================================================
-- 17_performance_optimization_indices_and_views.sql
-- Optimización masiva de rendimiento: Índices, Vistas y RPCs.
-- ============================================================

-- 1. ÍNDICES ESTRATÉGICOS
-- PERFIL / AUTH
create index if not exists idx_hsf_profiles_user_id on public.hsf_profiles (user_id);
create index if not exists idx_hsf_profiles_house_slug on public.hsf_profiles (house_slug);
create index if not exists idx_hsf_profiles_created_at on public.hsf_profiles (created_at desc);

-- MENÚ
create index if not exists idx_hsf_menu_categories_active_sort on public.hsf_menu_categories (active, sort_order);
create index if not exists idx_hsf_menu_items_active_category_sort on public.hsf_menu_items (active, category_id, sort_order);
create index if not exists idx_hsf_menu_items_active_sort on public.hsf_menu_items (active, sort_order);

-- VISITAS / MESEROS / PERFIL
create index if not exists idx_hsf_visit_sessions_customer_status_created on public.hsf_visit_sessions (customer_id, status, created_at desc);
create index if not exists idx_hsf_visit_sessions_status_created on public.hsf_visit_sessions (status, created_at desc);

-- TICKETS / PUNTOS
create index if not exists idx_hsf_ticket_claims_customer_created on public.hsf_ticket_claims (customer_id, created_at desc);
create index if not exists idx_hsf_ticket_claims_customer_status_created on public.hsf_ticket_claims (customer_id, status, created_at desc);
create index if not exists idx_hsf_ticket_claims_status_created on public.hsf_ticket_claims (status, created_at desc);
create index if not exists idx_hsf_ticket_claims_session_id on public.hsf_ticket_claims (session_id);

-- AVENTURAS
create index if not exists idx_hsf_adventure_runs_customer_status_created on public.hsf_adventure_runs (customer_id, status, created_at desc);
create index if not exists idx_hsf_adventure_rewards_customer_status_created on public.hsf_adventure_rewards (customer_id, status, created_at desc);
create index if not exists idx_hsf_adventure_attempts_run_created on public.hsf_adventure_attempts (run_id, created_at desc);

-- DUELOS
create index if not exists idx_hsf_duels_player_one_status_created on public.hsf_duels (player_one, status, created_at desc);
create index if not exists idx_hsf_duels_player_two_status_created on public.hsf_duels (player_two, status, created_at desc);
create index if not exists idx_hsf_duel_events_duel_created on public.hsf_duel_events (duel_id, created_at desc);
create index if not exists idx_hsf_duel_profiles_user_id on public.hsf_duel_profiles (user_id);
create index if not exists idx_hsf_duel_profiles_mmr on public.hsf_duel_profiles (mmr desc);
create index if not exists idx_hsf_duel_house_points_month_house on public.hsf_duel_house_points (month_key, house_slug);

-- 2. RPC PARA ADMIN DASHBOARD (Evita conteos pesados en JS)
create or replace function public.hsf_admin_dashboard_stats()
returns table (
  users_count bigint,
  total_loyalty_points bigint,
  pending_tickets_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*) from public.hsf_profiles)::bigint as users_count,
    (select coalesce(sum(loyalty_points), 0) from public.hsf_profiles)::bigint as total_loyalty_points,
    (select count(*) from public.hsf_ticket_claims where status = 'pending')::bigint as pending_tickets_count;
$$;

-- 3. VISTAS PARA RANKING DE DUELOS (Reduce N+1 en frontend)
create or replace view public.hsf_duel_ranking_players_view as
select
  dp.user_id,
  dp.mmr,
  dp.wins,
  dp.losses,
  dp.duels_played,
  dp.duel_shards,
  p.display_name,
  p.house_slug
from public.hsf_duel_profiles dp
left join public.hsf_profiles p
  on p.user_id = dp.user_id;

create or replace view public.hsf_duel_house_leaders_view as
select *
from (
  select
    dp.user_id,
    dp.mmr,
    dp.wins,
    dp.duels_played,
    p.display_name,
    p.house_slug,
    row_number() over (
      partition by p.house_slug
      order by dp.mmr desc
    ) as house_rank
  from public.hsf_duel_profiles dp
  join public.hsf_profiles p
    on p.user_id = dp.user_id
  where p.house_slug is not null
) ranked
where house_rank <= 2;
