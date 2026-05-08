import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Award, QrCode, LogOut, Sparkles, Star, Shield, Zap, Wand2, Hash, Settings as SettingsIcon, Map, Footprints } from 'lucide-react'

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
  { steps: 100, name: "Gran Comedor", icon: "🍽️" },
  { steps: 300, name: "Pasillos y Aulas", icon: "📜" },
  { steps: 600, name: "Cabaña de Hagrid", icon: "🛖" },
  { steps: 1000, name: "Bosque Prohibido", icon: "🌲" },
  { steps: 1500, name: "Sala de Menesteres", icon: "✨" }
]


const HOUSE_CONFIG = {
  red: { name: "Gryffindor", logo: gryffindorLogo, quote: "Valor y Caballerosidad", color: "from-red-500 to-amber-500", text: "text-red-400", reward: "Bebida de Mantequilla Gratis" },
  green: { name: "Slytherin", logo: slytherinLogo, quote: "Astucia y Ambición", color: "from-emerald-400 to-emerald-700", text: "text-emerald-400", reward: "Postre Mágico Gratis" },
  blue: { name: "Ravenclaw", logo: ravenclawLogo, quote: "Inteligencia y Sabiduría", color: "from-blue-400 to-indigo-400", text: "text-blue-400", reward: "Upgrade a Bebida Grande" },
  yellow: { name: "Hufflepuff", logo: hufflepuffLogo, quote: "Lealtad y Paciencia", color: "from-yellow-400 to-orange-400", text: "text-yellow-400", reward: "Snack de Bienvenida" }
}

export default function Profile() {
  const { profile, signOut } = useAuth()
  const [activeSession, setActiveSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchActiveSession = async () => {
    if (!profile) return
    const { data, error } = await supabase
      .from('hsf_visit_sessions')
      .select('*')
      .in('status', ['qr_generated', 'seated', 'closed_waiting_ticket', 'ticket_submitted'])
      .eq('customer_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error) setActiveSession(data)
    setLoading(false)
  }

  useEffect(() => {
    if (profile) {
      fetchActiveSession()

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

      return () => supabase.removeChannel(channel)
    }
  }, [profile])

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

  const house = profile?.house_slug ? HOUSE_CONFIG[profile.house_slug] : null

  if (loading && !activeSession) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-magical-gold font-black uppercase tracking-widest text-xs">
          Cargando pergaminos...
        </div>
      </div>
    )
  }

  const currentSteps = profile?.pasos_mapa_mes || 0
  
  // Calculate map progress
  const nextMilestoneIndex = MAP_THRESHOLDS.findIndex(m => m.steps > currentSteps)
  const currentMilestoneIndex = nextMilestoneIndex === -1 ? MAP_THRESHOLDS.length - 1 : nextMilestoneIndex - 1
  const currentMilestone = MAP_THRESHOLDS[currentMilestoneIndex]
  const nextMilestone = nextMilestoneIndex === -1 ? null : MAP_THRESHOLDS[nextMilestoneIndex]
  
  let progressPercentage = 100
  if (nextMilestone) {
    const range = nextMilestone.steps - currentMilestone.steps
    const progressIntoRange = currentSteps - currentMilestone.steps
    progressPercentage = (progressIntoRange / range) * 100
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 pb-24 space-y-8 md:space-y-12 animate-in fade-in duration-700 overflow-x-hidden">
      {/* Header - Minimalist */}
      <header className="flex justify-between items-center bg-white/5 p-4 md:p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-magical-gold/10 flex items-center justify-center border border-magical-gold/20">
            <Sparkles className="text-magical-gold w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase italic">{profile?.display_name}</h1>
            <p className="text-[9px] text-white/30 uppercase font-bold tracking-[0.2em]">Miembro de Hogwarts</p>
          </div>
        </div>
        <div className="flex gap-2">
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
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Estado de Visita</p>
            {activeSession && (
               <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/60">
                 {activeSession.status.replace(/_/g, ' ')}
               </span>
            )}
          </div>

          {!activeSession || activeSession.status === 'ticket_submitted' ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
              <p className="text-sm text-white/40 font-medium italic">Bienvenido a los terrenos de la escuela.</p>
              <Link to="/asistencia" className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase">
                <QrCode className="w-6 h-6" />
                Obtener Pase de Entrada
              </Link>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center space-y-6">
              {activeSession.status === 'seated' && (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <p className="text-4xl font-black text-white italic tracking-tighter">Mesa {activeSession.table_number}</p>
                    <p className="text-[10px] text-magical-gold font-black uppercase tracking-widest">Disfruta tu banquete</p>
                  </div>
                  <button 
                    onClick={handleEndVisit}
                    className="w-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Terminar Visita
                  </button>
                </div>
              )}

              {activeSession.status === 'closed_waiting_ticket' && (
                <Link to="/registrar-ticket" className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase">
                  <Star className="w-5 h-5" />
                  Registrar Consumo
                </Link>
              )}

              <Link to="/asistencia" className="text-center block text-[9px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-white/40 transition-colors">
                Abrir Escáner QR
              </Link>
            </div>
          )}
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
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#8b5a2b]/20 -translate-y-1/2 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-[#5c3a21] transition-all duration-1000 ease-out" 
                   style={{ width: `${(currentMilestoneIndex / (MAP_THRESHOLDS.length - 1)) * 100}%` }}
                 />
              </div>

              {/* Milestones */}
              <div className="relative flex justify-between">
                {MAP_THRESHOLDS.map((milestone, index) => {
                  const isPast = index <= currentMilestoneIndex
                  const isCurrent = index === currentMilestoneIndex
                  return (
                    <div key={index} className="flex flex-col items-center gap-3 relative">
                      <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all z-10
                        ${isPast ? 'bg-[#5c3a21] border-[#5c3a21] text-[#e6c9a8]' : 'bg-[#e6c9a8] border-[#8b5a2b]/30 text-[#8b5a2b]/50'}
                        ${isCurrent ? 'ring-4 ring-[#8b5a2b]/30 scale-110 shadow-xl' : ''}
                      `}>
                        {isCurrent ? <Footprints className="w-4 h-4 md:w-6 md:h-6 animate-pulse" /> : <span className="text-xs md:text-sm">{milestone.icon}</span>}
                      </div>
                      
                      <div className="absolute top-14 w-24 text-center">
                        <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isPast ? 'text-[#5c3a21]' : 'text-[#8b5a2b]/50'}`}>
                          {milestone.name}
                        </p>
                        <p className={`text-[7px] md:text-[8px] font-bold ${isPast ? 'text-[#5c3a21]/60' : 'text-[#8b5a2b]/30'}`}>
                          {milestone.steps} pasos
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-[#5c3a21]/5 border border-[#5c3a21]/10 rounded-2xl p-4 flex flex-col items-center text-center mt-12">
               <p className="text-[10px] uppercase font-black tracking-widest text-[#5c3a21]/60">Tus pasos este mes</p>
               <p className="text-3xl font-black text-[#5c3a21] italic tracking-tighter">{currentSteps}</p>
               {nextMilestone && (
                 <p className="text-[9px] font-bold text-[#5c3a21]/50 mt-1">Faltan {nextMilestone.steps - currentSteps} pasos para {nextMilestone.name}</p>
               )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
