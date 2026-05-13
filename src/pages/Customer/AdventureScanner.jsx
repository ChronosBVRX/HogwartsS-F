import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { QrCode, AlertCircle, ChevronLeft } from 'lucide-react'
import { useAdventureAudio } from '../../hooks/useAdventureAudio'
import { adventureAudio } from '../../data/adventureAudioManifest'
import AdventureAudioControl from '../../components/adventure/AdventureAudioControl'
import QRScanner from '../../components/QRScanner'

function parseAdventureQR(rawText) {
  try {
    // Si es una URL completa (con o sin hash)
    if (rawText.includes('?')) {
      const queryString = rawText.split('?')[1]
      const urlParams = new URLSearchParams(queryString)
      const zone = urlParams.get('zone')
      const token = urlParams.get('token')
      
      if (zone && token) return { zone, token }
    }

    // Formato alterno: zone|uuid
    if (rawText.includes('|')) {
      const [zone, token] = rawText.split('|')
      if (zone && token) return { zone, token }
    }

    // Formato JSON
    try {
      const parsed = JSON.parse(rawText)
      return { zone: parsed.zone, token: parsed.token }
    } catch {
      // Si nada funciona, devolver nulls
      return { zone: null, token: null }
    }
  } catch (err) {
    console.error('Error parsing QR:', err)
    return { zone: null, token: null }
  }
}

export default function AdventureScanner() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [adventureState, setAdventureState] = useState(null)
  const navigate = useNavigate()
  const audio = useAdventureAudio()

  const fetchAdventureState = useCallback(async () => {
    const { data } = await supabase.rpc('hsf_get_active_adventure')
    if (data?.ok) setAdventureState(data)
  }, [])

  const handleScanPayload = useCallback(async ({ zone, token }) => {
    if (!zone || !token) {
      setError('Este QR no parece ser un sello de aventura válido.')
      audio.play(adventureAudio.scanner.invalidQr, { volume: 0.9 })
      return
    }

    setLoading(true)
    setError(null)
    setMessage('Consultando el portal mágico...')

    const { data, error } = await supabase.rpc('hsf_scan_adventure_zone', {
      p_zone_slug: zone,
      p_zone_token: token
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    if (!data?.ok) {
      setError(data?.message || 'No se pudo abrir este portal.')
      audio.playVoice(adventureAudio.scanner.invalidQr, { volume: 0.9 })
      return
    }

    await audio.playVoice(adventureAudio.scanner.validPortal, { volume: 0.9 })

    sessionStorage.setItem(`hsf_adventure_step_${data.run_id}`, JSON.stringify(data.step))

    audio.stopSequence()
    audio.stopVoice()
    
    timeoutRef.current = setTimeout(() => {
      navigate(`/aventura/jugar/${data.run_id}`)
    }, 900)
  }, [audio, navigate])

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState warning in effect
    const init = async () => {
      await fetchAdventureState()
      const zone = searchParams.get('zone')
      const token = searchParams.get('token')
      if (zone && token) {
        handleScanPayload({ zone, token })
      }
    }
    init()
  }, [fetchAdventureState, handleScanPayload, searchParams])

  const playedInstructionRef = useRef(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!audio.enabled) return

    audio.setAudioContext('adventure-scanner')
    audio.playAmbient(adventureAudio.ambient.scanner, { volume: 0.16 })

    if (!playedInstructionRef.current) {
      playedInstructionRef.current = true
      audio.playVoice(adventureAudio.scanner.instruction, { volume: 0.9 })
    }

    return () => {
      audio.stopAmbient()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [audio.enabled, audio.setAudioContext, audio.playAmbient, audio.playVoice, audio.stopAmbient])

  const handleScan = async (decodedText) => {
    setShowScanner(false)
    await audio.playSfx(adventureAudio.ui.portalScan, { volume: 0.8 })
    const payload = parseAdventureQR(decodedText)
    handleScanPayload(payload)
  }

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col max-w-2xl mx-auto w-full space-y-6 pb-20">
      {showScanner && (
        <QRScanner
          title="Buscando Portal"
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="flex justify-between items-center">
        <Link to="/aventura" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Volver a aventura</span>
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

      <div className="glass-card overflow-hidden border border-white/10">
        <div className="p-8 text-center bg-magical-gold/5 border-b border-white/5 space-y-2">
          <QrCode className="w-10 h-10 mx-auto text-magical-gold" />
          <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
            Escanear <span className="text-magical-gold">Sello Mágico</span>
          </h1>
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
            Apunta al póster QR de la zona
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {adventureState?.clue && (
            <div className="bg-magical-gold/10 border border-magical-gold/20 p-5 rounded-2xl flex items-start gap-4 animate-in slide-in-from-top duration-500">
               <AlertCircle className="w-5 h-5 text-magical-gold shrink-0 mt-0.5" />
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-magical-gold/60">Tu pista actual:</p>
                 <p className="text-sm text-white italic leading-relaxed">
                   “{adventureState.clue}”
                 </p>
               </div>
            </div>
          )}

          <div className="flex flex-col items-center justify-center p-8 text-center space-y-8">
            <div className="relative group">
               <div className="absolute inset-0 bg-magical-gold/20 blur-3xl rounded-full scale-150 group-hover:bg-magical-gold/30 transition-all duration-700" />
               <div className="relative p-10 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl">
                 <QrCode className="w-20 h-20 text-magical-gold animate-float" />
               </div>
            </div>

            <button
              onClick={() => {
                audio.play(adventureAudio.ui.cameraStart, { volume: 0.65 })
                setShowScanner(true)
              }}
              className="btn-gold px-12 py-5 text-sm font-black uppercase tracking-widest flex items-center gap-3"
            >
              <QrCode className="w-5 h-5" />
              Activar Escáner
            </button>

            <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
              Encuentra los pósters mágicos ubicados en las diferentes zonas del castillo
            </p>
          </div>

          {(message || loading) && (
            <div className="bg-magical-gold/5 border border-magical-gold/10 rounded-2xl p-6 text-center space-y-4">
              <div className="w-8 h-8 border-2 border-magical-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-magical-gold text-[10px] font-black uppercase tracking-widest animate-pulse">
                {message || 'Invocando el portal...'}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 bg-red-400/10 p-5 rounded-2xl border border-red-400/20 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase">{error}</p>
                <button 
                  onClick={() => setShowScanner(true)} 
                  className="text-[10px] font-black uppercase tracking-widest underline"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
