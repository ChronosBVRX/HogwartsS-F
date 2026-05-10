import { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Gift, Sparkles, ChevronLeft } from 'lucide-react'

export default function AdventureReward() {
  const { runId } = useParams()
  const location = useLocation()
  const [reward, setReward] = useState(location.state || null)

  useEffect(() => {
    fetchReward()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  const fetchReward = async () => {
    const { data } = await supabase
      .from('hsf_adventure_rewards')
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) setReward(data)
  }

  const title = reward?.reward_title || reward?.rewardTitle || 'Recompensa mágica desbloqueada'
  const description = reward?.reward_description || reward?.rewardDescription || reward?.completion_text || 'Muestra esta pantalla al personal para validar tu recompensa.'

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-4 md:p-6 pb-24 flex items-center">
      <div className="glass-card rounded-[2.5rem] border border-magical-gold/30 overflow-hidden w-full text-center relative">
        <Sparkles className="absolute -right-8 -top-8 w-40 h-40 text-magical-gold/10" />

        <div className="p-10 md:p-12 space-y-8 relative z-10">
          <div className="w-24 h-24 mx-auto rounded-full bg-magical-gold/10 border border-magical-gold/30 flex items-center justify-center">
            <Gift className="w-12 h-12 text-magical-gold" />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-magical-gold">
              Aventura completada
            </p>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
              {title}
            </h1>
            <p className="text-white/60 leading-relaxed">{description}</p>
          </div>

          {Number(reward?.reward_points || 0) > 0 && (
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Puntos obtenidos</p>
              <p className="text-4xl font-black text-magical-gold">+{reward.reward_points}</p>
            </div>
          )}

          {Number(reward?.min_consumption || 0) > 0 && (
            <div className="bg-magical-gold/5 border border-magical-gold/20 p-5 rounded-2xl">
              <p className="text-[10px] text-magical-gold uppercase font-black tracking-widest">
                Válido con consumo mínimo de ${reward.min_consumption}
              </p>
            </div>
          )}

          <div className="grid gap-3">
            <Link to="/perfil" className="btn-gold w-full py-5 text-sm font-black uppercase">
              Ver mi perfil
            </Link>
            <Link to="/aventura" className="flex items-center justify-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4" />
              Volver a aventuras
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
