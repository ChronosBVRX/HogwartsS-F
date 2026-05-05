import { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle2 } from 'lucide-react'

export default function WaiterScanner() {
  const { user } = useAuth()
  const [scanning, setScanning] = useState(true)
  const [customerVisit, setCustomerVisit] = useState(null)
  const [tableNumber, setTableNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', { 
      fps: 10, 
      qrbox: { width: 250, height: 250 } 
    })

    scanner.render(onScanSuccess, onScanError)

    function onScanSuccess(decodedText) {
      scanner.clear()
      setScanning(false)
      fetchVisit(decodedText)
    }

    function onScanError(err) {
      // console.warn(err)
    }

    return () => scanner.clear()
  }, [])

  const fetchVisit = async (token) => {
    const { data, error } = await supabase
      .from('hsf_visit_sessions')
      .select('*, customer:hsf_profiles!customer_id(*)')
      .eq('qr_token', token)
      .eq('status', 'qr_generated')
      .single()

    if (error) {
      alert('Código inválido o sesión ya procesada.')
      window.location.reload()
    } else {
      setCustomerVisit(data)
    }
  }

  const handleAssignTable = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('hsf_visit_sessions')
      .update({
        status: 'seated',
        table_number: tableNumber,
        seated_by: user.id,
        seated_at: new Date().toISOString()
      })
      .eq('id', customerVisit.id)

    if (error) {
      alert(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/mesero'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 p-6 flex flex-col max-w-md mx-auto w-full space-y-6">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate('/mesero')} className="p-2 bg-white/5 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Escáner de Asistencia</h1>
      </header>

      {scanning && (
        <div className="glass-card p-4 overflow-hidden">
          <div id="reader"></div>
          <p className="text-center text-xs text-white/40 mt-4">Enfoca el código QR del cliente</p>
        </div>
      )}

      {customerVisit && !success && (
        <div className="glass-card p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-magical-gold">Cliente Detectado</h2>
            <p className="text-lg">{customerVisit.customer.display_name}</p>
          </div>

          <form onSubmit={handleAssignTable} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-white/60">Número de Mesa</label>
              <input 
                type="text" 
                className="input-field text-center text-2xl font-bold py-4"
                placeholder="Ej: 05"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-gold w-full py-4 text-lg" disabled={loading}>
              {loading ? 'Asignando...' : 'Confirmar Asistencia'}
            </button>
          </form>
        </div>
      )}

      {success && (
        <div className="glass-card p-12 flex flex-col items-center gap-4 text-center animate-in zoom-in">
          <CheckCircle2 className="w-20 h-20 text-green-500" />
          <h2 className="text-2xl font-bold text-white">Mesa Asignada</h2>
          <p className="text-white/60 text-lg">Mesa: {tableNumber}</p>
        </div>
      )}
    </div>
  )
}
