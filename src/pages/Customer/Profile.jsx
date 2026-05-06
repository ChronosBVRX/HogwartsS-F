import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Award, QrCode, LogOut, Sparkles, Star, Shield, Zap, Wand2, Hash } from 'lucide-react'

// House assets
import gryffindorLogo from '../../assets/houses/gryffindor.png'
import slytherinLogo from '../../assets/houses/slytherin.png'
import ravenclawLogo from '../../assets/houses/ravenclaw.png'
import hufflepuffLogo from '../../assets/houses/hufflepuff.png'
import idBg from '../../assets/id_bg_minimal.png'
import logo from '../../assets/logo.png'

const HOUSE_CONFIG = {
  red: { name: "Gryffindor", logo: gryffindorLogo, quote: "Valor y Caballerosidad", color: "from-red-500 to-amber-500", text: "text-red-400" },
  green: { name: "Slytherin", logo: slytherinLogo, quote: "Astucia y Ambición", color: "from-emerald-400 to-emerald-700", text: "text-emerald-400" },
  blue: { name: "Ravenclaw", logo: ravenclawLogo, quote: "Inteligencia y Sabiduría", color: "from-blue-400 to-indigo-400", text: "text-blue-400" },
  yellow: { name: "Hufflepuff", logo: hufflepuffLogo, quote: "Lealtad y Paciencia", color: "from-yellow-400 to-orange-400", text: "text-yellow-400" }
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
      {/* Header - Minimalist */}
      <header className="flex justify-between items-center bg-white/5 p-4 md:p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-magical-gold/10 flex items-center justify-center border border-magical-gold/20">
            <Sparkles className="text-magical-gold w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase italic">{profile?.display_name}</h1>
            <p className="text-[9px] text-white/30 uppercase font-bold tracking-[0.2em]">Hogwarts Member</p>
          </div>
        </div>
        <button onClick={signOut} className="text-xs font-bold text-white/30 hover:text-red-400 transition-colors uppercase tracking-widest px-4 py-2 border border-white/5 rounded-xl">
          Logout
        </button>
      </header>

      {/* MAGICAL ID CARD - ULTRA MINIMALIST */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Shield className="w-4 h-4 text-magical-gold/50" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Digital Identification Card</h2>
        </div>

        {house ? (
          <div className="relative aspect-[1.6/1] w-full max-w-2xl mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl group border border-white/10">
            {/* Minimalist Background Image */}
            <img src={idBg} className="absolute inset-0 w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-black/20" />
            
            {/* ID Content - High Contrast */}
            <div className="absolute inset-0 p-10 md:p-14 flex flex-col justify-between z-10 text-white">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-magical-gold">Hogwarts</h2>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40">Snacks & Foods Official</p>
                </div>
                <img src={logo} className="w-12 md:w-16 grayscale opacity-80" alt="" />
              </div>

              <div className="flex items-center gap-10 md:gap-16">
                {/* Clean Photo / Logo Container */}
                <div className="w-24 h-24 md:w-36 md:h-36 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 p-5 shadow-2xl flex items-center justify-center">
                   <img src={house.logo} className="w-full h-full object-contain" alt={house.name} />
                </div>

                {/* Details Section - Minimal & Legible */}
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Name</p>
                    <h3 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">
                      {profile?.display_name}
                    </h3>
                  </div>

                  <div className="flex gap-10">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">House</p>
                      <h4 className={`text-xl md:text-3xl font-black uppercase tracking-widest ${house.text}`}>
                        {house.name}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Strip - Information Only */}
              <div className="flex justify-between items-end border-t border-white/10 pt-6">
                <div className="flex items-center gap-3">
                  <Wand2 className="w-4 h-4 text-magical-gold/40" />
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.1em] text-white/60">{house.quote}</p>
                </div>
                <div className="flex items-center gap-2 text-white/30">
                  <Hash className="w-3 h-3" />
                  <span className="text-[10px] font-black tracking-widest uppercase">{profile?.id?.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-16 text-center space-y-6 border-dashed border-2 border-white/5 bg-transparent">
            <Zap className="w-12 h-12 text-white/10 mx-auto" />
            <p className="text-white/40 font-bold uppercase text-xs tracking-widest leading-relaxed">No house assigned. <br /> The sorting ceremony awaits you.</p>
            <Link to="/quiz" className="btn-gold px-10 py-4 inline-flex items-center gap-3 text-sm font-black uppercase">
              Start Ceremony
            </Link>
          </div>
        )}
      </section>

      {/* Stats & Actions - Clean Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Points - Minimalist */}
        <div className="bg-white/5 rounded-[2.5rem] p-8 md:p-10 border border-white/5 flex flex-col justify-between space-y-10 relative overflow-hidden">
           <div className="space-y-1 relative z-10">
              <p className="text-[10px] font-black text-magical-gold uppercase tracking-[0.3em]">Merits Balance</p>
              <h4 className="text-6xl font-black tracking-tighter text-white">{profile?.loyalty_points || 0}</h4>
           </div>
           
           {house && (
             <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-2 relative z-10">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Active House Perk</p>
                <p className="text-lg font-black text-white uppercase italic">{HOUSE_CONFIG[profile.house_slug].reward}</p>
             </div>
           )}
           <Star className="absolute -bottom-10 -right-10 w-48 h-48 text-magical-gold/5 rotate-12" />
        </div>

        {/* Visit - Functional & Minimalist */}
        <div className="bg-white/5 rounded-[2.5rem] p-8 md:p-10 border border-white/5 space-y-8 flex flex-col">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Current Visit Status</p>
            {activeSession && (
               <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/60">
                 {activeSession.status.replace(/_/g, ' ')}
               </span>
            )}
          </div>

          {!activeSession ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
              <p className="text-sm text-white/40 font-medium italic">Welcome to the grounds.</p>
              <Link to="/asistencia" className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase">
                <QrCode className="w-6 h-6" />
                Request Access
              </Link>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center space-y-6">
              {activeSession.status === 'seated' && (
                <div className="text-center space-y-1">
                  <p className="text-4xl font-black text-white italic tracking-tighter">Table {activeSession.table_number}</p>
                  <p className="text-[10px] text-magical-gold font-black uppercase tracking-widest">Location Confirmed</p>
                </div>
              )}

              {activeSession.status === 'closed_waiting_ticket' && (
                <Link to="/registrar-ticket" className="btn-gold w-full block text-center py-5 text-sm font-black uppercase">
                  Claim Consumption
                </Link>
              )}

              <Link to="/asistencia" className="text-center block text-[9px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-white/40 transition-colors">
                Open QR Scanner
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
