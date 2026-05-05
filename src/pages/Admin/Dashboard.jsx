import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Shield, Ticket, Check, X, Users, Star } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, points: 0, pendingTickets: 0 })
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [profilesRes, ticketsRes] = await Promise.all([
      supabase.from('hsf_profiles').select('loyalty_points'),
      supabase.from('hsf_ticket_claims').select('*, customer:hsf_profiles!customer_id(*)').order('created_at', { ascending: false })
    ])

    if (!profilesRes.error) {
      const points = profilesRes.data.reduce((acc, p) => acc + p.loyalty_points, 0)
      setStats({
        users: profilesRes.data.length,
        points,
        pendingTickets: ticketsRes.data?.filter(t => t.status === 'pending').length || 0
      })
    }

    if (!ticketsRes.error) setTickets(ticketsRes.data || [])
    setLoading(false)
  }

  const handleTicket = async (ticketId, status, reason = null) => {
    const { error } = await supabase
      .from('hsf_ticket_claims')
      .update({ 
        status, 
        rejection_reason: reason,
        reviewed_by: (await supabase.auth.getUser()).data.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', ticketId)

    if (!error) fetchData()
  }

  return (
    <div className="flex-1 p-6 space-y-12 max-w-7xl mx-auto w-full animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-magical-gold flex items-center gap-3">
            <Shield className="w-10 h-10" />
            Bóveda de Gringotts (Admin)
          </h1>
          <p className="text-white/40 italic">Control total de la economía mágica.</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard icon={<Users />} label="Magos Registrados" value={stats.users} />
        <StatCard icon={<Star />} label="Puntos en Circulación" value={stats.points} />
        <StatCard icon={<Ticket />} label="Tickets Pendientes" value={stats.pendingTickets} highlight />
      </div>

      {/* Tickets Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Ticket className="text-magical-gold" />
          Reclamaciones de Tickets
        </h2>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-white/60 text-xs uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Folio</th>
                <th className="px-6 py-4 font-medium">Monto</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{ticket.customer.display_name}</div>
                    <div className="text-[10px] text-white/40">{ticket.customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-magical-gold">{ticket.folio}</td>
                  <td className="px-6 py-4 font-bold">${ticket.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                      ticket.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      ticket.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {ticket.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleTicket(ticket.id, 'approved')}
                          className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            const reason = prompt('Razón del rechazo:')
                            if (reason) handleTicket(ticket.id, 'rejected', reason)
                          }}
                          className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon, label, value, highlight }) {
  return (
    <div className={`glass-card p-6 flex items-center gap-6 ${highlight ? 'border-magical-gold/40 bg-magical-gold/5' : ''}`}>
      <div className="p-4 bg-magical-gold/10 rounded-2xl text-magical-gold">
        {icon}
      </div>
      <div>
        <div className="text-sm text-white/40">{label}</div>
        <div className="text-3xl font-bold">{value}</div>
      </div>
    </div>
  )
}
