import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { withTimeout, safeWithTimeout } from '../../lib/supabaseSafe'
import audioManager from '../../lib/audioManager'
import { Award, QrCode, LogOut, Star, Shield, Zap, Wand2, Hash, Settings as SettingsIcon, Map, Footprints, Ticket, CheckCircle2, XCircle, Clock } from 'lucide-react'

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
  red: { name: "Gryffindor", logo: gryffindorLogo, quote: "Valor y Caballerosidad", color: "from-red-500 to-amber-500", text: "text-red-400", reward: "Bebida de Mantequilla Gratis" },
  green: { name: "Slytherin", logo: slytherinLogo, quote: "Astucia y Ambición", color: "from-emerald-400 to-emerald-700", text: "text-emerald-400", reward: "Postre Mágico Gratis" },
  blue: { name: "Ravenclaw", logo: ravenclawLogo, quote: "Inteligencia y Sabiduría", color: "from-blue-400 to-indigo-400", text: "text-blue-400", reward: "Upgrade a Bebida Grande" },
  yellow: { name: "Hufflepuff", logo: hufflepuffLogo, quote: "Lealtad y Paciencia", color: "from-yellow-400 to-orange-400", text: "text-yellow-400", reward: "Snack de Bienvenida" }
}

export default function Profile() {
  const { profile, profileLoading, signOut } = useAuth()
  const [activeSession, setActiveSession] = useState(() => {
    try {
      const cached = localStorage.getItem(`hsf_active_session_${profile?.user_id}`)
      return cached ? JSON.parse(cached) : null
    } catch (e) { return null }
  })
  const [ticketHistory, setTicketHistory] = useState(() => {
    try {
      const cached = localStorage.getItem(`hsf_ticket_history_${profile?.user_id}`)
      return cached ? JSON.parse(cached) : []
    } catch (e) { return [] }
  })
  const [monthlyPoints, setMonthlyPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const isFetching = useRef(false)
  const lastFetchTime = useRef(0)
  const navigate = useNavigate()

  const fetchActiveSession = useCallback(async () => {
    // Throttle: Evitar más de una petición cada 3 segundos
    const now = Date.now()
    if (isFetching.current || (now - lastFetchTime.current < 3000)) return
    
    isFetching.current = true
    lastFetchTime.current = now
    
    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      // Fetch all data in parallel to save time, using safeWithTimeout to avoid failing the whole block
      const [sessionRes, historyRes, monthlyRes] = await Promise.all([
        safeWithTimeout(
          supabase
            .from('hsf_visit_sessions')
            .select('*')
            .in('status', ['qr_generated', 'seated', 'closed_waiting_ticket', 'ticket_submitted'])
            .eq('customer_id', profile.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          15000,
          'Cargando sesión'
        ),
        safeWithTimeout(
          supabase
            .from('hsf_ticket_claims')
            .select('*')
            .eq('customer_id', profile.user_id)
            .order('created_at', { ascending: false })
            .limit(10),
          15000,
          'Cargando historial'
        ),
        safeWithTimeout(
          supabase
            .from('hsf_ticket_claims')
            .select('points_awarded')
            .eq('customer_id', profile.user_id)
            .eq('status', 'approved')
            .gte('created_at', startOfMonth.toISOString()),
          15000,
          'Cargando puntos'
        )
      ])

      if (!sessionRes.error) {
        setActiveSession(sessionRes.data || null)
        if (profile?.user_id) localStorage.setItem(`hsf_active_session_${profile.user_id}`, JSON.stringify(sessionRes.data || null))
      } else {
        console.warn('Session fetch failed, using cache:', sessionRes.error)
      }
 
      if (!historyRes.error) {
        setTicketHistory(historyRes.data || [])
        if (profile?.user_id) localStorage.setItem(`hsf_ticket_history_${profile.user_id}`, JSON.stringify(historyRes.data || []))
      } else {
        console.warn('History fetch failed, using cache:', historyRes.error)
      }
 
      if (!monthlyRes.error) {
        const total = monthlyRes.data?.reduce((acc, curr) => acc + (curr.points_awarded || 0), 0) || 0
        setMonthlyPoints(total)
      } else {
        console.warn('Monthly points fetch failed:', monthlyRes.error)
      }

    } catch (err) {
      console.error('fetchActiveSession failed:', err)
    } finally {
      isFetching.current = false
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    if (!profile) return
    
    // Pequeño delay inicial para dejar que AuthContext se estabilice en el refresh
    const timer = setTimeout(() => {
      fetchActiveSession()
    }, 300)

    const channel = supabase
      .channel(`session_updates_${profile.user_id}`)
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          table: 'hsf_visit_sessions', 
          filter: `customer_id=eq.${profile.user_id}` 
        }, 
        () => fetchActiveSession()
      )
      .subscribe()

    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [profile?.user_id, fetchActiveSession]) // Solo re-suscribir si cambia el ID de usuario

  const handleEndVisit = async () => {
    if (!activeSession) return
    
    const { error } = await supabase
      .from('hsf_visit_sessions')
      .update({ 
        status: 'closed_waiting_ticket', 
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', activeSession.id)

    if (!error) fetchActiveSession()
  }

  // Eliminamos el bloqueo total. La página se renderiza con lo que tenga (cache)
  // y muestra estados de carga locales donde sea necesario.

  if (!profile && !profileLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="glass-card p-8 rounded-[2.5rem] text-center space-y-6 max-w-md border border-white/10">
          <Wand2 className="w-16 h-16 text-magical-gold/20 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Perfil no encontrado</h1>
            <p className="text-white/50 text-sm leading-relaxed">
              Tu usuario existe en el Ministerio, pero tu perfil mágico local no fue encontrado. Esto sucede tras un reinicio de la Gran Cámara.
            </p>
          </div>
          <Link to="/registro" className="btn-gold w-full py-5 text-sm font-black uppercase tracking-widest">
            Recrear Perfil Mágico
          </Link>
          <button onClick={() => signOut()} className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </div>
    )
  }

  const house = profile?.house_slug ? HOUSE_CONFIG[profile.house_slug] : null

  const currentSteps = monthlyPoints
  
  // Calculate map progress
  const nextMilestoneIndex = MAP_THRESHOLDS.findIndex(m => m.steps > currentSteps)
  const currentMilestoneIndex = nextMilestoneIndex === -1 ? MAP_THRESHOLDS.length - 1 : nextMilestoneIndex - 1
  const nextMilestone = nextMilestoneIndex === -1 ? null : MAP_THRESHOLDS[nextMilestoneIndex]
  
  const finalGoal = MAP_THRESHOLDS[MAP_THRESHOLDS.length - 1].steps
  const mapProgressPercentage = Math.min((currentSteps / finalGoal) * 100, 100)

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 pb-24 space-y-8 md:space-y-12 animate-in fade-in duration-700 overflow-x-hidden">
      {/* Header - Minimalist */}
      <header className="flex justify-between items-center bg-white/5 p-4 md:p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-magical-gold/10 flex items-center justify-center border border-magical-gold/20">
            <Wand2 className="text-magical-gold w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase italic">{profile?.display_name}</h1>
              <span className="md:hidden px-2 py-0.5 bg-magical-gold/10 border border-magical-gold/20 rounded-full text-[8px] font-black text-magical-gold">
                {profile?.loyalty_points || 0} pts
              </span>
            </div>
            <p className="text-[9px] text-white/30 uppercase font-bold tracking-[0.2em]">Miembro de Hogwarts</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-[8px] font-black uppercase tracking-widest text-magical-gold/60">Puntos Totales</p>
            <p className="text-sm font-black text-white">{profile?.loyalty_points || 0} ✨</p>
          </div>
          <Link to="/ajustes" className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
            <SettingsIcon className="w-5 h-5 text-white/40" />
          </Link>
        </div>
      </header>

      {/* MAGICAL ID CARD - ULTRA MINIMALIST */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Shield className="w-4 h-4 text-magical-gold/50" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Identificación Mágica Oficial</h2>
        </div>

        {house ? (
          <div className="relative min-h-[380px] md:aspect-[1.6/1] w-full max-w-2xl mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl group border border-white/10">
            <img src={idBg} className="absolute inset-0 w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-black/20" />
            
            <div className="absolute inset-0 p-6 md:p-14 flex flex-col justify-between z-10 text-white">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter text-magical-gold">Hogwarts</h2>
                  <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.3em] opacity-40">Snacks & Foods Oficial</p>
                </div>
                <img src={logo} className="w-10 md:w-16 grayscale opacity-80" alt="" />
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-16 my-4 md:my-0">
                <div className="w-20 h-20 md:w-36 md:h-36 rounded-2xl md:rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 p-3 md:p-5 shadow-2xl flex items-center justify-center">
                   <img src={house.logo} className="w-full h-full object-contain" alt={house.name} />
                </div>

                <div className="space-y-3 md:space-y-6 text-center md:text-left">
                  <div className="space-y-1">
                    <p className="text-[8px] md:text-[9px] font-bold text-white/40 uppercase tracking-widest">Nombre del Mago</p>
                    <h3 className="text-xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">
                      {profile?.display_name}
                    </h3>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[8px] md:text-[9px] font-bold text-white/40 uppercase tracking-widest">Casa</p>
                    <h4 className={`text-lg md:text-3xl font-black uppercase tracking-widest ${house.text}`}>
                      {house.name}
                    </h4>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-white/10 pt-4 md:pt-6">
                <div className="flex items-center gap-3">
                  <Wand2 className="w-3 h-3 md:w-4 md:h-4 text-magical-gold/40" />
                  <p className="text-[8px] md:text-xs font-bold uppercase tracking-[0.1em] text-white/60">{house.quote}</p>
                </div>
                <div className="flex items-center gap-2 text-white/30">
                  <Hash className="w-2 h-2 md:w-3 md:h-3" />
                  <span className="text-[8px] md:text-[10px] font-black tracking-widest uppercase">ID #{profile?.user_id?.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-16 text-center space-y-6 border-dashed border-2 border-white/5 bg-transparent">
            <Zap className="w-12 h-12 text-white/10 mx-auto" />
            <p className="text-white/40 font-bold uppercase text-xs tracking-widest leading-relaxed">Sin casa asignada. <br /> La ceremonia te espera.</p>
            <Link to="/quiz" className="btn-gold px-10 py-4 inline-flex items-center gap-3 text-sm font-black uppercase">
              Comenzar Ceremonia
            </Link>
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-[2.5rem] p-8 md:p-10 border border-white/5 flex flex-col justify-between space-y-10 relative overflow-hidden">
           <div className="space-y-1 relative z-10">
              <p className="text-[10px] font-black text-magical-gold uppercase tracking-[0.3em]">Méritos Acumulados</p>
              <h4 className="text-6xl font-black tracking-tighter text-white">{profile?.loyalty_points || 0}</h4>
           </div>
           
           {house && (
             <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-2 relative z-10">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Beneficio de Casa Activo</p>
                <p className="text-lg font-black text-white uppercase italic">{house.reward}</p>
             </div>
           )}
           <Star className="absolute -bottom-10 -right-10 w-48 h-48 text-magical-gold/5 rotate-12" />
        </div>

        <div className="bg-white/5 rounded-[2.5rem] p-8 md:p-10 border border-white/5 space-y-8 flex flex-col">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Acciones Mágicas</p>
            {activeSession && (
               <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/60">
                 {activeSession.status.replace(/_/g, ' ')}
               </span>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-10">
            {/* Si está sentado, mostrar mesa arriba */}
            {activeSession?.status === 'seated' && (
              <div className="text-center space-y-1 pb-2">
                <p className="text-4xl font-black text-white italic tracking-tighter">Mesa {activeSession.table_number}</p>
                <p className="text-[10px] text-magical-gold font-black uppercase tracking-widest">Disfruta tu banquete</p>
              </div>
            )}

            <div className="space-y-10">
              {/* Botón de Aventura */}
              <div className="space-y-3 text-center">
                <button 
                  onClick={async () => {
                    audioManager.unlockAudio().catch(() => {})
                    localStorage.setItem('hsf_magic_audio_enabled', 'true')
                    try {
                      if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen().catch(() => {})
                      }
                    } catch (e) {}
                    navigate('/aventura')
                  }}
                  className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase shadow-[0_0_40px_rgba(212,175,55,0.3)] bg-green-600 border-green-500 hover:bg-green-500"
                >
                  <Wand2 className="w-5 h-5" />
                  Iniciar Aventura Mágica
                </button>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-relaxed max-w-[280px] mx-auto italic">
                  Resuelve acertijos en el castillo y gana recompensas
                </p>
              </div>

              {/* Botón de Duelos */}
              <div className="space-y-3 text-center">
                <button 
                  onClick={async () => {
                    audioManager.unlockAudio().catch(() => {})
                    try {
                      if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen().catch(() => {})
                      }
                    } catch (e) {}
                    navigate('/duelos')
                  }}
                  className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase shadow-[0_0_40px_rgba(212,175,55,0.3)]"
                >
                  <Wand2 className="w-5 h-5" />
                  Entrar a Duelos Mágicos
                </button>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-relaxed max-w-[280px] mx-auto italic">
                  Reta a la IA o a otros magos, gana fragmentos y defiende el honor de tu casa.
                </p>
              </div>

              {/* Botón de Registro de Visita */}
              <div className="space-y-3 text-center">
                <button 
                  onClick={async () => {
                    audioManager.unlockAudio().catch(() => {})
                    try {
                      if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen().catch(() => {})
                      }
                    } catch (e) {}
                    navigate('/asistencia')
                  }}
                  className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                >
                  <QrCode className="w-6 h-6" />
                  Registrar Visita Mágica
                </button>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-relaxed max-w-[280px] mx-auto italic">
                  Genera tu código para que un mesero valide tu estancia
                </p>
              </div>
            </div>

            {/* Acciones secundarias según el estado */}
            <div className="pt-2 space-y-4">
              {activeSession?.status === 'seated' && (
                <button 
                  onClick={handleEndVisit}
                  className="w-full text-white/20 hover:text-white/40 text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Terminar Visita
                </button>
              )}

              {activeSession?.status === 'closed_waiting_ticket' && (
                <Link to="/registrar-ticket" className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase bg-magical-gold text-magical-navy">
                  <Star className="w-5 h-5" />
                  Registrar Consumo
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MARAUDER's MAP SECTION */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center gap-2 px-2">
          <Map className="w-5 h-5 text-[#8b5a2b]" />
          <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#8b5a2b]">Mapa del Merodeador</h2>
        </div>

        <div className="relative w-full rounded-[2.5rem] overflow-hidden border-2 border-[#8b5a2b]/30 shadow-2xl bg-[#e6c9a8]">
          {/* Parchment Background */}
          <img src={mapBg} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply" alt="Parchment" />
          
          <div className="relative z-10 p-6 md:p-10 flex flex-col space-y-10">
            <div className="text-center space-y-2">
               <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter text-[#5c3a21]">Juro solemnemente...</h3>
               <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-[#5c3a21]/60">Que mis intenciones no son buenas</p>
            </div>

            {/* Progress Track */}
            <div className="relative py-10">
              {/* Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#5c3a21]/20 -translate-y-1/2 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-[#5c3a21] transition-all duration-1000 ease-out" 
                   style={{ width: `${mapProgressPercentage}%` }}
                 />
              </div>

              {/* Milestones */}
              <div className="relative flex justify-between">
                {MAP_THRESHOLDS.map((milestone, index) => {
                  const isPast = index <= currentMilestoneIndex
                  const isCurrent = index === currentMilestoneIndex
                  return (
                    <div key={index} className="flex flex-col items-center gap-2 relative flex-1 min-w-0">
                      <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all z-10
                        ${isPast ? 'bg-[#5c3a21] border-[#5c3a21] text-[#e6c9a8]' : 'bg-[#e6c9a8] border-[#8b5a2b]/30 text-[#8b5a2b]/50'}
                        ${isCurrent ? 'ring-4 ring-[#8b5a2b]/30 scale-110 shadow-xl' : ''}
                      `}>
                        {isCurrent ? <Footprints className="w-4 h-4 md:w-6 md:h-6 animate-pulse" /> : <span className="text-xs md:text-sm">{milestone.icon}</span>}
                      </div>
                      
                      <div className="text-center px-1">
                        <p className={`text-[7px] md:text-[10px] font-black uppercase tracking-tight md:tracking-widest leading-tight ${isPast ? 'text-[#5c3a21]' : 'text-[#8b5a2b]/50'}`}>
                          {milestone.name}
                        </p>
                        <p className={`text-[6px] md:text-[8px] font-bold mt-0.5 ${isPast ? 'text-[#5c3a21]/60' : 'text-[#8b5a2b]/30'}`}>
                          {milestone.steps} pts
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-[#5c3a21]/5 border border-[#5c3a21]/10 rounded-2xl p-4 flex flex-col items-center text-center mt-12 space-y-2">
               <p className="text-[10px] uppercase font-black tracking-widest text-[#5c3a21]/60 italic">
                 “Grandes banquetes aguardan a quienes recorren el castillo”. Junta 1,200 galeones y elige entre una Hamburguesa Clásica (Poder de Gryffindor) o unos Tacos de Arrachera (Fuerza de Gigante) gratis.
               </p>
               <div className="py-2">
                 <p className="text-[10px] uppercase font-black tracking-widest text-[#5c3a21]/40">Tu Poder Mágico Mensual</p>
                 <p className="text-4xl font-black text-[#5c3a21] italic tracking-tighter">{currentSteps} pts</p>
               </div>
               {nextMilestone && (
                 <p className="text-[9px] font-bold text-[#5c3a21]/50">Te faltan {nextMilestone.steps - currentSteps} puntos para llegar al {nextMilestone.name}</p>
               )}
            </div>
          </div>
        </div>
      </section>

      {/* TICKET HISTORY SECTION */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center gap-2 px-2">
          <Ticket className="w-5 h-5 text-white/40" />
          <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/40">Historial de Consumos</h2>
        </div>
        
        <div className="glass-card overflow-hidden divide-y divide-white/5 border border-white/5">
          {ticketHistory.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-white/30 uppercase font-bold tracking-widest">Aún no hay consumos registrados</p>
            </div>
          ) : (
            ticketHistory.map((ticket) => (
              <div key={ticket.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-white font-bold">{ticket.folio}</span>
                    <span className="text-[10px] text-white/30 uppercase tracking-widest">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xl font-black text-magical-gold">${ticket.amount}</div>
                </div>

                <div className="flex items-center gap-4">
                  {ticket.status === 'pending' && (
                    <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-lg border border-yellow-400/20">
                      <Clock className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">En revisión</span>
                    </div>
                  )}
                  {ticket.status === 'approved' && (
                    <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Aprobado (+{ticket.points_awarded} pts)</span>
                    </div>
                  )}
                  {ticket.status === 'rejected' && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20">
                        <XCircle className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Rechazado</span>
                      </div>
                      {ticket.rejection_reason && (
                        <span className="text-[9px] text-red-400/60 italic max-w-[200px] text-right">
                          "{ticket.rejection_reason}"
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
