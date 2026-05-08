-- ==========================================
-- 1. FUNCIONES DE SEGURIDAD (Para evitar recursividad infinita)
-- ==========================================
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hsf_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hsf_profiles
    WHERE user_id = auth.uid() AND role IN ('waiter', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ==========================================
-- 2. FUNCIÓN PARA PROCESAR APROBACIÓN DE TICKETS
-- Esta función actualiza los puntos del perfil e inserta en el ledger de forma atómica.
-- ==========================================
CREATE OR REPLACE FUNCTION process_ticket_approval(
  claim_id UUID,
  user_uuid UUID,
  points_to_add INTEGER,
  admin_uuid UUID
)
RETURNS VOID AS $$
BEGIN
  -- 1. Actualizar puntos en el perfil del usuario y pasos del mapa
  UPDATE public.hsf_profiles
  SET loyalty_points = loyalty_points + points_to_add,
      pasos_mapa_mes = pasos_mapa_mes + points_to_add,
      updated_at = NOW()
  WHERE user_id = user_uuid;

  -- 2. Insertar registro en el libro mayor (ledger)
  INSERT INTO public.hsf_points_ledger (
    user_id,
    points,
    reason,
    ticket_id,
    created_by
  ) VALUES (
    user_uuid,
    points_to_add,
    'Aprobación de ticket consumo',
    claim_id,
    admin_uuid
  );

  -- 3. Marcar ticket como otorgado
  UPDATE public.hsf_ticket_claims
  SET awarded_at = NOW(),
      points_awarded = points_to_add,
      status = 'approved'
  WHERE id = claim_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. LIMPIEZA Y CREACIÓN DE POLÍTICAS (RLS)
-- ==========================================
DROP POLICY IF EXISTS "Select Own Profile" ON public.hsf_profiles;
DROP POLICY IF EXISTS "Update Own Profile" ON public.hsf_profiles;
DROP POLICY IF EXISTS "Admin All Profiles" ON public.hsf_profiles;
DROP POLICY IF EXISTS "Select Own Sessions" ON public.hsf_visit_sessions;
DROP POLICY IF EXISTS "Insert Own Sessions" ON public.hsf_visit_sessions;
DROP POLICY IF EXISTS "Staff All Sessions" ON public.hsf_visit_sessions;
DROP POLICY IF EXISTS "Customer Own Claims" ON public.hsf_ticket_claims;
DROP POLICY IF EXISTS "Customer Insert Claims" ON public.hsf_ticket_claims;
DROP POLICY IF EXISTS "Admin All Claims" ON public.hsf_ticket_claims;

-- Perfiles
ALTER TABLE public.hsf_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Select Own Profile" ON public.hsf_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Update Own Profile" ON public.hsf_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin All Profiles" ON public.hsf_profiles FOR ALL USING (public.check_is_admin());

-- Sesiones
ALTER TABLE public.hsf_visit_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Select Own Sessions" ON public.hsf_visit_sessions FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Insert Own Sessions" ON public.hsf_visit_sessions FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Staff All Sessions" ON public.hsf_visit_sessions FOR ALL USING (public.check_is_staff());

-- Tickets
ALTER TABLE public.hsf_ticket_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer Own Claims" ON public.hsf_ticket_claims FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customer Insert Claims" ON public.hsf_ticket_claims FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Admin All Claims" ON public.hsf_ticket_claims FOR ALL USING (public.check_is_admin());

-- ==========================================
-- 4. DATOS INICIALES
-- ==========================================
INSERT INTO public.hsf_houses (slug, name, description, color_hex)
VALUES 
  ('red', 'Gryffindor', 'Valor y caballerosidad', '#ae0001'),
  ('green', 'Slytherin', 'Astucia y ambición', '#2a623d'),
  ('blue', 'Ravenclaw', 'Inteligencia y sabiduría', '#222f5b'),
  ('yellow', 'Hufflepuff', 'Lealtad y paciencia', '#ecb939')
ON CONFLICT (slug) DO NOTHING;
