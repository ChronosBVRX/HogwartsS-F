import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Shield, Zap, Sword, Sparkles, ArrowLeft, Star, AlertTriangle, HelpCircle } from 'lucide-react'
import { SPELLS } from '../../lib/duelSpells'
import { STANCES } from '../../lib/duelRules'

const FAMILY_NAMES = {
  attack: 'Ataque Directo',
  heavy: 'Ataque Pesado',
  defense: 'Defensa',
  control: 'Control',
  counter: 'Contrahechizo',
  heal: 'Curación',
  charge: 'Carga Mágica',
  disarm: 'Desarme'
}

const SPELL_TIPS = {
  expelliarmus: "Ideal para cortar ataques pesados como Stupefy.",
  stupefy: "Úsalo cuando creas que el rival va a curarse o cargar energía.",
  protego: "Úsalo cuando sospeches que viene un golpe fuerte.",
  petrificus: "Úsalo contra rivales que se protegen demasiado.",
  finite: "Úsalo para cancelar control como Confundus o Petrificus.",
  episkey: "Úsalo cuando necesites recuperarte, pero evita hacerlo frente a ataques pesados.",
  incendio: "Presiona al rival con daño constante.",
  confundus: "Rompe defensas y castiga rivales predecibles.",
  accio: "Recupera energía, pero cuidado: los ataques pueden castigarte mientras cargas.",
  rictusempra: "Ataque ligero, barato y útil para presionar sin gastar demasiado."
}

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
            <p>• Un hechizo puede consumir <span className="text-white font-bold">1 o 2 AP</span>.</p>
            <p>• Puedes mezclar acciones siempre que no superes los <span className="text-white font-bold">2 AP</span> totales.</p>
          </div>
        </section>

        {/* Energy Section */}
        <section className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-spell-blue/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-spell-blue" />
             </div>
             <h3 className="font-black uppercase italic tracking-tight">La Energía</h3>
          </div>
          <div className="space-y-3 text-sm text-white/60">
            <p>• La <span className="text-magical-gold font-bold">Energía (⚡)</span> es el recurso para lanzar hechizos.</p>
            <p>• Cada hechizo tiene un <span className="text-white font-bold">Costo de Energía</span> específico.</p>
            <p>• Recuperas energía con <span className="italic">Accio Energía</span> o mediante bonos de postura.</p>
          </div>
        </section>

        {/* Stances Glossary */}
        <section className="space-y-6">
          <h3 className="text-[10px] font-black uppercase text-magical-gold tracking-[0.4em] text-center">Glosario de Estilos</h3>
          <div className="grid gap-3">
             {Object.values(STANCES).map(s => (
               <StanceRow 
                 key={s.key} 
                 name={s.name} 
                 desc={s.description} 
                 icon={
                   s.key === 'neutral' ? '🪄' : 
                   s.key === 'offensive' ? '⚔️' : 
                   s.key === 'defensive' ? '🛡️' : 
                   s.key === 'concentrated' ? '🧘' : 
                   s.key === 'cunning' ? '🧠' : '🔥'
                 } 
               />
             ))}
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

        {/* Why you lose health */}
        <section className="bg-impact-red/5 border border-impact-red/20 rounded-[2rem] p-8 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-impact-red" />
            <h3 className="text-sm font-black uppercase italic">¿Por qué pierdes vida?</h3>
          </div>
          <p className="text-xs text-white/60 leading-relaxed italic">
            “Después de cada turno, el juego te muestra un veredicto y un análisis del impacto. Si recibiste mucho daño, normalmente fue por una de estas razones: el rival tuvo ventaja de familia, usaste una postura riesgosa, bloqueaste poco, tu segunda acción fue interrumpida o hubo modificadores especiales.”
          </p>
        </section>

        {/* Hechizos del Duelista */}
        <section className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-[10px] font-black uppercase text-magical-gold tracking-[0.4em]">Hechizos del Duelista</h3>
            <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest text-center">Conoce tu arsenal mágico</p>
          </div>
          
          <div className="grid gap-4">
            {Object.values(SPELLS).map(spell => (
              <div key={spell.key} className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-4 hover:border-magical-gold/20 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-black uppercase italic text-white leading-none">{spell.name}</h4>
                    <span className="text-[9px] font-black text-magical-gold uppercase tracking-[0.2em]">{FAMILY_NAMES[spell.family]}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded-lg border border-white/5">
                      <Sword className="w-3 h-3 text-white/40" />
                      <span className="text-[10px] font-black">{spell.apCost} AP</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-magical-gold/10 rounded-lg border border-magical-gold/20">
                      <Zap className="w-3 h-3 text-magical-gold" />
                      <span className="text-[10px] font-black text-magical-gold">{spell.energyCost} ⚡</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 text-[10px] font-black uppercase tracking-tight">
                  {spell.damage > 0 && <span className="text-impact-red">⚔️ Daño: {spell.damage}</span>}
                  {spell.block > 0 && <span className="text-spell-blue">🛡️ Bloqueo: {spell.block}</span>}
                  {spell.heal > 0 && <span className="text-healing-green">💚 Salud: +{spell.heal}</span>}
                  {spell.energyGain > 0 && <span className="text-magical-gold">⚡ Energía: +{spell.energyGain}</span>}
                </div>

                <p className="text-[11px] text-white/40 leading-relaxed font-medium">{spell.description}</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-healing-green/40 uppercase tracking-widest">Fuerte vs</p>
                    <div className="flex flex-wrap gap-1">
                      {spell.beats.map(f => (
                        <span key={f} className="text-[8px] font-bold px-1.5 py-0.5 bg-healing-green/10 text-healing-green rounded uppercase">{FAMILY_NAMES[f] || f}</span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-impact-red/40 uppercase tracking-widest">Débil vs</p>
                    <div className="flex flex-wrap gap-1">
                      {spell.losesTo.map(f => (
                        <span key={f} className="text-[8px] font-bold px-1.5 py-0.5 bg-impact-red/10 text-impact-red rounded uppercase">{FAMILY_NAMES[f] || f}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-start gap-2 bg-magical-gold/5 p-3 rounded-2xl border border-magical-gold/10">
                    <HelpCircle className="w-3.5 h-3.5 text-magical-gold shrink-0 mt-0.5" />
                    <p className="text-[10px] italic text-white/70 leading-relaxed">
                      <span className="font-black uppercase not-italic text-magical-gold mr-1 text-[9px]">Consejo:</span>
                      "{SPELL_TIPS[spell.key] || 'Úsalo con sabiduría estratégica.'}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Expert Tips */}
        <section className="p-8 bg-gradient-to-tr from-magical-gold/10 to-transparent rounded-[2.5rem] border border-magical-gold/20 space-y-4">
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

        <div className="space-y-4 pt-6">
          <button 
            onClick={() => navigate('/duelos/hechizos')}
            className="w-full py-4 bg-white/5 border border-white/10 text-white/60 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all"
          >
            Ver Guía completa de Hechizos
          </button>

          <button 
            onClick={() => navigate('/duelos')}
            className="w-full py-6 bg-magical-gold text-magical-navy font-black uppercase italic tracking-widest rounded-2xl shadow-[0_15px_40px_rgba(212,175,55,0.4)] active:scale-95 transition-all"
          >
            ¡Entendido!
          </button>
        </div>
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
        <p className="text-[10px] text-white/40 leading-tight mt-1">{desc}</p>
      </div>
    </div>
  )
}
