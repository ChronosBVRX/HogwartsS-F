import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { withTimeout } from '../../lib/supabaseSafe'
import { ChevronLeft, Info, CheckCircle2, AlertCircle, Gift } from 'lucide-react'
import QRScanner from '../../components/QRScanner'

export default function RewardScanner() {
  const [scanResult, setScanResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rewardDetails, setRewardDetails] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const navigate = useNavigate()
  
  const handleScan = async (decodedText) => {
    setShowScanner(false)
    setScanResult(decodedText)
    setLoading(true)
    setError(null)
    setRewardDetails(null)

    if (!decodedText.startsWith('reward-')) {
      setError('El código escaneado no es de una recompensa válida.')
      setLoading(false)
      return
    }

    const rewardId = decodedText.replace('reward-', '')

    const { data: reward, error: fetchError } = await withTimeout(
      supabase
        .from('hsf_adventure_rewards')
        .select('*, customer:hsf_profiles!hsf_adventure_rewards_customer_id_fkey(display_name, house_slug)')
        .eq('id', rewardId)
        .single(),
      8000,
      'Buscando recompensa'
    )

    if (fetchError || !reward) {
      setError('Recompensa no encontrada o código inválido.')
      setLoading(false)
      return
    }

    if (reward.status === 'redeemed') {
      setError('Esta recompensa ya fue reclamada.')
      setLoading(false)
      return
    }

    setRewardDetails(reward)
    setLoading(false)
  }

  const handleRedeem = async () => {
    setLoading(true)
    setError(null)

    const { error: updateError } = await withTimeout(
      supabase
        .from('hsf_adventure_rewards')
        .update({
          status: 'redeemed',
          redeemed_by: (await supabase.auth.getUser()).data.user.id,
          redeemed_at: new Date().toISOString()
        })
        .eq('id', rewardDetails.id),
      8000,
      'Canjeando recompensa'
    )

    if (updateError) {
      console.error("Update Error:", updateError)
      setError('Error al canjear la recompensa. Verifica la conexión.')
      setLoading(false)
    } else {
      alert('¡Recompensa canjeada con éxito!')
      navigate('/mesero')
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col max-w-2xl mx-auto w-full space-y-6 pb-20">
      {showScanner && (
        <QRScanner
          title="Escaneando Recompensa"
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
          <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-magical-gold">Escáner de Recompensas</h1>
          <p className="text-[9px] text-white/40 uppercase font-bold tracking-widest mt-1">Canje de Beneficios Mágicos</p>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="relative flex flex-col items-center justify-center p-8 text-center space-y-8 min-h-[300px]">
            {!scanResult ? (
              <>
                <div className="relative group">
                  <div className="absolute inset-0 bg-magical-gold/20 blur-3xl rounded-full scale-150 group-hover:bg-magical-gold/30 transition-all duration-700" />
                  <div className="relative p-10 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl">
                    <Gift className="w-20 h-20 text-magical-gold animate-float" />
                  </div>
                </div>

                <button 
                  onClick={() => setShowScanner(true)}
                  className="btn-gold px-12 py-5 text-sm font-black uppercase tracking-widest flex items-center gap-3"
                >
                  <Gift className="w-5 h-5" />
                  Escanear Recompensa
                </button>
              </>
            ) : rewardDetails ? (
              <div className="w-full space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="p-4 bg-green-500/20 rounded-full w-fit mx-auto">
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-xl font-black uppercase italic text-white">Recompensa Validada</h2>
                  
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4 text-left">
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-magical-gold">Comensal</p>
                        <p className="text-lg font-bold text-white">{rewardDetails.customer?.display_name || 'Desconocido'}</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-magical-gold">Tipo de Recompensa</p>
                        <p className="text-lg font-bold text-white">{rewardDetails.reward_title}</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-magical-gold">Beneficio a entregar</p>
                        <p className="text-xl font-black italic tracking-tighter text-magical-gold">{rewardDetails.reward_description}</p>
                     </div>
                  </div>
                </div>

                <button 
                  onClick={handleRedeem}
                  className="btn-gold w-full py-5 text-sm font-black uppercase italic tracking-tighter"
                  disabled={loading}
                >
                  {loading ? 'Canjeando...' : 'Confirmar Entrega'}
                </button>

                <button 
                  onClick={() => { setScanResult(null); setRewardDetails(null); setShowScanner(true); }}
                  className="text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white mt-4"
                >
                  Cancelar y escanear otro
                </button>
              </div>
            ) : null}
          </div>

          <div className="space-y-8">
            {!scanResult && (
              <div className="flex items-start gap-4 bg-white/5 p-6 rounded-2xl border border-white/5">
                <Info className="w-5 h-5 text-magical-gold shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs text-white/80 font-bold uppercase tracking-widest">Instrucciones</p>
                  <p className="text-[10px] text-white/40 leading-relaxed italic">
                    Apunta al QR de la recompensa en el perfil del cliente. El sistema verificará que no haya sido reclamada previamente.
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
