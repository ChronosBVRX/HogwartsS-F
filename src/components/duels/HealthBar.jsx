export default function HealthBar({ value = 100, label, house }) {
  const pct = Math.max(0, Math.min(100, value))
  
  const houseColors = {
    gryffindor: 'from-red-600 via-red-500 to-amber-500',
    slytherin: 'from-green-700 via-green-600 to-emerald-400',
    ravenclaw: 'from-blue-700 via-blue-600 to-cyan-400',
    hufflepuff: 'from-yellow-600 via-yellow-500 to-amber-400',
    ai: 'from-purple-600 via-purple-500 to-pink-400'
  }

  const colorClass = houseColors[house] || 'from-red-500 via-yellow-400 to-green-400'

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between items-end px-1">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black italic">
          {label}
        </span>
        <span className="text-sm text-white font-black tabular-nums">
          {pct}<span className="text-[10px] text-white/40 ml-0.5">HP</span>
        </span>
      </div>

      <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${colorClass} shadow-[0_0_15px_rgba(255,255,255,0.1)]`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
