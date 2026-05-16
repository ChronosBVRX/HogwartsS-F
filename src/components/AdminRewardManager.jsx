import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { withTimeout } from '../lib/supabaseSafe'
import { formatMagicalText } from '../utils/magicalFormatters'
import { Gift, CheckCircle2, AlertCircle, Search, Check } from 'lucide-react'

export default function AdminRewardManager() {
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('available')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchData()
  }, [filter])

  const fetchData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('hsf_adventure_rewards')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await withTimeout(query, 8000, 'Cargando recompensas')
      if (error) throw error

      let finalRewards = data || []
      if (finalRewards.length > 0) {
        const customerIds = [...new Set(finalRewards.map(r => r.customer_id).filter(Boolean))]
        if (customerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('hsf_profiles')
            .select('user_id, display_name, phone')
            .in('user_id', customerIds)
          
          if (profilesData) {
            const profileMap = Object.fromEntries(profilesData.map(p => [p.user_id, p]))
            finalRewards = finalRewards.map(r => ({
              ...r,
              customer: profileMap[r.customer_id] || null
            }))
          }
        }
      }

      setRewards(finalRewards)
    } catch (err) {
      console.error('[ADMIN REWARDS FETCH ERROR]', err)
      setMessage('No se pudieron cargar las recompensas.')
    } finally {
      setLoading(false)
    }
  }

  const redeemReward = async (rewardId) => {
    if (!confirm('¿Marcar esta recompensa como canjeada?')) return

    const { data, error } = await supabase.rpc('hsf_redeem_adventure_reward', {
      p_reward_id: rewardId
    })

    if (error || !data?.ok) {
      alert(error?.message || data?.message || 'No se pudo canjear la recompensa.')
      return
    }

    setMessage('Recompensa canjeada correctamente.')
    fetchData()
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {message && (
        <div className="bg-green-400/10 border border-green-400/20 text-green-400 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <p className="text-xs font-black uppercase tracking-widest">{message}</p>
        </div>
      )}

      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
          <div className="flex items-center gap-3">
            <Gift className="w-5 h-5 text-magical-gold" />
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Gestión de Recompensas y Beneficios</h2>
          </div>
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
            {['available', 'redeemed', 'all'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                  filter === s ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
                }`}
              >
                {s === 'available' ? 'Pendientes / Disponibles' : s === 'redeemed' ? 'Canjeadas' : 'Todas'}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card overflow-hidden border border-white/10">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-6 py-5">Mago / Estudiante</th>
                  <th className="px-6 py-5">Tipo de Recompensa</th>
                  <th className="px-6 py-5">Descripción del Beneficio</th>
                  <th className="px-6 py-5">Fecha</th>
                  <th className="px-6 py-5">Estado</th>
                  <th className="px-6 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan="6" className="px-6 py-16 text-center text-white/20 uppercase font-black tracking-widest">Cargando recompensas...</td></tr>
                ) : rewards.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-16 text-center text-white/20 uppercase font-black tracking-widest">Sin recompensas en este estado</td></tr>
                ) : rewards.map((reward) => (
                  <tr key={reward.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-white uppercase italic text-xs">{reward.customer?.display_name || 'Desconocido'}</div>
                      <div className="text-[9px] text-white/30">{reward.customer?.phone || 'Sin teléfono'}</div>
                    </td>
                    <td className="px-6 py-5 font-black text-magical-gold uppercase italic text-xs">{formatMagicalText(reward.reward_title)}</td>
                    <td className="px-6 py-5 text-white/70 text-xs max-w-xs">{formatMagicalText(reward.reward_description)}</td>
                    <td className="px-6 py-5 text-white/40 text-[10px]">{new Date(reward.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-5">
                      <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest border ${
                        reward.status === 'available'
                          ? 'border-green-500/20 text-green-400 bg-green-500/5'
                          : 'border-white/10 text-white/30 bg-white/5'
                      }`}>
                        {reward.status === 'available' ? 'Disponible' : 'Canjeada'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {reward.status === 'available' && (
                        <button
                          onClick={() => redeemReward(reward.id)}
                          className="px-4 py-2 bg-magical-gold text-magical-navy rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 ml-auto hover:bg-magical-gold/80 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Canjear
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            Gestión Centralizada: Aquí puedes verificar y marcar como canjeadas las recompensas sorpresa generadas por aventuras o por el Mapa del Merodeador, en caso de que el mesero no tenga su escáner a la mano.
          </p>
        </div>
      </section>
    </div>
  )
}
