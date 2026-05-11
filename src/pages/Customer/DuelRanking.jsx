import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Trophy, Shield, Star, Crown, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DuelRanking() {
  const [housePoints, setHousePoints] = useState([])
  const [topPlayers, setTopPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchRanking()
  }, [])

  const fetchRanking = async () => {
    const monthKey = new Date().toISOString().substring(0, 7) // YYYY-MM
    
    const [houseRes, playerRes] = await Promise.all([
      supabase.from('hsf_duel_house_points').select('*').eq('month_key', monthKey).order('points', { ascending: false }),
      supabase.from('hsf_duel_profiles').select('*, user:hsf_profiles(display_name, house_slug)').order('mmr', { ascending: false }).limit(10)
    ])

    if (houseRes.data) setHousePoints(houseRes.data)
    if (playerRes.data) setTopPlayers(playerRes.data)
    setLoading(false)
  }

  const houseData = {
    gryffindor: { name: 'Gryffindor', color: 'text-red-500', icon: '🦁' },
    slytherin: { name: 'Slytherin', color: 'text-green-500', icon: '🐍' },
    ravenclaw: { name: 'Ravenclaw', color: 'text-blue-500', icon: '🦅' },
    hufflepuff: { name: 'Hufflepuff', color: 'text-yellow-500', icon: '🦡' }
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 pb-24 space-y-12 animate-in fade-in duration-700">
      <header className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-4">
          <Crown className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
          Copa de <span className="text-magical-gold">Duelos</span>
        </h1>
        <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Honor y gloria para tu casa este mes</p>
      </header>

      <div className="grid md:grid-cols-2 gap-12">
        {/* HOUSE RANKING */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Shield className="w-5 h-5 text-magical-gold" />
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Puntos por Casa</h2>
          </div>

          <div className="space-y-4">
            {['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'].map((slug) => {
              const points = housePoints.find(p => p.house_slug === slug)?.points || 0
              const data = houseData[slug]
              const maxPoints = Math.max(...housePoints.map(p => p.points), 1)
              const pct = (points / maxPoints) * 100

              return (
                <div key={slug} className="glass-card p-6 border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{data.icon}</span>
                      <span className={`text-lg font-black uppercase tracking-tighter ${data.color}`}>{data.name}</span>
                    </div>
                    <span className="text-xl font-black text-white">{points} pts</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 bg-current ${data.color}`}
                      style={{ width: `${pct}%`, opacity: 0.6 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* TOP PLAYERS */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Trophy className="w-5 h-5 text-magical-gold" />
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Top Magos (MMR)</h2>
          </div>

          <div className="glass-card overflow-hidden border-white/5">
            <div className="divide-y divide-white/5">
              {topPlayers.map((player, i) => (
                <div key={player.user_id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className={`w-6 text-sm font-black ${i < 3 ? 'text-magical-gold' : 'text-white/20'}`}>#{i + 1}</span>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-tighter">{player.user?.display_name || 'Mago Anónimo'}</p>
                      <p className={`text-[8px] font-bold uppercase tracking-widest ${houseData[player.user?.house_slug]?.color || 'text-white/20'}`}>
                        {player.user?.house_slug || 'Sin Casa'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-magical-gold">{player.mmr}</p>
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">MMR</p>
                  </div>
                </div>
              ))}
              {topPlayers.length === 0 && (
                <div className="p-10 text-center text-white/20 uppercase font-black text-[10px] tracking-widest">Aún no hay magos rankeados</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={() => navigate('/duelos')}
        className="flex items-center justify-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
      >
        <ChevronLeft className="w-4 h-4" />
        Regresar
      </button>
    </div>
  )
}
