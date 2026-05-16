import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { withTimeout } from '../../lib/supabaseSafe'
import { ChevronLeft, Info, CheckCircle2, AlertCircle, QrCode } from 'lucide-react'
import QRScanner from '../../components/QRScanner'

export default function WaiterScanner() {
  const [scanResult, setScanResult] = useState(null)
  const [tableNumber, setTableNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const navigate = useNavigate()
  
  const handleScan = (decodedText) => {
    setShowScanner(false)
    if (decodedText.startsWith('reward-')) {
      setError('⚠️ Escaneaste un QR de Recompensa. Ve al panel principal y usa el "Escáner de Recompensas".')
      return
    }
    setError(null)
    setScanResult(decodedText)
  }

  const handleAssignTable = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1. Check if token exists
    const { data: session, error: fetchError } = await withTimeout(
      supabase
        .from('hsf_visit_sessions')
        .select('*')
        .eq('qr_token', scanResult?.trim())
        .eq('status', 'qr_generated')
        .gt('qr_expires_at', new Date().toISOString())
        .single(),
      8000,
      'Buscando token'
    )

    if (fetchError || !session) {
      setError('Código QR no válido o expirado.')
      setLoading(false)
      return
    }

    // 2. Update session
    const { error: updateError } = await withTimeout(
      supabase
        .from('hsf_visit_sessions')
        .update({
          status: 'seated',
          table_number: tableNumber,
          seated_by: (await supabase.auth.getUser()).data.user.id,
          seated_at: new Date().toISOString()
        })
        .eq('id', session.id),
      8000,
      'Asignando mesa'
    )

    if (updateError) {
      console.error("Update Error:", updateError)
      setError('Error al asignar mesa. Verifica la conexión.')
      setLoading(false)
    } else {
      alert('¡Mesa asignada con éxito!')
      navigate('/mesero')
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col max-w-2xl mx-auto w-full space-y-6 pb-20">
      {showScanner && (
        <QRScanner
          title="Validando Pase"
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

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
          <div className="relative flex flex-col items-center justify-center p-8 text-center space-y-8 min-h-[300px]">
            {!scanResult ? (
              <>
                <div className="relative group">
                  <div className="absolute inset-0 bg-magical-gold/20 blur-3xl rounded-full scale-150 group-hover:bg-magical-gold/30 transition-all duration-700" />
                  <div className="relative p-10 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl">
                    <QrCode className="w-20 h-20 text-magical-gold animate-float" />
                  </div>
                </div>

                <button 
                  onClick={() => setShowScanner(true)}
                  className="btn-gold px-12 py-5 text-sm font-black uppercase tracking-widest flex items-center gap-3"
                >
                  <QrCode className="w-5 h-5" />
                  Escanear Pase
                </button>
              </>
            ) : (
              <div className="w-full space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="p-4 bg-green-500/20 rounded-full w-fit mx-auto">
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-black uppercase italic text-white">¡Escaneado con éxito!</h2>
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Token: {scanResult.substring(0, 8)}...</p>
                </div>
                <button 
                  onClick={() => { setScanResult(null); setShowScanner(true); }}
                  className="text-[10px] font-black text-magical-gold uppercase tracking-widest hover:underline"
                >
                  Escanear otro pase
                </button>
              </div>
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
