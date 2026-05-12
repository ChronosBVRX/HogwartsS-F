import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Copy, Check, Shield, Zap, ChevronLeft, Loader2, Wand2 } from 'lucide-react'
import audioManager from '../../lib/audioManager'
import { normalizeHouseSlug, HOUSE_META } from '../../lib/houses'

export default function DuelWaitingRoom() {
  const { duelId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  
  const [duel, setDuel] = useState(null)
  const [p1Profile, setP1Profile] = useState(null)
  const [p2Profile, setP2Profile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchDuelData = async () => {
    try {
      const { data, error } = await supabase
        .from('hsf_duels')
        .select('*')
        .eq('id', duelId)
        .single()

      if (error) throw error
      setDuel(data)

      if (data.player_one) {
        const { data: p1 } = await supabase.from('hsf_profiles').select('*').eq('user_id', data.player_one).maybeSingle()
        setP1Profile(p1)
      }
      if (data.player_two) {
        const { data: p2 } = await supabase.from('hsf_profiles').select('*').eq('user_id', data.player_two).maybeSingle()
        setP2Profile(p2)
      }
      
      // If active, navigate to arena
      if (data.status === 'active') {
        navigate(`/duelos/sala/${duelId}`)
      }
    } catch (err) {
      console.error('Error fetching room:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!duelId) return
    fetchDuelData()

    // Realtime subscription
    const sub = supabase
      .channel(`waiting:${duelId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'hsf_duels', 
        filter: `id=eq.${duelId}` 
      }, (payload) => {
        const updated = payload.new
        setDuel(updated)
        
        // Auto-navigate if active
        if (updated.status === 'active') {
          audioManager.playSfx('ui_button_magic')
          navigate(`/duelos/sala/${duelId}`)
        }

        // Re-fetch profiles if player joined
        if (updated.player_two && !p2Profile) {
          fetchDuelData()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [duelId])

  const copyCode = () => {
    if (!duel?.invite_code) return
    navigator.clipboard.writeText(duel.invite_code)
    setCopied(true)
    audioManager.playSfx('ui_card_confirm')
    setTimeout(() => setCopied(false), 2000)
  }

  const setReady = async () => {
    setActionLoading(true)
    audioManager.playSfx('ui_button_magic')
    try {
      const { error } = await supabase.rpc('hsf_set_duel_ready', { p_duel_id: duelId })
      if (error) throw error
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-magical-navy flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-magical-gold animate-spin" />
    </div>
  )

  if (!duel) return (
    <div className="min-h-screen bg-magical-navy flex flex-col items-center justify-center p-6 space-y-4">
      <h2 className="text-white font-black uppercase tracking-widest">Sala no encontrada</h2>
      <button onClick={() => navigate('/duelos')} className="btn-gold px-8 py-3 uppercase text-xs">Regresar</button>
    </div>
  )

  const isP1 = profile?.user_id === duel.player_one
  const isP2 = profile?.user_id === duel.player_two
  const myReady = isP1 ? duel.player_one_ready : (isP2 ? duel.player_two_ready : false)
  const canSetReady = (isP1 || isP2) && !myReady

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-4 md:p-6 pb-24 space-y-8 animate-in fade-in zoom-in duration-500">
      
      {/* Header */}
      <div className="text-center space-y-4 mt-8">
        <div className="inline-flex p-4 rounded-2xl bg-magical-gold/10 border border-magical-gold/20 text-magical-gold mb-2">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
          Sala de <span className="text-magical-gold text-shadow-gold">Espera</span>
        </h1>
        <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Prepara tus hechizos para el combate</p>
      </div>

      {/* Invite Code Section */}
      <div className="glass-card p-6 border-magical-gold/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
           <Wand2 className="w-24 h-24 text-magical-gold" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Código de Invitación</span>
           <div className="flex items-center gap-3">
              <span className="text-5xl md:text-6xl font-black text-white tracking-[0.2em] font-mono select-all">
                {duel.invite_code}
              </span>
              <button 
                onClick={copyCode}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all active:scale-95"
                title="Copiar Código"
              >
                {copied ? <Check className="w-6 h-6 text-green-400" /> : <Copy className="w-6 h-6 text-white/60" />}
              </button>
           </div>
           <p className="text-xs text-white/40 italic">Comparte este código con tu rival para iniciar el duelo.</p>
        </div>
      </div>

      {/* Players Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player 1 Card */}
        <PlayerCard 
          profile={p1Profile} 
          isReady={duel.player_one_ready} 
          label="Anfitrión" 
          isMe={isP1}
        />

        {/* Player 2 Card */}
        <PlayerCard 
          profile={p2Profile} 
          isReady={duel.player_two_ready} 
          label="Oponente" 
          isMe={isP2}
          waiting={!duel.player_two}
        />
      </div>

      {/* Status & Action */}
      <div className="space-y-4">
        {duel.status === 'waiting' && duel.player_two && (
          <div className="text-center">
            <p className="text-magical-gold font-black uppercase tracking-widest text-[10px] animate-pulse">
               {duel.player_one_ready && duel.player_two_ready ? '¡Iniciando duelo!' : 'Esperando que ambos estén listos...'}
            </p>
          </div>
        )}

        {canSetReady ? (
          <button
            onClick={setReady}
            disabled={actionLoading || !duel.player_two}
            className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-lg
              ${duel.player_two 
                ? 'bg-magical-gold text-magical-navy hover:shadow-gold-lg' 
                : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
              }`}
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            {duel.player_two ? '¡Estoy Listo!' : 'Esperando Rival...'}
          </button>
        ) : myReady ? (
          <div className="w-full py-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 font-black uppercase tracking-[0.2em] text-center flex items-center justify-center gap-3">
             <Check className="w-5 h-5" />
             Esperando al otro mago...
          </div>
        ) : null}

        <button 
          onClick={() => navigate('/duelos')}
          className="w-full flex items-center justify-center gap-2 text-white/20 hover:text-white/40 transition-colors text-[10px] font-black uppercase tracking-[0.2em] py-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Cancelar y Salir
        </button>
      </div>
    </div>
  )
}

function PlayerCard({ profile, isReady, label, isMe, waiting }) {
  const houseColors = {
    gryffindor: 'from-red-600/20 to-red-900/40 border-red-500/30',
    slytherin: 'from-green-600/20 to-green-900/40 border-green-500/30',
    ravenclaw: 'from-blue-600/20 to-blue-900/40 border-blue-500/30',
    hufflepuff: 'from-yellow-600/20 to-yellow-900/40 border-yellow-500/30',
    neutral: 'from-slate-600/20 to-slate-900/40 border-slate-500/30'
  }

  const normHouse = normalizeHouseSlug(profile?.house_slug)
  const meta = HOUSE_META[normHouse] || { icon: '🧙‍♂️', avatar: null }

  return (
    <div className={`glass-card p-6 border transition-all duration-500 bg-gradient-to-br ${waiting ? 'bg-white/5 border-white/5 opacity-50' : houseColors[normHouse] || houseColors.neutral}`}>
      <div className="flex flex-col items-center text-center space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</span>
        
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/10 relative overflow-hidden">
           {waiting ? (
             <div className="animate-pulse flex space-x-1">
               <div className="h-2 w-2 bg-white/20 rounded-full"></div>
               <div className="h-2 w-2 bg-white/20 rounded-full"></div>
               <div className="h-2 w-2 bg-white/20 rounded-full"></div>
             </div>
           ) : (
             <div className="text-3xl drop-shadow-md">{meta.icon}</div>
           )}
        </div>

        <div className="space-y-1">
          <h4 className="text-white font-black uppercase italic tracking-tighter">
            {waiting ? '???' : (profile?.display_name || 'Desconocido')}
          </h4>
          {isMe && <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-white/60 font-black uppercase">Tú</span>}
        </div>

        <div className="pt-2">
          {waiting ? (
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Esperando...</span>
          ) : isReady ? (
            <div className="flex items-center gap-1.5 text-green-400">
               <Check className="w-3 h-3" />
               <span className="text-[9px] font-black uppercase tracking-widest">¡Listo!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-white/30 animate-pulse">
               <Loader2 className="w-3 h-3 animate-spin" />
               <span className="text-[9px] font-black uppercase tracking-widest">Pensando...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
