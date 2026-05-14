import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { withTimeout } from '../../lib/supabaseSafe'
import { useAuth } from '../../context/AuthContext'
import { QrCode, LogOut, Users, Clock, Coffee, CheckCircle2 } from 'lucide-react'

export default function WaiterDashboard() {
  const { user } = useAuth()
  const [activeVisits, setActiveVisits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveVisits()
    
    const channel = supabase
      .channel('waiter_dashboard')
      .on('postgres_changes', { event: '*', table: 'hsf_visit_sessions' }, fetchActiveVisits)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const fetchActiveVisits = async () => {
    const { data } = await withTimeout(
      supabase
        .from('hsf_visit_sessions')
        .select('*, customer:hsf_profiles!hsf_visit_sessions_customer_id_fkey(user_id, display_name, phone)')
        .eq('status', 'seated')
        .order('created_at', { ascending: false }),
      8000,
      'Cargando mesas activas'
    )

    setActiveVisits(data || [])
    setLoading(false)
  }

  const handleCloseVisit = async (visitId) => {
    if (!confirm('¿Liberar esta mesa? El cliente podrá registrar su ticket de consumo.')) return

    await withTimeout(
      supabase
        .from('hsf_visit_sessions')
        .update({
          status: 'closed_waiting_ticket',
          closed_by: user.id,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', visitId),
      8000,
      'Cerrando mesa'
    )
  }

  return (
    <div className="flex-1 p-6 space-y-10 max-w-6xl mx-auto w-full pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
        <div className="space-y-1">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Panel de <span className="text-magical-gold">Atención</span></h1>
          <p className="text-xs text-white/30 uppercase font-bold tracking-[0.3em]">Gestión de Comensales y Mesas</p>
        </div>
        <Link to="/mesero/escanear" className="btn-gold flex items-center gap-3 px-8 py-4 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
          <QrCode className="w-6 h-6" />
          <span className="font-black uppercase italic tracking-tighter">Recibir Cliente</span>
        </Link>
      </header>

      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <Coffee className="w-5 h-5 text-magical-gold" />
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Mesas en Servicio ({activeVisits.length})</h2>
        </div>

        {loading ? (
          <div className="p-20 text-center animate-pulse text-white/20 uppercase font-bold tracking-widest">
            Sincronizando con el Gran Comedor...
          </div>
        ) : activeVisits.length === 0 ? (
          <div className="glass-card p-20 text-center space-y-4 border-dashed border-2 border-white/5 bg-transparent">
            <Users className="w-16 h-16 text-white/5 mx-auto" />
            <p className="text-white/30 font-bold uppercase text-xs tracking-widest">No hay mesas ocupadas actualmente.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeVisits.map(visit => (
              <div key={visit.id} className="glass-card group hover:border-magical-gold/30 transition-all duration-500 overflow-hidden flex flex-col">
                <div className="p-8 space-y-6 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-magical-gold uppercase tracking-widest">Mesa Asignada</p>
                      <h3 className="text-5xl font-black italic tracking-tighter text-white">{visit.table_number}</h3>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl">
                      <Clock className="w-5 h-5 text-white/20" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-1">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Comensal</p>
                    <p className="text-lg font-bold text-white/80">{visit.customer?.display_name || 'Mago Anónimo'}</p>
                    <p className="text-[10px] text-white/20 font-bold">{visit.customer?.phone}</p>
                  </div>
                </div>

                <button 
                  onClick={() => handleCloseVisit(visit.id)}
                  className="w-full py-5 bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all font-black uppercase italic tracking-tighter border-t border-white/5 flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Liberar y Cerrar Mesa
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
