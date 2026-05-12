import { Zap, Shield, Heart, Sparkles, Clock, Sword, Wand, RefreshCcw } from 'lucide-react'
import audioManager from '../../lib/audioManager'

export default function SpellCard({ spell, disabled, selected, onClick, cooldown }) {
  const familyConfig = {
    attack: { color: 'var(--color-impact-red)', icon: Sword, bg: 'bg-impact-red/5', art: '/assets/duels/cards/attack.webp' },
    heavy: { color: 'var(--color-control-purple)', icon: Zap, bg: 'bg-control-purple/5', art: '/assets/duels/cards/attack.webp' },
    defense: { color: 'var(--color-spell-blue)', icon: Shield, bg: 'bg-spell-blue/5', art: '/assets/duels/cards/defense.webp' },
    control: { color: 'var(--color-control-purple)', icon: Sparkles, bg: 'bg-control-purple/5', art: '/assets/duels/cards/control.webp' },
    counter: { color: 'var(--color-text-gray)', icon: RefreshCcw, bg: 'bg-white/5', art: '/assets/duels/cards/defense.webp' },
    heal: { color: 'var(--color-healing-green)', icon: Heart, bg: 'bg-healing-green/5', art: '/assets/duels/cards/heal.webp' },
    charge: { color: 'var(--color-magical-gold)', icon: Wand, bg: 'bg-magical-gold/5', art: '/assets/duels/cards/control.webp' },
    disarm: { color: 'var(--color-impact-red)', icon: Wand, bg: 'bg-impact-red/5', art: '/assets/duels/cards/attack.webp' }
  }

  const config = familyConfig[spell.family] || { color: 'white', icon: Sparkles, bg: 'bg-white/5', art: '/assets/duels/cards/control.webp' }
  const Icon = config.icon

  return (
    <button
      disabled={disabled || cooldown > 0}
      onClick={() => {
        if (disabled && !cooldown) {
          audioManager.playVoice('low_energy');
          return;
        }
        
        audioManager.playSfx('ui_card_select');
        
        // Family specific sfx
        if (spell.family === 'attack' || spell.family === 'heavy') audioManager.playSfx('spell_cast_heavy');
        else if (spell.family === 'heal') audioManager.playSfx('heal_magic');
        else if (spell.family === 'charge') audioManager.playSfx('energy_charge');
        else if (spell.family === 'control') audioManager.playSfx('control_spell');
        else audioManager.playSfx('spell_cast_light');

        onClick();
      }}
      className={`
        magic-card flex flex-col p-3 md:p-4 text-left transition-all duration-300
        ${selected ? 'selected scale-[1.02] -translate-y-1' : 'hover:-translate-y-1'}
        ${(disabled || cooldown > 0) ? 'opacity-40 grayscale-[0.5] cursor-not-allowed scale-95' : ''}
      `}
      style={{ 
        '--beam-color': config.color,
        borderColor: selected ? config.color : 'rgba(212, 175, 55, 0.2)',
        boxShadow: selected ? `0 0 20px ${config.color}44` : 'none'
      }}
    >
      {/* Energy Cost Badge */}
      <div className="absolute top-2 right-2 z-20">
        <div className="bg-night-blue/90 border border-magical-gold/40 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md">
          <span className="text-[10px] md:text-xs font-black text-magical-gold leading-none">{spell.cost}</span>
          <Zap className="w-2 h-2 text-magical-gold fill-magical-gold ml-0.5" />
        </div>
      </div>

      {/* Card Body */}
      <div className="relative z-10 flex flex-col h-full space-y-2 md:space-y-3">
        {/* Type Icon & Name */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center border border-white/10 ${config.bg} backdrop-blur-sm`}>
            <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: config.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[10px] md:text-sm font-black uppercase italic tracking-tighter text-white leading-tight truncate">
              {spell.name}
            </h3>
            <p className="text-[6px] md:text-[7px] font-black uppercase tracking-[0.2em] opacity-60" style={{ color: config.color }}>
              {spell.family}
            </p>
          </div>
        </div>

        {/* Illustration - REAL ART */}
        <div className="flex-1 rounded-lg bg-black/60 border border-white/5 flex items-center justify-center overflow-hidden relative min-h-[60px] md:min-h-[80px]">
          <img 
            src={config.art} 
            alt={spell.name} 
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="scanline" />
        </div>

        {/* Description */}
        <div className="bg-black/30 p-2 rounded-lg border border-white/5 backdrop-blur-sm">
          <p className="text-[7px] md:text-[9px] text-text-gray leading-tight italic line-clamp-2">
            {spell.description}
          </p>
        </div>

        {/* Cooldown Overlay */}
        {cooldown > 0 && (
          <div className="absolute inset-0 bg-magical-navy/80 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-1 rounded-lg z-30">
            <Clock className="w-6 h-6 text-magical-gold animate-spin-slow" />
            <span className="text-lg font-black text-white">{cooldown}</span>
          </div>
        )}
      </div>

      {/* Decorative Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500 pointer-events-none" />
    </button>
  )
}


