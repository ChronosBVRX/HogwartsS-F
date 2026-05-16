import { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Gift, Sparkles, ChevronLeft, QrCode as QrIcon, CheckCircle2 } from 'lucide-react'
import { useAdventureAudio } from '../../hooks/useAdventureAudio'
import { adventureAudio } from '../../data/adventureAudioManifest'
import { QRCodeSVG } from 'qrcode.react'
import { formatMagicalText } from '../../utils/magicalFormatters'

export default function AdventureReward() {
  const { runId } = useParams()
  const location = useLocation()
  const [reward, setReward] = useState(location.state || null)
  const [loading, setLoading] = useState(!location.state)
  const audio = useAdventureAudio()

  useEffect(() => {
    fetchReward()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  useEffect(() => {
    if (!audio.enabled || loading) return

    const rewardContextId = `adventure-reward-${runId}`
    audio.setAudioContext(rewardContextId)
    audio.playAmbient(adventureAudio.ambient.reward, { volume: 0.18 })

    if (reward?.status === 'redeemed' || reward?.isRedeemed) {
      audio.playVoice(adventureAudio.reward.alreadyRedeemed, { volume: 0.9 })
    } else if (reward) {
      audio.playSequence([
        { type: 'sfx', src: adventureAudio.ui.rewardFanfare, volume: 0.85 },
        { type: 'voice', src: adventureAudio.reward.completed, volume: 0.95, delay: 400 },
        { type: 'voice', src: adventureAudio.reward.showCode, volume: 0.9, delay: 300 }
      ], { contextId: rewardContextId })
    }

    return () => audio.stopAmbient()
  }, [audio.enabled, loading, reward?.id, reward?.status, runId, audio.setAudioContext, audio.playAmbient, audio.playVoice, audio.playSequence])

  const fetchReward = async () => {
    const { data } = await supabase
      .from('hsf_adventure_rewards')
      .select('*')
      .eq('run_id', runId === 'system' ? null : runId) // Handle system rewards (house welcome)
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      setReward(data)
    } else if (runId !== 'system') {
      // If not available, check if it was already redeemed
      const { data: redeemed } = await supabase
        .from('hsf_adventure_rewards')
        .select('*')
        .eq('run_id', runId)
        .eq('status', 'redeemed')
        .maybeSingle()
      if (redeemed) setReward({ ...redeemed, isRedeemed: true })
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-pulse text-magical-gold font-black uppercase tracking-widest text-xs">Revelando recompensa...</div>
    </div>
  )

  const title = reward?.reward_title || 'Recompensa mágica'
  const description = reward?.reward_description || 'Muestra esta pantalla al personal para validar tu recompensa.'
  const isRedeemed = reward?.status === 'redeemed' || reward?.isRedeemed

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-4 md:p-6 pb-24 space-y-6">
      <div className="flex justify-end">
        <AdventureAudioControl
          enabled={audio.enabled}
          onEnable={audio.unlockAudio}
          onDisable={audio.disableAudio}
          onTest={audio.testAudio}
          error={audio.lastError}
          compact
        />
      </div>
      
      <div className="flex items-center">
      <div className={`glass-card rounded-[2.5rem] border ${isRedeemed ? 'border-white/10' : 'border-magical-gold/30'} overflow-hidden w-full text-center relative`}>
        <Sparkles className="absolute -right-8 -top-8 w-40 h-40 text-magical-gold/10" />

        <div className="p-10 md:p-12 space-y-8 relative z-10">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center border ${isRedeemed ? 'bg-white/5 border-white/10' : 'bg-magical-gold/10 border-magical-gold/30'}`}>
            {isRedeemed ? <CheckCircle2 className="w-12 h-12 text-white/20" /> : <Gift className="w-12 h-12 text-magical-gold" />}
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${isRedeemed ? 'text-white/30' : 'text-magical-gold'}`}>
                {isRedeemed ? 'Hechizo ya utilizado' : '¡Misión Cumplida!'}
              </p>
              <h1 className={`text-4xl md:text-5xl font-black uppercase italic tracking-tighter ${isRedeemed ? 'text-white/40' : 'text-white'}`}>
                {formatMagicalText(title)}
              </h1>
            </div>
            <p className="text-white/60 leading-relaxed italic">“{formatMagicalText(description)}”</p>
            
            {!isRedeemed && (
              <div className="bg-magical-navy/40 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-magical-gold font-black uppercase tracking-widest">
                  Presenta este código con la Gerencia
                </p>
              </div>
            )}
          </div>

          {!isRedeemed && reward?.id && (
            <div className="bg-white p-6 rounded-[2.5rem] inline-block shadow-2xl border-8 border-magical-gold/20">
              <QRCodeSVG value={`reward-${reward.id}`} size={180} />
            </div>
          )}

          {isRedeemed && (
            <div className="py-10">
              <p className="text-white/20 font-black uppercase tracking-widest text-xs italic">Esta recompensa ya ha sido reclamada en el Gran Comedor</p>
            </div>
          )}

          <div className="grid gap-3 pt-4">
            <Link to="/perfil" className="btn-gold w-full py-5 text-sm font-black uppercase">
              Volver al Castillo
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
