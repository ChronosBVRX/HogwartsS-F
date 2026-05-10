import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Wand2, ChevronLeft, AlertCircle, CheckCircle2, XCircle, QrCode } from 'lucide-react'

export default function AdventurePlay() {
  const { runId } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(null)
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answering, setAnswering] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const cached = sessionStorage.getItem(`hsf_adventure_step_${runId}`)
    if (cached) {
      try {
        setStep(JSON.parse(cached))
      } catch {}
    }
    fetchStep()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  const fetchStep = async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('hsf_get_active_adventure')

    if (!error) {
      setState(data)
      if (data?.step) setStep(data.step)
    }

    setLoading(false)
  }

  const handleAnswer = async (value) => {
    setAnswering(true)
    setResult(null)

    const { data, error } = await supabase.rpc('hsf_answer_adventure_step', {
      p_run_id: runId,
      p_answer: value
    })

    setAnswering(false)

    if (error) {
      setResult({ ok: false, message: error.message })
      return
    }

    if (!data?.ok) {
      // Handle failure limits
      if (data?.out_of_attempts) {
        setResult({ ok: false, message: data.message, outOfAttempts: true })
        // Refresh state after a delay to show the blocked screen
        setTimeout(() => fetchStep(), 3000)
        return
      }
      setResult({ ok: false, message: data?.message || 'Respuesta incorrecta.' })
      fetchStep() // Refresh to update failed_attempts counter
      return
    }

    if (data.completed) {
      navigate(`/aventura/recompensa/${runId}`, { state: data })
      return
    }

    setResult({
      ok: true,
      message: data.message,
      clue: data.clue_to_next_zone
    })

    sessionStorage.removeItem(`hsf_adventure_step_${runId}`)
  }

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
      <Link to="/aventura" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
        <ChevronLeft className="w-5 h-5" />
        <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
      </Link>

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
                    <Link to="/aventura/escanear" className="btn-gold inline-flex items-center gap-2 px-5 py-3 text-xs font-black uppercase">
                      <QrCode className="w-4 h-4" />
                      Escanear siguiente sello
                    </Link>
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
