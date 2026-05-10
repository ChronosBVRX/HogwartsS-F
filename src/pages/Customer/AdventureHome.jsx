import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Wand2, QrCode, Gift, Map, AlertCircle, Sparkles } from 'lucide-react'

export default function AdventureHome() {
  const [state, setState] = useState(null)
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdventure()
    fetchRewards()
  }, [])

  const fetchAdventure = async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('hsf_get_active_adventure')
    if (!error) setState(data)
    setLoading(false)
  }

  const fetchRewards = async () => {
    const { data } = await supabase
      .from('hsf_adventure_rewards')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    setRewards(data || [])
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 pb-24 space-y-8 animate-in fade-in duration-700">
      <header className="glass-card p-8 md:p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
        <Sparkles className="absolute -right-8 -bottom-8 w-40 h-40 text-magical-gold/5" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-magical-gold">
            <Map className="w-6 h-6" />
            <p className="text-[10px] font-black uppercase tracking-[0.35em]">Experiencia interactiva por zonas</p>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">
            Aventura <span className="text-magical-gold">Mágica</span>
          </h1>
          <p className="text-white/55 max-w-2xl leading-relaxed">
            Recorre las zonas del restaurante, escanea los sellos mágicos y resuelve acertijos difíciles para desbloquear una recompensa.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="p-16 text-center text-magical-gold uppercase font-black tracking-widest animate-pulse">
          Consultando el mapa...
        </div>
      ) : state?.has_active ? (
        <section className="glass-card p-8 rounded-[2.5rem] border border-magical-gold/20 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-magical-gold/10 rounded-2xl text-magical-gold">
              <Wand2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-magical-gold">Aventura activa</p>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">{state.title}</h2>
              <p className="text-white/50 text-sm">Etapa actual: {state.current_step_order}</p>
            </div>
          </div>

          {state.needs_scan ? (
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
              <div className="flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-magical-gold shrink-0 mt-1" />
                <p className="text-white/60 italic">{state.clue || 'Busca el siguiente portal mágico.'}</p>
              </div>
              <Link to="/aventura/escanear" className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase">
                <QrCode className="w-5 h-5" />
                Escanear siguiente sello
              </Link>
            </div>
          ) : (
            <Link to={`/aventura/jugar/${state.run_id}`} className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase">
              <Wand2 className="w-5 h-5" />
              Continuar pregunta
            </Link>
          )}
        </section>
      ) : (
        <section className="glass-card p-8 rounded-[2.5rem] border border-white/10 space-y-6 text-center">
          <Wand2 className="w-16 h-16 text-magical-gold mx-auto" />
          <div className="space-y-2">
            <h2 className="text-3xl font-black uppercase italic text-white">Comienza desde cualquier zona</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Escanea el póster QR de Gryffindor, Slytherin, Gran Comedor, Callejón Diagon o Zona Disney. El sistema elegirá una aventura rotativa según el portal donde inicies.
            </p>
          </div>
          <Link to="/aventura/escanear" className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-sm font-black uppercase">
            <QrCode className="w-5 h-5" />
            Escanear primer sello
          </Link>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Gift className="w-5 h-5 text-magical-gold" />
          <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/40">Mis recompensas mágicas</h2>
        </div>

        <div className="glass-card overflow-hidden divide-y divide-white/5">
          {rewards.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-xs font-black uppercase tracking-widest">
              Aún no tienes recompensas de aventura.
            </div>
          ) : rewards.map((reward) => (
            <div key={reward.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-white font-black uppercase italic">{reward.reward_title}</p>
                <p className="text-white/40 text-xs mt-1">{reward.reward_description}</p>
                {Number(reward.min_consumption) > 0 && (
                  <p className="text-[10px] text-magical-gold mt-2 uppercase font-black">
                    Consumo mínimo: ${reward.min_consumption}
                  </p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] uppercase font-black tracking-widest border ${
                reward.status === 'available'
                  ? 'border-green-500/20 text-green-400 bg-green-500/5'
                  : 'border-white/10 text-white/30 bg-white/5'
              }`}>
                {reward.status === 'available' ? 'Disponible' : reward.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
