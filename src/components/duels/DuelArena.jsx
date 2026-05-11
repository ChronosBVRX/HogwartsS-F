import { useEffect, useRef } from 'react'

export default function DuelArena({ duel, lastEvent, isResolving, player, opponent }) {
  const containerRef = useRef(null)

  const houseIcons = {
    gryffindor: '🦁',
    slytherin: '🐍',
    ravenclaw: '🦅',
    hufflepuff: '🦡',
    ai: '💀'
  }

  return (
    <section ref={containerRef} className="relative h-[350px] md:h-[450px] rounded-[3rem] overflow-hidden border border-white/10 bg-gradient-to-b from-[#0a0f1e] via-[#050712] to-black shadow-2xl">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15),transparent_70%)]" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />

      {/* Turn Indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-20">
        <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 space-y-0.5">
          <p className="text-[8px] uppercase tracking-[0.4em] text-white/30 font-black">Arena de Duelos</p>
          <p className="text-magical-gold text-xs font-black uppercase italic tracking-widest">
            {duel?.status === 'finished' ? 'Duelo Terminado' : `Turno ${duel?.turn_number || 1} / 12`}
          </p>
        </div>
      </div>

      {/* Combatants */}
      <div className="absolute inset-0 flex items-center justify-between px-6 md:px-16 pt-12">
        {/* Opponent */}
        <div className="flex flex-col items-center space-y-4">
          <div className={`duel-avatar opponent ${isResolving ? 'animate-duel-hit' : ''} border-red-500/20 shadow-red-500/10`}>
            <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              {houseIcons[opponent?.house] || '👤'}
            </span>
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Rival</div>
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-white uppercase tracking-tighter truncate max-w-[100px]">{opponent?.name}</p>
            <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">{opponent?.house}</p>
          </div>
        </div>

        {/* Combat Visual Area */}
        <div className="flex-1 relative h-full mx-4 flex items-center justify-center pointer-events-none">
          {isResolving && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="spell-beam" />
              <div className="spell-impact" />
              
              {/* Damage Floating Numbers (Simulated for MVP) */}
              {lastEvent?.payload?.player_one_damage > 0 && (
                <div className="damage-number" style={{ left: '80%' }}>
                  -{lastEvent.payload.player_one_damage}
                </div>
              )}
              {lastEvent?.payload?.player_two_damage > 0 && (
                <div className="damage-number" style={{ left: '20%' }}>
                  -{lastEvent.payload.player_two_damage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Player */}
        <div className="flex flex-col items-center space-y-4">
          <div className={`duel-avatar player ${isResolving ? 'animate-duel-cast' : ''} border-magical-gold/20 shadow-magical-gold/10`}>
            <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              {houseIcons[player?.house] || '👤'}
            </span>
            <div className="absolute -top-2 -left-2 bg-magical-gold text-magical-navy text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Tú</div>
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-white uppercase tracking-tighter truncate max-w-[100px]">{player?.name}</p>
            <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">{player?.house}</p>
          </div>
        </div>
      </div>

      {/* Narrative Overlay */}
      {lastEvent?.payload?.message && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[85%] z-30">
          <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-5 text-center shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
            <p className="text-white/80 text-xs md:text-sm italic font-medium leading-relaxed">
              "{lastEvent.payload.message}"
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
