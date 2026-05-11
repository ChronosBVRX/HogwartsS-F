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
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 pb-24 flex flex-col space-y-6 animate-in fade-in duration-700">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10">
        <HealthBar label="Tú" value={myHp} house={myHouse} />
        <div className="px-8 text-center">
          <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">VS</div>
          <div className="text-xl font-black text-white italic tracking-tighter uppercase italic">{rivalName}</div>
        </div>
        <HealthBar label="Rival" value={rivalHp} house={duel?.mode === 'ai' ? 'ai' : rivalHouse} />
      </div>

      {/* Main Arena */}
      <DuelArena 
        duel={duel} 
        lastEvent={lastEvent} 
        isResolving={isResolving} 
        player={{ name: profile.display_name, house: myHouse }}
        opponent={{ name: rivalName, house: duel?.mode === 'ai' ? 'ai' : rivalHouse }}
      />

      {/* Controls Area */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <EnergyBar value={myEnergy} />
          <div className="flex items-center gap-3">
             <div className={`px-4 py-2 rounded-2xl border ${timeLeft < 5 ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-magical-gold/10 border-magical-gold text-magical-gold'}`}>
               <span className="text-[8px] font-black uppercase tracking-widest mr-2 opacity-60">Tiempo</span>
               <span className="text-lg font-black tabular-nums">{timeLeft}s</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6">
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

      {/* Result Modal */}
      {showResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60 animate-in fade-in duration-500">
          <div className="glass-card max-w-sm w-full p-10 text-center space-y-8 border-magical-gold/30">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center border-4 ${duel.winner_id === profile.user_id ? 'bg-magical-gold/20 border-magical-gold text-magical-gold' : 'bg-red-500/20 border-red-500 text-red-500'}`}>
              {duel.winner_id === profile.user_id ? <Trophy className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                {duel.winner_id === profile.user_id ? '¡Victoria!' : 'Derrota'}
              </h2>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                {duel.winner_id === profile.user_id 
                  ? 'Has defendido el honor de tu casa con valentía.' 
                  : 'Incluso los mejores magos tienen días difíciles en la arena.'}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex justify-between items-center">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Fragmentos Ganados</span>
              <span className="text-xl font-black text-blue-400">+{duel.winner_id === profile.user_id ? 15 : 5} 💠</span>
            </div>

            <button 
              onClick={() => navigate('/duelos')}
              className="btn-gold w-full py-5 text-sm font-black uppercase"
            >
              Regresar al Castillo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
