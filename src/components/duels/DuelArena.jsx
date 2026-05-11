import { normalizeHouseSlug, HOUSE_META } from '../../lib/houses'
import arenaYard from '../../assets/duels/arena_yard.png'

export default function DuelArena({ duel, lastEvent, isResolving, player, opponent }) {
  const normPlayer = normalizeHouseSlug(player?.house)
  const normOpponent = normalizeHouseSlug(opponent?.house)
  
  const pMeta = HOUSE_META[normPlayer] || { name: 'Mago', avatar: null }
  const oMeta = HOUSE_META[normOpponent] || { name: 'Rival', avatar: null }

  return (
    <section className="relative h-[400px] md:h-[550px] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
      {/* 3D-like Arena Background */}
      <div className="absolute inset-0 bg-black">
        <img src={arenaYard} className="w-full h-full object-cover opacity-60 scale-110 blur-[1px]" alt="Arena" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1),transparent_80%)]" />
      </div>

      {/* Turn Indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-black/60 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10 text-center">
          <p className="text-[8px] uppercase tracking-[0.4em] text-white/30 font-black">Arena de Duelos</p>
          <p className="text-magical-gold text-xs font-black uppercase italic tracking-widest">
            {duel?.status === 'finished' ? 'Duelo Terminado' : `Turno ${duel?.turn_number || 1} / 12`}
          </p>
        </div>
      </div>

      {/* Combatants Container */}
      <div className="absolute inset-0 flex items-end justify-between px-4 md:px-12 pb-12">
        
        {/* Opponent (Left side for mirror effect) */}
        <div className="relative flex flex-col items-center group">
          <div className={`relative w-32 h-32 md:w-48 md:h-48 rounded-[2rem] overflow-hidden border-2 transition-all duration-500 ${isResolving ? 'animate-duel-hit' : 'hover:scale-105'} border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]`}>
            {oMeta.avatar ? (
              <img src={oMeta.avatar} className="w-full h-full object-cover grayscale-[0.2]" alt={oMeta.name} />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center text-4xl">💀</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>
          <div className="mt-4 text-center">
             <div className="bg-red-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-1 shadow-lg">Rival</div>
             <p className="text-sm font-black text-white uppercase tracking-tighter drop-shadow-lg">{opponent?.name}</p>
          </div>
        </div>

        {/* Action Center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          {isResolving && (
            <>
              <div className="spell-beam" />
              <div className="spell-impact" />
              
              {lastEvent?.payload?.player_one_damage > 0 && (
                <div className="damage-number" style={{ left: '75%' }}>
                  -{lastEvent.payload.player_one_damage}
                </div>
              )}
              {lastEvent?.payload?.player_two_damage > 0 && (
                <div className="damage-number" style={{ left: '25%' }}>
                  -{lastEvent.payload.player_two_damage}
                </div>
              )}
            </>
          )}
        </div>

        {/* Player (Right side) */}
        <div className="relative flex flex-col items-center group">
          <div className={`relative w-32 h-32 md:w-48 md:h-48 rounded-[2rem] overflow-hidden border-2 transition-all duration-500 ${isResolving ? 'animate-duel-cast' : 'hover:scale-105'} border-magical-gold/20 shadow-[0_0_50px_rgba(212,175,55,0.1)]`}>
            {pMeta.avatar ? (
              <img src={pMeta.avatar} className="w-full h-full object-cover" alt={pMeta.name} />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center text-4xl">🧙‍♂️</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>
          <div className="mt-4 text-center">
             <div className="bg-magical-gold text-magical-navy text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-1 shadow-lg">Tú</div>
             <p className="text-sm font-black text-white uppercase tracking-tighter drop-shadow-lg">{player?.name}</p>
          </div>
        </div>

      </div>

      {/* Narrative Log */}
      {lastEvent?.payload?.message && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[60%] z-40">
          <div className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-4 text-center shadow-2xl border-b-4 border-b-magical-gold">
            <p className="text-white text-xs md:text-sm italic font-medium leading-relaxed tracking-wide">
              "{lastEvent.payload.message}"
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
