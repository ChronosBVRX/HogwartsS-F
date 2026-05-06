import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from '../../lib/supabase'
import { ChevronLeft, Info, CheckCircle2, AlertCircle } from 'lucide-react'

export default function WaiterScanner() {
  const [scanResult, setScanResult] = useState(null)
  const [tableNumber, setTableNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    })

    scanner.render(
      (decodedText) => {
        setScanResult(decodedText)
        scanner.clear()
      },
      (error) => {
        // Silently handle scan errors
      }
    )

    return () => scanner.clear()
  }, [])

  const handleAssignTable = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1. Find session by token
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

    // 2. Update session status
    const { error: updateError } = await supabase
      .from('hsf_visit_sessions')
      .update({
        status: 'seated',
        table_number: tableNumber,
        waiter_id: (await supabase.auth.getUser()).data.user.id
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
      <button onClick={() => navigate('/mesero')} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
        <ChevronLeft className="w-5 h-5" />
        Regresar al Panel
      </button>

      <div className="glass-card overflow-hidden">
        <div className="p-8 text-center bg-magical-gold/5 border-b border-white/5">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-magical-gold">Escáner de Asistencia</h1>
          <p className="text-sm text-white/40 uppercase font-bold tracking-widest mt-1">Registrar nueva llegada</p>
        </div>

        <div className="p-8 space-y-8">
          {!scanResult ? (
            <div className="space-y-6">
              <div id="reader" className="rounded-3xl overflow-hidden border-2 border-dashed border-white/10" />
              <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl text-left">
                <Info className="w-5 h-5 text-magical-gold shrink-0 mt-0.5" />
                <p className="text-xs text-white/60 leading-relaxed italic">
                  Escanea el código QR que el cliente tiene en su sección de "Asistencia".
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
                  <h2 className="text-xl font-black uppercase">¡Código Escaneado!</h2>
                  <p className="text-sm text-white/40">Token: <span className="font-mono text-magical-gold">{scanResult}</span></p>
                </div>
              </div>

              <form onSubmit={handleAssignTable} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/60">Número de Mesa</label>
                  <input 
                    type="text" 
                    className="input-field text-2xl text-center py-4 font-black"
                    placeholder="Ej: 14"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-bold">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setScanResult(null)}
                    className="py-4 rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition-all"
                  >
                    Re-escanear
                  </button>
                  <button 
                    type="submit" 
                    className="btn-gold py-4 text-lg"
                    disabled={loading}
                  >
                    {loading ? 'Asignando...' : 'Confirmar Mesa'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
