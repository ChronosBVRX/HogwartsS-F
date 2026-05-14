import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { withTimeout } from '../../lib/supabaseSafe'
import { useAuth } from '../../context/AuthContext'
import { ChevronLeft, Ticket, Send, Wand2, AlertCircle } from 'lucide-react'

export default function ClaimTicket() {
  const { user } = useAuth()
  const [activeSession, setActiveSession] = useState(null)
  const [folio, setFolio] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchSession()
  }, [])

  const fetchSession = async () => {
    const { data } = await withTimeout(
      supabase
        .from('hsf_visit_sessions')
        .select('*')
        .eq('status', 'closed_waiting_ticket')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      8000,
      'Buscando visita pendiente'
    )

    if (!data) {
      alert('No tienes una visita cerrada pendiente de ticket.')
      navigate('/perfil')
    } else {
      setActiveSession(data)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!activeSession?.id) {
      setError('No se encontró una visita pendiente para registrar el ticket.')
      setLoading(false)
      return
    }
    
    const parsedAmount = parseFloat(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('El monto debe ser mayor a cero.')
      setLoading(false)
      return
    }

    // 1. Create ticket claim
    const { error: claimError } = await withTimeout(
      supabase
        .from('hsf_ticket_claims')
        .insert({
          session_id: activeSession.id,
          customer_id: user.id,
          folio,
          amount: parseFloat(amount)
        }),
      8000,
      'Registrando ticket'
    )

    if (claimError) {
      setError('Error al enviar el ticket. ¿Ya registraste este folio?')
      setLoading(false)
    } else {
      // 2. Update session status to ticket_submitted
      await withTimeout(
        supabase
          .from('hsf_visit_sessions')
          .update({ status: 'ticket_submitted' })
          .eq('id', activeSession.id),
        8000,
        'Actualizando visita'
      )

      setSuccess(true)
      setTimeout(() => navigate('/perfil'), 3000)
    }
  }

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center animate-in zoom-in duration-500">
        <div className="glass-card p-12 space-y-6">
          <div className="p-4 bg-green-500/20 rounded-full w-fit mx-auto">
            <Wand2 className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">¡Ticket Enviado!</h1>
          <p className="text-white/60">Tu solicitud está siendo revisada por los duendes de Gringotts. <br /> Recibirás tus puntos pronto.</p>
          <div className="text-[10px] text-white/20 uppercase font-bold tracking-widest pt-4">Redirigiendo a tu perfil...</div>
        </div>
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
          <div className="p-4 bg-magical-gold/10 rounded-3xl w-fit mx-auto mb-4 border border-magical-gold/20 shadow-lg">
            <Ticket className="w-10 h-10 text-magical-gold" />
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Registrar Consumo</h1>
          <p className="text-xs text-white/40 uppercase font-bold tracking-[0.3em]">Convierte tu ticket en Galeones</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Folio del Ticket</label>
              <input 
                type="text" 
                className="input-field py-4 font-mono text-magical-gold"
                placeholder="ABC-12345"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Monto Total ($)</label>
              <input 
                type="number" 
                step="0.01"
                className="input-field py-4 text-2xl font-black"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wand2 className="w-5 h-5 text-magical-gold" />
              <span className="text-xs font-bold text-white/60">Recompensa Estimada</span>
            </div>
            <div className="text-2xl font-black text-magical-gold">
               {Math.floor(amount || 0)} <span className="text-[10px] uppercase tracking-widest">Puntos</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-400/10 p-5 rounded-2xl border border-red-400/20 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-gold w-full py-6 text-xl flex items-center justify-center gap-4 group"
            disabled={loading}
          >
            <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            <span className="font-black uppercase italic tracking-tighter">Enviar para Validación</span>
          </button>
        </form>
      </div>
    </div>
  )
}
