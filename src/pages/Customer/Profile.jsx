import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Award, QrCode, LogOut, Sparkles, Star, Shield, Zap, Wand2, MapPin, Calendar } from 'lucide-react'

// House assets
import gryffindorLogo from '../../assets/houses/gryffindor.png'
import slytherinLogo from '../../assets/houses/slytherin.png'
import ravenclawLogo from '../../assets/houses/ravenclaw.png'
import hufflepuffLogo from '../../assets/houses/hufflepuff.png'
import idBg from '../../assets/id_bg_clean.png'
import logo from '../../assets/logo.png'

const HOUSE_CONFIG = {
  red: { name: "Gryffindor", logo: gryffindorLogo, quote: "Donde habitan los valientes de corazón.", color: "from-red-600 to-amber-500", reward: "Bebida de Mantequilla Gratis", trait: "Valor y Caballerosidad" },
  green: { name: "Slytherin", logo: slytherinLogo, quote: "Ambición, astucia y determinación.", color: "from-emerald-500 to-emerald-900", reward: "Postre Mágico Gratis", trait: "Astucia y Ambición" },
  blue: { name: "Ravenclaw", logo: ravenclawLogo, quote: "Una mente dispuesta siempre aprenderá.", color: "from-blue-500 to-blue-800", reward: "Upgrade a Bebida Grande", trait: "Inteligencia y Sabiduría" },
  yellow: { name: "Hufflepuff", logo: hufflepuffLogo, quote: "Justos, leales y trabajadores.", color: "from-yellow-400 to-yellow-700", reward: "Snack de Bienvenida", trait: "Lealtad y Paciencia" }
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
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-[0.3em]">Perfil de Estudiante</p>
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
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Credencial de Identificación</h2>
        </div>

        {house ? (
          <div className="relative aspect-[1.6/1] w-full max-w-2xl mx-auto rounded-[30px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.9)] group">
            {/* ID Background Image */}
            <img src={idBg} className="absolute inset-0 w-full h-full object-cover" alt="" />
            
            {/* ID Content Overlay */}
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between z-10 text-white">
              {/* Top Row: School Logo and Title */}
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <img src={logo} className="w-16 md:w-20 drop-shadow-2xl" alt="Hogwarts" />
                <div className="text-right">
                  <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-magical-gold">Hogwarts</h2>
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Snacks & Foods Official ID</p>
                </div>
              </div>

              {/* Middle Row: Photo and Details */}
              <div className="flex items-center gap-8 py-4">
                {/* Photo Placeholder / House Logo */}
                <div className="w-28 h-28 md:w-40 md:h-40 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 p-4 shadow-inner relative group-hover:border-magical-gold/50 transition-all">
                   <img src={house.logo} className="w-full h-full object-contain animate-pulse" alt={house.name} />
                   <div className="absolute -bottom-2 -right-2 bg-magical-gold text-magical-navy p-1.5 rounded-lg shadow-lg">
                     <Award className="w-4 h-4" />
                   </div>
                </div>

                {/* Details Container */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-magical-gold/60">Nombre del Estudiante</span>
                    <h3 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter drop-shadow-2xl">
                      {profile?.display_name}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-magical-gold/60">Casa Oficial</span>
                      <h4 className={`text-lg md:text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${house.color}`}>
                        {house.name}
                      </h4>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-magical-gold/60">Atributo</span>
                      <h4 className="text-xs md:text-sm font-bold text-white/80 uppercase">{house.trait}</h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Quote and ID number */}
              <div className="bg-black/30 backdrop-blur-sm p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Wand2 className="w-4 h-4 text-magical-gold opacity-50" />
                  <p className="text-[9px] md:text-xs italic font-medium text-white/70">"{house.quote}"</p>
                </div>
                <div className="bg-magical-gold/90 text-magical-navy px-3 py-1 rounded-lg text-[9px] md:text-xs font-black tracking-widest shadow-lg">
                  #{profile?.id?.slice(0, 8).toUpperCase()}
                </div>
              </div>
            </div>
            
            {/* Interactive Effects */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          </div>
        ) : (
          <div className="glass-card p-12 text-center space-y-6">
            <Zap className="w-16 h-16 text-magical-gold/20 mx-auto" />
            <p className="text-white/60 font-medium">Aún no has sido asignado a una casa en el Gran Comedor.</p>
            <Link to="/quiz" className="btn-gold px-12 py-5 inline-flex items-center gap-3 text-lg">
              Comenzar Ceremonia
              <Sparkles className="w-6 h-6" />
            </Link>
          </div>
        )}
      </section>

      {/* Grid of Sections */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Loyalty Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-magical-gold" />
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Puntos de Casa</h2>
          </div>
          
          <div className="glass-card p-8 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-magical-gold/5 blur-3xl -mr-10 -mt-10" />
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-black text-magical-gold uppercase tracking-[0.2em] mb-1">Galeones Acumulados</p>
                <h4 className="text-5xl font-black tracking-tighter">{profile?.loyalty_points || 0}</h4>
              </div>
              <div className="p-5 bg-magical-gold/10 rounded-3xl border border-magical-gold/20 shadow-lg">
                <Star className="text-magical-gold w-10 h-10 fill-magical-gold/20" />
              </div>
            </div>

            {house && (
              <div className="p-6 bg-gradient-to-br from-white/10 to-transparent rounded-[24px] border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-magical-gold" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-magical-gold">Tu Recompensa Actual</span>
                </div>
                <p className="text-xl font-black text-white">{house.reward}</p>
                <p className="text-[10px] text-white/40 uppercase font-bold">Muestra tu credencial al mesero para canjear.</p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance & Visit Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-magical-gold" />
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Gestión de Visita</h2>
          </div>

          <div className="glass-card p-8 flex flex-col justify-between h-full space-y-8">
            {!activeSession ? (
              <div className="text-center py-10 space-y-8">
                <div className="space-y-2">
                  <p className="text-white/60 text-lg font-medium italic">¿Ya llegaste a Hogwarts?</p>
                  <p className="text-xs text-white/30 uppercase tracking-widest">Regístrate para asignar tu mesa</p>
                </div>
                <Link to="/asistencia" className="btn-gold w-full flex items-center justify-center gap-4 py-5 text-lg">
                  <QrCode className="w-7 h-7" />
                  Obtener Pase de Entrada
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Estado Actual</span>
                    <span className="px-3 py-1 bg-magical-gold/20 text-magical-gold rounded-full text-[10px] font-black uppercase tracking-widest border border-magical-gold/30">
                      {activeSession.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  {activeSession.status === 'seated' && (
                    <div className="text-center space-y-2">
                      <p className="text-3xl font-black text-white">Mesa {activeSession.table_number}</p>
                      <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Ubicación Confirmada</p>
                    </div>
                  )}

                  {activeSession.status === 'closed_waiting_ticket' && (
                    <Link to="/registrar-ticket" className="btn-gold w-full block text-center py-5 text-lg">
                      Registrar Ticket
                    </Link>
                  )}
                </div>

                <Link to="/asistencia" className="flex items-center justify-center gap-2 text-xs font-black text-white/40 uppercase tracking-[0.3em] hover:text-magical-gold transition-colors">
                  <QrCode className="w-4 h-4" />
                  Ver mi Código QR
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
