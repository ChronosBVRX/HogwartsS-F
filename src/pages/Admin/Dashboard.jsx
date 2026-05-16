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

  const handleDeleteUser = async (userId, displayName) => {
    if (!confirm(`¿Estás absolutamente seguro de eliminar al usuario "${displayName}"?\nEsta acción es irreversible y borrar el usuario eliminará todo su historial y acceso.`)) return

    const { data, error } = await supabase.rpc('hsf_delete_user', { p_user_id: userId })

    if (error || !data?.ok) {
      alert(error?.message || data?.message || 'No se pudo eliminar el usuario.')
      return
    }

    alert('Usuario eliminado correctamente.')
    fetchData()
  }

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  const navigationCards = [
    { id: 'tickets', label: 'Tickets', desc: 'Validar consumos', icon: <Ticket className="w-6 h-6 text-magical-gold" />, color: 'border-magical-gold/30 hover:border-magical-gold' },
    { id: 'users', label: 'Personal', desc: 'Roles y Casas', icon: <UserCog className="w-6 h-6 text-blue-400" />, color: 'border-blue-500/30 hover:border-blue-500' },
    { id: 'menu', label: 'Menú', desc: 'Platillos y Precios', icon: <Wand2 className="w-6 h-6 text-purple-400" />, color: 'border-purple-500/30 hover:border-purple-500' },
    { id: 'adventures', label: 'Aventuras', desc: 'Pósters y Progreso', icon: <Map className="w-6 h-6 text-green-400" />, color: 'border-green-500/30 hover:border-green-500' },
    { id: 'rewards', label: 'Recompensas', desc: 'Cortesías y Canjes', icon: <Gift className="w-6 h-6 text-yellow-400" />, color: 'border-yellow-500/30 hover:border-yellow-500' },
    { id: 'duels', label: 'Duelos', desc: 'Hechizos y Combate', icon: <Swords className="w-6 h-6 text-red-400" />, color: 'border-red-500/30 hover:border-red-500' }
  ]

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-10 max-w-7xl mx-auto w-full pb-24 animate-in fade-in duration-700">
      {/* Header Banner */}
      <header className="bg-gradient-to-r from-white/10 via-magical-gold/10 to-white/5 p-6 sm:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 backdrop-blur-md">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter text-white drop-shadow-md">
            Bóveda de <span className="text-magical-gold">Gringotts</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-white/60 uppercase font-black tracking-[0.3em] flex items-center gap-2">
            <Shield className="w-4 h-4 text-magical-gold inline-block" />
            Panel de Control General de Hogwarts
          </p>
        </div>
        <div className="bg-black/40 px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3 self-stretch md:self-auto justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Sistema En Vivo</span>
        </div>
      </header>

      {/* Big Touch-Friendly Navigation Grid */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white/40 px-2">Selecciona un Módulo de Gestión</h2>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          {navigationCards.map((card) => {
            const active = activeTab === card.id
            return (
              <button
                key={card.id}
                onClick={() => setActiveTab(card.id)}
                className={`p-5 rounded-3xl border transition-all duration-300 text-left flex flex-col justify-between h-36 relative overflow-hidden group ${
                  active
                    ? 'bg-magical-gold text-magical-navy border-magical-gold shadow-[0_0_30px_rgba(212,175,55,0.35)] scale-[1.02]'
                    : `bg-white/5 text-white border-white/10 hover:bg-white/10 ${card.color}`
                }`}
              >
                {/* Background glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex justify-between items-start w-full relative z-10">
                  <div className={`p-3 rounded-2xl ${active ? 'bg-magical-navy/20 text-magical-navy' : 'bg-white/5'}`}>
                    {React.cloneElement(card.icon, { className: `w-6 h-6 ${active ? 'text-magical-navy' : ''}` })}
                  </div>
                  {active && (
                    <span className="bg-magical-navy text-magical-gold text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-md tracking-widest animate-in zoom-in duration-300">
                      Activo
                    </span>
                  )}
                </div>

                <div className="relative z-10 space-y-0.5 mt-4">
                  <h3 className={`text-sm sm:text-base font-black uppercase tracking-tight ${active ? 'text-magical-navy' : 'text-white'}`}>
                    {card.label}
                  </h3>
                  <p className={`text-[10px] line-clamp-1 font-bold ${active ? 'text-magical-navy/70' : 'text-white/40'}`}>
                    {card.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Module Content Renders */}
      <div className="pt-4">
        {activeTab === 'menu' && <AdminMenuManager />}
        {activeTab === 'adventures' && <AdminAdventureManager />}
        {activeTab === 'rewards' && <AdminRewardManager />}
        {activeTab === 'duels' && <AdminDuelManager />}

        {activeTab === 'tickets' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <StatCard icon={<Users />} label="Magos Registrados" value={stats.users} />
              <StatCard icon={<Star />} label="Galeones Totales" value={stats.points} />
              <StatCard icon={<Ticket />} label="Tickets Pendientes" value={stats.pendingTickets} highlight={stats.pendingTickets > 0} />
            </div>

            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-magical-gold" />
                  <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Validación de Consumo</h2>
                </div>
                <div className="flex flex-wrap bg-white/5 p-1 rounded-xl border border-white/5 w-full sm:w-auto justify-between">
                  {['pending', 'approved', 'rejected', 'all'].map(s => (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all text-center ${
                        filter === s ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/60'
                      }`}
                    >
                      {s === 'pending' ? 'Pendientes' : s === 'approved' ? 'Aprobados' : s === 'rejected' ? 'Rechazados' : 'Todos'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card overflow-hidden border border-white/10 shadow-xl rounded-3xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-[0.2em] border-b border-white/10">
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
                         <tr><td colSpan="6" className="px-6 py-16 text-center text-white/20 uppercase font-black tracking-widest">Cargando tickets...</td></tr>
                      ) : filteredTickets.length === 0 ? (
                        <tr><td colSpan="6" className="px-6 py-16 text-center text-white/20 uppercase font-black tracking-widest">Sin registros en este estado</td></tr>
                      ) : (
                        filteredTickets.map(ticket => (
                          <tr key={ticket.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="font-bold text-white uppercase italic text-xs">{ticket.session?.customer?.display_name || 'Desconocido'}</div>
                              <div className="text-[10px] text-white/40">{ticket.session?.customer?.phone || 'Sin teléfono'}</div>
                            </td>
                            <td className="px-6 py-5 font-mono text-xs text-magical-gold font-bold">{ticket.folio}</td>
                            <td className="px-6 py-5 font-black text-lg text-white">${ticket.amount}</td>
                            <td className="px-6 py-5 font-bold text-xs text-magical-gold">+{ticket.points_awarded || Math.floor(ticket.amount)}</td>
                            <td className="px-6 py-5">
                              <span className={`text-[9px] px-3 py-1 rounded-full uppercase font-black tracking-widest border inline-block ${
                                ticket.status === 'approved' ? 'border-green-500/20 text-green-400 bg-green-500/5' :
                                ticket.status === 'pending' ? 'border-yellow-500/20 text-yellow-400 bg-yellow-500/5 animate-pulse' :
                                'border-red-500/20 text-red-400 bg-red-500/5'
                              }`}>
                                {ticket.status === 'approved' ? 'Aprobado' : ticket.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              {ticket.status === 'pending' && (
                                <div className="flex justify-end gap-2 items-center">
                                  <button
                                    onClick={() => handleTicket(ticket.id, 'approved', ticket.amount, ticket.customer_id)}
                                    className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl hover:bg-green-500/20 text-[10px] font-black uppercase flex items-center gap-1.5 transition-colors shadow-sm"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Aprobar
                                  </button>
                                  <button
                                    onClick={() => { const reason = prompt('Razón de rechazo:'); if (reason) handleTicket(ticket.id, 'rejected', ticket.amount, ticket.customer_id, reason) }}
                                    className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 text-[10px] font-black uppercase flex items-center gap-1.5 transition-colors shadow-sm"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Rechazar
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
        )}

        {activeTab === 'users' && (
          <section className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 px-2">
              <UserCog className="w-5 h-5 text-magical-gold" />
              <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Gestión de Personal y Estudiantes</h2>
            </div>

            <div className="glass-card overflow-hidden border border-white/10 shadow-xl rounded-3xl">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-[0.2em] border-b border-white/10">
                    <tr>
                      <th className="px-8 py-6">Mago / Estudiante</th>
                      <th className="px-8 py-6">Casa Mágica</th>
                      <th className="px-8 py-6">Galeones Totales</th>
                      <th className="px-8 py-6">Rol Actual</th>
                      <th className="px-8 py-6 text-right">Asignar Nuevo Rol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr><td colSpan="5" className="px-8 py-20 text-center text-white/20 uppercase font-black tracking-widest">Consultando registros...</td></tr>
                    ) : allUsers.map(u => (
                      <tr key={u.user_id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="font-bold text-white uppercase italic text-xs">{formatMagicalText(u.display_name)}</div>
                          <div className="text-[10px] text-white/40">{u.phone || 'Sin teléfono'}</div>
                        </td>
                        <td className="px-8 py-6 font-bold text-[10px] uppercase tracking-widest">
                          <span className={`px-3 py-1.5 rounded-xl border ${
                            u.house_slug === 'red' ? 'border-red-500/20 text-red-400 bg-red-500/10' :
                            u.house_slug === 'green' ? 'border-green-500/20 text-green-400 bg-green-500/10' :
                            u.house_slug === 'blue' ? 'border-blue-500/20 text-blue-400 bg-blue-500/10' :
                            u.house_slug === 'yellow' ? 'border-yellow-500/20 text-yellow-400 bg-yellow-500/10' : 'border-white/10 text-white/30 bg-white/5'
                          }`}>
                            {formatMagicalText(u.house_slug) || 'Sin casa'}
                          </span>
                        </td>
                        <td className="px-8 py-6 font-black text-magical-gold text-sm">{u.loyalty_points || 0} G</td>
                        <td className="px-8 py-6">
                          <span className={`text-[9px] px-3.5 py-1.5 rounded-full uppercase font-black tracking-widest border inline-block ${
                            u.role === 'admin' ? 'border-purple-500/30 text-purple-300 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]' :
                            u.role === 'waiter' ? 'border-blue-500/30 text-blue-300 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]' :
                            'border-white/10 text-white/40 bg-white/5'
                          }`}>
                            {u.role === 'customer' ? 'Mago' : u.role === 'waiter' ? 'Mesero' : 'Administrador'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex justify-end gap-2 items-center">
                            {['customer', 'waiter', 'admin'].map(r => {
                              const isCurrent = u.role === r
                              return (
                                <button
                                  key={r}
                                  disabled={isCurrent}
                                  onClick={() => handleUpdateRole(u.user_id, r)}
                                  className={`px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                    isCurrent
                                      ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                                      : r === 'admin'
                                      ? 'bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 shadow-sm'
                                      : r === 'waiter'
                                      ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 shadow-sm'
                                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white shadow-sm'
                                  }`}
                                >
                                  {r === 'customer' ? 'Mago' : r === 'waiter' ? 'Mesero' : 'Admin'}
                                </button>
                              )
                            })}
                            <button
                              onClick={() => handleDeleteUser(u.user_id, u.display_name)}
                              className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors shadow-sm ml-2"
                              title="Eliminar usuario"
                            >
                              <X className="w-4 h-4" />
                            </button>
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
    </div>
  )
}

function StatCard({ icon, label, value, highlight }) {
  return (
    <div className={`glass-card p-6 sm:p-8 rounded-3xl flex items-center gap-6 sm:gap-8 relative overflow-hidden transition-all duration-500 shadow-xl ${
      highlight ? 'border-magical-gold/50 bg-magical-gold/10 shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-white/10 bg-gradient-to-br from-white/10 to-white/5'
    }`}>
      <div className={`p-4 sm:p-5 rounded-2xl shrink-0 shadow-inner ${highlight ? 'bg-magical-gold text-magical-navy shadow-md' : 'bg-white/10 text-white/70'}`}>
        {React.cloneElement(icon, { className: "w-7 h-7 sm:w-8 sm:h-8" })}
      </div>
      <div className="relative z-10 overflow-hidden">
        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-1 truncate">{label}</p>
        <p className={`text-3xl sm:text-4xl font-black tracking-tighter ${highlight ? 'text-magical-gold drop-shadow' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  )
}
