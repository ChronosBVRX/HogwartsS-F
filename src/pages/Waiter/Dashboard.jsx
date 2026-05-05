import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { QrCode, LogOut, Users } from 'lucide-react'

export default function WaiterDashboard() {
  const { user } = useAuth()
  const [activeVisits, setActiveVisits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveVisits()
    
    // Subscribe to changes
    const channel = supabase
      .channel('waiter_dashboard')
      .on('postgres_changes', { event: '*', table: 'hsf_visit_sessions' }, fetchActiveVisits)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const fetchActiveVisits = async () => {
    const { data } = await supabase
      .from('hsf_visit_sessions')
      .select('*, customer:hsf_profiles!customer_id(*)')
      .eq('status', 'seated')
      .order('seated_at', { ascending: false })

    setActiveVisits(data || [])
    setLoading(false)
  }

  const handleCloseVisit = async (visitId) => {
    if (!confirm('¿Estás seguro de cerrar esta mesa? El cliente podrá registrar su ticket.')) return

    await supabase
      .from('hsf_visit_sessions')
      .update({
        status: 'closed_waiting_ticket',
        closed_by: user.id,
        closed_at: new Date().toISOString()
      })
      .eq('id', visitId)
  }

  return (
    <div className="flex-1 p-6 space-y-8 max-w-5xl mx-auto w-full">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-magical-gold">Panel de Meseros</h1>
        <Link to="/mesero/escanear" className="btn-gold flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Escanear QR
        </Link>
      </header>

      <div className="grid gap-6">
        <div className="flex items-center gap-2 text-white/60">
          <Users className="w-5 h-5" />
          <h2 className="text-lg font-bold">Mesas Activas ({activeVisits.length})</h2>
        </div>

        {activeVisits.length === 0 ? (
          <div className="glass-card p-12 text-center text-white/40">
            No hay mesas activas en este momento.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeVisits.map(visit => (
              <div key={visit.id} className="glass-card p-6 space-y-4 border-l-4 border-l-magical-gold">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Mesa {visit.table_number}</h3>
                    <p className="text-sm text-white/60">{visit.customer.display_name}</p>
                  </div>
                  <span className="text-[10px] text-white/40 uppercase">
                    {new Date(visit.seated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <button 
                  onClick={() => handleCloseVisit(visit.id)}
                  className="w-full py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Mesa
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
