import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  Trophy, Star, Zap, Wand2, Medal, 
  Crown, Sword, Shield, ChevronLeft, 
  Lock, CheckCircle2, Loader2, BarChart2 
} from 'lucide-react'
import audioManager from '../../lib/audioManager'
import AudioToggle from '../../components/AudioToggle'

const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'first_duel',
    name: 'Primer Duelo',
    description: 'Bautizo de fuego en la arena.',
    condition: (p) => p.duels_played >= 1,
    target: 1,
    current: (p) => p.duels_played || 0,
    icon: <Wand2 className="w-6 h-6" />,
    color: 'text-spell-blue'
  },
  {
    id: 'first_win',
    name: 'Primer Triunfo',
    description: 'Tu varita ha dictado sentencia por primera vez.',
    condition: (p) => p.wins >= 1,
    target: 1,
    current: (p) => p.wins || 0,
    icon: <Trophy className="w-6 h-6" />,
    color: 'text-magical-gold'
  },
  {
    id: 'constant_duelist',
    name: 'Duelista Constante',
    description: 'La práctica hace al maestro.',
    condition: (p) => p.duels_played >= 10,
    target: 10,
    current: (p) => p.duels_played || 0,
    icon: <SwordsIcon className="w-6 h-6" />,
    color: 'text-smoke-white'
  },
  {
    id: 'arena_champion',
    name: 'Campeón de la Arena',
    description: 'Diez victorias que forjan una leyenda.',
    condition: (p) => p.wins >= 10,
    target: 10,
    current: (p) => p.wins || 0,
    icon: <Medal className="w-6 h-6" />,
    color: 'text-magical-gold'
  },
  {
    id: 'competitive_mage',
    name: 'Mago Competitivo',
    description: 'Has superado el umbral del aprendiz.',
    condition: (p) => p.mmr >= 1100,
    target: 1100,
    current: (p) => p.mmr || 1000,
    icon: <Zap className="w-6 h-6" />,
    color: 'text-control-purple'
  },
  {
    id: 'rising_legend',
    name: 'Leyenda Emergente',
    description: 'Tu nombre empieza a resonar en los pasillos.',
    condition: (p) => p.mmr >= 1300,
    target: 1300,
    current: (p) => p.mmr || 1000,
    icon: <Crown className="w-6 h-6" />,
    color: 'text-magical-gold'
  },
  {
    id: 'shard_collector',
    name: 'Coleccionista de Fragmentos',
    description: 'Atesoras el poder residual de tus duelos.',
    condition: (p) => p.duel_shards >= 100,
    target: 100,
    current: (p) => p.duel_shards || 0,
    icon: <Star className="w-6 h-6" />,
    color: 'text-spell-blue'
  },
  {
    id: 'survivor',
    name: 'Sobreviviente',
    description: 'La derrota es solo una lección pendiente.',
    condition: (p) => p.losses >= 5,
    target: 5,
    current: (p) => p.losses || 0,
    icon: <Shield className="w-6 h-6" />,
    color: 'text-impact-red'
  }
]

