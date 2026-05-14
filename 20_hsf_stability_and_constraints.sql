-- 20_hsf_stability_and_constraints.sql

-- 1. Limpiar duplicados de inventario de duelos y agregar índice único
DELETE FROM public.hsf_duel_inventory
WHERE id IN (
  SELECT id FROM (
    SELECT id, row_number() OVER (PARTITION BY user_id, item_key ORDER BY acquired_at ASC) as rn
    FROM public.hsf_duel_inventory
  ) t
  WHERE t.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS hsf_duel_inventory_user_item_uidx
ON public.hsf_duel_inventory(user_id, item_key);

-- 2. Limpiar duplicados de puntos de casa y agregar índice único
-- Si hay varias entradas para la misma casa y mes, las agrupamos o nos quedamos con la más reciente.
-- Por seguridad, nos quedamos con la que tenga el ID mayor.
DELETE FROM public.hsf_duel_house_points
WHERE id IN (
  SELECT id FROM (
    SELECT id, row_number() OVER (PARTITION BY house_slug, month_key ORDER BY created_at DESC) as rn
    FROM public.hsf_duel_house_points
  ) t
  WHERE t.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS hsf_duel_house_points_house_month_uidx
ON public.hsf_duel_house_points(house_slug, month_key);

-- 3. Limpiar duplicados de límites diarios y agregar índice único
DELETE FROM public.hsf_duel_daily_limits
WHERE id IN (
  SELECT id FROM (
    SELECT id, row_number() OVER (PARTITION BY user_id, duel_date ORDER BY created_at DESC) as rn
    FROM public.hsf_duel_daily_limits
  ) t
  WHERE t.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS hsf_duel_daily_limits_user_date_uidx
ON public.hsf_duel_daily_limits(user_id, duel_date);

-- 4. Evitar aventuras activas múltiples
-- Marcamos las duplicadas como 'abandoned' y nos quedamos con la más reciente.
UPDATE public.hsf_adventure_runs
SET status = 'abandoned',
    updated_at = NOW()
WHERE status = 'active'
AND id IN (
  SELECT id FROM (
    SELECT id, row_number() OVER (PARTITION BY customer_id ORDER BY created_at DESC) as rn
    FROM public.hsf_adventure_runs
    WHERE status = 'active'
  ) t
  WHERE t.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS hsf_adventure_runs_one_active_per_customer_uidx
ON public.hsf_adventure_runs(customer_id)
WHERE status = 'active';

-- 5. Evitar QRs generados múltiples
UPDATE public.hsf_visit_sessions
SET status = 'expired',
    updated_at = NOW()
WHERE status = 'qr_generated'
AND id IN (
  SELECT id FROM (
    SELECT id, row_number() OVER (PARTITION BY customer_id ORDER BY created_at DESC) as rn
    FROM public.hsf_visit_sessions
    WHERE status = 'qr_generated'
  ) t
  WHERE t.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS hsf_visit_sessions_one_qr_per_customer_uidx
ON public.hsf_visit_sessions(customer_id)
WHERE status = 'qr_generated';

-- 6. RPC para Compra Segura (Transaccional) en la Tienda de Duelos
CREATE OR REPLACE FUNCTION hsf_purchase_duel_item(p_item_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_price_galleons int;
  v_price_shards int;
  v_user_galleons int;
  v_user_shards int;
BEGIN
  -- Verificar autenticación
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Obtener precios
  SELECT price_galleons, price_shards
  INTO v_price_galleons, v_price_shards
  FROM public.hsf_duel_items
  WHERE item_key = p_item_key AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Objeto no encontrado o inactivo';
  END IF;

  -- Verificar inventario
  IF EXISTS (SELECT 1 FROM public.hsf_duel_inventory WHERE user_id = v_user_id AND item_key = p_item_key) THEN
    RAISE EXCEPTION 'Ya posees este objeto';
  END IF;

  -- Verificar fondos (galleons)
  IF v_price_galleons > 0 THEN
    SELECT loyalty_points INTO v_user_galleons
    FROM public.hsf_profiles
    WHERE user_id = v_user_id;

    IF v_user_galleons < v_price_galleons THEN
      RAISE EXCEPTION 'No tienes suficientes Galeones';
    END IF;
  END IF;

  -- Verificar fondos (shards)
  IF v_price_shards > 0 THEN
    SELECT duel_shards INTO v_user_shards
    FROM public.hsf_duel_profiles
    WHERE user_id = v_user_id;

    IF v_user_shards < v_price_shards THEN
      RAISE EXCEPTION 'No tienes suficientes Fragmentos';
    END IF;
  END IF;

  -- Realizar la compra
  INSERT INTO public.hsf_duel_inventory (user_id, item_key)
  VALUES (v_user_id, p_item_key);

  -- Descontar monedas
  IF v_price_galleons > 0 THEN
    UPDATE public.hsf_profiles
    SET loyalty_points = loyalty_points - v_price_galleons
    WHERE user_id = v_user_id;
  END IF;

  IF v_price_shards > 0 THEN
    UPDATE public.hsf_duel_profiles
    SET duel_shards = duel_shards - v_price_shards
    WHERE user_id = v_user_id;
  END IF;

END;
$$;
