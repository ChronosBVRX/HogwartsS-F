# Howard's Snacks & Foods (HSF)

Aplicación web completa para gestión de lealtad, menú y visitas mágicas.

## Tecnologías
- React + Vite
- Tailwind CSS
- Supabase (Auth, DB, RLS)
- Lucide React (Iconos)

## Configuración

1. **Supabase Setup**:
   - Ve al SQL Editor de tu proyecto en Supabase.
   - Pega y ejecuta el contenido del archivo `hsf_setup.sql` (disponible en la carpeta de la conversación o artefactos).
   - Este script creará todas las tablas (`hsf_`), funciones de seguridad y políticas RLS necesarias.

2. **Variables de Entorno**:
   - Crea un archivo `.env` en la raíz del proyecto.
   - Copia el contenido de `.env.example` o usa los siguientes campos:
     ```env
     VITE_SUPABASE_URL=tu_url_aqui
     VITE_SUPABASE_ANON_KEY=tu_key_anon_aqui
     ```

3. **Instalación**:
   ```bash
   npm install
   ```

4. **Desarrollo**:
   ```bash
   npm run dev
   ```

## Roles
- **Customer**: Puede ver menú, realizar el ritual (quiz), generar QR de asistencia y registrar tickets.
- **Waiter**: Puede escanear QRs, asignar mesas y cerrar visitas.
- **Admin**: Acceso total a estadísticas y aprobación de tickets.

### Convertir usuario en Admin/Waiter
Usa el SQL Editor de Supabase:
```sql
-- Para Admin
update public.hsf_profiles set role = 'admin' where display_name = 'Tu Nombre';

-- Para Mesero
update public.hsf_profiles set role = 'waiter' where display_name = 'Nombre Mesero';
```
