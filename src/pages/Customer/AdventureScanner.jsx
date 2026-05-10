import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../../lib/supabase'
import { Camera, QrCode, AlertCircle, ChevronLeft, RefreshCw } from 'lucide-react'

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
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [adventureState, setAdventureState] = useState(null)
  const scannerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchAdventureState()
    
    const zone = searchParams.get('zone')
    const token = searchParams.get('token')
    if (zone && token) {
      handleScanPayload({ zone, token })
    }

    return () => stopScanner()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAdventureState = async () => {
    const { data } = await supabase.rpc('hsf_get_active_adventure')
    if (data?.ok) setAdventureState(data)
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
      } catch (err) {
        console.warn('Scanner stop warning:', err)
      }
    }
    setIsCameraActive(false)
  }

  const startScanner = async () => {
    setError(null)
    setMessage(null)

    try {
      const html5QrCode = new Html5Qrcode('adventure-reader')
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        async (decodedText) => {
          await stopScanner()
          const payload = parseAdventureQR(decodedText)
          await handleScanPayload(payload)
        }
      )

      setIsCameraActive(true)
    } catch (err) {
      setError('No se pudo iniciar la cámara. Revisa permisos o intenta abrir la app desde Chrome/Safari.')
      console.error(err)
    }
  }

  const handleScanPayload = async ({ zone, token }) => {
    if (!zone || !token) {
      setError('Este QR no parece ser un sello de aventura válido.')
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
      return
    }

    sessionStorage.setItem(`hsf_adventure_step_${data.run_id}`, JSON.stringify(data.step))
    navigate(`/aventura/jugar/${data.run_id}`)
  }

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col max-w-2xl mx-auto w-full space-y-6 pb-20">
      <Link to="/aventura" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
        <ChevronLeft className="w-5 h-5" />
        <span className="text-[10px] font-black uppercase tracking-widest">Volver a aventura</span>
      </Link>

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

          <div className="relative aspect-square w-full max-w-[400px] mx-auto">
            <div
              id="adventure-reader"
              className={`w-full h-full rounded-3xl overflow-hidden bg-black/40 border-2 border-dashed transition-all duration-500 ${
                isCameraActive ? 'border-magical-gold/50' : 'border-white/10'
              }`}
            />

            {!isCameraActive && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6 z-10">
                <div className="p-6 bg-magical-gold/10 rounded-full animate-pulse">
                  <Camera className="w-12 h-12 text-magical-gold/60" />
                </div>
                <button
                  onClick={startScanner}
                  className="btn-gold px-10 py-4 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Iniciar cámara
                </button>
              </div>
            )}
          </div>

          {message && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-white/50 text-xs font-bold uppercase tracking-widest text-center">
              {message}
            </div>
          )}

          {loading && (
            <div className="text-center text-magical-gold uppercase font-black tracking-widest animate-pulse">
              Abriendo portal...
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 bg-red-400/10 p-5 rounded-2xl border border-red-400/20 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase">{error}</p>
                <button onClick={startScanner} className="text-[10px] font-black uppercase tracking-widest underline">
                  Intentar escanear otro QR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
