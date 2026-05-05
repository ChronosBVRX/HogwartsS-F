import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { ChevronLeft, Ticket, Send } from 'lucide-react'

export default function ClaimTicket() {
  const { profile } = useAuth()
  const [activeSession, setActiveSession] = useState(null)
  const [folio, setFolio] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchSession()
  }, [])

  const fetchSession = async () => {
    const { data } = await supabase
      .from('hsf_visit_sessions')
      .select('*')
      .eq('status', 'closed_waiting_ticket')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

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

    const { error } = await supabase
      .from('hsf_ticket_claims')
      .insert({
        session_id: activeSession.id,
        folio,
        amount: parseFloat(amount)
      })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      alert('Ticket registrado correctamente. Pendiente de aprobación.')
      navigate('/perfil')
    }
  }

  return (
    <div className="flex-1 p-6 flex flex-col max-w-md mx-auto w-full space-y-6">
      <button onClick={() => navigate('/perfil')} className="flex items-center gap-2 text-white/60 hover:text-white">
        <ChevronLeft className="w-5 h-5" />
        Volver al Perfil
      </button>

      <div className="glass-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="p-3 bg-magical-gold/10 rounded-full w-fit mx-auto">
            <Ticket className="w-8 h-8 text-magical-gold" />
          </div>
          <h1 className="text-2xl font-bold text-magical-gold">Registrar Ticket</h1>
          <p className="text-sm text-white/60">Ingresa los datos de tu consumo para obtener puntos.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-white/80">Folio del Ticket</label>
            <input 
              type="text" 
              className="input-field"
              placeholder="Ej: ABC-123"
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-white/80">Monto Total ($)</label>
            <input 
              type="number" 
              step="0.01"
              className="input-field"
              placeholder="Ej: 250.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <p className="text-[10px] text-magical-gold/60 italic">Obtendrás aprox. {Math.floor(amount || 0)} puntos.</p>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button 
            type="submit" 
            className="btn-gold w-full py-4 flex items-center justify-center gap-2"
            disabled={loading}
          >
            <Send className="w-5 h-5" />
            {loading ? 'Enviando...' : 'Enviar para Revisión'}
          </button>
        </form>
      </div>
    </div>
  )
}
