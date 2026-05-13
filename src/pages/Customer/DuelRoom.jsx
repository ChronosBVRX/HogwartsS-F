import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import HealthBar from '../../components/duels/HealthBar'
import SpellCard from '../../components/duels/SpellCard'
import DuelArena from '../../components/duels/DuelArena'
import DuelTurnAnnouncement from '../../components/duels/DuelTurnAnnouncement'
import SpellDetailModal from '../../components/duels/SpellDetailModal'
import { SPELLS } from '../../lib/duelSpells'
import audioManager from '../../lib/audioManager'
import { Trophy, Skull, Swords, Repeat, Home, BarChart3, Volume2, Flag } from 'lucide-react'

export default function DuelRoom() {
  const { duelId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  
  const [duel, setDuel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedActions, setSelectedActions] = useState([])
  const [selectedStance, setSelectedStance] = useState('neutral')
  const [detailedSpell, setDetailedSpell] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastEvent, setLastEvent] = useState(null)
  const [resolutionStage, setResolutionStage] = useState('idle') // idle, casting, impact, narrative
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(20)
  const [cooldowns, setCooldowns] = useState({})
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const STANCES = [
    { key: 'neutral', name: 'Neutral', icon: '🪄', desc: 'Sin bonos ni penalizaciones' },
    { key: 'offensive', name: 'Ofensiva', icon: '⚔️', desc: '+4 Daño / +3 Daño recibido' },
    { key: 'defensive', name: 'Defensiva', icon: '🛡️', desc: '+6 Bloqueo / -3 Daño' },
    { key: 'concentrated', name: 'Concentrada', icon: '🧘', desc: '+1 Energía extra al usar Accio' },
    { key: 'cunning', name: 'Astuta', icon: '🧠', desc: 'Bonus táctico si vences la familia' },
    { key: 'desperate', name: 'Desesperada', icon: '🔥', desc: '+6 Daño si tienes < 25 HP / si no, -3 Daño' }
  ]

  // Calculate used AP and Energy
  const usedAP = selectedActions.reduce((sum, s) => sum + (s.cost >= 2 ? 2 : 1), 0)
  const totalEnergyCost = selectedActions.reduce((sum, s) => sum + s.cost, 0)
  
  // Audio state
  const [audioReady, setAudioReady] = useState(audioManager.isUnlocked)
  const [resultAudioPlayed, setResultAudioPlayed] = useState(false)

  // Perspective states
  const isP1 = profile?.user_id === duel?.player_one
  const myHp = isP1 ? duel?.player_one_hp : duel?.player_two_hp
  const rivalHp = isP1 ? duel?.player_two_hp : duel?.player_one_hp
  const myEnergy = isP1 ? duel?.player_one_energy : duel?.player_two_energy
  const myHouse = profile?.house_slug || profile?.house?.slug || 'neutral'
  const rivalHouse = isP1 ? duel?.p2_house : duel?.p1_house
  const rivalName = isP1 ? (duel?.mode === 'ai' ? 'Profesor Snape' : duel?.p2_name) : duel?.p1_name

  const duelFinished = duel?.status === 'finished'
  const iWon = duelFinished && duel?.winner_id === profile?.user_id
  const isDraw = duelFinished && duel?.mode === 'pvp' && !duel?.winner_id && duel?.player_one_hp === duel?.player_two_hp
  const iLost = duelFinished && !iWon && !isDraw

  const fetchDuel = async (retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('hsf_duels')
        .select('*')
        .eq('id', duelId)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        if (retryCount < 3) {
           setTimeout(() => fetchDuel(retryCount + 1), 1000)
           return
        }
        throw new Error('Duelo no encontrado')
      }

      // Safeguard for PvP entry
      if (data.mode === 'pvp' && data.status === 'waiting') {
        navigate(`/duelos/espera/${duelId}`)
        return
      }

      // Fetch names and genders separately
      let p1_name = data.player_one_name || 'Mago 1', p1_house = data.player_one_house || 'neutral', p1_gender = 'male'
      let p2_name = data.player_two_name || 'Mago 2', p2_house = data.player_two_house || 'neutral', p2_gender = 'male'

      const { data: p1 } = await supabase.from('hsf_profiles').select('display_name, house_slug, gender').eq('user_id', data.player_one).maybeSingle()
      if (p1) {
        p1_name = p1.display_name
        p1_house = p1.house_slug
        p1_gender = p1.gender || 'male'
      }

      if (data.player_two) {
        if (data.mode === 'ai') {
          p2_name = 'Profesor Snape'
          p2_house = 'ai'
          p2_gender = 'male'
        } else {
          const { data: p2 } = await supabase.from('hsf_profiles').select('display_name, house_slug, gender').eq('user_id', data.player_two).maybeSingle()
          if (p2) {
            p2_name = p2.display_name
            p2_house = p2.house_slug
            p2_gender = p2.gender || 'male'
          }
        }
      }

      const formattedData = {
        ...data,
        p1_name,
        p1_house,
        p1_gender,
        p2_name,
        p2_house,
        p2_gender
      }
      
      setDuel(formattedData)
      
      // Sync initial cooldowns
      const localIsP1 = profile?.user_id === formattedData.player_one
      const cds = localIsP1 ? formattedData.player_one_cooldowns : formattedData.player_two_cooldowns
      setCooldowns(cds || {})
      
      if (formattedData.status === 'finished') {
        setShowResult(true)
      }
    } catch (error) {
      console.error('Error fetching duel:', error)
    } finally {
      setLoading(false)
    }
  }

  const enableDuelAudio = async () => {
    await audioManager.unlockAudio()
    setAudioReady(true)
    audioManager.playAmbient('duel_hall')
    audioManager.playSfx('ui_button_magic')
  }

  useEffect(() => {
    if (!duelId) return
    fetchDuel()

    audioManager.initAudio()
    const unlockOnFirstTouch = async () => {
      await audioManager.unlockAudio()
      setAudioReady(true)
      audioManager.playAmbient('duel_hall')
      
      // Play instructions on first load
      const hasSeenInstructions = sessionStorage.getItem('hsf_duel_instructions_played')
      if (!hasSeenInstructions) {
        audioManager.playVoice('instructions', { force: true, delayMs: 1000 })
        sessionStorage.setItem('hsf_duel_instructions_played', 'true')
      }
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {})
        }
      } catch (e) {}
    }
    window.addEventListener('pointerdown', unlockOnFirstTouch, { once: true })

    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    } catch (e) {}

    const duelSub = supabase
      .channel(`duel:${duelId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'hsf_duels', 
        filter: `id=eq.${duelId}` 
      }, (payload) => {
        console.log('DUEL UPDATE:', payload.new)
        setDuel(prev => ({ ...prev, ...payload.new }))
        // Sync cooldowns if it's my turn
        if (payload.new.status === 'active') {
          const localIsP1 = profile?.user_id === payload.new.player_one
          const cds = localIsP1 ? payload.new.player_one_cooldowns : payload.new.player_two_cooldowns
          setCooldowns(cds || {})
        }
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
        console.log('DUEL EVENT INSERT:', payload.new)
        console.log('DUEL EVENT PAYLOAD:', payload.new.payload)
        
        setLastEvent(payload.new)
        setResolutionStage('casting')
        
        if (payload.new.payload) {
          const p1_damage = payload.new.payload.p1_damage ?? payload.new.payload.player_one_damage ?? 0
          const p2_damage = payload.new.payload.p2_damage ?? payload.new.payload.player_two_damage ?? 0
          
          const iAmP1 = profile?.user_id === duel?.player_one
          const myDamageTaken = iAmP1 ? p1_damage : p2_damage
          const rivalDamageTaken = iAmP1 ? p2_damage : p1_damage

          if (rivalDamageTaken > 15) {
            audioManager.playVoice('turn_result_super', { cooldownMs: 20000 })
          } else if (myDamageTaken > 10) {
            audioManager.playVoice('turn_result_weak', { cooldownMs: 20000 })
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


  // Timer logic
  useEffect(() => {
    if (duel?.status === 'active' && resolutionStage === 'idle' && !isSubmitting) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    } else {
      setTimeLeft(20)
    }
  }, [duel?.status, resolutionStage, isSubmitting, duel?.turn_number])

  const handleAbandon = async () => {
    if (duelFinished) {
      navigate('/duelos')
      return
    }

    if (!window.confirm('¿Estás seguro de que quieres abandonar el duelo? Perderás automáticamente.')) return

    try {
      setIsSubmitting(true)
      const { error } = await supabase.rpc('hsf_abandon_duel', { p_duel_id: duelId })
      if (error) throw error
      navigate('/duelos')
    } catch (err) {
      console.error('Error abandonando duelo:', err)
      alert('Error al abandonar: ' + err.message)
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!duelFinished) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [duelFinished])

  const handleConfirmStrategy = async () => {
    if (selectedActions.length === 0 || isSubmitting) return
    
    await audioManager.unlockAudio()
    setAudioReady(true)
    
    setIsSubmitting(true)
    audioManager.playSfx('strategy_confirm')
    
    try {
      // Create simplified actions array for the database
      const actionsPayload = selectedActions.map(s => ({ type: 'spell', key: s.key }))

      const { error } = await supabase.rpc('hsf_submit_duel_turn', {
        p_duel_id: duelId,
        p_turn_number: duel.turn_number,
        p_actions: actionsPayload,
        p_stance: selectedStance
      })

      if (error) throw error
      
      // Clear local selection
      setSelectedActions([])
      setSelectedStance('neutral')
      
      audioManager.playVoice('spell_confirmed', { cooldownMs: 15000 })
    } catch (err) {
      console.error('Error submitting strategy:', err)
      alert('Error al enviar estrategia: ' + err.message)
      setIsSubmitting(false)
    }
  }

  const nextTurn = () => {
    setResolutionStage('idle')
    setLastEvent(null)
    setIsSubmitting(false) 
    setSelectedActions([])
    setSelectedStance('neutral')
    setTimeLeft(20)
    audioManager.playSfx('ui_button_magic')

    // Contextual Turn Start Voice
    if (myHp <= 30 || myEnergy <= 1) {
      audioManager.playVoice('turn_start_pressure', { cooldownMs: 15000 })
    } else if (myHp > rivalHp + 20) {
      audioManager.playVoice('turn_start_advantage', { cooldownMs: 20000 })
    } else if (rivalHp > myHp + 20) {
      audioManager.playVoice('turn_start_disadvantage', { cooldownMs: 20000 })
    } else {
      audioManager.playVoice('turn_start_neutral', { cooldownMs: 30000 })
    }
  }

  // Result Audio Effect
  useEffect(() => {
    if (showResult && !resultAudioPlayed) {
      setResultAudioPlayed(true)
      if (iWon) {
        audioManager.playSfx('victory_fanfare')
        audioManager.playVoice('victory', { force: true })
      } else if (iLost) {
        audioManager.playSfx('defeat_dark')
        audioManager.playVoice('defeat', { force: true })
      }
    }
  }, [showResult, iWon, iLost, resultAudioPlayed])

  if (loading) return (
    <div className="min-h-screen bg-magical-navy flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-magical-gold"></div>
    </div>
  )

  if (!duel) return (
    <div className="min-h-screen bg-magical-navy flex flex-col items-center justify-center space-y-4">
      <p className="text-white/40 uppercase font-black tracking-widest">Duelo no encontrado</p>
      <button onClick={() => navigate('/duelos')} className="btn-gold px-8 py-3 uppercase text-xs font-black">Regresar</button>
    </div>
  )

  return (
    <main className="h-screen bg-magical-navy text-white flex flex-col overflow-hidden relative">
      
      {/* Header Info - Ultra Compact */}
      <div className="px-4 py-2 bg-night-blue/80 border-b border-white/5 flex justify-between items-center gap-4">
          <div className="flex-1">
            <HealthBar label="Rival" value={rivalHp} house={duel?.mode === 'ai' ? 'ai' : rivalHouse} compact />
          </div>
          <div className="flex flex-col items-center">
            <div className={`text-xl font-black italic ${timeLeft < 5 ? 'text-impact-red animate-pulse' : 'text-magical-gold'}`}>
               {timeLeft}s
            </div>
            {!duelFinished && (
              <button 
                onClick={handleAbandon}
                className="mt-1 p-1 bg-white/5 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-all flex items-center gap-1"
                title="Abandonar Duelo"
              >
                <Flag className="w-3 h-3" />
                <span className="text-[7px] font-black uppercase">Abandonar</span>
              </button>
            )}
          </div>
          <div className="flex-1">
            <HealthBar label="Tú" value={myHp} house={myHouse} compact />
          </div>
      </div>

      {/* Main Arena Area - Flexible but constrained */}
      <div className="flex-1 min-h-0 relative">
        <DuelArena 
          duel={duel} 
          lastEvent={lastEvent} 
          isResolving={resolutionStage === 'impact' || resolutionStage === 'casting'} 
          player={{ 
            name: profile?.display_name || 'Tú', 
            house: myHouse,
            gender: profile?.gender || 'male'
          }}
          opponent={{ 
            name: rivalName, 
            house: duel?.mode === 'ai' ? 'ai' : rivalHouse,
            gender: isP1 ? duel?.p2_gender : duel?.p1_gender
          }}
          isP1={isP1}
        />
        
        {/* Cinematic Stage Overlays */}
        {resolutionStage === 'narrative' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-magical-navy/90 backdrop-blur-md overflow-y-auto pt-20 pb-12">
            <div className="w-full max-w-xl animate-in fade-in zoom-in duration-300">
              <DuelTurnAnnouncement 
                lastEvent={lastEvent} 
                isP1={isP1} 
                onContinue={nextTurn}
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Strategy Toggle - Mobile Optimization */}
      {!duelFinished && resolutionStage === 'idle' && !isMenuOpen && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="bg-magical-gold text-magical-navy px-8 py-4 rounded-full font-black uppercase italic tracking-widest shadow-[0_0_30px_rgba(212,175,55,0.5)] border-2 border-white/20 flex items-center gap-3 active:scale-95 transition-all"
          >
            <Swords className="w-5 h-5" />
            Preparar Estrategia
          </button>
        </div>
      )}

      {/* Strategic Selection Area - Now Toggleable and Immersive */}
      {!duelFinished && resolutionStage === 'idle' && isMenuOpen && (
        <section className="fixed inset-0 z-50 bg-magical-navy/95 backdrop-blur-2xl p-4 overflow-y-auto animate-in slide-in-from-bottom duration-500">
          <div className="max-w-4xl mx-auto space-y-8 pt-12 pb-24">
            
            {/* Header with Close */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h2 className="text-2xl font-black italic text-white uppercase">Libro de Hechizos</h2>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Prepara tu próximo movimiento</p>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="bg-white/10 p-4 rounded-full hover:bg-white/20 transition-all"
              >
                <Flag className="w-6 h-6 text-magical-gold" />
              </button>
            </div>

            {/* Stance Selector */}
            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-black text-magical-gold uppercase tracking-[0.3em] text-center">Elige tu estilo de combate</p>
              <div className="grid grid-cols-3 gap-3">
                {STANCES.map(s => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setSelectedStance(s.key)
                      audioManager.playSfx('stance_select')
                    }}
                    className={`p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                      selectedStance === s.key 
                        ? 'border-magical-gold bg-magical-gold/10 scale-105 shadow-[0_0_20px_rgba(212,175,55,0.2)]' 
                        : 'border-white/5 bg-white/5 opacity-40 hover:opacity-100'
                    }`}
                  >
                    <span className="text-3xl">{s.icon}</span>
                    <span className="text-[10px] font-black uppercase text-white tracking-tighter">{s.name}</span>
                    <span className="text-[8px] text-white/40 leading-tight text-center line-clamp-2">
                      {s.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar & Confirm - Fixed at Bottom of Menu */}
            <div className="sticky bottom-0 left-0 right-0 pt-4 pb-2 bg-magical-navy">
              <div className="flex justify-between items-center bg-black/60 p-4 rounded-3xl border border-magical-gold/20 shadow-2xl">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${usedAP >= 1 ? 'bg-magical-gold shadow-[0_0_12px_var(--color-magical-gold)]' : 'bg-white/10'}`} />
                    <div className={`w-3 h-3 rounded-full ${usedAP >= 2 ? 'bg-magical-gold shadow-[0_0_12px_var(--color-magical-gold)]' : 'bg-white/10'}`} />
                    <span className="text-[10px] font-black uppercase text-white/40 ml-2">Movimientos</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <ZapIcon className="text-magical-gold w-4 h-4" />
                     <p className="text-2xl font-black italic">{myEnergy - totalEnergyCost} / 5</p>
                     <span className="text-[9px] text-white/30 uppercase font-black tracking-widest ml-1">Energía</span>
                  </div>
                </div>

                <button
                  disabled={selectedActions.length === 0 || isSubmitting}
                  onClick={async () => {
                    await handleConfirmStrategy();
                    setIsMenuOpen(false);
                  }}
                  className={`px-8 py-5 rounded-2xl font-black uppercase italic tracking-widest text-sm transition-all duration-300 flex items-center gap-2 ${
                    selectedActions.length > 0 
                      ? 'bg-magical-gold text-magical-navy shadow-[0_0_30px_rgba(212,175,55,0.4)] scale-105 active:scale-95' 
                      : 'bg-white/5 text-white/20'
                  }`}
                >
                  {isSubmitting ? 'Lanzando...' : '¡Lanzar Hechizos!'}
                  <Swords className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Spell Grid */}
            <div className="space-y-4">
              <p className="text-[10px] text-white/30 font-medium italic text-center">
                Toca una carta para inspeccionarla y agregarla a tu combo.
              </p>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {Object.entries(SPELLS).map(([key, spell]) => {
                  const isSelected = selectedActions.some(a => a.key === key)
                  
                  return (
                    <SpellCard
                      key={key}
                      spell={spell}
                      selected={isSelected}
                      onClick={() => {
                        setDetailedSpell(spell)
                        audioManager.playSfx('ui_card_select')
                      }}
                      disabled={isSubmitting}
                      cooldown={cooldowns[key] || 0}
                      compact
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Spell Detail Modal */}
      {detailedSpell && (
        <SpellDetailModal 
          spell={detailedSpell} 
          onClose={() => setDetailedSpell(null)}
          isSelected={selectedActions.some(a => a.key === detailedSpell.key)}
          canCast={usedAP + (detailedSpell.cost >= 2 ? 2 : 1) <= 2 && (myEnergy - totalEnergyCost) >= detailedSpell.cost && !isSubmitting}
          onCast={() => {
            const isSelected = selectedActions.some(a => a.key === detailedSpell.key)
            if (isSelected) {
              setSelectedActions(prev => prev.filter(a => a.key !== detailedSpell.key))
            } else {
              setSelectedActions(prev => [...prev, detailedSpell])
              audioManager.playSfx('ui_card_select')
            }
            setDetailedSpell(null)
          }}
        />
      )}

      {/* Result Overlay */}
      {showResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-magical-navy/95 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="relative w-full max-w-2xl text-center space-y-8">
              <div className="space-y-4">
                {iWon ? (
                  <h1 className="text-6xl font-black italic text-white uppercase drop-shadow-2xl">¡Victoria!</h1>
                ) : iLost ? (
                  <h1 className="text-6xl font-black italic text-white uppercase drop-shadow-2xl">Derrota</h1>
                ) : (
                  <h1 className="text-6xl font-black italic text-white uppercase drop-shadow-2xl">Empate</h1>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                 <p className="text-text-gray uppercase text-xs font-black tracking-widest mb-4">Fragmentos Obtenidos</p>
                 <div className="flex items-center justify-center gap-4">
                    <img src="/assets/items/shard_magical.png" className="w-12 h-12" alt="Shard" />
                    <span className="text-5xl font-black italic">+{iWon ? '15' : iLost ? '5' : '8'}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => navigate('/duelos')} className="bg-white/10 px-6 py-4 rounded-xl font-black uppercase text-xs">Inicio</button>
                <button onClick={() => navigate('/duelos/retar')} className="bg-magical-gold text-magical-navy px-6 py-4 rounded-xl font-black uppercase text-xs">Nuevo Duelo</button>
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
