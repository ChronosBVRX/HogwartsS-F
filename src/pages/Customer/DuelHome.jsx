import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Wand2, Trophy, ShoppingBag, BarChart2, Swords, Shield, Zap, Sparkles } from 'lucide-react'

export default function DuelHome() {
  const { profile } = useAuth()
  const [duelProfile, setDuelProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDuelProfile()
  }, [profile])

  const fetchDuelProfile = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('hsf_duel_profiles')
      .select('*')
      .eq('user_id', profile.user_id)
      .maybeSingle()
    
    if (data) setDuelProfile(data)
    setLoading(false)
  }

  const startAiDuel = async () => {
    const { data, error } = await supabase.rpc('hsf_create_ai_duel')
    if (data) navigate(`/duelos/sala/${data}`)
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 pb-24 space-y-8 animate-in fade-in duration-700">
      <header className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden flex items-center justify-center text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-magical-gold/20 to-magical-navy z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40" />
        
        <div className="relative z-20 space-y-2 px-6">
          <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase italic drop-shadow-2xl">
            Duelos <span className="text-magical-gold">Mágicos</span>
          </h1>
          <p className="text-white/60 font-bold text-xs md:text-sm tracking-[0.3em] uppercase">Reta al destino y defiende tu honor</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl text-center space-y-1">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Victorias</p>
          <p className="text-2xl font-black text-white">{duelProfile?.wins || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl text-center space-y-1">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">MMR</p>
          <p className="text-2xl font-black text-magical-gold">{duelProfile?.mmr || 1000}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl text-center space-y-1">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Fragmentos</p>
          <p className="text-2xl font-black text-blue-400">{duelProfile?.duel_shards || 0} 💠</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl text-center space-y-1">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Duelos</p>
          <p className="text-2xl font-black text-white">{duelProfile?.duels_played || 0}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <button 
          onClick={startAiDuel}
          className="group relative h-64 rounded-[2.5rem] overflow-hidden border border-white/10 transition-all hover:scale-[1.02] hover:border-magical-gold/50"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-magical-navy via-magical-navy/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551269901-5c5e14c25df7?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 group-hover:scale-110 transition-transform duration-1000" />
          
          <div className="absolute inset-0 p-8 flex flex-col justify-end items-center text-center space-y-4 z-20">
            <div className="p-4 rounded-2xl bg-magical-gold text-magical-navy shadow-2xl group-hover:scale-110 transition-transform">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Entrenamiento IA</h3>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Perfecciona tus hechizos contra el Rival Encantado</p>
            </div>
          </div>
        </button>

        <Link 
          to="/duelos/retar"
          className="group relative h-64 rounded-[2.5rem] overflow-hidden border border-white/10 transition-all hover:scale-[1.02] hover:border-blue-500/50"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-magical-navy via-magical-navy/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 group-hover:scale-110 transition-transform duration-1000" />
          
          <div className="absolute inset-0 p-8 flex flex-col justify-end items-center text-center space-y-4 z-20">
            <div className="p-4 rounded-2xl bg-blue-500 text-white shadow-2xl group-hover:scale-110 transition-transform">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Retar a otro Mago</h3>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Duelo en tiempo real contra un oponente humano</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <ShoppingBag />, label: 'Tienda', to: '/duelos/tienda', color: 'text-emerald-400' },
          { icon: <Trophy />, label: 'Ranking', to: '/duelos/ranking', color: 'text-amber-400' },
          { icon: <BarChart2 />, label: 'Logros', to: '#', color: 'text-purple-400' },
          { icon: <Sparkles />, label: 'Hechizos', to: '#', color: 'text-blue-400' }
        ].map((item, i) => (
          <Link 
            key={i}
            to={item.to}
            className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-white/10 transition-all border-b-4 hover:border-b-magical-gold"
          >
            <div className={item.color}>{item.icon}</div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
