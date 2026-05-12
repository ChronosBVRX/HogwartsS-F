import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Trophy, Shield, Star, Crown, ChevronLeft, Wand2, AlertTriangle, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DuelRanking() {
  const [housePoints, setHousePoints] = useState([])
  const [topPlayers, setTopPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [houseError, setHouseError] = useState(null)
  const [playerError, setPlayerError] = useState(null)
  const [debugData, setDebugData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchRanking()
  }, [])

  const fetchRanking = async () => {
    setLoading(true)
    setHouseError(null)
    setPlayerError(null)

    const now = new Date()
    const monthKey = now.toISOString().substring(0, 7) // YYYY-MM
    
    try {
      // 1. Fetch House Points (Diagnostic mode: fetch all then filter)
      const { data: allHousePoints, error: hError } = await supabase
        .from('hsf_duel_house_points')
        .select('*')
      
      if (hError) {
        console.error('Error ranking casas:', hError)
        setHouseError('No se pudo cargar la Copa de las Casas.')
      } else {
        console.log('House Points DB:', allHousePoints)
        setDebugData(allHousePoints || [])
        const currentMonthData = allHousePoints?.filter(p => p.month_key === monthKey) || []
        setHousePoints(currentMonthData)
      }

      // 2. Fetch Player Ranking - Use multi-step fetch to avoid console 400 errors from missing relationships
      const { data: rawPlayers, error: rawError } = await supabase
        .from('hsf_duel_profiles')
        .select('*')
        .order('mmr', { ascending: false })
        .limit(10)
      
      if (rawError) {
        console.error('Error fetching duel profiles:', rawError)
        setPlayerError('No se pudo cargar el ranking de jugadores.')
      } else if (rawPlayers) {
        const playersWithData = await Promise.all(rawPlayers.map(async (p) => {
          const { data: u } = await supabase
            .from('hsf_profiles')
            .select('display_name, house_slug')
            .eq('user_id', p.user_id)
            .maybeSingle()
          return { ...p, user: u }
        }))
        setTopPlayers(playersWithData)
      }
    } catch (err) {
      console.error('General ranking error:', err)
    } finally {
      setLoading(false)
    }
  }

  const houseData = {
    gryffindor: { name: 'Gryffindor', color: 'text-impact-red', icon: '🦁', gradient: 'from-impact-red/20 to-magical-navy' },
    slytherin: { name: 'Slytherin', color: 'text-healing-green', icon: '🐍', gradient: 'from-healing-green/20 to-magical-navy' },
    ravenclaw: { name: 'Ravenclaw', color: 'text-spell-blue', icon: '🦅', gradient: 'from-spell-blue/20 to-magical-navy' },
    hufflepuff: { name: 'Hufflepuff', color: 'text-magical-gold', icon: '🦡', gradient: 'from-magical-gold/20 to-magical-navy' }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-magical-gold/20 border-t-magical-gold rounded-full animate-spin" />
        <p className="text-magical-gold font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">Cargando ranking...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 pb-32 space-y-16 animate-in fade-in duration-1000">
      <header className="relative py-16 flex flex-col items-center text-center space-y-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-magical-gold/10 blur-[80px] rounded-full animate-glow-pulse" />
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="p-6 rounded-[2.5rem] bg-night-blue border border-magical-gold/30 shadow-[0_0_50px_rgba(212,175,55,0.15)] animate-float">
            <Trophy className="w-12 h-12 text-magical-gold" />
          </div>
          <div className="space-y-2">
            <div className="inline-block px-4 py-1 rounded-full bg-magical-gold/10 border border-magical-gold/20 mb-2">
               <p className="text-[10px] font-black text-magical-gold uppercase tracking-[0.5em]">Temporada de la Copa</p>
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase italic drop-shadow-2xl">
              Ranking <span className="text-magical-gold">Supremo</span>
            </h1>
            <p className="text-text-gray font-black uppercase tracking-[0.4em] text-[10px] opacity-60 leading-relaxed">Gloria eterna para los magos más valientes</p>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-16">
        {/* HOUSE RANKING */}
        <div className="space-y-10">
          <div className="flex items-center gap-4 border-b border-white/5 pb-4">
            <Shield className="w-6 h-6 text-magical-gold" />
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Copa de las Casas</h2>
          </div>

          {houseError ? (
            <div className="p-8 rounded-3xl bg-impact-red/5 border border-impact-red/20 text-center space-y-4">
              <AlertTriangle className="w-8 h-8 text-impact-red mx-auto" />
              <p className="text-impact-red text-xs font-black uppercase tracking-widest">{houseError}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff']
                .sort((a, b) => {
                  const ptsA = housePoints.find(p => p.house_slug === a)?.points || 0
                  const ptsB = housePoints.find(p => p.house_slug === b)?.points || 0
                  return ptsB - ptsA
                })
                .map((slug) => {
                  const points = housePoints.find(p => p.house_slug === slug)?.points || 0
                  const data = houseData[slug]
                  const maxPoints = Math.max(...housePoints.map(p => p.points), 100)
                  const pct = (points / maxPoints) * 100

                  return (
                    <div key={slug} className="magic-card p-6 md:p-8 border-white/5 space-y-6 group overflow-hidden relative min-h-[160px] flex flex-col justify-between">
                      <div className={`absolute inset-0 bg-gradient-to-br ${data.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-700`} />
                      
                      <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-black/40 flex items-center justify-center text-2xl md:text-3xl border border-white/5 group-hover:scale-110 transition-transform">
                            {data.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-lg md:text-xl font-black uppercase tracking-tighter ${data.color}`}>{data.name}</span>
                            <span className="text-[9px] font-black text-text-gray uppercase tracking-widest">Puntuación Total</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl md:text-3xl font-black text-white tabular-nums drop-shadow-md">{points}</span>
                          <span className="text-[10px] text-text-gray font-black uppercase ml-1">pts</span>
                        </div>
                      </div>

                      <div className="h-3 bg-black/40 rounded-full overflow-hidden p-[2px] border border-white/5 relative z-10">
                        <div 
                          className={`h-full rounded-full transition-all duration-[1.5s] ease-out bg-gradient-to-r from-magical-navy via-current to-white/20 ${data.color}`}
                          style={{ width: `${pct}%` }}
                        />
                        <div className="scanline" />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* TOP PLAYERS */}
        <div className="space-y-10">
          <div className="flex items-center gap-4 border-b border-white/5 pb-4">
            <Star className="w-6 h-6 text-magical-gold" />
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Los 10 Mejores</h2>
          </div>

          {playerError ? (
            <div className="p-8 rounded-3xl bg-impact-red/5 border border-impact-red/20 text-center space-y-4">
              <AlertTriangle className="w-8 h-8 text-impact-red mx-auto" />
              <p className="text-impact-red text-xs font-black uppercase tracking-widest">{playerError}</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden border-magical-gold/10">
              <div className="divide-y divide-white/5">
                {topPlayers.map((player, i) => (
                  <div key={player.user_id} className="p-6 flex items-center justify-between hover:bg-magical-gold/5 transition-all duration-300 group">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                         <span className={`w-8 text-xl font-black italic ${i < 3 ? 'text-magical-gold scale-125' : 'text-text-gray/40'}`}>
                           {i === 0 ? <Crown className="w-6 h-6" /> : `#${i + 1}`}
                         </span>
                      </div>
                      
                      <div className="flex flex-col">
                        <p className="text-lg font-black text-white uppercase tracking-tight group-hover:text-magical-gold transition-colors">
                          {player.user?.display_name || 'Mago Anónimo'}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${houseData[
                            player.user?.house_slug === 'red' ? 'gryffindor' :
                            player.user?.house_slug === 'green' ? 'slytherin' :
                            player.user?.house_slug === 'blue' ? 'ravenclaw' :
                            player.user?.house_slug === 'yellow' ? 'hufflepuff' :
                            player.user?.house_slug
                          ]?.color.replace('text-', 'bg-') || 'bg-white/20'}`} />
                          <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${houseData[
                            player.user?.house_slug === 'red' ? 'gryffindor' :
                            player.user?.house_slug === 'green' ? 'slytherin' :
                            player.user?.house_slug === 'blue' ? 'ravenclaw' :
                            player.user?.house_slug === 'yellow' ? 'hufflepuff' :
                            player.user?.house_slug
                          ]?.color || 'text-text-gray/40'}`}>
                            {player.user?.house_slug === 'red' ? 'Gryffindor' :
                             player.user?.house_slug === 'green' ? 'Slytherin' :
                             player.user?.house_slug === 'blue' ? 'Ravenclaw' :
                             player.user?.house_slug === 'yellow' ? 'Hufflepuff' :
                             player.user?.house_slug || 'Sin Casa'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-black/20 px-6 py-2 rounded-xl border border-white/5 text-center group-hover:border-magical-gold/30 transition-colors">
                      <p className="text-2xl font-black text-white drop-shadow-md">{player.mmr}</p>
                      <p className="text-[7px] font-black text-text-gray uppercase tracking-widest leading-none">Puntos MMR</p>
                    </div>
                  </div>
                ))}
                
                {topPlayers.length === 0 && (
                  <div className="p-20 text-center flex flex-col items-center gap-4">
                    <Wand2 className="w-12 h-12 text-white/5 animate-pulse" />
                    <p className="text-text-gray/40 uppercase font-black text-[10px] tracking-[0.5em]">Aún no hay magos rankeados</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diagnostic Box - Visible if table is empty or mismatch */}
      {debugData && (
        <div className="bg-magical-gold/5 border border-magical-gold/20 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 text-magical-gold">
            <Info className="w-5 h-5" />
            <h3 className="font-black uppercase text-xs tracking-widest">Panel de Sincronización</h3>
          </div>
          {debugData.length === 0 ? (
            <p className="text-impact-red text-xs font-black uppercase">⚠️ La tabla hsf_duel_house_points está VACÍA en Supabase.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-text-gray text-xs">Registros encontrados en el servidor:</p>
              <div className="flex flex-wrap gap-2">
                {debugData.map((d, i) => (
                  <span key={i} className="bg-white/5 px-3 py-1 rounded-full text-[9px] text-white/40 font-mono">
                    {d.month_key}: {d.house_slug} ({d.points}pts)
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-[9px] text-text-gray opacity-40 italic">
            Si la tabla está vacía tras ejecutar el SQL, asegúrate de que el SQL Editor no devolvió errores.
          </p>
        </div>
      )}

      <div className="pt-10 flex justify-center">
        <button 
          onClick={() => navigate('/duelos')}
          className="group flex items-center gap-3 text-text-gray hover:text-magical-gold transition-all text-xs font-black uppercase tracking-[0.4em]"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
          Regresar al Castillo
        </button>
      </div>
    </div>
  )
}
