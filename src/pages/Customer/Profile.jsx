import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Award, QrCode, Home, Info } from 'lucide-react'

export default function Profile() {
  const { profile, signOut } = useAuth()
  const [activeSession, setActiveSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) fetchActiveSession()
  }, [profile])

  const fetchActiveSession = async () => {
    const { data, error } = await supabase
      .from('hsf_visit_sessions')
      .select('*')
      .in('status', ['qr_generated', 'seated', 'closed_waiting_ticket'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error) setActiveSession(data)
    setLoading(false)
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">¡Hola, {profile?.display_name}!</h1>
          <p className="text-white/60">Gestiona tu experiencia mágica.</p>
        </div>
        <button onClick={signOut} className="text-sm text-red-400 hover:underline">
          Cerrar Sesión
        </button>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* House Card */}
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-magical-gold/10 rounded-full">
            <Award className="w-12 h-12 text-magical-gold" />
          </div>
          {profile?.house_slug ? (
            <>
              <h2 className="text-2xl font-bold" style={{ color: profile.house?.color_hex }}>
                {profile.house?.name}
              </h2>
              <p className="text-sm text-white/60">{profile.house?.description}</p>
              <div className="bg-magical-gold/20 px-4 py-2 rounded-lg border border-magical-gold/30">
                <span className="text-magical-gold font-bold">{profile.loyalty_points} Puntos acumulados</span>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-magical-gold">Sin Casa Aún</h2>
              <p className="text-sm text-white/60">El ritual te espera para descubrir tu verdadero espíritu.</p>
              <Link to="/quiz" className="btn-gold">
                Comenzar Ritual
              </Link>
            </>
          )}
        </div>

        {/* Visit Status Card */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <QrCode className="w-6 h-6 text-magical-gold" />
            <h2 className="text-xl font-bold">Tu Visita</h2>
          </div>

          {!activeSession ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-white/60 text-sm">¿Estás en el restaurante?</p>
              <Link to="/asistencia" className="btn-gold flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5" />
                Registrar Asistencia
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <span className="text-sm text-white/60">Estado:</span>
                <span className="font-bold text-magical-gold uppercase">
                  {activeSession.status.replace(/_/g, ' ')}
                </span>
              </div>

              {activeSession.status === 'seated' && (
                <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20 text-center">
                  <p className="text-green-400 font-bold">Bienvenido. Tu mesa es: {activeSession.table_number}</p>
                </div>
              )}

              {activeSession.status === 'closed_waiting_ticket' && (
                <div className="bg-magical-gold/10 p-4 rounded-xl border border-magical-gold/20 text-center space-y-2">
                  <p className="text-magical-gold font-bold">Mesa cerrada. ¡Ya puedes registrar tu consumo!</p>
                  <Link to="/registrar-ticket" className="btn-gold block">
                    Registrar Ticket
                  </Link>
                </div>
              )}

              <Link to="/asistencia" className="text-center block text-sm text-white/40 hover:text-white/60">
                Ver QR de Asistencia
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
