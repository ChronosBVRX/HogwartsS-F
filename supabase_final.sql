-- ==========================================
-- 1. FUNCIÓN PARA PROCESAR APROBACIÓN DE TICKETS
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
  -- 1. Actualizar puntos en el perfil del usuario
  UPDATE public.hsf_profiles
  SET loyalty_points = loyalty_points + points_to_add,
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
      points_awarded = points_to_add
  WHERE id = claim_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. POLÍTICAS DE SEGURIDAD (RLS)
-- Asegúrate de que estas políticas existan para que el frontend funcione.
-- ==========================================

-- Perfiles
ALTER TABLE public.hsf_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Select Own Profile" ON public.hsf_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Update Own Profile" ON public.hsf_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin All Profiles" ON public.hsf_profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.hsf_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Sesiones
ALTER TABLE public.hsf_visit_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Select Own Sessions" ON public.hsf_visit_sessions FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Insert Own Sessions" ON public.hsf_visit_sessions FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Staff All Sessions" ON public.hsf_visit_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.hsf_profiles WHERE user_id = auth.uid() AND role IN ('waiter', 'admin'))
);

-- Tickets
ALTER TABLE public.hsf_ticket_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer Own Claims" ON public.hsf_ticket_claims FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customer Insert Claims" ON public.hsf_ticket_claims FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Admin All Claims" ON public.hsf_ticket_claims FOR ALL USING (
  EXISTS (SELECT 1 FROM public.hsf_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- ==========================================
-- 3. DATOS INICIALES PARA CASAS (SI NO EXISTEN)
-- Esto es vital para que los iconos y colores se mapeen correctamente.
-- ==========================================
INSERT INTO public.hsf_houses (slug, name, description, color_hex)
VALUES 
  ('red', 'Gryffindor', 'Valor y caballerosidad', '#ae0001'),
  ('green', 'Slytherin', 'Astucia y ambición', '#2a623d'),
  ('blue', 'Ravenclaw', 'Inteligencia y sabiduría', '#222f5b'),
  ('yellow', 'Hufflepuff', 'Lealtad y paciencia', '#ecb939')
ON CONFLICT (slug) DO NOTHING;
