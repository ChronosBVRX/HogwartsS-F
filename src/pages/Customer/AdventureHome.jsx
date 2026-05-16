import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Wand2, QrCode, AlertCircle, Sparkles, XCircle } from 'lucide-react'
import { useAdventureAudio } from '../../hooks/useAdventureAudio'
import { adventureAudio } from '../../data/adventureAudioManifest'
import AdventureAudioControl from '../../components/adventure/AdventureAudioControl'
import SeasonBanner from '../../components/adventure/SeasonBanner'
import { getCurrentAdventureSeason } from '../../lib/adventureSeasonService'
import { formatMagicalText } from '../../utils/magicalFormatters'

export default function AdventureHome() {
  const [state, setState] = useState(null)
  const [season, setSeason] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const audio = useAdventureAudio()

  useEffect(() => {
    let channel;

    const setupRealtime = async () => {
      await Promise.all([
        fetchAdventure(),
        fetchSeasonData()
      ])

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel('adventure_home_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            table: 'hsf_adventure_runs',
            filter: `customer_id=eq.${user.id}`
          },
          () => fetchAdventure()
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const lastHomeAudioKeyRef = useRef(null)

  useEffect(() => {
    if (!audio.enabled) return
    
    if (audio.setAudioContext) audio.setAudioContext('adventure-home')
    audio.playAmbient(adventureAudio.ambient.castle, { volume: 0.18 })

    return () => audio.stopAmbient()
  }, [audio.enabled, audio.setAudioContext, audio.playAmbient, audio.stopAmbient])

  useEffect(() => {
    if (!audio.enabled || loading || !state) return

    const homeAudioKey = state.blocked
      ? 'blocked'
      : state.has_active
        ? 'active'
        : 'intro'

    if (lastHomeAudioKeyRef.current !== homeAudioKey) {
      lastHomeAudioKeyRef.current = homeAudioKey
      
      const src = state.blocked
        ? adventureAudio.home.blockedDaily
        : state.has_active
          ? adventureAudio.home.activeAdventure
          : adventureAudio.home.intro

      if (audio.playVoice) {
        audio.playVoice(src, { volume: 0.9 })
      } else {
        audio.play(src, { volume: 0.9 })
      }
    }
  }, [audio.enabled, audio.playVoice, audio.play, loading, state])

  const fetchSeasonData = async () => {
    try {
      const seasonData = await getCurrentAdventureSeason(supabase)
      setSeason(seasonData)
    } catch (err) {
      console.error('fetchSeasonData failed:', err)
    }
  }

  const fetchAdventure = async () => {
    setLoading(true)
    try {
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout consultando hsf_get_active_adventure')), 8000)
      })

      const request = supabase.rpc('hsf_get_active_adventure')
      const { data, error } = await Promise.race([request, timeout])

      if (error) {
        console.error('Error hsf_get_active_adventure:', error)
        setState({
          ok: false,
          blocked: false,
          has_active: false,
          needs_scan: true,
          message: 'No se pudo consultar la aventura mágica.'
        })
        return
      }

      setState(data || {
        ok: false,
        blocked: false,
        has_active: false,
        needs_scan: true,
        message: 'No hay aventura activa disponible.'
      })
    } catch (err) {
      console.error('fetchAdventure failed:', err)
      setState({
        ok: false,
        blocked: false,
        has_active: false,
        needs_scan: true,
        message: 'El mapa tardó demasiado en responder. Intenta escanear un sello mágico.'
      })
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 pb-24 space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-end">
        <AdventureAudioControl
          enabled={audio.enabled}
          onEnable={audio.unlockAudio}
          onDisable={audio.disableAudio}
          onTest={audio.testAudio}
          error={audio.lastError}
        />
      </div>

      <SeasonBanner season={season} />

      {loading ? (
        <div className="p-16 text-center text-magical-gold uppercase font-black tracking-widest animate-pulse">
          Consultando el mapa...
        </div>
      ) : state?.blocked ? (
        <section className="glass-card p-8 rounded-[2.5rem] border border-red-500/20 space-y-6 text-center">
          <div className="p-4 bg-red-500/10 rounded-full w-fit mx-auto text-red-500">
            {state.reason === 'daily_limit' ? <Sparkles className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Magia agotada</h2>
            <p className="text-white/50 max-w-md mx-auto">{formatMagicalText(state.message)}</p>
          </div>
          <div className="pt-4 border-t border-white/5">
             <p className="text-[10px] font-black uppercase tracking-widest text-magical-gold/40 italic">Vuelve mañana para recuperar tu energía mágica</p>
          </div>
        </section>
      ) : state?.has_active ? (
        <section className="glass-card p-8 rounded-[2.5rem] border border-magical-gold/20 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-magical-gold/10 rounded-2xl text-magical-gold">
              <Wand2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-magical-gold">Aventura activa</p>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">{formatMagicalText(state.title)}</h2>
              <p className="text-white/50 text-sm">Etapa actual: {state.current_step_order}</p>
            </div>
          </div>

          {state.needs_scan ? (
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
              <div className="flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-magical-gold shrink-0 mt-1" />
                <p className="text-white/60 italic">{formatMagicalText(state.clue) || 'Busca el siguiente portal mágico.'}</p>
              </div>
              <Link onClick={() => !audio.enabled && audio.unlockAudio()} to="/aventura/escanear" className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase">
                <QrCode className="w-5 h-5" />
                Escanear siguiente sello
              </Link>
            </div>
          ) : (
            <Link onClick={() => !audio.enabled && audio.unlockAudio()} to={`/aventura/jugar/${state.run_id}`} className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase">
              <Wand2 className="w-5 h-5" />
              Continuar pregunta
            </Link>
          )}
        </section>
      ) : (
        <section className="glass-card p-8 md:p-12 rounded-[2.5rem] border border-magical-gold/30 space-y-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-magical-gold/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div className="p-6 bg-magical-gold/10 rounded-full w-fit mx-auto text-magical-gold border border-magical-gold/20 animate-float">
              <QrCode className="w-16 h-16" />
            </div>
            <div className="space-y-3 max-w-xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
                Escanear <span className="text-magical-gold">Sello Mágico</span>
              </h2>
              <p className="text-white/60 text-sm md:text-base leading-relaxed">
                Busca los pósters mágicos en las distintas zonas del restaurante. La aventura que inicies dependerá del primer sello que decidas escanear.
              </p>
            </div>
            <Link onClick={() => !audio.enabled && audio.unlockAudio()} to="/aventura/escanear" className="btn-gold w-full max-w-md mx-auto flex items-center justify-center gap-3 py-5 text-sm font-black uppercase tracking-widest shadow-lg shadow-magical-gold/20">
              <QrCode className="w-5 h-5" />
              Activar Escáner Mágico
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
