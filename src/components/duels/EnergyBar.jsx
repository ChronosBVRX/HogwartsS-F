import { Zap } from 'lucide-react'

export default function EnergyBar({ value = 3, max = 5 }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-3 justify-center items-center">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`relative w-6 h-6 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${
              i < value
                ? 'bg-spell-blue/20 border-spell-blue shadow-[0_0_20px_rgba(77,161,255,0.6)] scale-110'
                : 'bg-black/40 border-white/10 scale-90 opacity-40'
            }`}
          >
            {i < value && (
              <>
                <Zap className="w-3 h-3 text-spell-blue fill-spell-blue animate-pulse" />
                <div className="absolute inset-0 bg-spell-blue/30 rounded-full blur-[4px] animate-pulse" />
              </>
            )}
          </div>
        ))}
      </div>
      <p className="text-[7px] uppercase tracking-[0.5em] text-spell-blue font-black opacity-80">Energía Mágica</p>
    </div>
  )
}

