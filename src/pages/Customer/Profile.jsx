import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { withTimeout } from '../../lib/supabaseSafe'
import audioManager from '../../lib/audioManager'
import { QRCodeSVG } from 'qrcode.react'
import { Award, QrCode, LogOut, Star, Shield, Zap, Wand2, Hash, Settings as SettingsIcon, Map, Footprints, Ticket, CheckCircle2, XCircle, Clock, Gift, X } from 'lucide-react'

// House assets
import gryffindorLogo from '../../assets/houses/gryffindor.png'
import slytherinLogo from '../../assets/houses/slytherin.png'
import ravenclawLogo from '../../assets/houses/ravenclaw.png'
import hufflepuffLogo from '../../assets/houses/hufflepuff.png'
import idBg from '../../assets/id_bg_minimal.png'
import logo from '../../assets/logo.png'
import mapBg from '../../assets/map_bg.png'

const MAP_THRESHOLDS = [
  { steps: 0, name: "Entrada Principal", icon: "🚪" },
  { steps: 150, name: "Primer Sello", icon: "✨" },
  { steps: 300, name: "Gran Comedor", icon: "🍽️" },
  { steps: 500, name: "Aulas Mágicas", icon: "📜" },
  { steps: 750, name: "Cabaña Hagrid", icon: "🛖" },
  { steps: 1000, name: "Bosque Prohibido", icon: "🌲" },
  { steps: 1200, name: "Sala Menesteres", icon: "🎁" }
]

const HOUSE_CONFIG = {
  red: { name: "Gryffindor", logo: gryffindorLogo, quote: "Valor y Caballerosidad", color: "from-red-500 to-amber-500", text: "text-red-400", reward: "Soda Italiana Gratis" },
  green: { name: "Slytherin", logo: slytherinLogo, quote: "Astucia y Ambición", color: "from-emerald-400 to-emerald-700", text: "text-emerald-400", reward: "Soda Italiana Gratis" },
  blue: { name: "Ravenclaw", logo: ravenclawLogo, quote: "Inteligencia y Sabiduría", color: "from-blue-400 to-indigo-400", text: "text-blue-400", reward: "Soda Italiana Gratis" },
  yellow: { name: "Hufflepuff", logo: hufflepuffLogo, quote: "Lealtad y Paciencia", color: "from-yellow-400 to-orange-400", text: "text-yellow-400", reward: "Soda Italiana Gratis" }
}

