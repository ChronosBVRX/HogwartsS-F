export default function HealthBar({ value = 100, label, house, compact = false }) {
  const pct = Math.max(0, Math.min(100, value))
  
  const houseColors = {
    gryffindor: 'from-impact-red via-red-500 to-amber-500',
    slytherin: 'from-healing-green via-green-600 to-emerald-400',
    ravenclaw: 'from-spell-blue via-blue-600 to-cyan-400',
    hufflepuff: 'from-magical-gold via-yellow-500 to-amber-400',
    ai: 'from-control-purple via-purple-500 to-pink-400'
  }

  const colorClass = houseColors[house] || 'from-impact-red via-magical-gold to-healing-green'

  return (
    <div className={`${compact ? 'space-y-1' : 'space-y-2'} w-full`}>
      <div className="flex justify-between items-center px-2">
        <span className={`${compact ? 'text-[8px]' : 'text-[10px]'} uppercase tracking-[0.3em] text-text-gray font-black`}>
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <span className={`${compact ? 'text-sm' : 'text-lg'} text-white font-black tabular-nums drop-shadow-md`}>
            {pct}
          </span>
          <span className="text-[8px] text-text-gray font-black uppercase">HP</span>
        </div>
      </div>

      <div className={`${compact ? 'h-3' : 'h-4'} bg-black/40 rounded-lg overflow-hidden border border-white/10 p-[2px] shadow-inner relative`}>
        {/* Glow Effect */}
        <div 
          className="absolute inset-y-0 left-0 bg-white/20 blur-sm pointer-events-none transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        
        <div
          className={`h-full rounded-md transition-all duration-700 ease-out bg-gradient-to-r ${colorClass} relative`}
          style={{ width: `${pct}%` }}
        >
          {/* Shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </div>
    </div>
  )
}

