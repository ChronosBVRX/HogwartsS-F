import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { getAvailableHand } from '../../lib/duelBalance'

import DuelArena from '../../components/duels/DuelArena'
import HealthBar from '../../components/duels/HealthBar'
import EnergyBar from '../../components/duels/EnergyBar'
import SpellCard from '../../components/duels/SpellCard'
import { Clock, Trophy, XCircle } from 'lucide-react'
import audioManager from '../../lib/audioManager'
import DuelTurnAnnouncement from '../../components/duels/DuelTurnAnnouncement'

export default function DuelRoom() {
  const { duelId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [duel, setDuel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSpell, setSelectedSpell] = useState(null)
  const [isResolving, setIsResolving] = useState(false)
  const [lastEvent, setLastEvent] = useState(null)
  const [availableHand, setAvailableHand] = useState([])
  const [timeLeft, setTimeLeft] = useState(20)
  const [showResult, setShowResult] = useState(false)
  const [resolutionStage, setResolutionStage] = useState(null) // null, 'casting', 'impact', 'narrative'

  // Determine if user is P1 or P2
  const isP1 = profile?.user_id === duel?.player_one
  const myHp = isP1 ? duel?.player_one_hp : duel?.player_two_hp
  const rivalHp = isP1 ? duel?.player_two_hp : duel?.player_one_hp
  const myEnergy = isP1 ? duel?.player_one_energy : duel?.player_two_energy
  const myHouse = isP1 ? duel?.player_one_house : duel?.player_two_house
  const rivalHouse = isP1 ? duel?.player_two_house : duel?.player_one_house
  const rivalName = isP1 ? duel?.player_two_name : duel?.player_one_name

  useEffect(() => {
    fetchDuel()
    const channel = supabase
      .channel(`duel_${duelId}`)
      .on('postgres_changes', { event: '*', table: 'hsf_duels', filter: `id=eq.${duelId}` }, (payload) => {
        setDuel(payload.new)
        if (payload.new.status === 'finished') {
          setShowResult(true)
          if (payload.new.winner_id === profile.user_id) {
            audioManager.playSfx('victory_fanfare')
            audioManager.playVoice('victory')
          } else {
            audioManager.playSfx('defeat_dark')
            audioManager.playVoice('defeat')
          }
        }
      })
      .on('postgres_changes', { event: 'INSERT', table: 'hsf_duel_events', filter: `duel_id=eq.${duelId}` }, (payload) => {
        setLastEvent(payload.new)
        
        // Character reactions to duel events
        if (payload.new.payload) {
          const { player_one_damage, player_two_damage } = payload.new.payload
          const iAmP1 = profile.user_id === duel?.player_one
          const myDamage = iAmP1 ? player_one_damage : player_two_damage
          const rivalDamage = iAmP1 ? player_two_damage : player_one_damage

          if (rivalDamage > 15) {
            audioManager.playVoice('harry_cheer_advantage')
          } else if (myDamage > 10) {
            audioManager.playVoice('snape_mock_bad_move')
          } else if (rivalDamage > 0) {
            audioManager.playVoice('harry_cheer_good_move')
          }
        }
        triggerResolution()
      })
      .subscribe()

    audioManager.initAudio()
    audioManager.playAmbient('duel_hall')

    return () => {
      supabase.removeChannel(channel)
      audioManager.stopAmbient()
    }
  }, [duelId])

  useEffect(() => {
    if (duel?.status === 'active' && !isResolving) {
      if (duel.turn_number === 1) {
        audioManager.playVoice('instructions')
      } else {
        audioManager.playVoice('turn_start')
        
        // Dynamic character reactions based on state
        if (myEnergy < 2) {
          audioManager.playVoice('snape_mock_low_energy');
        }
      }
    }
  }, [duel?.turn_number, isResolving])

  useEffect(() => {
    if (duel && !resolutionStage && duel.status === 'active') {
      const hand = getAvailableHand(duel.turn_number, myEnergy)
      setAvailableHand(hand)
      setTimeLeft(20)
    }
  }, [duel?.turn_number, resolutionStage])

  useEffect(() => {
    if (!duel || duel.status !== 'active' || isResolving || selectedSpell) return

    if (timeLeft <= 0) {
      handleSpellSubmit('protego')
      return
    }

    if (timeLeft === 5) {
      audioManager.playSfx('ui_timer_warning')
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, isResolving, duel?.status, selectedSpell])

  const fetchDuel = async () => {
    const { data } = await supabase.from('hsf_duels').select('*').eq('id', duelId).single()
    if (data) {
      setDuel(data)
      setLoading(false)
    }
  }

  const fetchLastEvent = async () => {
    const { data } = await supabase
      .from('hsf_duel_events')
      .select('*')
      .eq('duel_id', duelId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      setLastEvent(data)
      triggerResolution()
    }
  }

  const triggerResolution = () => {
    if (resolutionStage) return;
    
    // Stage 1: Casting (Focus on the magic)
    setResolutionStage('casting')
    setIsResolving(true)

    // Stage 2: Impact (Show damage/animations)
    setTimeout(() => {
      setResolutionStage('impact')
    }, 1500)

    // Stage 3: Narrative (The Pokemon Box)
    setTimeout(() => {
      setResolutionStage('narrative')
    }, 3500)

    // Stage 4: Reset (NOW MANUAL)
    // We removed the automatic timeout here
  }

  const nextTurn = () => {
    setResolutionStage(null)
    setIsResolving(false)
    setSelectedSpell(null)
    audioManager.playSfx('ui_button_magic')
  }

  const handleSpellSubmit = async (spellKey) => {
    if (isResolving || duel?.status !== 'active' || selectedSpell) return
    
    setSelectedSpell(spellKey)

    const { data, error } = await supabase.rpc('hsf_submit_duel_action', {
      p_duel_id: duelId,
      p_spell_key: spellKey,
      p_item_key: null,
      p_used_focus: false
    })

    if (error) {
      alert('Error en el duelo: ' + error.message)
      setSelectedSpell(null)
      return
    }

    console.log('Resultado RPC duelo:', data)

    if (data?.status === 'waiting_opponent') {
      return
    }

    await fetchDuel()
    await fetchLastEvent()
  }


  if (loading) return <div className="flex-1 flex items-center justify-center font-black uppercase tracking-widest text-magical-gold animate-pulse">Entrando a la Arena...</div>

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-2 md:p-8 pb-32 flex flex-col space-y-4 md:space-y-8 animate-in fade-in duration-1000">
      {/* Header Info - Premium Stat Bar */}
      <div className="flex justify-between items-center bg-night-blue/60 backdrop-blur-xl p-3 md:p-6 rounded-2xl md:rounded-[2rem] border border-magical-gold/20 shadow-2xl">
        <div className="flex-1 min-w-0">
          <HealthBar label="Tu Vida" value={myHp} house={myHouse} />
        </div>
        
        <div className="px-4 md:px-10 flex flex-col items-center">
          <div className="text-[7px] md:text-[10px] font-black text-magical-gold/40 uppercase tracking-[0.4em] mb-1">Duelo</div>
          <div className="w-8 md:w-12 h-[1px] bg-magical-gold/20 mb-2" />
          <div className="text-xs md:text-xl font-black text-white italic tracking-tighter uppercase truncate max-w-[80px] md:max-w-none">{rivalName}</div>
        </div>

        <div className="flex-1 min-w-0">
          <HealthBar label="Rival" value={rivalHp} house={duel?.mode === 'ai' ? 'ai' : rivalHouse} />
        </div>
      </div>

      {/* Main Arena Section */}
      <div className="relative">
        <DuelArena 
          duel={duel} 
          lastEvent={lastEvent} 
          isResolving={resolutionStage === 'impact' || resolutionStage === 'casting'} 
          player={{ name: profile.display_name, house: myHouse }}
          opponent={{ name: rivalName, house: duel?.mode === 'ai' ? 'ai' : rivalHouse }}
        />
        
        {/* Waiting Overlay */}
        {selectedSpell && !resolutionStage && (
          <div className="absolute inset-0 bg-magical-navy/60 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-magical-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-magical-gold font-black uppercase italic tracking-widest text-sm">Esperando al oponente...</p>
            </div>
          </div>
        )}
      </div>

      {/* Turn Announcement - Pokémon Style (Overlaying bottom area) */}
      {resolutionStage === 'narrative' && lastEvent && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 md:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-black/20 pointer-events-none">
          <div className="w-full max-w-5xl pointer-events-auto">
            <DuelTurnAnnouncement lastEvent={lastEvent} isP1={isP1} onContinue={nextTurn} />
          </div>
        </div>
      )}

      {/* Controls & Hand Area */}
      <div className="premium-panel fixed bottom-0 left-0 right-0 p-4 md:p-6 pt-6 md:pt-10 z-50 rounded-t-[2rem] md:rounded-t-[3rem] border-t border-magical-gold/20">
        <div className="max-w-5xl mx-auto space-y-4 md:space-y-8">
          <div className="flex justify-between items-center">
            <EnergyBar value={myEnergy} />
            
            {/* Timer Badge */}
            <div className={`relative px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl border transition-all duration-300 ${timeLeft < 5 ? 'bg-impact-red/20 border-impact-red text-impact-red animate-pulse' : 'bg-night-blue border-magical-gold/40 text-magical-gold'}`}>
               <div className="flex items-center gap-2 md:gap-3">
                 <Clock className={`w-3 h-3 md:w-4 md:h-4 ${timeLeft < 5 ? 'animate-spin-slow' : ''}`} />
                 <span className="text-sm md:text-xl font-black tabular-nums">{timeLeft}s</span>
               </div>
               <div className="absolute -top-2 left-3 md:left-4 bg-magical-navy px-1.5 md:px-2">
                 <span className="text-[6px] md:text-[7px] font-black uppercase tracking-widest opacity-60">Tiempo</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-8 overflow-x-auto pb-4 pt-2 custom-scrollbar">
            {availableHand.map((spell, idx) => (
              <SpellCard 
                key={`${spell.key}-${duel?.turn_number}-${idx}`}
                spell={spell}
                selected={selectedSpell === spell.key}
                disabled={resolutionStage || myEnergy < spell.cost || selectedSpell}
                onClick={() => handleSpellSubmit(spell.key)}
              />
            ))}
          </div>
        </div>
      </div>


      {/* Result Modal - Redesigned */}
      {showResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-magical-navy/80 animate-in fade-in zoom-in duration-500">
          <div className="glass-card max-w-md w-full p-12 text-center space-y-10 border-magical-gold/40 shadow-[0_0_100px_rgba(212,175,55,0.2)]">
            {/* Badge Icon */}
            <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center border-4 relative ${duel.winner_id === profile.user_id ? 'bg-magical-gold/10 border-magical-gold text-magical-gold' : 'bg-impact-red/10 border-impact-red text-impact-red'}`}>
              {duel.winner_id === profile.user_id ? (
                <>
                  <Trophy className="w-16 h-16 animate-float" />
                  <div className="absolute inset-0 bg-magical-gold/20 rounded-full animate-ping" />
                </>
              ) : (
                <XCircle className="w-16 h-16" />
              )}
            </div>
            
            <div className="space-y-3">
              <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">
                {duel.winner_id === profile.user_id ? '¡Victoria!' : 'Derrota'}
              </h2>
              <div className="h-1 w-24 bg-magical-gold/30 mx-auto rounded-full" />
              <p className="text-text-gray text-xs font-black uppercase tracking-widest leading-relaxed">
                {duel.winner_id === profile.user_id 
                  ? 'Has defendido el honor de tu casa con valentía incomparable.' 
                  : 'Incluso los magos más poderosos caen. Levántate y vuelve a intentar.'}
              </p>
            </div>

            {/* Rewards Card */}
            <div className="bg-night-blue/60 border border-magical-gold/20 p-6 rounded-2xl flex justify-between items-center group overflow-hidden relative">
              <div className="relative z-10">
                <p className="text-[10px] font-black text-text-gray uppercase tracking-widest text-left">Fragmentos Ganados</p>
                <p className="text-2xl font-black text-white">+{duel.winner_id === profile.user_id ? 15 : 5}</p>
              </div>
              <div className="w-16 h-16 bg-spell-blue/20 rounded-2xl flex items-center justify-center border border-spell-blue/30 relative z-10">
                <span className="text-3xl">💠</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>

            <button 
              onClick={() => navigate('/duelos')}
              className="btn-gold w-full py-6 text-base font-black shadow-[0_10px_30px_rgba(212,175,55,0.3)]"
            >
              Regresar al Castillo
            </button>
          </div>
        </div>
      )}
    </div>

  )
}
