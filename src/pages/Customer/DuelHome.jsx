import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Wand2, Trophy, ShoppingBag, BarChart2, Swords, Shield, Zap, Sparkles } from 'lucide-react'
import audioManager from '../../lib/audioManager'
import AudioToggle from '../../components/AudioToggle'

export default function DuelHome() {
  const { profile } = useAuth()
  const [duelProfile, setDuelProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDuelProfile()
    audioManager.initAudio()
    audioManager.playAmbient('castle_night')
    audioManager.playVoice('welcome')
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
    // Unlock audio and request fullscreen on user interaction
    audioManager.unlockAudio().catch(() => {})
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    } catch (e) {}

    const { data, error } = await supabase.rpc('hsf_create_ai_duel')
    if (data) navigate(`/duelos/sala/${data}`)
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 pb-32 space-y-10 animate-in fade-in duration-1000">
      {/* Premium Hero Header */}
      <header className="relative h-72 md:h-96 rounded-[3rem] overflow-hidden flex flex-col items-center justify-center text-center border border-magical-gold/20 shadow-2xl">
        <div className="absolute inset-0 bg-magical-navy">
          <img 
            src="/assets/duels/arenas/home_bg.webp" 
            className="w-full h-full object-cover opacity-60 scale-105" 
            alt="Castle Home" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-magical-navy via-magical-navy/20 to-transparent" />
        </div>
        
        <div className="relative z-20 space-y-4 px-6">
          <div className="inline-block px-4 py-1 rounded-full bg-magical-gold/10 border border-magical-gold/30 backdrop-blur-md mb-2">
            <p className="text-[10px] font-black text-magical-gold uppercase tracking-[0.4em]">Temporada I</p>
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
            Duelos <span className="text-magical-gold">Mágicos</span>
          </h1>
          <p className="text-smoke-white font-bold text-xs md:text-sm tracking-[0.3em] uppercase opacity-60">Reta al destino y defiende tu honor</p>
        </div>

        {/* Decorative particles */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-magical-navy to-transparent z-15" />
      </header>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Victorias', value: duelProfile?.wins || 0, color: 'text-white' },
          { label: 'Rango MMR', value: duelProfile?.mmr || 1000, color: 'text-magical-gold' },
          { label: 'Fragmentos', value: `${duelProfile?.duel_shards || 0} 💠`, color: 'text-spell-blue' },
          { label: 'Duelos', value: duelProfile?.duels_played || 0, color: 'text-smoke-white' }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 text-center space-y-1 group hover:border-magical-gold/40 transition-colors">
            <p className="text-[9px] font-black text-text-gray uppercase tracking-widest">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.color} drop-shadow-sm`}>{stat.value}</p>
            <div className="w-8 h-1 bg-magical-gold/10 mx-auto rounded-full mt-2 group-hover:w-12 group-hover:bg-magical-gold/30 transition-all" />
          </div>
        ))}
      </div>

      {/* Main Actions */}
      <div className="grid md:grid-cols-2 gap-8">
        <button 
          onClick={startAiDuel}
          className="group relative h-80 rounded-[2.5rem] overflow-hidden border border-magical-gold/20 transition-all duration-500 hover:scale-[1.02] hover:border-magical-gold shadow-xl"
        >
          <div className="absolute inset-0 bg-magical-navy">
            <img 
              src="/assets/duels/arenas/arena_great_hall_mobile.webp" 
              className="w-full h-full object-cover opacity-30 group-hover:scale-110 group-hover:opacity-50 transition-all duration-1000" 
              alt="AI Training" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-magical-navy via-transparent to-transparent" />
          </div>
          
          <div className="absolute inset-0 p-10 flex flex-col justify-end items-start text-left space-y-4 z-20">
            <div className="p-5 rounded-2xl bg-magical-gold text-magical-navy shadow-2xl group-hover:rotate-12 transition-transform">
              <Swords className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Entrenamiento IA</h3>
              <p className="text-[10px] text-text-gray font-black uppercase tracking-widest leading-relaxed">Perfecciona tus hechizos contra el Rival Encantado</p>
            </div>
          </div>
        </button>

        <Link 
          to="/duelos/retar"
          className="group relative h-80 rounded-[2.5rem] overflow-hidden border border-spell-blue/20 transition-all duration-500 hover:scale-[1.02] hover:border-spell-blue shadow-xl"
        >
          <div className="absolute inset-0 bg-magical-navy">
            <div className="absolute inset-0 bg-gradient-to-tr from-spell-blue/20 to-transparent opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-magical-navy via-transparent to-transparent" />
            {/* Could add a specific image here if available */}
          </div>
          
          <div className="absolute inset-0 p-10 flex flex-col justify-end items-start text-left space-y-4 z-20">
            <div className="p-5 rounded-2xl bg-spell-blue text-white shadow-2xl group-hover:-rotate-12 transition-transform">
              <Wand2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Duelo Real</h3>
              <p className="text-[10px] text-text-gray font-black uppercase tracking-widest leading-relaxed">Reta a otros magos en tiempo real por el honor de tu casa</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Sub Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { icon: <ShoppingBag className="w-6 h-6" />, label: 'Tienda', to: '/duelos/tienda', color: 'text-healing-green', border: 'hover:border-healing-green' },
          { icon: <Trophy className="w-6 h-6" />, label: 'Ranking', to: '/duelos/ranking', color: 'text-magical-gold', border: 'hover:border-magical-gold' },
          { icon: <BarChart2 className="w-6 h-6" />, label: 'Logros', to: '#', color: 'text-control-purple', border: 'hover:border-control-purple' },
          { icon: <Sparkles className="w-6 h-6" />, label: 'Guía', to: '/duelos/hechizos', color: 'text-spell-blue', border: 'hover:border-spell-blue' }
        ].map((item, i) => (
          <Link 
            key={i}
            to={item.to}
            onClick={() => {
              audioManager.unlockAudio().catch(() => {});
              audioManager.playSfx('ui_button_magic');
            }}
            className={`glass-card p-8 flex flex-col items-center gap-4 transition-all duration-300 hover:-translate-y-2 border-b-4 ${item.border}`}
          >
            <div className={`${item.color} drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`}>{item.icon}</div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-gray">{item.label}</span>
          </Link>
        ))}
      </div>
      <AudioToggle />
    </div>
  )
}