export default function Profile() {
  const { profile, signOut } = useAuth()
  const [activeSession, setActiveSession] = useState(null)
  const [ticketHistory, setTicketHistory] = useState([])
  const [monthlyPoints, setMonthlyPoints] = useState(0)
  const [welcomeReward, setWelcomeReward] = useState(null)
  const [mapReward, setMapReward] = useState(null)
  const [adventureRewards, setAdventureRewards] = useState([])
  const [selectedReward, setSelectedReward] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchData = useCallback(async () => {
    if (!profile?.user_id) return
    
    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const [sessionRes, historyRes, monthlyRes, welcomeRes, mapRes, advRewardsRes] = await Promise.all([
        withTimeout(
          supabase
            .from('hsf_visit_sessions')
            .select('*')
            .in('status', ['qr_generated', 'seated', 'closed_waiting_ticket', 'ticket_submitted'])
            .eq('customer_id', profile.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          20000,
          'Sesión'
        ),
        withTimeout(
          supabase
            .from('hsf_ticket_claims')
            .select('*')
            .eq('customer_id', profile.user_id)
            .order('created_at', { ascending: false })
            .limit(10),
          20000,
          'Historial'
        ),
        withTimeout(
          supabase
            .from('hsf_ticket_claims')
            .select('points_awarded')
            .eq('customer_id', profile.user_id)
            .eq('status', 'approved')
            .gte('created_at', startOfMonth.toISOString()),
          20000,
          'Puntos'
        ),
        withTimeout(
          supabase
            .from('hsf_adventure_rewards')
            .select('*')
            .eq('customer_id', profile.user_id)
            .eq('reward_title', 'Recompensa de Ceremonia')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          20000,
          'Recompensa Bienvenida'
        ),
        withTimeout(
          supabase
            .from('hsf_adventure_rewards')
            .select('*')
            .eq('customer_id', profile.user_id)
            .eq('reward_title', 'Mapa del Merodeador')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          20000,
          'Recompensa Mapa'
        ),
        withTimeout(
          supabase
            .from('hsf_adventure_rewards')
            .select('id, reward_title, reward_description, min_consumption, status, created_at')
            .eq('customer_id', profile.user_id)
            .order('created_at', { ascending: false })
            .limit(10),
          20000,
          'Recompensas Aventuras'
        )
      ])

      if (sessionRes.data) setActiveSession(sessionRes.data)
      if (historyRes.data) setTicketHistory(historyRes.data)
      if (welcomeRes?.data) setWelcomeReward(welcomeRes.data)
      if (advRewardsRes?.data) {
        setAdventureRewards(advRewardsRes.data.filter(r => r.reward_title !== 'Mapa del Merodeador'))
      }
      
      let totalMonthly = 0;
      if (monthlyRes.data) {
        totalMonthly = monthlyRes.data.reduce((acc, curr) => acc + (curr.points_awarded || 0), 0)
        setMonthlyPoints(totalMonthly)
      }

      let currentMapReward = mapRes?.data || null;
      if (totalMonthly >= 1200 && !currentMapReward) {
        const { data: newReward } = await supabase
          .from('hsf_adventure_rewards')
          .insert({
            customer_id: profile.user_id,
            reward_title: 'Mapa del Merodeador',
            reward_description: 'Elige tu recompensa: Hamburguesa Sencilla o Tacos de Arrachera',
            min_consumption: 0,
            status: 'available'
          })
          .select()
          .maybeSingle();
        if (newReward) currentMapReward = newReward;
      }
      setMapReward(currentMapReward)
    } catch (err) {
      console.error('Error loading profile data:', err)
    } finally {
      setLoading(false)
    }
  }, [profile?.user_id])

  useEffect(() => {
    if (!profile) return
    fetchData()

    const channel = supabase
      .channel(`profile_updates_${profile.user_id}`)
      .on('postgres_changes', { event: '*', table: 'hsf_visit_sessions', filter: `customer_id=eq.${profile.user_id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'hsf_ticket_claims', filter: `customer_id=eq.${profile.user_id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'hsf_adventure_rewards', filter: `customer_id=eq.${profile.user_id}` }, () => fetchData())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [profile?.user_id, fetchData])

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="glass-card p-8 rounded-[2.5rem] text-center space-y-6 max-w-md border border-white/10">
          <Wand2 className="w-16 h-16 text-magical-gold/20 mx-auto" />
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white italic">Cargando Perfil...</h1>
          <button onClick={() => signOut()} className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/40">Cerrar Sesión</button>
        </div>
      </div>
    )
  }

  const house = profile?.house_slug ? HOUSE_CONFIG[profile.house_slug] : null
  const currentSteps = monthlyPoints
  const nextMilestoneIndex = MAP_THRESHOLDS.findIndex(m => m.steps > currentSteps)
  const currentMilestoneIndex = nextMilestoneIndex === -1 ? MAP_THRESHOLDS.length - 1 : nextMilestoneIndex - 1
  const nextMilestone = nextMilestoneIndex === -1 ? null : MAP_THRESHOLDS[nextMilestoneIndex]
  const finalGoal = MAP_THRESHOLDS[MAP_THRESHOLDS.length - 1].steps
  const mapProgressPercentage = Math.min((currentSteps / finalGoal) * 100, 100)

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 pb-24 space-y-8 animate-in fade-in duration-700 overflow-x-hidden">
      <header className="flex justify-between items-center bg-white/5 p-4 md:p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-magical-gold/10 flex items-center justify-center border border-magical-gold/20">
            <Wand2 className="text-magical-gold w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase italic">{profile?.display_name}</h1>
              <span className="md:hidden px-2 py-0.5 bg-magical-gold/10 border border-magical-gold/20 rounded-full text-[8px] font-black text-magical-gold">{profile?.loyalty_points || 0} pts</span>
            </div>
            <p className="text-[9px] text-white/30 uppercase font-bold tracking-[0.2em]">Miembro de Hogwarts</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-[8px] font-black uppercase tracking-widest text-magical-gold/60">Puntos Totales</p>
            <p className="text-sm font-black text-white">{profile?.loyalty_points || 0} ✨</p>
          </div>
          <Link to="/ajustes" className="p-3 bg-white/5 rounded-xl border border-white/5">
            <SettingsIcon className="w-5 h-5 text-white/40" />
          </Link>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Shield className="w-4 h-4 text-magical-gold/50" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Identificación Mágica</h2>
        </div>

        {house ? (
          <div className="relative min-h-[380px] md:aspect-[1.6/1] w-full max-w-2xl mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
            <img src={idBg} className="absolute inset-0 w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 p-6 md:p-14 flex flex-col justify-between z-10 text-white">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter text-magical-gold">Hogwarts</h2>
                  <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.3em] opacity-40">Snacks & Foods</p>
                </div>
                <img src={logo} className="w-10 md:w-16 grayscale opacity-80" alt="" />
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-16">
                <div className="w-20 h-20 md:w-36 md:h-36 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 p-3 shadow-2xl flex items-center justify-center">
                   <img src={house.logo} className="w-full h-full object-contain" alt={house.name} />
                </div>
                <div className="space-y-3 md:space-y-6 text-center md:text-left">
                  <div className="space-y-1">
                    <p className="text-[8px] md:text-[9px] font-bold text-white/40 uppercase tracking-widest">Nombre del Mago</p>
                    <h3 className="text-xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">{profile?.display_name}</h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] md:text-[9px] font-bold text-white/40 uppercase tracking-widest">Casa</p>
                    <h4 className={`text-lg md:text-3xl font-black uppercase tracking-widest ${house.text}`}>{house.name}</h4>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-end border-t border-white/10 pt-4 md:pt-6">
                <div className="flex items-center gap-3">
                  <Wand2 className="w-3 h-3 text-magical-gold/40" />
                  <p className="text-[8px] md:text-xs font-bold uppercase tracking-[0.1em] text-white/60">{house.quote}</p>
                </div>
                <span className="text-[8px] font-black tracking-widest uppercase opacity-30">ID #{profile?.user_id?.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-16 text-center space-y-6 border-dashed border-2 border-white/5 bg-transparent">
            <Zap className="w-12 h-12 text-white/10 mx-auto" />
            <p className="text-white/40 font-bold uppercase text-xs tracking-widest">Sin casa asignada. La ceremonia te espera.</p>
            <Link to="/quiz" className="btn-gold inline-block px-10 py-4 text-sm font-black uppercase">Comenzar Ceremonia</Link>
          </div>
        )}
      </section>

      <div className="w-full max-w-lg mx-auto">
        <div className="bg-white/5 rounded-[2.5rem] p-8 md:p-10 border border-white/5 space-y-8 flex flex-col">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Acciones Mágicas</p>
            {activeSession && <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/60">{activeSession.status.replace(/_/g, ' ')}</span>}
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-10">
            {activeSession?.status === 'seated' && (
              <div className="text-center space-y-1 pb-2">
                <p className="text-4xl font-black text-white italic tracking-tighter">Mesa {activeSession.table_number}</p>
                <p className="text-[10px] text-magical-gold font-black uppercase tracking-widest">Disfruta tu banquete</p>
              </div>
            )}

            <div className="space-y-6">
              <button onClick={() => { audioManager.unlockAudio().catch(() => {}); navigate('/aventura') }} className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase bg-green-600 border-green-500">
                <Wand2 className="w-5 h-5" /> Iniciar Aventura
              </button>
              <button onClick={() => { audioManager.unlockAudio().catch(() => {}); navigate('/duelos') }} className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase">
                <Wand2 className="w-5 h-5" /> Duelos Mágicos
              </button>
              <button onClick={() => { audioManager.unlockAudio().catch(() => {}); navigate('/asistencia') }} className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase">
                <QrCode className="w-6 h-6" /> Registrar Visita
              </button>
            </div>

            <div className="pt-2">
              {activeSession?.status === 'seated' && (
                <button onClick={async () => { await supabase.from('hsf_visit_sessions').update({ status: 'closed_waiting_ticket', closed_at: new Date().toISOString() }).eq('id', activeSession.id); fetchData() }} className="w-full text-white/20 hover:text-white/40 text-[10px] font-black uppercase tracking-widest">Terminar Visita</button>
              )}
              {activeSession?.status === 'closed_waiting_ticket' && (
                <Link to="/registrar-ticket" className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase bg-magical-gold text-magical-navy">Registrar Consumo</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4 pt-4">
        <div className="flex items-center gap-2 px-2">
          <Map className="w-5 h-5 text-[#8b5a2b]" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8b5a2b]">Mapa del Merodeador</h2>
        </div>
        <div className="relative w-full rounded-[2.5rem] overflow-hidden border-2 border-[#8b5a2b]/30 shadow-2xl bg-[#e6c9a8]">
          <img src={mapBg} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply" alt="" />
          <div className="relative z-10 p-6 md:p-10 flex flex-col space-y-10">
            <div className="text-center space-y-2">
               <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter text-[#5c3a21]">Juro solemnemente...</h3>
               <p className="text-xs font-bold uppercase tracking-widest text-[#5c3a21]/60">Que mis intenciones no son buenas</p>
            </div>
            <div className="relative py-10">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#5c3a21]/20 -translate-y-1/2 rounded-full overflow-hidden">
                 <div className="h-full bg-[#5c3a21] transition-all duration-1000" style={{ width: `${mapProgressPercentage}%` }} />
              </div>
              <div className="relative flex justify-between">
                {MAP_THRESHOLDS.map((milestone, index) => {
                  const isPast = index <= currentMilestoneIndex
                  const isCurrent = index === currentMilestoneIndex
                  return (
                    <div key={index} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                      <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 z-10 ${isPast ? 'bg-[#5c3a21] border-[#5c3a21] text-[#e6c9a8]' : 'bg-[#e6c9a8] border-[#8b5a2b]/30 text-[#8b5a2b]/50'} ${isCurrent ? 'ring-4 ring-[#8b5a2b]/30 scale-110 shadow-xl' : ''}`}>
                        {isCurrent ? <Footprints className="w-4 h-4 md:w-6 md:h-6 animate-pulse" /> : <span className="text-xs">{milestone.icon}</span>}
                      </div>
                      <p className={`text-[7px] font-black uppercase tracking-tight text-center ${isPast ? 'text-[#5c3a21]' : 'text-[#8b5a2b]/50'}`}>{milestone.name}</p>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="bg-[#5c3a21]/5 border border-[#5c3a21]/10 rounded-2xl p-6 text-center space-y-4">
               <p className="text-[10px] uppercase font-black tracking-widest text-[#5c3a21]/60 italic max-w-lg mx-auto">“Grandes banquetes aguardan a quienes recorren el restaurante”. Junta 1,200 puntos con tus tickets validados y elige tu recompensa: ¡Hamburguesa Sencilla o Tacos de Arrachera!</p>
               <div>
                 <p className="text-[10px] uppercase font-black tracking-widest text-[#5c3a21]/40">Poder Mágico Mensual</p>
                 <p className="text-4xl font-black text-[#5c3a21] italic tracking-tighter">{currentSteps} pts</p>
               </div>
               {nextMilestone && <p className="text-[9px] font-bold text-[#5c3a21]/50">Te faltan {nextMilestone.steps - currentSteps} puntos para el {nextMilestone.name}</p>}
               {mapReward?.status === 'available' ? (
                 <div className="bg-white p-3 rounded-xl inline-block mx-auto border-4 border-[#8b5a2b]/30 mt-2">
                   <QRCodeSVG value={`reward-${mapReward.id}`} size={100} />
                   <p className="text-[8px] font-black text-black text-center mt-2 uppercase tracking-widest">ESCANEAR PARA<br/>CANJEAR</p>
                 </div>
               ) : mapReward?.status === 'redeemed' ? (
                 <p className="text-[10px] font-bold text-[#5c3a21]/60 uppercase tracking-widest border border-[#5c3a21]/20 py-2 px-4 rounded-full inline-block mt-2 bg-[#5c3a21]/5">Recompensa del Mapa reclamada</p>
               ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-4">
        <div className="flex items-center gap-2 px-2">
          <Gift className="w-5 h-5 text-magical-gold" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Mis Recompensas Mágicas (Casa y Aventuras)</h2>
        </div>

        <div className="glass-card overflow-hidden divide-y divide-white/5 border border-white/5">
          {adventureRewards.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-xs font-black uppercase tracking-widest">
              Aún no tienes recompensas de casa o aventura.
            </div>
          ) : adventureRewards.map((reward) => (
            <div key={reward.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/5 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-black uppercase italic">{reward.reward_title}</p>
                  {reward.reward_title === 'Recompensa de Ceremonia' && (
                    <span className="px-2 py-0.5 bg-magical-gold/10 border border-magical-gold/20 rounded-full text-[8px] font-black text-magical-gold uppercase tracking-widest">
                      Casa {house?.name || ''}
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-xs mt-1">{reward.reward_description}</p>
                {Number(reward.min_consumption) > 0 && (
                  <p className="text-[10px] text-magical-gold mt-2 uppercase font-black">
                    Consumo mínimo: ${reward.min_consumption}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4 justify-between md:justify-end">
                {reward.status === 'available' ? (
                  <button
                    onClick={() => setSelectedReward(reward)}
                    className="btn-gold px-4 py-2 text-xs font-black uppercase tracking-widest flex items-center gap-2 shrink-0"
                  >
                    <QrCode className="w-4 h-4" />
                    Ver Código
                  </button>
                ) : null}
                <span className={`px-3 py-1 rounded-full text-[9px] uppercase font-black tracking-widest border h-fit ${
                  reward.status === 'available'
                    ? 'border-green-500/20 text-green-400 bg-green-500/5'
                    : 'border-white/10 text-white/30 bg-white/5'
                }`}>
                  {reward.status === 'available' ? 'Disponible' : reward.status === 'redeemed' ? 'Canjeada' : reward.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 pt-4 pb-12">
        <div className="flex items-center gap-2 px-2">
          <Ticket className="w-5 h-5 text-white/40" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Historial</h2>
        </div>
        <div className="glass-card overflow-hidden divide-y divide-white/5 border border-white/5">
          {ticketHistory.length === 0 ? (
            <div className="p-8 text-center text-white/30 uppercase text-xs font-bold tracking-widest">Aún no hay consumos</div>
          ) : (
            ticketHistory.map((ticket) => (
              <div key={ticket.id} className="p-5 flex justify-between items-center hover:bg-white/5 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-white font-bold">{ticket.folio}</span>
                    <span className="text-[10px] text-white/30 uppercase">{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xl font-black text-magical-gold">${ticket.amount}</div>
                </div>
                <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${ticket.status === 'approved' ? 'text-green-400 bg-green-400/10 border-green-400/20' : ticket.status === 'rejected' ? 'text-red-400 bg-red-400/10 border-red-400/20' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'}`}>
                  {ticket.status === 'approved' ? `Aprobado (+${ticket.points_awarded} pts)` : ticket.status === 'rejected' ? 'Rechazado' : 'Revisión'}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card max-w-md w-full p-8 md:p-10 rounded-[2.5rem] border border-magical-gold/30 space-y-6 text-center relative shadow-2xl">
            <button
              onClick={() => setSelectedReward(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-16 h-16 mx-auto rounded-full bg-magical-gold/10 border border-magical-gold/30 flex items-center justify-center">
              <Gift className="w-8 h-8 text-magical-gold" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                  {selectedReward.reward_title}
                </h3>
                {selectedReward.reward_title === 'Recompensa de Ceremonia' && (
                  <span className="px-2 py-0.5 bg-magical-gold/10 border border-magical-gold/20 rounded-full text-[8px] font-black text-magical-gold uppercase tracking-widest">
                    Casa {house?.name || ''}
                  </span>
                )}
              </div>
              <p className="text-white/60 text-sm italic">“{selectedReward.reward_description}”</p>
              {Number(selectedReward.min_consumption) > 0 && (
                <p className="text-xs text-magical-gold uppercase font-black pt-1">
                  Consumo mínimo: ${selectedReward.min_consumption}
                </p>
              )}
            </div>

            <div className="bg-white p-6 rounded-[2rem] inline-block shadow-2xl border-4 border-magical-gold/20 my-4">
              <QRCodeSVG value={`reward-${selectedReward.id}`} size={200} />
            </div>

            <div className="bg-magical-navy/40 p-4 rounded-2xl border border-white/5 space-y-1">
              <p className="text-[10px] text-magical-gold font-black uppercase tracking-widest">
                Presenta este código al Personal
              </p>
              <p className="text-[10px] text-white/40 italic">
                El mesero escaneará este código para aplicar tu beneficio en la cuenta.
              </p>
            </div>

            <button
              onClick={() => setSelectedReward(null)}
              className="btn-gold w-full py-4 text-xs font-black uppercase"
            >
              Hecho
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
