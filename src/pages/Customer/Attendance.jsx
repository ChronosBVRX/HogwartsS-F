import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { ChevronLeft, QrCode, Clock, ShieldCheck, AlertCircle } from 'lucide-react'

export default function Attendance() {
  const { user } = useAuth()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchOrCreateSession()

      const channel = supabase
        .channel(`attendance_updates_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            table: 'hsf_visit_sessions',
            filter: `customer_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.new.status === 'seated') {
              navigate('/perfil')
            } else {
              fetchOrCreateSession()
            }
          }
        )
        .subscribe()

      return () => supabase.removeChannel(channel)
    }
  }, [user, navigate])

  const fetchOrCreateSession = async () => {
    setLoading(true)
    
    // 1. Check for active session
    const { data: existing } = await supabase
      .from('hsf_visit_sessions')
      .select('*')
      .in('status', ['qr_generated', 'seated'])
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      setSession(existing)
      setLoading(false)
    } else {
      // 2. Create new session (DB handles qr_token as UUID)
      const { data, error } = await supabase
        .from('hsf_visit_sessions')
        .insert({ 
          customer_id: user.id 
        })
        .select()
        .single()
      
      if (error) {
        console.error('[ATTENDANCE INSERT ERROR]', error)
      } else {
        setSession(data)
      }
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center animate-pulse">
        <p className="text-magical-gold uppercase font-black tracking-widest italic">Invocando pase de entrada...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 flex flex-col max-w-2xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
      <button onClick={() => navigate('/perfil')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
        <ChevronLeft className="w-5 h-5" />
        <span className="text-xs font-black uppercase tracking-widest">Volver al Perfil</span>
      </button>

      <div className="glass-card overflow-hidden">
        <div className="p-10 text-center bg-magical-gold/5 border-b border-white/5 space-y-2">
          <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
            Registrar <span className="text-magical-gold">Visita Mágica</span>
          </h1>
          <p className="text-[10px] text-white/50 uppercase font-black tracking-[0.2em] leading-relaxed max-w-sm mx-auto">
            Muestra este código al personal para validar tu asistencia y acumular puntos
          </p>
        </div>

        <div className="p-10 flex flex-col items-center space-y-10">
          {session ? (
            <>
              {/* QR Code Container */}
              <div className="p-8 bg-white rounded-[3rem] shadow-[0_0_50px_rgba(255,255,255,0.1)] relative group">
                <QRCodeSVG 
                  value={session.qr_token} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
                <div className="absolute inset-0 border-4 border-magical-gold/20 rounded-[3rem] pointer-events-none group-hover:border-magical-gold/40 transition-all" />
              </div>

              {/* Status & Info */}
              <div className="w-full space-y-6">
                <div className="flex justify-center">
                  <div className="bg-white/5 p-4 px-10 rounded-2xl border border-white/10 flex flex-col items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-magical-gold" />
                    <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Estado del Pase</span>
                    <span className="text-xs font-black uppercase text-magical-gold tracking-tighter">
                      {session.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="bg-magical-gold/5 border border-magical-gold/20 p-5 rounded-2xl flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-magical-gold shrink-0 mt-0.5" />
                  <p className="text-xs text-white/60 leading-relaxed italic">
                    Un mesero escaneará este código para asignarte una mesa y comenzar tu experiencia mágica.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <p className="text-white/60">No se pudo generar el pase. Inténtalo de nuevo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