export default function DuelAchievements() {
  const { profile } = useAuth()
  const [duelProfile, setDuelProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDuelProfile()
    audioManager.initAudio()
    audioManager.playAmbient('castle_night')
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

  const unlockedCount = ACHIEVEMENT_DEFINITIONS.filter(ach => 
    duelProfile ? ach.condition(duelProfile) : false
  ).length

  if (loading) {
    return (
      <div className="min-h-screen bg-magical-navy flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-magical-gold animate-spin" />
        <p className="text-magical-gold/40 font-black uppercase tracking-[0.3em] text-[10px]">Consultando registros...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 pb-32 space-y-12 animate-in fade-in duration-1000">
      {/* Header Section */}
      <header className="relative glass-card p-10 md:p-20 rounded-[3rem] border border-magical-gold/20 overflow-hidden flex flex-col items-center text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-magical-gold/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <div className="inline-flex p-5 rounded-[2rem] bg-magical-gold/10 border border-magical-gold/30 text-magical-gold">
            <Medal className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white drop-shadow-2xl">
              Tus <span className="text-magical-gold">Logros</span>
            </h1>
            <p className="text-smoke-white font-bold text-xs md:text-sm tracking-[0.4em] uppercase opacity-40">Salón de la Excelencia Mágica</p>
          </div>

          <div className="flex items-center justify-center gap-8 pt-4">
             <div className="text-center">
                <p className="text-[10px] font-black text-text-gray uppercase tracking-widest mb-1">Desbloqueados</p>
                <p className="text-3xl font-black text-white">{unlockedCount} / {ACHIEVEMENT_DEFINITIONS.length}</p>
             </div>
             <div className="w-[1px] h-10 bg-white/10" />
             <div className="text-center">
                <p className="text-[10px] font-black text-text-gray uppercase tracking-widest mb-1">Puntos MMR</p>
                <p className="text-3xl font-black text-magical-gold">{duelProfile?.mmr || 1000}</p>
             </div>
          </div>
        </div>
      </header>

      {/* Achievements Grid */}
      {!duelProfile ? (
        <div className="glass-card p-16 text-center space-y-6 border-dashed border-white/10">
          <p className="text-white/60 font-medium max-w-md mx-auto leading-relaxed">
            Aún no tienes progreso de duelos. Entra a la arena para comenzar a desbloquear logros y forjar tu legado.
          </p>
          <button 
            onClick={() => navigate('/duelos')}
            className="btn-gold !px-10 !py-4 text-xs font-black uppercase tracking-widest shadow-2xl"
          >
            Ir a Duelos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {ACHIEVEMENT_DEFINITIONS.map((ach) => {
            const isUnlocked = ach.condition(duelProfile)
            const current = ach.current(duelProfile)
            const progress = Math.min(100, (current / ach.target) * 100)

            return (
              <div 
                key={ach.id} 
                className={`magic-card relative p-8 flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 group ${
                  isUnlocked ? 'border-magical-gold shadow-[0_0_40px_rgba(212,175,55,0.1)]' : 'border-white/10 opacity-60 hover:opacity-100'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-6 right-6">
                  {isUnlocked ? (
                    <div className="bg-magical-gold/20 text-magical-gold p-1 rounded-full border border-magical-gold/30">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="bg-white/5 text-white/20 p-1 rounded-full border border-white/10">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className={`p-4 rounded-2xl bg-black/40 border border-white/10 inline-block ${isUnlocked ? ach.color : 'text-white/20'}`}>
                    {ach.icon}
                  </div>

                  <div className="space-y-2">
                    <h3 className={`text-2xl font-black uppercase italic tracking-tighter leading-none ${isUnlocked ? 'text-white' : 'text-white/40'}`}>
                      {ach.name}
                    </h3>
                    <p className="text-[11px] text-text-gray font-medium leading-relaxed italic opacity-60">
                      {ach.description}
                    </p>
                  </div>
                </div>

                <div className="pt-8 space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[8px] font-black text-text-gray uppercase tracking-widest">Progreso</span>
                    <span className={`text-xs font-black tabular-nums ${isUnlocked ? 'text-magical-gold' : 'text-white/40'}`}>
                      {current} / {ach.target}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${isUnlocked ? 'bg-magical-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]' : 'bg-white/10'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="pt-10 flex justify-center">
        <button 
          onClick={() => navigate('/duelos')}
          className="group flex items-center gap-3 text-text-gray hover:text-magical-gold transition-all text-xs font-black uppercase tracking-[0.4em]"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
          Regresar a Duelos
        </button>
      </div>

      <AudioToggle />
    </div>
  )
}

function SwordsIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 18L12 12M12 12L6 6M12 12L18 6M12 12L6 18" />
    </svg>
  )
}
