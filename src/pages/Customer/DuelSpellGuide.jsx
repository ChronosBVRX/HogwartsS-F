import React from 'react'
import { Link } from 'react-router-dom'
import { SPELLS, HOUSE_POWERS } from '../../lib/duelSpells'
import { ChevronLeft, Wand2, Shield, Zap, Heart, Sparkles, Sword, RefreshCcw } from 'lucide-react'
import AudioToggle from '../../components/AudioToggle'
import audioManager from '../../lib/audioManager'

const FAMILY_LABELS = {
  attack: 'Ataque directo',
  heavy: 'Ataque pesado',
  defense: 'Defensa',
  control: 'Control',
  counter: 'Contrahechizo',
  heal: 'Curación',
  charge: 'Carga mágica',
  disarm: 'Desarme'
}

const FAMILY_COLORS = {
  attack: 'text-impact-red border-impact-red/30 bg-impact-red/10',
  heavy: 'text-control-purple border-control-purple/30 bg-control-purple/10',
  defense: 'text-spell-blue border-spell-blue/30 bg-spell-blue/10',
  control: 'text-control-purple border-control-purple/30 bg-control-purple/10',
  counter: 'text-smoke-white border-white/20 bg-white/10',
  heal: 'text-healing-green border-healing-green/30 bg-healing-green/10',
  charge: 'text-magical-gold border-magical-gold/30 bg-magical-gold/10',
  disarm: 'text-impact-red border-impact-red/30 bg-impact-red/10'
}

const HOUSE_LABELS = {
  red: 'Gryffindor',
  green: 'Slytherin',
  blue: 'Ravenclaw',
  yellow: 'Hufflepuff'
}

const HOUSE_ICONS = {
  red: '🦁',
  green: '🐍',
  blue: '🦅',
  yellow: '🦡'
}

const HOUSE_GRADIENTS = {
  red: 'from-impact-red/20 to-transparent',
  green: 'from-healing-green/20 to-transparent',
  blue: 'from-spell-blue/20 to-transparent',
  yellow: 'from-magical-gold/20 to-transparent'
}

