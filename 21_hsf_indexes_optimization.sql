-- 21_hsf_indexes_optimization.sql
-- Optimización de índices para mejorar la velocidad general de la aplicación.

-- 1. hsf_profiles
CREATE INDEX IF NOT EXISTS idx_hsf_profiles_user_id ON public.hsf_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_hsf_profiles_role ON public.hsf_profiles(role);

-- 2. hsf_visit_sessions
CREATE INDEX IF NOT EXISTS idx_hsf_visit_sessions_customer_id ON public.hsf_visit_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_hsf_visit_sessions_status ON public.hsf_visit_sessions(status);
CREATE INDEX IF NOT EXISTS idx_hsf_visit_sessions_created_at ON public.hsf_visit_sessions(created_at);

-- 3. hsf_ticket_claims
CREATE INDEX IF NOT EXISTS idx_hsf_ticket_claims_session_id ON public.hsf_ticket_claims(session_id);
CREATE INDEX IF NOT EXISTS idx_hsf_ticket_claims_status ON public.hsf_ticket_claims(status);

-- 4. hsf_menu_items & categories
CREATE INDEX IF NOT EXISTS idx_hsf_menu_categories_active ON public.hsf_menu_categories(active);
CREATE INDEX IF NOT EXISTS idx_hsf_menu_categories_sort_order ON public.hsf_menu_categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_hsf_menu_items_active ON public.hsf_menu_items(active);
CREATE INDEX IF NOT EXISTS idx_hsf_menu_items_category_id ON public.hsf_menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_hsf_menu_items_sort_order ON public.hsf_menu_items(sort_order);

-- 5. hsf_duels & duel components
CREATE INDEX IF NOT EXISTS idx_hsf_duels_player_one ON public.hsf_duels(player_one);
CREATE INDEX IF NOT EXISTS idx_hsf_duels_player_two ON public.hsf_duels(player_two);
CREATE INDEX IF NOT EXISTS idx_hsf_duels_status ON public.hsf_duels(status);

CREATE INDEX IF NOT EXISTS idx_hsf_duel_turns_duel_id ON public.hsf_duel_turns(duel_id);
CREATE INDEX IF NOT EXISTS idx_hsf_duel_turns_player_id ON public.hsf_duel_turns(player_id);

CREATE INDEX IF NOT EXISTS idx_hsf_duel_inventory_user_id ON public.hsf_duel_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_hsf_duel_daily_limits_user_id ON public.hsf_duel_daily_limits(user_id);

-- 6. hsf_adventure
CREATE INDEX IF NOT EXISTS idx_hsf_adventure_runs_customer_id ON public.hsf_adventure_runs(customer_id);
CREATE INDEX IF NOT EXISTS idx_hsf_adventure_runs_status ON public.hsf_adventure_runs(status);

CREATE INDEX IF NOT EXISTS idx_hsf_adventure_run_step_variants_run_id ON public.hsf_adventure_run_step_variants(run_id);
CREATE INDEX IF NOT EXISTS idx_hsf_adventure_attempts_run_id ON public.hsf_adventure_attempts(run_id);
