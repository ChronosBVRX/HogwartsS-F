
-- ============================================================
-- 16_fix_rewards_not_null_run_id.sql
-- Permite que run_id sea nulo en hsf_adventure_rewards para recompensas de sistema.
-- ============================================================

ALTER TABLE public.hsf_adventure_rewards ALTER COLUMN run_id DROP NOT NULL;

-- Re-instalar la función de recompensa de bienvenida con el fix (aunque el fix real es el ALTER TABLE)
CREATE OR REPLACE FUNCTION public.hsf_grant_house_welcome_reward(p_user_id uuid, p_house_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reward_title text;
  v_reward_desc text;
  v_exists boolean;
BEGIN
  -- Verificar si ya recibió una recompensa de bienvenida
  SELECT EXISTS (
    SELECT 1 FROM public.hsf_adventure_rewards 
    WHERE customer_id = p_user_id AND reward_title LIKE '%Bienvenida de Casa%'
  ) INTO v_exists;

  IF v_exists THEN
    RETURN;
  END IF;

  v_reward_title := 'Soda Italiana de Bienvenida: ' || initcap(p_house_slug);
  v_reward_desc := '“No importa lo que somos por nacimiento, sino lo que llegamos a ser”. Disfruta de esta esencia mágica burbujeante para celebrar tu llegada a ' || initcap(p_house_slug) || '. Reclama con gerencia.';

  INSERT INTO public.hsf_adventure_rewards (
    run_id, 
    customer_id, 
    reward_title, 
    reward_description, 
    reward_points, 
    min_consumption, 
    status
  )
  VALUES (
    NULL, -- Ahora permitido por el ALTER TABLE anterior
    p_user_id,
    v_reward_title,
    v_reward_desc,
    0,
    0,
    'available'
  );
END;
$$;
