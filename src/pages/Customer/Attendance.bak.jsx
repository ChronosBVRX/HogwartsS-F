import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { ChevronLeft, Info } from 'lucide-react'

export default function Attendance() {
  const { user } = useAuth()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrCreateSession()
  }, [])

  const fetchOrCreateSession = async () => {
    // Check if active session exists
    const { data: existing } = await supabase
      .from('hsf_visit_sessions')
      .select('*')
      .in('status', ['qr_generated', 'seated'])
      .maybeSingle()

    if (existing) {
      setSession(existing)
      setLoading(false)
    } else {
      // Create new session
      const { data, error } = await supabase
        .from('hsf_visit_sessions')
        .insert({ 
          customer_id: user.id,
          qr_token: `HSF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        })
        .select()
        .single()
      
      if (!error) setSession(data)
      setLoading(false)
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center">Cargando...</div>

  return (
    <div className="flex-1 p-6 flex flex-col max-w-md mx-auto w-full space-y-6">
      <Link to="/perfil" className="flex items-center gap-2 text-white/60 hover:text-white">
        <ChevronLeft className="w-5 h-5" />
        Volver al Perfil
      </Link>

      <div className="glass-card p-8 flex flex-col items-center text-center space-y-6">
        <h1 className="text-2xl font-bold text-magical-gold">Tu Código de Asistencia</h1>
        <p className="text-sm text-white/60">
          Muestra este código al mesero cuando llegues al restaurante para asignar tu mesa.
        </p>

        <div className="bg-white p-4 rounded-2xl shadow-xl">
          <QRCodeSVG 
            value={session?.qr_token || ''} 
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="flex items-start gap-3 bg-magical-gold/10 p-4 rounded-xl border border-magical-gold/20 text-left">
          <Info className="w-5 h-5 text-magical-gold shrink-0 mt-0.5" />
          <p className="text-xs text-magical-gold/80 leading-relaxed">
            Este código es único para tu visita actual. Si ya estás sentado, el mesero ya lo ha procesado.
          </p>
        </div>
      </div>
    </div>
  )
}
