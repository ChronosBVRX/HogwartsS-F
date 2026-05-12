import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import HealthBar from '../../components/duels/HealthBar'
import SpellCard from '../../components/duels/SpellCard'
import DuelArena from '../../components/duels/DuelArena'
import DuelTurnAnnouncement from '../../components/duels/DuelTurnAnnouncement'
import { SPELLS } from '../../lib/duelSpells'
import audioManager from '../../lib/audioManager'
import { Trophy, Skull, Swords, Repeat, Home, BarChart3, Volume2 } from 'lucide-react'

export default function DuelRoom() {
  const { duelId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  
  const [duel, setDuel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSpell, setSelectedSpell] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastEvent, setLastEvent] = useState(null)
  const [resolutionStage, setResolutionStage] = useState('idle') // idle, casting, impact, narrative
  const [showResult, setShowResult] = useState(false)
  
  // Audio state
  const [audioReady, setAudioReady] = useState(audioManager.isUnlocked)
  const [resultAudioPlayed, setResultAudioPlayed] = useState(false)

  // Perspective states
  const isP1 = profile?.user_id === duel?.player_one
  const myHp = isP1 ? duel?.player_one_hp : duel?.player_two_hp
  const rivalHp = isP1 ? duel?.player_two_hp : duel?.player_one_hp
  const myEnergy = isP1 ? duel?.player_one_energy : duel?.player_two_energy
  const myHouse = profile?.house || 'neutral'
  const rivalHouse = isP1 ? duel?.player_two_house : duel?.player_one_house
  const rivalName = isP1 ? (duel?.mode === 'ai' ? 'Profesor Snape' : duel?.p2_name) : duel?.p1_name

  const duelFinished = duel?.status === 'finished'
  const iWon = duelFinished && duel?.winner_id === profile?.user_id
  const isDraw = duelFinished && duel?.mode === 'pvp' && !duel?.winner_id && duel?.player_one_hp === duel?.player_two_hp
  const iLost = duelFinished && !iWon && !isDraw

  const fetchDuel = async () => {
    const { data, error } = await supabase
      .from('hsf_duels')
      .select(`
        *,
        p1_profile:hsf_profiles!player_one(display_name, house),
        p2_profile:hsf_profiles!player_two(display_name, house)
      `)
      .eq('id', duelId)
      .single()

    if (error) {
      console.error('Error fetching duel:', error)
      return
    }

    const formattedData = {
      ...data,
      p1_name: data.p1_profile?.display_name,
      p1_house: data.p1_profile?.house,
      p2_name: data.p2_profile?.display_name,
      p2_house: data.p2_profile?.house
    }
    
    setDuel(formattedData)
    if (formattedData.status === 'finished') {
      setShowResult(true)
    }
    setLoading(false)
  }

  const enableDuelAudio = async () => {
    await audioManager.unlockAudio()
    setAudioReady(true)
    audioManager.playAmbient('duel_hall')
    audioManager.playSfx('ui_button_magic')
  }

  useEffect(() => {
    fetchDuel()

    audioManager.initAudio()
    const unlockOnFirstTouch = async () => {
      await audioManager.unlockAudio()
      setAudioReady(true)
      audioManager.playAmbient('duel_hall')
      // Try fullscreen on first touch as fallback
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {})
        }
      } catch (e) {}
    }
    window.addEventListener('pointerdown', unlockOnFirstTouch, { once: true })

    // Auto-try fullscreen on mount
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    } catch (e) {}

    // Listen for real-time changes in the duel
    const duelSub = supabase
      .channel(`duel:${duelId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'hsf_duels', 
        filter: `id=eq.${duelId}` 
      }, (payload) => {
        setDuel(prev => ({ ...prev, ...payload.new }))
        if (payload.new.status === 'finished') {
          setShowResult(true)
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'hsf_duel_events',
        filter: `duel_id=eq.${duelId}`
      }, (payload) => {
        setLastEvent(payload.new)
        setResolutionStage('casting')
        
        // Character reactions to duel events
        if (payload.new.payload) {
          const { p1_damage = 0, p2_damage = 0 } = payload.new.payload
          const iAmP1 = profile.user_id === duel?.player_one
          const myDamage = iAmP1 ? p1_damage : p2_damage
          const rivalDamage = iAmP1 ? p2_damage : p1_damage

          if (rivalDamage > 15) {
            audioManager.playVoice('harry_cheer_advantage', { cooldownMs: 20000 })
          } else if (myDamage > 10) {
            audioManager.playVoice('snape_mock_bad_move', { cooldownMs: 20000 })
          } else if (rivalDamage > 0) {
            audioManager.playVoice('harry_cheer_good_move', { cooldownMs: 15000 })
          }
        }

        setTimeout(() => setResolutionStage('impact'), 1000)
        setTimeout(() => setResolutionStage('narrative'), 2500)
      })
      .subscribe()

    return () => {
      window.removeEventListener('pointerdown', unlockOnFirstTouch)
      supabase.removeChannel(duelSub)
      audioManager.stopAmbient()
    }
  }, [duelId])

  // End of game audio
  useEffect(() => {
    if (!duelFinished || resultAudioPlayed || !audioReady) return

    if (iWon) {
      audioManager.playSfx('victory_fanfare')
      audioManager.playVoice('victory', { force: true })
    } else if (iLost) {
      audioManager.playSfx('defeat_dark')
      audioManager.playVoice('defeat', { force: true })
    } else {
      audioManager.playSfx('ui_reward')
    }

    setResultAudioPlayed(true)
  }, [duelFinished, iWon, iLost, isDraw, audioReady, resultAudioPlayed])

  const handleSpellSubmit = async () => {
    if (!selectedSpell || isSubmitting) return
    
    await audioManager.unlockAudio()
    setAudioReady(true)
    
    setIsSubmitting(true)
    audioManager.playSfx('ui_card_confirm')

    const { error } = await supabase.rpc('hsf_submit_duel_turn', {
      p_duel_id: duelId,
      p_spell_key: selectedSpell,
      p_turn_number: duel.turn_number
    })

    if (error) {
      console.error('Error submitting turn:', error)
      alert(error.message)
    } else {
      setSelectedSpell(null)
    }
    setIsSubmitting(false)
  }

  const nextTurn = () => {
    setResolutionStage('idle')
    setLastEvent(null)
    audioManager.playSfx('ui_button_magic')
  }

  if (loading) return (
    <div className="min-h-screen bg-magical-navy flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-magical-gold"></div>
    </div>
  )

  return (
    <main className="min-h-screen bg-magical-navy text-white pb-20 relative overflow-hidden">
      
      {/* Header Info - Premium Stat Bar */}
      <div className="max-w-7xl mx-auto px-4 pt-4 md:pt-8 space-y-6">
        <div className="flex justify-between items-center bg-night-blue/60 backdrop-blur-xl p-3 md:p-6 rounded-2xl md:rounded-[2rem] border border-magical-gold/20 shadow-2xl">
          <div className="flex-1 min-w-0">
            <HealthBar label="Rival" value={rivalHp} house={duel?.mode === 'ai' ? 'ai' : rivalHouse} />
          </div>
          
          <div className="px-4 md:px-10 flex flex-col items-center">
            <div className="text-[7px] md:text-[10px] font-black text-magical-gold/40 uppercase tracking-[0.4em] mb-1">Duelo</div>
            <p className="text-magical-gold text-xs md:text-sm font-black uppercase italic tracking-widest leading-none mb-2">
              Turno {duel?.turn_number || 1} / 12
            </p>
            <div className="text-xs md:text-xl font-black text-white italic tracking-tighter uppercase">VS</div>
          </div>

          <div className="flex-1 min-w-0">
            <HealthBar label="Tu Vida" value={myHp} house={myHouse} />
          </div>
        </div>

        {/* Arena Layer */}
        <DuelArena 
          duel={duel} 
          lastEvent={lastEvent} 
          isResolving={resolutionStage === 'impact' || resolutionStage === 'casting'} 
          player={{ name: profile.display_name, house: myHouse }}
          opponent={{ name: rivalName, house: duel?.mode === 'ai' ? 'ai' : rivalHouse }}
          isP1={isP1}
        />
        
        {/* Waiting Overlay */}
        {duel.status === 'active' && resolutionStage === 'idle' && (
          <section className="bg-night-blue/40 backdrop-blur-lg p-6 md:p-10 rounded-[2.5rem] border border-white/5 shadow-inner">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-magical-gold text-xs md:text-sm font-black uppercase tracking-[0.3em] mb-2">Tus Hechizos</h2>
                <div className="flex items-center gap-3">
                   <ZapIcon className="text-magical-gold w-5 h-5" />
                   <p className="text-xl md:text-3xl font-black italic tracking-tighter">{myEnergy} / 5</p>
                </div>
              </div>
              <button
                disabled={!selectedSpell || isSubmitting}
                onClick={handleSpellSubmit}
                className={`px-8 md:px-12 py-3 md:py-5 rounded-2xl font-black uppercase italic tracking-widest transition-all duration-300 ${
                  selectedSpell 
                    ? 'bg-magical-gold text-magical-navy shadow-[0_10px_30px_rgba(212,175,55,0.4)] scale-105' 
                    : 'bg-white/5 text-white/20'
                }`}
              >
                {isSubmitting ? 'Lanzando...' : '¡Lanzar Hechizo!'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6">
              {Object.entries(SPELLS).map(([key, spell]) => (
                <SpellCard
                  key={key}
                  spell={spell}
                  selected={selectedSpell === key}
                  onClick={() => setSelectedSpell(key)}
                  disabled={myEnergy < spell.cost || isSubmitting}
                />
              ))}
            </div>
          </section>
        )}

        {resolutionStage === 'narrative' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-magical-navy/80 backdrop-blur-md">
            <div className="w-full max-w-xl">
              <DuelTurnAnnouncement 
                lastEvent={lastEvent} 
                isP1={isP1} 
                onContinue={nextTurn}
              />
            </div>
          </div>
        )}
      </div>

      {/* Cinematic End Game Overlay */}
      {showResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-hidden">
           <div className="absolute inset-0 bg-magical-navy/95 backdrop-blur-3xl" />
           
           <div className="relative w-full max-w-2xl text-center space-y-12 animate-in fade-in zoom-in duration-1000">
              
              {/* Animated Glow Backdrops */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full blur-[100px] md:blur-[160px] opacity-20 ${
                iWon ? 'bg-healing-green' : iLost ? 'bg-impact-red' : 'bg-magical-gold'
              }`} />

              <div className="space-y-6 relative z-10">
                {iWon ? (
                  <>
                    <div className="inline-flex p-6 md:p-8 rounded-full bg-healing-green/10 border border-healing-green/30 mb-8 animate-bounce-slow">
                      <Trophy className="w-16 md:w-24 h-16 md:h-24 text-healing-green drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase drop-shadow-2xl">¡Victoria!</h1>
                    <p className="text-healing-green text-sm md:text-xl font-bold tracking-[0.3em] uppercase">Has dominado el duelo mágico</p>
                  </>
                ) : iLost ? (
                  <>
                    <div className="inline-flex p-6 md:p-8 rounded-full bg-impact-red/10 border border-impact-red/30 mb-8">
                      <Skull className="w-16 md:w-24 h-16 md:h-24 text-impact-red drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase drop-shadow-2xl">Derrota</h1>
                    <p className="text-impact-red text-sm md:text-xl font-bold tracking-[0.3em] uppercase">El rival ha sido superior esta vez</p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex p-6 md:p-8 rounded-full bg-magical-gold/10 border border-magical-gold/30 mb-8">
                      <Repeat className="w-16 md:w-24 h-16 md:h-24 text-magical-gold" />
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase tracking-tighter">Empate</h1>
                    <p className="text-magical-gold text-sm md:text-xl font-bold tracking-[0.3em] uppercase">Ambos magos resistieron</p>
                  </>
                )}
              </div>

              {/* Rewards Summary */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4 relative z-10">
                 <p className="text-text-gray uppercase text-[10px] md:text-xs font-black tracking-widest">Recompensa Obtenida</p>
                 <div className="flex items-center justify-center gap-4">
                    <img src="/assets/items/shard_magical.webp" className="w-10 md:w-16 h-10 md:h-16 drop-shadow-2xl" alt="Shard" />
                    <span className="text-4xl md:text-6xl font-black italic tracking-tighter">
                       +{iWon ? '15' : iLost ? '5' : '8'}
                    </span>
                    <span className="text-magical-gold font-black uppercase text-xs md:text-sm tracking-widest">Fragmentos</span>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                <button
                  onClick={() => navigate('/duels')}
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all text-xs"
                >
                  <Home className="w-4 h-4" /> Inicio
                </button>
                <button
                  onClick={() => navigate('/duels/ranking')}
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all text-xs"
                >
                  <BarChart3 className="w-4 h-4" /> Ranking
                </button>
                <button
                  onClick={() => navigate('/duels/lobby')}
                  className="flex items-center justify-center gap-2 bg-magical-gold text-magical-navy px-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl text-xs"
                >
                  <Swords className="w-4 h-4" /> Nuevo Duelo
                </button>
              </div>

           </div>
        </div>
      )}
    </main>
  )
}

function ZapIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}
