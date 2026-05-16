import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Wand2, QrCode, Gift, Map, AlertCircle, Sparkles, XCircle, LayoutGrid } from 'lucide-react'
import { useAdventureAudio } from '../../hooks/useAdventureAudio'
import { adventureAudio } from '../../data/adventureAudioManifest'
import AdventureAudioControl from '../../components/adventure/AdventureAudioControl'
import SeasonBanner from '../../components/adventure/SeasonBanner'
import SeasonAdventureGrid from '../../components/adventure/SeasonAdventureGrid'
import { 
  getCurrentAdventureSeason, 
  getAvailableSeasonAdventures,
  startSeasonAdventure 
} from '../../lib/adventureSeasonService'
import { formatMagicalText } from '../../utils/magicalFormatters'
import { QRCodeSVG } from 'qrcode.react'

export default function AdventureHome() {
  const [state, setState] = useState(null)
  const [rewards, setRewards] = useState([])
  const [season, setSeason] = useState(null)
  const [adventures, setAdventures] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const audio = useAdventureAudio()

  useEffect(() => {
    let channel;

    const setupRealtime = async () => {
      await Promise.all([
        fetchAdventure(),
        fetchRewards(),
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
      const [seasonData, adventureData] = await Promise.all([
        getCurrentAdventureSeason(supabase),
        getAvailableSeasonAdventures(supabase)
      ])
      setSeason(seasonData)
      setAdventures(adventureData)
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

  const fetchRewards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setRewards([])
        return
      }

      const { data, error } = await supabase
        .from('hsf_adventure_rewards')
        .select('id, reward_title, reward_description, min_consumption, status, created_at')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error cargando recompensas:', error)
        setRewards([])
        return
      }
      setRewards(data || [])
    } catch (err) {
      console.error('fetchRewards failed:', err)
      setRewards([])
    }
  }

  const handleStartAdventure = async (adventure) => {
    if (!audio.enabled) {
      audio.unlockAudio();
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/login')
      return
    }

    setLoading(true)
    try {
      const run = await startSeasonAdventure(supabase, adventure.adventure_id, user.id)
      await fetchAdventure()
      navigate('/aventura/escanear')
    } catch (error) {
      console.error('Error starting adventure:', error)
      alert('No se pudo iniciar la aventura. Quizás ya tienes una activa.')
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
        <div className="space-y-8">
          <div className="flex items-center gap-2 px-2">
            <LayoutGrid className="w-5 h-5 text-magical-gold" />
            <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/40">Elegir Aventura de Temporada</h2>
          </div>
          
          <SeasonAdventureGrid 
            adventures={adventures} 
            onStartAdventure={handleStartAdventure} 
          />

          <section className="glass-card p-8 rounded-[2.5rem] border border-white/10 space-y-6 text-center">
            <QrCode className="w-16 h-16 text-magical-gold mx-auto" />
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase italic text-white">O escanea un sello directamente</h2>
              <p className="text-white/50 max-w-xl mx-auto">
                Si prefieres la sorpresa, escanea cualquier sello mágico y el mapa elegirá la aventura que inicie en esa zona.
              </p>
            </div>
            <Link onClick={() => !audio.enabled && audio.unlockAudio()} to="/aventura/escanear" className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase">
              <QrCode className="w-5 h-5" />
              Escanear cualquier sello
            </Link>
          </section>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Gift className="w-5 h-5 text-magical-gold" />
          <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/40">Mis recompensas mágicas</h2>
        </div>

        <div className="glass-card overflow-hidden divide-y divide-white/5">
          {rewards.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-xs font-black uppercase tracking-widest">
              Aún no tienes recompensas de aventura.
            </div>
          ) : rewards.map((reward) => (
            <div key={reward.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <p className="text-white font-black uppercase italic">{formatMagicalText(reward.reward_title)}</p>
                <p className="text-white/40 text-xs mt-1">{formatMagicalText(reward.reward_description)}</p>
                {Number(reward.min_consumption) > 0 && (
                  <p className="text-[10px] text-magical-gold mt-2 uppercase font-black">
                    Consumo mínimo: ${reward.min_consumption}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4 justify-between md:justify-end">
                {reward.status === 'available' ? (
                  <div className="bg-white p-3 rounded-xl inline-block border-4 border-magical-gold/20 shrink-0">
                    <QRCodeSVG value={`reward-${reward.id}`} size={80} />
                    <p className="text-[7px] font-black text-black text-center mt-1 uppercase tracking-widest">ESCANEAR PARA<br/>CANJEAR</p>
                  </div>
                ) : null}
                <span className={`px-3 py-1 rounded-full text-[9px] uppercase font-black tracking-widest border h-fit ${
                  reward.status === 'available'
                    ? 'border-green-500/20 text-green-400 bg-green-500/5'
                    : 'border-white/10 text-white/30 bg-white/5'
                }`}>
                  {reward.status === 'available' ? 'Disponible' : reward.status === 'redeemed' ? 'Canjeada' : reward.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
