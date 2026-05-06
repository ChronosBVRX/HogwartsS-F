-- Función para incrementar puntos de lealtad de forma segura
CREATE OR REPLACE FUNCTION increment_loyalty_points(user_uuid UUID, points INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE hsf_profiles
  SET loyalty_points = loyalty_points + points,
      updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
