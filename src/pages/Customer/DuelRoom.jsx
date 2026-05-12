import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { SPELLS } from '../../lib/duelSpells'
import { getSpellResult, getAvailableHand } from '../../lib/duelBalance'
import { chooseAiSpell } from '../../lib/duelAi'

import DuelArena from '../../components/duels/DuelArena'
import HealthBar from '../../components/duels/HealthBar'
import EnergyBar from '../../components/duels/EnergyBar'
import SpellCard from '../../components/duels/SpellCard'
import { Wand2, Shield, Zap, ChevronLeft, Trophy, XCircle } from 'lucide-react'

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
        if (payload.new.status === 'finished') setShowResult(true)
      })
      .on('postgres_changes', { event: 'INSERT', table: 'hsf_duel_events', filter: `duel_id=eq.${duelId}` }, (payload) => {
        setLastEvent(payload.new)
        triggerResolution()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [duelId])

  useEffect(() => {
    if (duel && !isResolving && duel.status === 'active') {
      setAvailableHand(getAvailableHand(duel.turn_number, myEnergy))
      setTimeLeft(20)
    }
  }, [duel?.turn_number, isResolving])

  useEffect(() => {
    if (timeLeft > 0 && !isResolving && duel?.status === 'active') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !selectedSpell && !isResolving) {
      handleSpellSubmit('protego') // Auto-select weak defense
    }
  }, [timeLeft, isResolving])

  const fetchDuel = async () => {
    const { data } = await supabase.from('hsf_duels').select('*').eq('id', duelId).single()
    if (data) {
      setDuel(data)
      setLoading(false)
    }
  }

  const triggerResolution = () => {
    setIsResolving(true)
    setSelectedSpell(null)
    setTimeout(() => setIsResolving(false), 3000)
  }

  const handleSpellSubmit = async (spellKey) => {
    if (isResolving || duel?.status !== 'active') return
    
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
    } else if (data?.status === 'waiting_opponent') {
      // PvP logic: Just wait for Realtime update
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center font-black uppercase tracking-widest text-magical-gold animate-pulse">Entrando a la Arena...</div>

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 pb-32 flex flex-col space-y-8 animate-in fade-in duration-1000">
      {/* Header Info - Premium Stat Bar */}
      <div className="flex justify-between items-center bg-night-blue/60 backdrop-blur-xl p-6 rounded-[2rem] border border-magical-gold/20 shadow-2xl">
        <div className="flex-1">
          <HealthBar label="Tu Vitalidad" value={myHp} house={myHouse} />
        </div>
        
        <div className="px-10 flex flex-col items-center">
          <div className="text-[10px] font-black text-magical-gold/40 uppercase tracking-[0.6em] mb-1">Duelo</div>
          <div className="w-12 h-[1px] bg-magical-gold/20 mb-2" />
          <div className="text-xl font-black text-white italic tracking-tighter uppercase">{rivalName}</div>
        </div>

        <div className="flex-1">
          <HealthBar label="Energía Rival" value={rivalHp} house={duel?.mode === 'ai' ? 'ai' : rivalHouse} />
        </div>
      </div>

      {/* Main Arena Section */}
      <DuelArena 
        duel={duel} 
        lastEvent={lastEvent} 
        isResolving={isResolving} 
        player={{ name: profile.display_name, house: myHouse }}
        opponent={{ name: rivalName, house: duel?.mode === 'ai' ? 'ai' : rivalHouse }}
      />

      {/* Controls & Hand Area */}
      <div className="premium-panel fixed bottom-0 left-0 right-0 p-6 pt-10 z-50 rounded-t-[3rem] border-t border-magical-gold/20">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <EnergyBar value={myEnergy} />
            
            {/* Timer Badge */}
            <div className={`relative px-6 py-3 rounded-2xl border transition-all duration-300 ${timeLeft < 5 ? 'bg-impact-red/20 border-impact-red text-impact-red animate-pulse' : 'bg-night-blue border-magical-gold/40 text-magical-gold'}`}>
               <div className="flex items-center gap-3">
                 <Clock className={`w-4 h-4 ${timeLeft < 5 ? 'animate-spin-slow' : ''}`} />
                 <span className="text-xl font-black tabular-nums">{timeLeft}s</span>
               </div>
               <div className="absolute -top-2 left-4 bg-magical-navy px-2">
                 <span className="text-[7px] font-black uppercase tracking-widest opacity-60">Tiempo</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 md:gap-8 overflow-x-auto pb-4 custom-scrollbar">
            {availableHand.map(spell => (
              <SpellCard 
                key={spell.key}
                spell={spell}
                selected={selectedSpell === spell.key}
                disabled={isResolving || myEnergy < spell.cost || selectedSpell}
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
