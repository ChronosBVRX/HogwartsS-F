-- ==========================================
-- SCRIPT DE OPTIMIZACIÓN DE RENDIMIENTO
-- ==========================================
-- Ejecuta este script en el SQL Editor de Supabase.
-- Esto creará los índices faltantes en tus llaves foráneas 
-- para acelerar drásticamente las consultas y evitar la "pantalla de carga eterna".
-- Es 100% seguro y no borrará ni alterará tus datos.

-- Índices para Aventuras
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_adventure_attempts_scanned_zone_id ON public.hsf_adventure_attempts(scanned_zone_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_adventure_attempts_step_id ON public.hsf_adventure_attempts(step_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_adventure_rewards_redeemed_by ON public.hsf_adventure_rewards(redeemed_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_adventure_rewards_run_id ON public.hsf_adventure_rewards(run_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_adventure_run_step_variants_step_id ON public.hsf_adventure_run_step_variants(step_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_adventure_run_step_variants_variant_id ON public.hsf_adventure_run_step_variants(variant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_adventure_runs_adventure_id ON public.hsf_adventure_runs(adventure_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_adventure_runs_started_zone_id ON public.hsf_adventure_runs(started_zone_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_adventure_season_template_adventures_adv_id ON public.hsf_adventure_season_template_adventures(adventure_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_adventure_steps_req_zone_id ON public.hsf_adventure_steps(required_zone_id);

-- Índices para Duelos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_duel_inventory_item_key ON public.hsf_duel_inventory(item_key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_duels_loser_id ON public.hsf_duels(loser_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_duels_winner_id ON public.hsf_duels(winner_id);

-- Índices para Tickets y Puntos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_points_ledger_created_by ON public.hsf_points_ledger(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_points_ledger_user_id ON public.hsf_points_ledger(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_claims_reviewed_by ON public.hsf_ticket_claims(reviewed_by);

-- Índices para Sesiones de Visita
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visit_sessions_closed_by ON public.hsf_visit_sessions(closed_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visit_sessions_seated_by ON public.hsf_visit_sessions(seated_by);
