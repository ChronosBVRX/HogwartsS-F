import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Shield, Ticket, Check, X, Users, Star, TrendingUp, AlertCircle, Search } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, points: 0, pendingTickets: 0 })
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    fetchData()
  }, [filter])

  const fetchData = async () => {
    setLoading(true)
    const [profilesRes, ticketsRes] = await Promise.all([
      supabase.from('hsf_profiles').select('loyalty_points'),
      supabase
        .from('hsf_ticket_claims')
        .select(`
          *,
          session:hsf_visit_sessions (
            customer:hsf_profiles (display_name, phone)
          )
        `)
        .order('created_at', { ascending: false })
    ])

    if (!profilesRes.error) {
      const points = profilesRes.data.reduce((acc, p) => acc + p.loyalty_points, 0)
      setStats({
        users: profilesRes.data.length,
        points,
        pendingTickets: ticketsRes.data?.filter(t => t.status === 'pending').length || 0
      })
    }

    if (!ticketsRes.error) {
      setTickets(ticketsRes.data || [])
    }
    setLoading(false)
  }

  const handleTicket = async (ticketId, status, amount, userId, reason = null) => {
    // 1. Update ticket status
    const { error: ticketError } = await supabase
      .from('hsf_ticket_claims')
      .update({ 
        status, 
        admin_notes: reason,
        approved_at: status === 'approved' ? new Date().toISOString() : null
      })
      .eq('id', ticketId)

    if (ticketError) return

    // 2. If approved, add points to profile
    if (status === 'approved') {
      const pointsToAdd = Math.floor(amount)
      await supabase.rpc('increment_loyalty_points', { 
        user_uuid: userId, 
        points: pointsToAdd 
      })
    }

    fetchData()
  }

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  return (
    <div className="flex-1 p-6 space-y-12 max-w-7xl mx-auto w-full pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
        <div className="space-y-1">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
            Bóveda de <span className="text-magical-gold">Gringotts</span>
          </h1>
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-[0.3em]">Administración Central de Hogwarts</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white/5 px-6 py-4 rounded-2xl border border-white/5 flex items-center gap-3">
              <TrendingUp className="text-green-400 w-5 h-5" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Estado del Sistema</p>
                <p className="text-xs font-bold text-green-400">ACTIVO Y SEGURO</p>
              </div>
           </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard icon={<Users />} label="Magos Registrados" value={stats.users} />
        <StatCard icon={<Star />} label="Puntos en Circulación" value={stats.points} />
        <StatCard icon={<Ticket />} label="Pendientes de Validar" value={stats.pendingTickets} highlight={stats.pendingTickets > 0} />
      </div>

      {/* Tickets Section */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Ticket className="w-5 h-5 text-magical-gold" />
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Gestión de Consumo</h2>
          </div>
          
          <div className="flex bg-white/5 p-1.5 rounded-xl border border-white/10">
            {['pending', 'approved', 'rejected', 'all'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === s ? 'bg-magical-gold text-magical-navy shadow-lg' : 'text-white/40 hover:text-white'
                }`}
              >
                {s === 'pending' ? 'Pendientes' : s === 'approved' ? 'Aprobados' : s === 'rejected' ? 'Rechazados' : 'Todos'}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-6">Mago / Estudiante</th>
                  <th className="px-8 py-6">Folio de Ticket</th>
                  <th className="px-8 py-6">Monto Total</th>
                  <th className="px-8 py-6">Puntos a Generar</th>
                  <th className="px-8 py-6">Estado</th>
                  <th className="px-8 py-6 text-right">Validación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                   <tr>
                     <td colSpan="6" className="px-8 py-20 text-center text-white/20 uppercase font-black tracking-widest">Consultando registros históricos...</td>
                   </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center text-white/20 uppercase font-black tracking-widest">Sin solicitudes en esta categoría</td>
                  </tr>
                ) : (
                  filteredTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-bold text-white uppercase italic">{ticket.session.customer.display_name}</div>
                        <div className="text-[10px] text-white/30 tracking-widest">{ticket.session.customer.phone}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/5 text-magical-gold font-mono text-sm w-fit">
                          {ticket.folio}
                        </div>
                      </td>
                      <td className="px-8 py-6 font-black text-xl text-white">${ticket.amount}</td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-2 text-magical-gold font-bold">
                            <Star className="w-3 h-3 fill-magical-gold" />
                            {Math.floor(ticket.amount)}
                         </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[9px] px-3 py-1 rounded-full uppercase font-black tracking-widest border ${
                          ticket.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          ticket.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                          'bg-red-500/10 text-red-400 border-red-400/20'
                        }`}>
                          {ticket.status === 'pending' ? 'En Revisión' : ticket.status === 'approved' ? 'Validado' : 'Rechazado'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {ticket.status === 'pending' && (
                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleTicket(ticket.id, 'approved', ticket.amount, ticket.session.customer.id)}
                              className="p-3 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500/20 border border-green-500/20 transition-all"
                              title="Aprobar Ticket"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => {
                                const reason = prompt('Razón del rechazo:')
                                if (reason) handleTicket(ticket.id, 'rejected', ticket.amount, ticket.session.customer.id, reason)
                              }}
                              className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 border border-red-500/20 transition-all"
                              title="Rechazar Ticket"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon, label, value, highlight }) {
  return (
    <div className={`glass-card p-8 flex items-center gap-8 relative overflow-hidden transition-all duration-500 ${highlight ? 'border-magical-gold/40 bg-magical-gold/5 shadow-[0_0_30px_rgba(212,175,55,0.1)]' : ''}`}>
      <div className={`p-5 rounded-2xl ${highlight ? 'bg-magical-gold/20 text-magical-gold' : 'bg-white/5 text-white/40'}`}>
        {React.cloneElement(icon, { className: "w-8 h-8" })}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">{label}</p>
        <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
      </div>
      {highlight && <div className="absolute top-0 right-0 w-24 h-24 bg-magical-gold/10 blur-3xl -mr-10 -mt-10" />}
    </div>
  )
}
