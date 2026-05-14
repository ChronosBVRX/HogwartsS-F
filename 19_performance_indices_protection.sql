-- Optimización de índices para mejorar el rendimiento de consultas frecuentes
-- Estos índices no son destructivos y solo mejoran la velocidad de lectura.

create index if not exists idx_hsf_profiles_user_id
on public.hsf_profiles(user_id);

create index if not exists idx_hsf_adventure_runs_customer_status
on public.hsf_adventure_runs(customer_id, status);

create index if not exists idx_hsf_adventure_runs_customer_created
on public.hsf_adventure_runs(customer_id, created_at desc);

create index if not exists idx_hsf_adventure_rewards_customer_created
on public.hsf_adventure_rewards(customer_id, created_at desc);

create index if not exists idx_hsf_adventure_rewards_status_created
on public.hsf_adventure_rewards(status, created_at desc);

create index if not exists idx_hsf_adventure_steps_adventure_order
on public.hsf_adventure_steps(adventure_id, step_order);

create index if not exists idx_hsf_adventure_zones_slug
on public.hsf_adventure_zones(slug);

create index if not exists idx_hsf_adventure_zones_active
on public.hsf_adventure_zones(active);