export default function DuelSpellGuide() {
  const spells = Object.values(SPELLS)

  React.useEffect(() => {
    const hasHeardIntro = sessionStorage.getItem('hsf_duel_spell_guide_intro_played')
    if (!hasHeardIntro) {
      audioManager.playVoice('spell_guide_intro', { delayMs: 1000 })
      sessionStorage.setItem('hsf_duel_spell_guide_intro_played', 'true')
    }
  }, [])

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 pb-32 space-y-16 animate-in fade-in duration-1000">
      <header className="relative glass-card p-12 md:p-20 rounded-[3rem] border border-magical-gold/20 overflow-hidden flex flex-col items-center text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-magical-gold/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <div className="inline-flex p-5 rounded-[2rem] bg-magical-gold/10 border border-magical-gold/30 text-magical-gold animate-pulse">
            <Wand2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white drop-shadow-2xl">
              Guía de <span className="text-magical-gold">Hechizos</span>
            </h1>
            <p className="text-smoke-white font-bold text-xs md:text-sm tracking-[0.4em] uppercase opacity-40">Compendio de Sabiduría Arcana</p>
          </div>

          <p className="text-white/60 max-w-2xl mx-auto text-sm md:text-base leading-relaxed font-medium">
            El conocimiento es el arma más poderosa de un mago. Domina las ventajas estratégicas, gestiona tu energía y comprende los beneficios ancestrales de tu casa.
          </p>

          <Link to="/duelos" className="inline-flex items-center gap-2 text-magical-gold hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em] group bg-magical-gold/5 px-6 py-3 rounded-full border border-magical-gold/20 hover:border-magical-gold">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al Castillo
          </Link>
        </div>
      </header>

      {/* Quick Advantage Table */}
      <section className="space-y-10">
        <div className="flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-magical-gold/20" />
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            Tríada de Ventajas
          </h2>
          <div className="h-[1px] flex-1 bg-magical-gold/20" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { a: 'Defensa', b: 'vence a', c: 'Ataque Directo y Pesado', icon: <Shield className="w-5 h-5" />, color: 'text-spell-blue' },
            { a: 'Control', b: 'vence a', c: 'Hechizos de Defensa', icon: <Sparkles className="w-5 h-5" />, color: 'text-control-purple' },
            { a: 'Contrahechizo', b: 'vence a', c: 'Hechizos de Control', icon: <RefreshCcw className="w-5 h-5" />, color: 'text-smoke-white' },
            { a: 'Ataque Pesado', b: 'vence a', c: 'Curación y Carga', icon: <Zap className="w-5 h-5" />, color: 'text-impact-red' },
            { a: 'Desarme', b: 'vence a', c: 'Ataques Pesados', icon: <Sword className="w-5 h-5" />, color: 'text-impact-red' },
            { a: 'Ataque Directo', b: 'vence a', c: 'Carga Mágica', icon: <Zap className="w-5 h-5" />, color: 'text-impact-red' },
            { a: 'Curación', b: 'aprovecha', c: 'Turnos Defensivos', icon: <Heart className="w-5 h-5" />, color: 'text-healing-green' },
            { a: 'Carga Mágica', b: 'aprovecha', c: 'Contrahechizos Vacíos', icon: <Zap className="w-5 h-5" />, color: 'text-magical-gold' }
          ].map((row, index) => (
            <div key={index} className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col gap-3 group hover:border-magical-gold/40 transition-all">
              <div className={`${row.color} opacity-60 group-hover:opacity-100 transition-opacity`}>{row.icon}</div>
              <p className="text-white font-black uppercase italic text-lg tracking-tighter">{row.a}</p>
              <p className="text-magical-gold text-[9px] font-black uppercase tracking-[0.3em]">{row.b}</p>
              <p className="text-white/50 text-xs font-bold leading-tight">{row.c}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Spell Catalog */}
      <section className="space-y-10">
        <div className="flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-magical-gold/20" />
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            Catálogo de Hechizos
          </h2>
          <div className="h-[1px] flex-1 bg-magical-gold/20" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {spells.map((spell) => (
            <article key={spell.key} className={`glass-card p-8 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-2 flex flex-col ${FAMILY_COLORS[spell.family] || 'border-white/10'}`}>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black mb-1">
                    {FAMILY_LABELS[spell.family] || spell.family}
                  </p>
                  <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                    {spell.name}
                  </h3>
                </div>

                <div className="flex gap-2">
                  <div className="bg-black/40 border border-white/10 rounded-2xl px-3 py-2 text-center shadow-xl backdrop-blur-md">
                    <p className="text-xl font-black text-white leading-none">{spell.apCost}</p>
                    <p className="text-[7px] uppercase tracking-widest text-white/40 mt-1">Movs</p>
                  </div>
                  <div className="bg-magical-gold/10 border border-magical-gold/20 rounded-2xl px-3 py-2 text-center shadow-xl backdrop-blur-md">
                    <p className="text-xl font-black text-magical-gold leading-none">{spell.energyCost}</p>
                    <p className="text-[7px] uppercase tracking-widest text-magical-gold/40 mt-1">Energía</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <p className="text-sm md:text-base text-white/60 leading-relaxed font-medium italic min-h-[3em]">
                  "{spell.description}"
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Daño" value={spell.damage || 0} color="text-impact-red" />
                  <Stat label="Bloqueo" value={spell.block || 0} color="text-spell-blue" />
                  <Stat label="Cura" value={spell.heal || 0} color="text-healing-green" />
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="space-y-2">
                    <p className="text-[9px] uppercase tracking-widest text-healing-green font-black flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-healing-green" /> Fuerte contra
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {spell.beats?.map(type => (
                        <span key={type} className="px-3 py-1 rounded-full bg-healing-green/5 border border-healing-green/10 text-healing-green text-[8px] uppercase font-bold tracking-widest">
                          {FAMILY_LABELS[type] || type}
                        </span>
                      ))}
                      {(!spell.beats || spell.beats.length === 0) && <span className="text-[8px] text-white/20 font-bold uppercase">Ninguno</span>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] uppercase tracking-widest text-impact-red font-black flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-impact-red" /> Débil contra
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {spell.losesTo?.map(type => (
                        <span key={type} className="px-3 py-1 rounded-full bg-impact-red/5 border border-impact-red/10 text-impact-red text-[8px] uppercase font-bold tracking-widest">
                          {FAMILY_LABELS[type] || type}
                        </span>
                      ))}
                      {(!spell.losesTo || spell.losesTo.length === 0) && <span className="text-[8px] text-white/20 font-bold uppercase">Ninguno</span>}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* House Powers */}
      <section className="space-y-10">
        <div className="flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-magical-gold/20" />
          <div className="text-center">
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
              Poderes de Casa — <span className="text-magical-gold">Próximamente</span>
            </h2>
            <p className="text-[10px] text-white/30 uppercase font-bold tracking-[0.3em] mt-2">
              Estos poderes aún no están activos en combate.
            </p>
          </div>
          <div className="h-[1px] flex-1 bg-magical-gold/20" />
        </div>

        <div className="grid md:grid-cols-2 gap-8 opacity-40 grayscale pointer-events-none">
          {Object.entries(HOUSE_POWERS).map(([house, power]) => (
            <div key={house} className={`relative glass-card p-10 rounded-[3rem] border border-white/5 overflow-hidden group`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${HOUSE_GRADIENTS[house]} opacity-40`} />
              
              <div className="relative z-10 flex gap-6 items-start">
                <div className="text-6xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {HOUSE_ICONS[house]}
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-magical-gold font-black opacity-60">
                    Legado {HOUSE_LABELS[house]}
                  </p>
                  <h3 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter">
                    {power.name}
                  </h3>
                  <div className="h-[1px] w-12 bg-magical-gold/30" />
                  <p className="text-sm md:text-base text-smoke-white/70 leading-relaxed font-medium">
                    {power.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-xs text-white/40 italic">
            "Actualmente tu estrategia depende de los hechizos, familias, posturas, energía y la lectura del rival."
          </p>
        </div>
      </section>

      <AudioToggle />
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 text-center backdrop-blur-sm">
      <p className={`text-xl md:text-2xl font-black tabular-nums ${value > 0 ? color : 'text-white/20'}`}>
        {value}
      </p>
      <p className="text-[8px] md:text-[9px] uppercase tracking-widest text-white/30 font-black mt-1">
        {label}
      </p>
    </div>
  )
}
