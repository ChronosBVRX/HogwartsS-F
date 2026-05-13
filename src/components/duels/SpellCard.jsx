import { Zap, Shield, Heart, Sparkles, Clock, Sword, Wand, RefreshCcw } from 'lucide-react'
import audioManager from '../../lib/audioManager'
import { getSpellImage } from '../../lib/duelAssets'

export default function SpellCard({ spell, disabled, selected, onClick, cooldown, compact = false }) {
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
    <div className="flex flex-col items-center gap-1 group">
      <button
        disabled={disabled || cooldown > 0}
        onClick={async () => {
          await audioManager.unlockAudio();
          if (disabled && !cooldown) {
            audioManager.playVoice('low_energy');
            return;
          }
          
          audioManager.playSfx('ui_card_select');
          
          if (spell.family === 'attack' || spell.family === 'heavy') audioManager.playSfx('spell_cast_heavy');
          else if (spell.family === 'heal') audioManager.playSfx('heal_magic');
          else if (spell.family === 'charge') audioManager.playSfx('energy_charge');
          else if (spell.family === 'control') audioManager.playSfx('control_spell');
          else audioManager.playSfx('spell_cast_light');

          onClick();
        }}
        className={`
          magic-card relative flex flex-col ${compact ? 'p-1' : 'p-3'} transition-all duration-300
          ${compact ? 'w-16 h-24' : 'w-24 h-36 md:w-32 md:h-48'}
          ${selected ? 'selected scale-[1.05] -translate-y-1' : 'hover:-translate-y-1'}
          ${(disabled || cooldown > 0) ? 'opacity-40 grayscale-[0.5] cursor-not-allowed scale-95' : ''}
          overflow-hidden rounded-xl border-2
        `}
        style={{ 
          '--beam-color': config.color,
          borderColor: selected ? config.color : 'rgba(212, 175, 55, 0.2)',
          boxShadow: selected ? `0 0 20px ${config.color}66` : 'none'
        }}
      >
        {/* Energy Cost Badge */}
        <div className="absolute top-1 right-1 z-20">
          <div className={`bg-night-blue/90 border border-magical-gold/40 ${compact ? 'w-4 h-4' : 'w-6 h-6 md:w-7 md:h-7'} rounded-full flex items-center justify-center shadow-lg backdrop-blur-md`}>
            <span className={`${compact ? 'text-[7px]' : 'text-[10px] md:text-xs'} font-black text-magical-gold leading-none`}>{spell.cost}</span>
          </div>
        </div>

        {/* Illustration - ALWAYS VISIBLE */}
        <div className="absolute inset-0 z-0">
          <img 
            src={getSpellImage(spell.key)} 
            alt={spell.name} 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500"
            onError={(e) => { e.target.src = config.art }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="scanline opacity-20" />
        </div>

        {/* Type Icon Overlay */}
        <div className={`absolute left-1 bottom-1 z-10 ${compact ? 'w-4 h-4' : 'w-6 h-6 md:w-8 md:h-8'} rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-sm border border-white/10 shadow-lg`}>
          <Icon className={`${compact ? 'w-2.5 h-2.5' : 'w-4 h-4 md:w-5 md:h-5'}`} style={{ color: config.color }} />
        </div>

        {/* Cooldown Overlay */}
        {cooldown > 0 && (
          <div className="absolute inset-0 bg-magical-navy/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-30">
            <Clock className={`${compact ? 'w-3 h-3' : 'w-6 h-6'} text-magical-gold animate-spin-slow`} />
            <span className={`${compact ? 'text-xs' : 'text-lg'} font-black text-white`}>{cooldown}</span>
          </div>
        )}

        {/* Decorative Shine */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
      </button>

      {/* Spell Name Label - BELOW the card */}
      <div className={`text-center px-1 max-w-full ${compact ? 'mt-0.5' : 'mt-1'}`}>
         <p className={`${compact ? 'text-[6px]' : 'text-[9px] md:text-[10px]'} font-black uppercase italic tracking-tighter text-white/80 group-hover:text-magical-gold transition-colors leading-tight truncate`}>
           {spell.name}
         </p>
      </div>
    </div>
  )
}


