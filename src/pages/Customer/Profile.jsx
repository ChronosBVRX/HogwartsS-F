import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Award, QrCode, LogOut, Sparkles, Star, Shield, Zap, Wand2 } from 'lucide-react'

// House assets
import gryffindorLogo from '../../assets/houses/gryffindor.png'
import slytherinLogo from '../../assets/houses/slytherin.png'
import ravenclawLogo from '../../assets/houses/ravenclaw.png'
import hufflepuffLogo from '../../assets/houses/hufflepuff.png'
import idBg from '../../assets/id_bg.png'
import logo from '../../assets/logo.png'

const HOUSE_CONFIG = {
  red: { name: "Gryffindor", logo: gryffindorLogo, quote: "La valentía es la fuerza que impulsa el alma.", color: "from-red-600 to-amber-600", reward: "Bebida de Mantequilla Gratis" },
  green: { name: "Slytherin", logo: slytherinLogo, quote: "La grandeza nace de la ambición y el ingenio.", color: "from-emerald-600 to-slate-800", reward: "Postre Mágico Gratis" },
  blue: { name: "Ravenclaw", logo: ravenclawLogo, quote: "Una mente ingeniosa es el mayor tesoro del mago.", color: "from-blue-600 to-indigo-900", reward: "Upgrade a Bebida Grande" },
  yellow: { name: "Hufflepuff", logo: hufflepuffLogo, quote: "La lealtad y el esfuerzo son los cimientos de la magia.", color: "from-yellow-500 to-orange-400", reward: "Snack de Bienvenida" }
}

export default function Profile() {
  const { profile, signOut } = useAuth()
  const [activeSession, setActiveSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) fetchActiveSession()
  }, [profile])

  const fetchActiveSession = async () => {
    const { data, error } = await supabase
      .from('hsf_visit_sessions')
      .select('*')
      .in('status', ['qr_generated', 'seated', 'closed_waiting_ticket'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error) setActiveSession(data)
    setLoading(false)
  }

  const house = profile?.house_slug ? HOUSE_CONFIG[profile.house_slug] : null

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-6 pb-20 space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-magical-gold/20 flex items-center justify-center border border-magical-gold/30">
            <Sparkles className="text-magical-gold w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              {profile?.display_name}
            </h1>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-[0.3em]">Mago de Hogwarts</p>
          </div>
        </div>
        <button onClick={signOut} className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* MAGICAL ID CARD */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-magical-gold" />
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Identificación Oficial</h2>
        </div>

        {house ? (
          <div className="relative aspect-[1.6/1] w-full max-w-2xl mx-auto rounded-[30px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] group perspective-1000">
            {/* ID Background Image */}
            <img src={idBg} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
            
            {/* ID Content Overlay */}
            <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-between z-10">
              <div className="flex justify-between items-start">
                <img src={logo} className="w-16 md:w-24 drop-shadow-lg" alt="Hogwarts" />
                <div className="text-right">
                  <p className="text-[8px] md:text-[10px] font-black text-magical-gold uppercase tracking-[0.3em]">Hogwarts School</p>
                  <p className="text-[6px] md:text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">Snacks & Foods Division</p>
                </div>
              </div>

              <div className="flex items-center gap-6 md:gap-10">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-magical-gold/30 relative bg-magical-navy/40 backdrop-blur-md">
                   <img src={house.logo} className="w-full h-full object-contain p-2 animate-pulse" alt={house.name} />
                </div>
                <div className="space-y-2 md:space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-magical-gold uppercase tracking-widest">Nombre del Mago</p>
                    <h3 className="text-xl md:text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-md">
                      {profile?.display_name}
                    </h3>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-magical-gold uppercase tracking-widest">Casa</p>
                    <h3 className={`text-lg md:text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${house.color}`}>
                      {house.name}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-white/10 pt-4 md:pt-6">
                <div className="max-w-[60%]">
                  <p className="text-[8px] md:text-[10px] text-white/60 italic font-medium">"{house.quote}"</p>
                </div>
                <div className="text-right">
                  <div className="bg-magical-gold text-magical-navy px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                    ID #{profile?.id?.slice(0, 8).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
            {/* Holographic Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-30 group-hover:via-white/10 transition-all duration-500 pointer-events-none" />
          </div>
        ) : (
          <div className="glass-card p-12 text-center space-y-6">
            <Wand2 className="w-16 h-16 text-magical-gold/20 mx-auto" />
            <p className="text-white/60">Aún no has sido asignado a una casa. Tu identificación está en blanco.</p>
            <Link to="/quiz" className="btn-gold px-10 py-4 inline-flex items-center gap-3">
              Realizar el Ritual
              <Sparkles className="w-5 h-5" />
            </Link>
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Loyalty & Rewards */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-magical-gold" />
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Méritos y Recompensas</h2>
          </div>
          
          <div className="glass-card p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-black text-magical-gold uppercase tracking-widest mb-1">Puntos Acumulados</p>
                <h4 className="text-4xl font-black">{profile?.loyalty_points || 0}</h4>
              </div>
              <div className="p-4 bg-magical-gold/10 rounded-2xl border border-magical-gold/20">
                <Zap className="text-magical-gold w-8 h-8" />
              </div>
            </div>

            {house && (
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
                <div className="p-3 bg-magical-gold/20 rounded-xl">
                  <Star className="text-magical-gold w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Beneficio por Casa</p>
                  <p className="text-sm font-bold text-white">{house.reward}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visit Management */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-magical-gold" />
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Gestión de Visita</h2>
          </div>

          <div className="glass-card p-8 space-y-6">
            {!activeSession ? (
              <div className="text-center py-6 space-y-6">
                <p className="text-white/40 text-sm">¿Estás disfrutando de un festín en el restaurante?</p>
                <Link to="/asistencia" className="btn-gold w-full flex items-center justify-center gap-3 py-4">
                  <QrCode className="w-6 h-6" />
                  Registrar Asistencia
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-xs font-black text-white/40 uppercase tracking-widest">Estado de Sesión</span>
                  <span className="font-black text-magical-gold uppercase text-sm">
                    {activeSession.status.replace(/_/g, ' ')}
                  </span>
                </div>
                
                {activeSession.status === 'seated' && (
                  <div className="bg-green-500/10 p-5 rounded-2xl border border-green-500/20 text-center">
                    <p className="text-green-400 font-bold">Mesa Asignada: {activeSession.table_number}</p>
                  </div>
                )}

                {activeSession.status === 'closed_waiting_ticket' && (
                  <Link to="/registrar-ticket" className="btn-gold w-full block text-center py-4">
                    Registrar Ticket de Consumo
                  </Link>
                )}

                <Link to="/asistencia" className="text-center block text-xs font-black text-magical-gold uppercase tracking-[0.2em] hover:opacity-80">
                  Ver QR de Asistencia
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
