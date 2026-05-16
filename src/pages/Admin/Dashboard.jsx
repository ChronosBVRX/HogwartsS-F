import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { withTimeout } from '../../lib/supabaseSafe'
import { formatMagicalText } from '../../utils/magicalFormatters'
import { Shield, Ticket, Check, X, Users, Star, TrendingUp, AlertCircle, Search, UserCog, UserPlus, Wand2, Map, Home, Gift } from 'lucide-react'
import AdminMenuManager from '../../components/AdminMenuManager'
import AdminAdventureManager from '../../components/AdminAdventureManager'
import AdminRewardManager from '../../components/AdminRewardManager'
import AdminDuelManager from '../../components/AdminDuelManager'
import { Swords } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, points: 0, pendingTickets: 0 })
  const [tickets, setTickets] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tickets')
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    fetchData()
  }, [filter, activeTab])

  const fetchData = async () => {
    setLoading(true)
    
    try {
      // 1. Fetch Global Stats via RPC
      const statsPromise = withTimeout(
        supabase.rpc('hsf_admin_dashboard_stats'),
        8000,
        'Cargando estadísticas'
      )
      
      if (activeTab === 'tickets') {
        const ticketQuery = withTimeout(
          supabase
            .from('hsf_ticket_claims')
            .select(`
              id, folio, amount, points_awarded, status, customer_id, created_at,
              session:hsf_visit_sessions!hsf_ticket_claims_session_id_fkey (
                id,
                customer:hsf_profiles!hsf_visit_sessions_customer_id_fkey (user_id, display_name, phone)
              )
            `)
            .order('created_at', { ascending: false })
            .limit(100),
          10000,
          'Cargando tickets'
        )

        const [statsRes, ticketsRes] = await Promise.all([statsPromise, ticketQuery])

        if (!statsRes.error && statsRes.data?.[0]) {
          const s = statsRes.data[0]
          setStats({
            users: parseInt(s.users_count),
            points: parseInt(s.total_loyalty_points),
            pendingTickets: parseInt(s.pending_tickets_count)
          })
        }

        if (!ticketsRes.error) setTickets(ticketsRes.data || [])
      } else if (activeTab === 'users') {
        const usersQuery = withTimeout(
          supabase
            .from('hsf_profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200),
          10000,
          'Cargando usuarios'
        )

        const [statsRes, usersRes] = await Promise.all([
          statsPromise,
          usersQuery
        ])

        if (!statsRes.error && statsRes.data?.[0]) {
          const s = statsRes.data[0]
          setStats({
            users: parseInt(s.users_count),
            points: parseInt(s.total_loyalty_points),
            pendingTickets: parseInt(s.pending_tickets_count)
          })
        }

        if (!usersRes.error) setAllUsers(usersRes.data || [])
      }
    } catch (err) {
      console.error('[ADMIN FETCH ERROR]', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTicket = async (ticketId, status, amount, userId, reason = null) => {
    const adminId = (await supabase.auth.getUser()).data.user.id

    const updateData = {
      status,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString()
    }
    
    if (status === 'approved') {
      updateData.awarded_at = new Date().toISOString()
    } else if (status === 'rejected') {
      updateData.rejection_reason = reason
    }

    const { error: ticketError } = await supabase
      .from('hsf_ticket_claims')
      .update(updateData)
      .eq('id', ticketId)

    if (ticketError) {
      alert('Error: ' + ticketError.message)
      return
    }

    if (status === 'approved') {
      const pointsToAdd = Math.floor(amount)
      const { error: rpcError } = await supabase.rpc('process_ticket_approval', { 
        claim_id: ticketId,
        user_uuid: userId, 
        points_to_add: pointsToAdd,
        admin_uuid: adminId
      })

      if (rpcError) {
        console.error("RPC Error:", rpcError)
        alert('Ticket aprobado, pero hubo un error al sumar los puntos: ' + rpcError.message + '\nPor favor, asegúrate de haber ejecutado el SQL de process_ticket_approval en Supabase.')
      }
    }

    fetchData()
  }

  const handleUpdateRole = async (userId, newRole) => {
    const { error } = await supabase
      .from('hsf_profiles')
      .update({ role: newRole })
      .eq('user_id', userId)

    if (error) alert('Error al cambiar rol: ' + error.message)
    else fetchData()
  }

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  return (
    <div className="flex-1 p-6 space-y-12 max-w-7xl mx-auto w-full pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
        <div className="space-y-1">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
            Bóveda de <span className="text-magical-gold">Gringotts</span>
          </h1>
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-[0.3em]">Administración Central de Hogwarts</p>
        </div>
        
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 overflow-x-auto custom-scrollbar scrollbar-hide max-w-full">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tickets' ? 'bg-magical-gold text-magical-navy' : 'text-white/40 hover:text-white'
            }`}
          >
            <Ticket className="w-4 h-4" />
            Tickets
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users' ? 'bg-magical-gold text-magical-navy' : 'text-white/40 hover:text-white'
            }`}
          >
            <UserCog className="w-4 h-4" />
            Usuarios
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'menu' ? 'bg-magical-gold text-magical-navy' : 'text-white/40 hover:text-white'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            Menú
          </button>
          <button
            onClick={() => setActiveTab('adventures')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'adventures' ? 'bg-magical-gold text-magical-navy' : 'text-white/40 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            Aventuras
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'rewards' ? 'bg-magical-gold text-magical-navy' : 'text-white/40 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4" />
            Recompensas
          </button>
          <button
            onClick={() => setActiveTab('duels')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'duels' ? 'bg-magical-gold text-magical-navy' : 'text-white/40 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4" />
            Duelos
          </button>
        </div>
      </header>

      {activeTab === 'menu' && <AdminMenuManager />}
      {activeTab === 'adventures' && <AdminAdventureManager />}
      {activeTab === 'rewards' && <AdminRewardManager />}
      {activeTab === 'duels' && <AdminDuelManager />}

      {activeTab === 'tickets' && (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            <StatCard icon={<Users />} label="Magos Registrados" value={stats.users} />
            <StatCard icon={<Star />} label="Galeones Totales" value={stats.points} />
            <StatCard icon={<Ticket />} label="Pendientes" value={stats.pendingTickets} highlight={stats.pendingTickets > 0} />
          </div>

          <section className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-magical-gold" />
                <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Validación de Consumo</h2>
              </div>
              <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                {['pending', 'approved', 'rejected', 'all'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                      filter === s ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
                    }`}
                  >
                    {s === 'pending' ? 'Pendientes' : s === 'approved' ? 'Aprobados' : s === 'rejected' ? 'Rechazados' : 'Todos'}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card overflow-hidden border border-white/10">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-6 py-5">Mago / Estudiante</th>
                      <th className="px-6 py-5">Folio</th>
                      <th className="px-6 py-5">Monto</th>
                      <th className="px-6 py-5">Puntos</th>
                      <th className="px-6 py-5">Estado</th>
                      <th className="px-6 py-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                       <tr><td colSpan="6" className="px-6 py-16 text-center text-white/20 uppercase font-black">Cargando tickets...</td></tr>
                    ) : filteredTickets.length === 0 ? (
                      <tr><td colSpan="6" className="px-6 py-16 text-center text-white/20 uppercase font-black">Sin registros</td></tr>
                    ) : (
                      filteredTickets.map(ticket => (
                        <tr key={ticket.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="font-bold text-white uppercase italic text-xs">{ticket.session?.customer?.display_name || 'Desconocido'}</div>
                            <div className="text-[9px] text-white/30">{ticket.session?.customer?.phone}</div>
                          </td>
                          <td className="px-6 py-5 font-mono text-xs text-magical-gold">{ticket.folio}</td>
                          <td className="px-6 py-5 font-black text-lg text-white">${ticket.amount}</td>
                          <td className="px-6 py-5 font-bold text-xs text-magical-gold">{ticket.points_awarded || Math.floor(ticket.amount)}</td>
                          <td className="px-6 py-5">
                            <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest border ${
                              ticket.status === 'approved' ? 'border-green-500/20 text-green-400 bg-green-500/5' :
                              ticket.status === 'pending' ? 'border-yellow-500/20 text-yellow-400 bg-yellow-500/5' :
                              'border-red-500/20 text-red-400 bg-red-500/5'
                            }`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            {ticket.status === 'pending' && (
                              <div className="flex justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity">
                                <button onClick={() => handleTicket(ticket.id, 'approved', ticket.amount, ticket.customer_id)} className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20"><Check className="w-4 h-4" /></button>
                                <button onClick={() => { const reason = prompt('Razón:'); if (reason) handleTicket(ticket.id, 'rejected', ticket.amount, ticket.customer_id, reason) }} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"><X className="w-4 h-4" /></button>
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
        </>
      )}

      {activeTab === 'users' && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <UserCog className="w-5 h-5 text-magical-gold" />
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Gestión de Personal y Estudiantes</h2>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-8 py-6">Mago</th>
                    <th className="px-8 py-6">Casa</th>
                    <th className="px-8 py-6">Puntos</th>
                    <th className="px-8 py-6">Rol Actual</th>
                    <th className="px-8 py-6 text-right">Asignar Nuevo Rol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan="4" className="px-8 py-20 text-center text-white/20 uppercase font-black">Consultando registros...</td></tr>
                  ) : allUsers.map(u => (
                    <tr key={u.user_id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-bold text-white uppercase italic">{formatMagicalText(u.display_name)}</div>
                        <div className="text-[10px] text-white/30">{u.phone}</div>
                      </td>
                      <td className="px-8 py-6 font-bold text-[10px] uppercase tracking-widest">
                        <span className={`px-2 py-1 rounded-md ${
                          u.house_slug === 'red' ? 'text-red-400 bg-red-400/10' :
                          u.house_slug === 'green' ? 'text-green-400 bg-green-400/10' :
                          u.house_slug === 'blue' ? 'text-blue-400 bg-blue-400/10' :
                          u.house_slug === 'yellow' ? 'text-yellow-400 bg-yellow-400/10' : 'text-white/20'
                        }`}>
                          {formatMagicalText(u.house_slug) || 'Sin casa'}
                        </span>
                      </td>
                      <td className="px-8 py-6 font-black text-magical-gold">{u.loyalty_points} G</td>
                      <td className="px-8 py-6">
                        <span className={`text-[9px] px-3 py-1 rounded-full uppercase font-black tracking-widest border ${
                          u.role === 'admin' ? 'border-purple-500/20 text-purple-400 bg-purple-500/5' :
                          u.role === 'waiter' ? 'border-blue-500/20 text-blue-400 bg-blue-500/5' :
                          'border-white/10 text-white/40'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-2">
                          {['customer', 'waiter', 'admin'].map(r => (
                            <button
                              key={r}
                              disabled={u.role === r}
                              onClick={() => handleUpdateRole(u.user_id, r)}
                              className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                                u.role === r ? 'bg-white/10 text-white/20' : 'bg-white/5 text-white/40 hover:bg-white/20 hover:text-white'
                              }`}
                            >
                              {r === 'customer' ? 'Mago' : r === 'waiter' ? 'Mesero' : 'Admin'}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, highlight }) {
  return (
    <div className={`glass-card p-8 flex items-center gap-8 relative overflow-hidden transition-all duration-500 ${highlight ? 'border-magical-gold/40 bg-magical-gold/5' : ''}`}>
      <div className={`p-5 rounded-2xl ${highlight ? 'bg-magical-gold/20 text-magical-gold' : 'bg-white/5 text-white/40'}`}>
        {React.cloneElement(icon, { className: "w-8 h-8" })}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">{label}</p>
        <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
      </div>
    </div>
  )
}
