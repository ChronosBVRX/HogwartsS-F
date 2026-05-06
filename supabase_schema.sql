-- 1. Perfiles de Usuario (con Casa y Puntos)
CREATE TABLE IF NOT EXISTS hsf_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  house_slug TEXT DEFAULT NULL,
  loyalty_points INTEGER DEFAULT 0,
  role TEXT DEFAULT 'customer', -- 'customer', 'waiter', 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sesiones de Visita (Seguimiento de QR)
CREATE TABLE IF NOT EXISTS hsf_visit_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  waiter_id UUID REFERENCES auth.users(id),
  qr_token TEXT UNIQUE,
  status TEXT DEFAULT 'qr_generated', -- 'qr_generated', 'seated', 'closed_waiting_ticket', 'completed'
  table_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Reclamaciones de Tickets (Validación de puntos)
CREATE TABLE IF NOT EXISTS hsf_ticket_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES hsf_visit_sessions(id) ON DELETE CASCADE,
  folio TEXT,
  amount DECIMAL(10, 2),
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ DEFAULT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE hsf_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hsf_visit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hsf_ticket_claims ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (Ejemplos básicos)
-- Perfiles: Cada usuario lee el suyo, Admins leen todos.
CREATE POLICY "Users can view own profile" ON hsf_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON hsf_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM hsf_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Sesiones: Usuarios ven las suyas, Meseros ven todas.
CREATE POLICY "Users can view own sessions" ON hsf_visit_sessions FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Waiters can view all sessions" ON hsf_visit_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM hsf_profiles WHERE id = auth.uid() AND role IN ('waiter', 'admin'))
);

-- Tickets: Usuarios ven los suyos, Admins ven todos.
CREATE POLICY "Users can view own claims" ON hsf_ticket_claims FOR SELECT USING (
  EXISTS (SELECT 1 FROM hsf_visit_sessions WHERE id = session_id AND customer_id = auth.uid())
);
CREATE POLICY "Admins can view all claims" ON hsf_ticket_claims FOR ALL USING (
  EXISTS (SELECT 1 FROM hsf_profiles WHERE id = auth.uid() AND role = 'admin')
);
