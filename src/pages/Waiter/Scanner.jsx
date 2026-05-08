import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../../lib/supabase'
import { ChevronLeft, Info, CheckCircle2, AlertCircle, Camera, RefreshCw } from 'lucide-react'

export default function WaiterScanner() {
  const [scanResult, setScanResult] = useState(null)
  const [tableNumber, setTableNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const navigate = useNavigate()
  
  const scannerRef = useRef(null)

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
      } catch (err) {
        console.warn("Scanner stop warning:", err)
      }
    }
    setIsCameraActive(false)
  }

  const startScanner = async () => {
    setError(null)
    setScanResult(null)
    
    try {
      // Html5Qrcode needs an empty div. We ensure it's empty by logic.
      const html5QrCode = new Html5Qrcode("reader")
      scannerRef.current = html5QrCode
      
      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }
      
      await html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
          setScanResult(decodedText)
          stopScanner()
        }
      )
      setIsCameraActive(true)
    } catch (err) {
      setError("Error de cámara: Asegúrate de dar permisos y no tener otras apps usándola.")
      console.error(err)
    }
  }

  const handleAssignTable = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: session, error: fetchError } = await supabase
      .from('hsf_visit_sessions')
      .select('*')
      .eq('qr_token', scanResult)
      .single()

    if (fetchError || !session) {
      setError('Código QR no válido o expirado.')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('hsf_visit_sessions')
      .update({
        status: 'seated',
        table_number: tableNumber,
        waiter_id: (await supabase.auth.getUser()).data.user.id,
        seated_at: new Date().toISOString()
      })
      .eq('id', session.id)

    if (updateError) {
      setError('Error al asignar mesa.')
      setLoading(false)
    } else {
      alert('¡Mesa asignada con éxito!')
      navigate('/mesero')
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col max-w-2xl mx-auto w-full space-y-6 pb-20">
      <button onClick={() => navigate('/mesero')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
        <ChevronLeft className="w-5 h-5" />
        <span className="text-[10px] font-black uppercase tracking-widest">Regresar al Panel</span>
      </button>

      <div className="glass-card overflow-hidden border border-white/10 shadow-2xl">
        <div className="p-6 md:p-8 text-center bg-magical-gold/5 border-b border-white/5">
          <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-magical-gold">Escáner de Asistencia</h1>
          <p className="text-[9px] text-white/40 uppercase font-bold tracking-widest mt-1">Gringotts Validation System</p>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="relative aspect-square w-full max-w-[400px] mx-auto">
            {/* 
                CRITICAL: The #reader div MUST BE EMPTY for React. 
                Html5Qrcode will inject a video element here. 
                React should never render children inside this div.
            */}
            <div 
              id="reader" 
              className={`w-full h-full rounded-3xl overflow-hidden bg-black/40 border-2 border-dashed transition-all duration-500 ${
                isCameraActive ? 'border-magical-gold/50 shadow-[0_0_50px_rgba(212,175,55,0.1)]' : 'border-white/10'
              }`}
            ></div>

            {/* OVERLAYS: These are siblings to #reader, so React and the library don't fight */}
            {!isCameraActive && !scanResult && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6 z-10">
                <div className="p-6 bg-magical-gold/10 rounded-full animate-pulse">
                  <Camera className="w-12 h-12 text-magical-gold/60" />
                </div>
                <button 
                  onClick={startScanner}
                  className="btn-gold px-10 py-4 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Iniciar Cámara
                </button>
              </div>
            )}

            {scanResult && (
              <div className="absolute inset-0 bg-magical-navy/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-4 z-20 animate-in fade-in zoom-in duration-500 rounded-3xl">
                <div className="p-4 bg-green-500/20 rounded-full">
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                </div>
                <h2 className="text-xl font-black uppercase italic text-white">¡Escaneado!</h2>
                <button 
                  onClick={() => { setScanResult(null); startScanner(); }}
                  className="text-[10px] font-black text-magical-gold uppercase tracking-widest hover:underline"
                >
                  Escanear otro
                </button>
              </div>
            )}

            {isCameraActive && (
              <button 
                onClick={stopScanner}
                className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white/60 hover:text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 z-30"
              >
                Detener
              </button>
            )}
          </div>

          <div className="space-y-8">
            {scanResult ? (
              <form onSubmit={handleAssignTable} className="space-y-6 animate-in slide-in-from-bottom duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Número de Mesa</label>
                  <input 
                    type="text" 
                    className="input-field text-4xl text-center py-6 font-black bg-white/5 border-2 border-magical-gold/20 focus:border-magical-gold"
                    placeholder="--"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-gold w-full py-5 text-sm font-black uppercase italic tracking-tighter"
                  disabled={loading}
                >
                  {loading ? 'Asignando...' : 'Confirmar Mesa'}
                </button>
              </form>
            ) : (
              <div className="flex items-start gap-4 bg-white/5 p-6 rounded-2xl border border-white/5">
                <Info className="w-5 h-5 text-magical-gold shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs text-white/80 font-bold uppercase tracking-widest">Instrucciones</p>
                  <p className="text-[10px] text-white/40 leading-relaxed italic">
                    Apunta al QR del Pase de Entrada del cliente. Asegúrate de tener buena luz.
                  </p>
                </div>
              </div>
            )}

            {error && (
               <div className="flex items-center gap-3 bg-red-400/10 p-5 rounded-2xl border border-red-400/20 text-red-400">
                 <AlertCircle className="w-5 h-5" />
                 <p className="text-[10px] font-bold uppercase">{error}</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
