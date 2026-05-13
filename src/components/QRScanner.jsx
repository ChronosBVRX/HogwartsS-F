import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, RefreshCw, AlertCircle } from 'lucide-react'

export default function QRScanner({ onScan, onClose, title = 'Escanear QR' }) {
  const [error, setError] = useState(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const scannerRef = useRef(null)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
        await scannerRef.current.clear()
        scannerRef.current = null
      } catch (err) {
        console.warn('Scanner stop warning:', err)
      }
    }
    setIsCameraActive(false)
  }, [])

  const startScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) return

    // Avoid synchronous setState in effect by ensuring it's not the first thing called if needed
    // or just let the async boundary handle it if the lint allows it.
    // However, to be safe and satisfy the lint:
    setError(null)
    
    try {
      const html5QrCode = new Html5Qrcode('qr-reader-element')
      scannerRef.current = html5QrCode

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          await stopScanner()
          onScan(decodedText)
        }
      )
      setIsCameraActive(true)
    } catch (err) {
      setError('No se pudo acceder a la cámara. Por favor, asegúrate de dar los permisos necesarios.')
      console.error(err)
    }
  }, [onScan, stopScanner])

  useEffect(() => {
    const init = async () => {
      await startScanner()
    }
    init()
    return () => {
      stopScanner()
    }
  }, [startScanner, stopScanner])

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute top-6 right-6 flex gap-3">
        <button
          onClick={() => {
            stopScanner()
            onClose()
          }}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white border border-white/10"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full max-w-md space-y-8 flex flex-col items-center">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
            {title}
          </h2>
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
            Apunta la cámara al código QR
          </p>
        </div>

        <div className="relative aspect-square w-full max-w-[320px] mx-auto group">
          {/* Scanner Overlay Decorations */}
          <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-magical-gold rounded-tl-xl z-20 group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-magical-gold rounded-tr-xl z-20 group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-magical-gold rounded-bl-xl z-20 group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-magical-gold rounded-br-xl z-20 group-hover:scale-110 transition-transform duration-500" />

          {/* Scanning Line Animation */}
          {isCameraActive && (
            <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-3xl">
              <div className="w-full h-1 bg-magical-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.5)] animate-scan-line" />
            </div>
          )}

          <div
            id="qr-reader-element"
            className="w-full h-full rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl"
          />

          {!isCameraActive && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="w-10 h-10 text-magical-gold animate-spin" />
            </div>
          )}
        </div>

        {error && (
          <div className="w-full max-w-sm flex items-start gap-3 bg-red-400/10 p-5 rounded-2xl border border-red-400/20 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase">{error}</p>
              <button
                onClick={startScanner}
                className="text-[10px] font-black uppercase tracking-widest underline"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 text-center max-w-xs">
        <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest leading-relaxed">
          Si tienes problemas, asegúrate de que hay buena iluminación y el código no tiene reflejos.
        </p>
      </div>
    </div>
  )
}
