import { Zap, Shield, Heart, Sparkles, Clock, Sword, Wand, RefreshCcw } from 'lucide-react'

export default function SpellCard({ spell, disabled, selected, onClick, cooldown }) {
  const familyConfig = {
    attack: { color: 'var(--color-impact-red)', icon: Sword, bg: 'bg-impact-red/5' },
    heavy: { color: 'var(--color-control-purple)', icon: Zap, bg: 'bg-control-purple/5' },
    defense: { color: 'var(--color-spell-blue)', icon: Shield, bg: 'bg-spell-blue/5' },
    control: { color: 'var(--color-control-purple)', icon: Sparkles, bg: 'bg-control-purple/5' },
    counter: { color: 'var(--color-text-gray)', icon: RefreshCcw, bg: 'bg-white/5' },
    heal: { color: 'var(--color-healing-green)', icon: Heart, bg: 'bg-healing-green/5' },
    charge: { color: 'var(--color-magical-gold)', icon: Wand, bg: 'bg-magical-gold/5' },
    disarm: { color: 'var(--color-impact-red)', icon: Wand, bg: 'bg-impact-red/5' }
  }

  const config = familyConfig[spell.family] || { color: 'white', icon: Sparkles, bg: 'bg-white/5' }
  const Icon = config.icon

  return (
    <button
      disabled={disabled || cooldown > 0}
      onClick={onClick}
      className={`
        magic-card flex flex-col p-4 text-left
        ${selected ? 'selected' : ''}
        ${(disabled || cooldown > 0) ? 'opacity-40 grayscale-[0.5] cursor-not-allowed scale-95' : ''}
      `}
      style={{ 
        '--beam-color': config.color,
        borderColor: selected ? config.color : 'rgba(212, 175, 55, 0.2)'
      }}
    >
      {/* Energy Cost Badge */}
      <div className="absolute top-2 right-2 z-20">
        <div className="bg-night-blue/90 border border-magical-gold/40 w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-xs font-black text-magical-gold leading-none">{spell.cost}</span>
          <Zap className="w-2 h-2 text-magical-gold fill-magical-gold ml-0.5" />
        </div>
      </div>

      {/* Card Body */}
      <div className="relative z-10 flex flex-col h-full space-y-3">
        {/* Type Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 ${config.bg} backdrop-blur-sm`}>
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>

        {/* Title */}
        <div className="space-y-0.5">
          <h3 className="text-sm font-black uppercase italic tracking-tighter text-white leading-tight">
            {spell.name}
          </h3>
          <p className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40" style={{ color: config.color }}>
            {spell.family}
          </p>
        </div>

        {/* Illustration Placeholder (Patterned bg) */}
        <div className="flex-1 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, var(--beam-color) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
          <Icon className="w-8 h-8 opacity-10 scale-150 rotate-12" style={{ color: config.color }} />
        </div>

        {/* Description */}
        <div className="bg-black/20 p-2 rounded-lg border border-white/5">
          <p className="text-[9px] text-text-gray leading-tight italic line-clamp-2">
            {spell.description}
          </p>
        </div>

        {/* Cooldown Overlay */}
        {cooldown > 0 && (
          <div className="absolute inset-0 bg-magical-navy/80 backdrop-blur-[1px] flex flex-col items-center justify-center space-y-1 rounded-lg">
            <Clock className="w-6 h-6 text-magical-gold animate-spin-slow" />
            <span className="text-lg font-black text-white">{cooldown}</span>
          </div>
        )}
      </div>

      {/* Decorative Shine */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </button>
  )
}

