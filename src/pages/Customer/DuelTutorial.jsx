import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Sword, Shield, Zap, ChevronRight, ChevronLeft, Play } from 'lucide-react'

const STEPS = [
  {
    title: "El Arte del Ataque",
    desc: "Usa hechizos como Rictusempra para dañar al rival. Recuerda que los ataques directos vencen a los que intentan cargar energía.",
    icon: <Sword className="w-12 h-12 text-impact-red" />,
    color: "from-impact-red/20 to-transparent",
    tip: "Tip: Los ataques pesados (2 AP) como Stupefy ocupan todo el turno, pero causan un alto impacto."
  },
  {
    title: "Defensa y Postura",
    desc: "Antes de atacar, elige tu estilo. La 'Guardia Protegida' aumenta tu bloqueo, ideal si esperas un golpe fuerte del rival.",
    icon: <Shield className="w-12 h-12 text-spell-blue" />,
    color: "from-spell-blue/20 to-transparent",
    tip: "Tip: Protego reduce ataques fuertes y es clave para sobrevivir a un combo rival."
  },
  {
    title: "Domina los Combos",
    desc: "Tienes 2 movimientos por turno. Puedes lanzar Protego (1) y luego Accio Energía (1) para defenderte y recargar recursos a la vez.",
    icon: <Zap className="w-12 h-12 text-magical-gold" />,
    color: "from-magical-gold/20 to-transparent",
    tip: "Tip: Accio Energía es fundamental para preparar tus jugadas más potentes en el siguiente turno."
  }
]

export default function DuelTutorial() {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-magical-navy text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('/assets/textures/magical-grid.svg')] opacity-10 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-magical-gold/5 blur-[120px] rounded-full" />
      
      <div className="max-w-md w-full z-10 space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-magical-gold/10 border border-magical-gold/20 rounded-full">
            <Sparkles className="w-3 h-3 text-magical-gold" />
            <span className="text-[10px] font-black uppercase tracking-widest text-magical-gold">Clase de Duelo</span>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Entrenamiento <br/><span className="text-magical-gold">Mágico</span></h1>
        </div>

        {/* Slide Card */}
        <div className={`relative p-8 rounded-[2.5rem] border border-white/10 bg-gradient-to-b ${STEPS[current].color} backdrop-blur-xl transition-all duration-500 overflow-hidden`}>
           <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-5 bg-black/40 rounded-3xl border border-white/5 animate-bounce-slow">
                {STEPS[current].icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase italic text-white tracking-tight">{STEPS[current].title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{STEPS[current].desc}</p>
              </div>
              <div className="w-full p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold text-magical-gold/80 italic">{STEPS[current].tip}</p>
              </div>
           </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button 
            disabled={current === 0}
            onClick={() => setCurrent(c => c - 1)}
            className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all bg-black/40"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex gap-2">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-magical-gold' : 'w-2 bg-white/10'}`} />
            ))}
          </div>

          {current < STEPS.length - 1 ? (
            <button 
              onClick={() => setCurrent(c => c + 1)}
              className="w-14 h-14 rounded-2xl bg-magical-gold text-magical-navy flex items-center justify-center active:scale-90 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          ) : (
            <button 
              onClick={() => navigate('/duelos')}
              className="px-6 h-14 rounded-2xl bg-healing-green text-magical-navy font-black uppercase italic text-sm flex items-center gap-2 active:scale-90 transition-all"
            >
              ¡A Luchar! <Play className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>

        <button onClick={() => navigate('/duelos')} className="w-full text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">
          Saltar tutorial
        </button>
      </div>
    </div>
  )
}
