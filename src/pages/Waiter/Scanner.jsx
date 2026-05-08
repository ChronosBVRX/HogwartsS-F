import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../../lib/supabase'
import { ChevronLeft, Info, CheckCircle2, AlertCircle, Camera } from 'lucide-react'

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
      if (scannerRef.current) {
        scannerRef.current.stop().catch(err => console.error("Error stopping scanner", err))
      }
    }
  }, [])

  const startScanner = async () => {
    setError(null)
    try {
      const html5QrCode = new Html5Qrcode("reader")
      scannerRef.current = html5QrCode
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } }
      
      await html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
          setScanResult(decodedText)
          html5QrCode.stop().then(() => setIsCameraActive(false))
        }
      )
      setIsCameraActive(true)
    } catch (err) {
      setError("No se pudo acceder a la cámara. Asegúrate de dar permisos.")
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
    <div className="flex-1 p-6 flex flex-col max-w-2xl mx-auto w-full space-y-6">
      <button onClick={() => navigate('/mesero')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
        <ChevronLeft className="w-5 h-5" />
        <span className="text-xs font-black uppercase tracking-widest">Regresar al Panel</span>
      </button>

      <div className="glass-card overflow-hidden">
        <div className="p-8 text-center bg-magical-gold/5 border-b border-white/5">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-magical-gold">Escáner de Asistencia</h1>
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-1">Registrar nueva llegada</p>
        </div>

        <div className="p-8 space-y-8">
          {!scanResult ? (
            <div className="space-y-6">
              <div id="reader" className="rounded-3xl overflow-hidden bg-black/40 aspect-square flex items-center justify-center border-2 border-dashed border-white/10">
                {!isCameraActive && (
                  <button 
                    onClick={startScanner}
                    className="flex flex-col items-center gap-4 text-magical-gold/60 hover:text-magical-gold transition-colors"
                  >
                    <div className="p-6 bg-magical-gold/10 rounded-full">
                      <Camera className="w-12 h-12" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-xs">Activar Cámara</span>
                  </button>
                )}
              </div>
              <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl text-left border border-white/5">
                <Info className="w-5 h-5 text-magical-gold shrink-0 mt-0.5" />
                <p className="text-xs text-white/60 leading-relaxed italic">
                  Apunta la cámara al código QR del cliente para identificar su sesión.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in zoom-in duration-300">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-green-500/20 rounded-full">
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-black uppercase italic">¡Código Escaneado!</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Sesión identificada correctamente</p>
                </div>
              </div>

              <form onSubmit={handleAssignTable} className="space-y-6">
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

                {error && (
                  <div className="flex items-center gap-3 bg-red-400/10 p-5 rounded-2xl border border-red-400/20 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-xs font-bold">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => { setScanResult(null); setIsCameraActive(false); }}
                    className="py-5 rounded-2xl border border-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all text-white/40"
                  >
                    Re-escanear
                  </button>
                  <button 
                    type="submit" 
                    className="btn-gold py-5 text-sm font-black uppercase italic tracking-tighter"
                    disabled={loading}
                  >
                    {loading ? 'Procesando...' : 'Confirmar Mesa'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {error && !isCameraActive && !scanResult && (
             <div className="flex items-center gap-3 bg-red-400/10 p-5 rounded-2xl border border-red-400/20 text-red-400">
               <AlertCircle className="w-5 h-5" />
               <p className="text-xs font-bold">{error}</p>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
