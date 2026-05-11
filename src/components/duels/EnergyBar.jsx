export default function EnergyBar({ value = 3, max = 5 }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[8px] uppercase tracking-[0.3em] text-blue-400 font-black text-center">Energía Mágica</p>
      <div className="flex gap-2 justify-center">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-500 ${
              i < value
                ? 'bg-blue-400 border-blue-200 shadow-[0_0_15px_rgba(96,165,250,0.8)] scale-110'
                : 'bg-white/5 border-white/10 scale-90 opacity-40'
            }`}
          >
            {i < value && (
              <div className="absolute inset-0 bg-white/40 rounded-full animate-pulse" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
