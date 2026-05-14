import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { withTimeout } from '../../lib/supabaseSafe'
import { Wand2, ChevronLeft, AlertCircle, CheckCircle2, XCircle, QrCode } from 'lucide-react'
import { useAdventureAudio } from '../../hooks/useAdventureAudio'
import { adventureAudio, getStepAudio } from '../../data/adventureAudioManifest'
import AdventureAudioControl from '../../components/adventure/AdventureAudioControl'

export default function AdventurePlay() {
  const { runId } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(null)
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answering, setAnswering] = useState(false)
  const [result, setResult] = useState(null)
  const audio = useAdventureAudio()
  const [autoAdvancing, setAutoAdvancing] = useState(false)
  const [hasPlayedStepAudio, setHasPlayedStepAudio] = useState(false)

  useEffect(() => {
    const cached = sessionStorage.getItem(`hsf_adventure_step_${runId}`)
    if (cached) {
      try {
        setStep(JSON.parse(cached))
      } catch {}
    }
    fetchStep()

    const channel = supabase
      .channel(`adventure_play_${runId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          table: 'hsf_adventure_runs',
          filter: `id=eq.${runId}`
        },
        () => fetchStep()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  const timeoutRef = useRef(null)

  useEffect(() => {
    const stepContextId = step?.id
      ? `adventure-play-${runId}-${step.id}`
      : `adventure-play-${runId}-loading`

    audio.setAudioContext(stepContextId)
    setHasPlayedStepAudio(false)
  }, [runId, step?.id, audio.setAudioContext])

  useEffect(() => {
    if (!audio.enabled || !step || hasPlayedStepAudio) return

    const stepAudio = getStepAudio(step)
    const stepContextId = `adventure-play-${runId}-${step.id}`

    audio.playSequence([
      { type: 'sfx', src: adventureAudio.ui.mapOpen, volume: 0.55 },
      { type: 'voice', src: stepAudio?.intro, volume: 0.95, delay: 300 },
      { type: 'voice', src: stepAudio?.question, volume: 0.95, delay: 300 }
    ], { contextId: stepContextId })

    setHasPlayedStepAudio(true)
  }, [audio.enabled, audio.playSequence, step, hasPlayedStepAudio, runId])

  const fetchStep = async () => {
    setLoading(true)

    try {
      const { data, error } = await withTimeout(
        supabase.rpc('hsf_get_active_adventure'),
        8000,
        'Leyendo pergamino'
      )

      if (error) {
        console.error('Error hsf_get_active_adventure:', error)
        setState({
          ok: false,
          needs_scan: true,
          message: 'No se pudo leer la aventura.'
        })
        return
      }

      setState(data)

      if (data?.step) {
        setStep(data.step)
        sessionStorage.setItem(`hsf_adventure_step_${runId}`, JSON.stringify(data.step))
      }
    } catch (err) {
      console.error('fetchStep failed:', err)
      setState({
        ok: false,
        needs_scan: true,
        message: 'El pergamino tardó demasiado en responder. Intenta volver al mapa.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (value) => {
    setAnswering(true)
    setResult(null)

    audio.stopSequence()
    audio.stopVoice()
    await audio.playSfx(adventureAudio.ui.magicClick, { volume: 0.55 })

    let data
    let error

    try {
      const result = await withTimeout(
        supabase.rpc('hsf_answer_adventure_step', {
          p_run_id: runId,
          p_answer: value
        }),
        10000,
        'Consultando respuesta'
      )

      data = result.data
      error = result.error
    } catch (err) {
      setAnswering(false)
      setResult({
        ok: false,
        message: 'El pergamino tardó demasiado en responder. Intenta nuevamente.'
      })
      return
    }

    setAnswering(false)

    if (error) {
      setResult({ ok: false, message: error.message })
      return
    }

    const stepContextId = `adventure-play-${runId}-${step.id}`

    if (!data?.ok) {
      // Handle failure limits
      if (data?.out_of_attempts) {
        setResult({ ok: false, message: data.message, outOfAttempts: true })
        timeoutRef.current = setTimeout(() => fetchStep(), 3000)
        return
      }
      setResult({ ok: false, message: data?.message || 'Respuesta incorrecta.' })
      
      const stepAudio = getStepAudio(step)
      audio.playSequence([
        { type: 'sfx', src: adventureAudio.ui.wrong, volume: 0.75 },
        { type: 'voice', src: stepAudio?.fail, volume: 0.95, delay: 250 }
      ], { contextId: stepContextId })

      fetchStep()
      return
    }

    if (data.completed) {
      audio.playSequence([
        { type: 'sfx', src: adventureAudio.ui.correct, volume: 0.75 },
        { type: 'sfx', src: adventureAudio.ui.rewardFanfare, volume: 0.85, delay: 300 }
      ], { contextId: stepContextId })
      
      timeoutRef.current = setTimeout(() => {
        navigate(`/aventura/recompensa/${runId}`, { state: data })
      }, 1000)
      return
    }

    const stepAudio = getStepAudio(step)
    setResult({
      ok: true,
      message: data.message,
      clue: data.clue_to_next_zone
    })

    sessionStorage.removeItem(`hsf_adventure_step_${runId}`)
    setAutoAdvancing(true)

    audio.playSequence([
      { type: 'sfx', src: adventureAudio.ui.correct, volume: 0.75 },
      { type: 'voice', src: stepAudio?.success, volume: 0.95, delay: 250 },
      { type: 'voice', src: adventureAudio.scanner.lookingForSeal, volume: 0.9, delay: 250 }
    ], { contextId: stepContextId })

    timeoutRef.current = setTimeout(() => {
      audio.stopSequence()
      audio.stopVoice()
      navigate('/aventura/escanear')
    }, 3500)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (loading && !step) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-magical-gold uppercase font-black tracking-widest animate-pulse">
        Leyendo pergamino...
      </div>
    )
  }

  if (state?.needs_scan) {
    return (
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full flex items-center">
        <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 space-y-6 text-center">
          <QrCode className="w-16 h-16 text-magical-gold mx-auto" />
          <h1 className="text-3xl font-black uppercase italic text-white">Falta escanear el siguiente sello</h1>
          <p className="text-white/50 italic">{state.clue || 'Busca el siguiente portal mágico.'}</p>
          <Link to="/aventura/escanear" className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase">
            <QrCode className="w-5 h-5" />
            Escanear sello
          </Link>
        </div>
      </div>
    )
  }

  if (!step) {
    return (
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full flex items-center">
        <div className="glass-card p-8 rounded-[2.5rem] border border-red-400/20 space-y-6 text-center">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto" />
          <h1 className="text-2xl font-black uppercase text-white">No se encontró la pregunta</h1>
          <Link to="/aventura" className="btn-gold w-full py-4">Volver</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6 pb-24 space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <Link to="/aventura" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
        </Link>

        <AdventureAudioControl
          enabled={audio.enabled}
          onEnable={audio.unlockAudio}
          onDisable={audio.disableAudio}
          onTest={audio.testAudio}
          error={audio.lastError}
          compact
        />
      </div>

      <div className="glass-card rounded-[2.5rem] border border-white/10 overflow-hidden">
        <div className="p-8 bg-magical-gold/5 border-b border-white/5 space-y-3">
            <div className="flex flex-col items-end gap-1">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-magical-gold">
                Etapa {step.step_order} · {step.difficulty}
              </p>
              {state?.failed_attempts !== undefined && (
                <div className="flex gap-1">
                  <div className={`w-2 h-2 rounded-full ${state.failed_attempts >= 1 ? 'bg-red-500' : 'bg-white/20'}`} />
                  <div className={`w-2 h-2 rounded-full ${state.failed_attempts >= 2 ? 'bg-red-500' : 'bg-white/20'}`} />
                </div>
              )}
            </div>
            <Wand2 className="w-6 h-6 text-magical-gold" />
          <h1 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
            {step.narrator_name}
          </h1>
          <p className="text-white/60 italic leading-relaxed">“{step.narrator_line}”</p>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
            <p className="text-white/70 leading-relaxed">{step.story_text}</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-black leading-tight text-white">
              {step.question}
            </h2>

            <div className="grid gap-3">
              {(step.options || []).map((option) => (
                <button
                  key={option.value}
                  disabled={answering || result?.ok}
                  onClick={() => handleAnswer(option.value)}
                  className="w-full text-left p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-magical-gold hover:text-magical-navy transition-all disabled:opacity-60"
                >
                  <div className="flex gap-4 items-start">
                    <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-black shrink-0">
                      {option.value}
                    </span>
                    <span className="font-bold">{option.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {answering && (
            <div className="text-center text-magical-gold uppercase font-black tracking-widest animate-pulse">
              Consultando al pergamino...
            </div>
          )}

          {result && (
            <div className={`p-5 rounded-2xl border flex items-start gap-3 ${
              result.ok
                ? 'bg-green-400/10 border-green-400/20 text-green-400'
                : 'bg-red-400/10 border-red-400/20 text-red-400'
            }`}>
              {result.ok ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <div className="space-y-3">
                <p className="text-sm font-bold">{result.message}</p>
                {result.clue && (
                  <>
                    <p className="text-white/60 italic">{result.clue}</p>
                    {autoAdvancing ? (
                      <p className="text-[10px] font-black uppercase tracking-widest text-magical-gold animate-pulse">
                        El mapa se está moviendo hacia el siguiente sello...
                      </p>
                    ) : (
                      <Link to="/aventura/escanear" className="btn-gold inline-flex items-center gap-2 px-5 py-3 text-xs font-black uppercase">
                        <QrCode className="w-4 h-4" />
                        Escanear siguiente sello
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
