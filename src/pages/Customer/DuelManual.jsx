import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Shield, Zap, Sword, Sparkles, ArrowLeft, Star } from 'lucide-react'

export default function DuelManual() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-magical-navy text-white pb-12">
      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-magical-navy/80 backdrop-blur-md z-30 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-xl border border-white/10 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-magical-gold" />
          <h1 className="text-sm font-black uppercase tracking-widest">Manual del Duelista</h1>
        </div>
        <div className="w-9" />
      </header>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Intro */}
        <section className="text-center space-y-4">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Reglas de <br/><span className="text-magical-gold">Combate</span></h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Domina las artes arcanas y vence a cualquier oponente con estrategia pura.
          </p>
        </section>

        {/* Action Points Section */}
        <section className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-magical-gold/20 flex items-center justify-center">
               <Zap className="w-4 h-4 text-magical-gold" />
             </div>
             <h3 className="font-black uppercase italic tracking-tight">El Turno y los Movimientos</h3>
          </div>
          <div className="space-y-3 text-sm text-white/60">
            <p>• Cada turno tienes <span className="text-white font-bold">2 Movimientos (AP)</span>.</p>
            <p>• Hechizos ligeros consumen <span className="text-white font-bold">1 AP</span>.</p>
            <p>• Hechizos pesados (como Stupefy) consumen <span className="text-white font-bold">2 AP</span>.</p>
            <p>• Puedes mezclar acciones: p.ej. <span className="italic">Defensa + Carga de Energía</span>.</p>
          </div>
        </section>

        {/* Stances Glossary */}
        <section className="space-y-6">
          <h3 className="text-[10px] font-black uppercase text-magical-gold tracking-[0.4em] text-center">Glosario de Estilos</h3>
          <div className="grid gap-3">
             <StanceRow name="Ataque Valiente" desc="+5 Daño / +4 Daño recibido" icon="⚔️" />
             <StanceRow name="Guardia Protegida" desc="+8 Bloqueo / -4 Daño" icon="🛡️" />
             <StanceRow name="Enfoque Arcano" desc="+1 Energía si no recibes daño fuerte" icon="🧘" />
             <StanceRow name="Lectura Táctica" desc="Bonus si tu familia de hechizo vence al rival" icon="🧠" />
             <StanceRow name="Último Recurso" desc="Potencia desesperada cuando tienes poca vida" icon="🔥" />
          </div>
        </section>

        {/* Spell Families */}
        <section className="space-y-6">
          <h3 className="text-[10px] font-black uppercase text-magical-gold tracking-[0.4em] text-center">Triángulo de Poder</h3>
          <div className="grid grid-cols-2 gap-4 text-[10px]">
             <div className="p-4 bg-black/40 border border-impact-red/20 rounded-2xl">
               <p className="text-impact-red font-black uppercase mb-1">Ataque</p>
               <p className="text-white/50">Vence a Carga y Curación.</p>
             </div>
             <div className="p-4 bg-black/40 border border-spell-blue/20 rounded-2xl">
               <p className="text-spell-blue font-black uppercase mb-1">Defensa</p>
               <p className="text-white/50">Vence a Ataque y Ataque Pesado.</p>
             </div>
             <div className="p-4 bg-black/40 border border-control-purple/20 rounded-2xl">
               <p className="text-control-purple font-black uppercase mb-1">Control</p>
               <p className="text-white/50">Vence a Defensa.</p>
             </div>
             <div className="p-4 bg-black/40 border border-healing-green/20 rounded-2xl">
               <p className="text-healing-green font-black uppercase mb-1">Contrahechizo</p>
               <p className="text-white/50">Vence a Control.</p>
             </div>
          </div>
        </section>

        {/* Expert Tips */}
        <section className="p-6 bg-gradient-to-tr from-magical-gold/10 to-transparent rounded-3xl border border-magical-gold/20 space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-magical-gold fill-current" />
            <h3 className="text-sm font-black uppercase italic">Consejos de Experto</h3>
          </div>
          <ul className="space-y-3 text-xs text-white/70 italic">
            <li>"No gastes toda tu energía en el primer turno. La paciencia gana duelos."</li>
            <li>"Usa Protego si el rival tiene mucha energía; es probable que lance un ataque pesado."</li>
            <li>"Combina Accio Energía con una postura defensiva para recargar sin peligro."</li>
          </ul>
        </section>

        <button 
          onClick={() => navigate('/duelos')}
          className="w-full py-5 bg-magical-gold text-magical-navy font-black uppercase italic tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all"
        >
          ¡Entendido!
        </button>
      </div>
    </div>
  )
}

function StanceRow({ name, desc, icon }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-[10px] font-black uppercase text-white tracking-widest">{name}</p>
        <p className="text-[10px] text-white/40">{desc}</p>
      </div>
    </div>
  )
}
