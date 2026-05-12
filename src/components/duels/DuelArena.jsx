import { normalizeHouseSlug, HOUSE_META } from '../../lib/houses'

export default function DuelArena({ duel, lastEvent, isResolving, player, opponent }) {
  const normPlayer = normalizeHouseSlug(player?.house)
  const normOpponent = normalizeHouseSlug(opponent?.house)
  
  const pMeta = HOUSE_META[normPlayer] || { name: 'Mago', avatar: null }
  const oMeta = HOUSE_META[normOpponent] || { name: 'Rival', avatar: null }

  return (
    <section className="relative h-[420px] md:h-[600px] rounded-[2.5rem] overflow-hidden border border-magical-gold/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      {/* Premium Arena Background */}
      <div className="absolute inset-0 bg-magical-navy">
        <img 
          src="/assets/duels/arenas/arena_great_hall_mobile.webp" 
          className="w-full h-full object-cover opacity-80 scale-105" 
          alt="Arena" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-magical-navy via-transparent to-magical-navy/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05),transparent_70%)]" />
        
        {/* Particle Overlay (Placeholder effect) */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-magical-gold rounded-full animate-pulse" />
          <div className="absolute top-1/3 left-2/3 w-2 h-2 bg-magical-gold rounded-full animate-float" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-soft-gold rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-2/3 left-1/3 w-1.5 h-1.5 bg-magical-gold rounded-full animate-float" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      {/* Turn Indicator Overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-night-blue/80 backdrop-blur-md px-8 py-3 rounded-2xl border border-magical-gold/30 text-center shadow-xl">
          <p className="text-[9px] uppercase tracking-[0.5em] text-text-gray font-black mb-1">Arena de Duelos</p>
          <p className="text-magical-gold text-sm font-black uppercase italic tracking-widest">
            {duel?.status === 'finished' ? 'Duelo Finalizado' : `Turno ${duel?.turn_number || 1} / 12`}
          </p>
        </div>
      </div>

      {/* Combatants Container */}
      <div className="absolute inset-0 flex items-end justify-between px-6 md:px-16 pb-16">
        
        {/* Opponent (Left) */}
        <div className="relative flex flex-col items-center group">
          <div className={`relative w-36 h-36 md:w-56 md:h-56 rounded-3xl overflow-hidden border-2 transition-all duration-700 ${isResolving ? 'animate-duel-hit' : 'animate-float'} border-impact-red/30 shadow-[0_0_40px_rgba(255,77,90,0.2)]`}>
            {oMeta.avatar ? (
              <img src={oMeta.avatar} className="w-full h-full object-cover" alt={oMeta.name} />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center text-5xl">💀</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-magical-navy/90 via-transparent to-transparent" />
            <div className="scanline" />
          </div>
          <div className="mt-5 text-center">
             <div className="bg-impact-red/20 text-impact-red text-[9px] font-black px-4 py-1.5 rounded-lg border border-impact-red/30 uppercase tracking-widest inline-block mb-2 backdrop-blur-sm">Rival</div>
             <p className="text-base font-black text-white uppercase tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{opponent?.name}</p>
          </div>
        </div>

        {/* Action Effects Layer */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          {isResolving && (
            <>
              {/* Dynamic Beam Effect */}
              <div className="spell-beam w-[60%] origin-left" style={{ 
                '--beam-color': lastEvent?.payload?.player_one_damage > 0 ? '#D4AF37' : '#4DA1FF',
                transform: 'rotate(-5deg)'
              }} />
              
              {/* Floating Damage Text */}
              {lastEvent?.payload?.player_one_damage > 0 && (
                <div className="damage-text" style={{ left: '75%' }}>
                  -{lastEvent.payload.player_one_damage}
                </div>
              )}
              {lastEvent?.payload?.player_two_damage > 0 && (
                <div className="damage-text" style={{ left: '20%' }}>
                  -{lastEvent.payload.player_two_damage}
                </div>
              )}
            </>
          )}
        </div>

        {/* Player (Right) */}
        <div className="relative flex flex-col items-center group">
          <div className={`relative w-36 h-36 md:w-56 md:h-56 rounded-3xl overflow-hidden border-2 transition-all duration-700 ${isResolving ? 'animate-duel-cast' : 'animate-float'} border-magical-gold/40 shadow-[0_0_40px_rgba(212,175,55,0.3)]`} style={{ animationDelay: '0.5s' }}>
            {pMeta.avatar ? (
              <img src={pMeta.avatar} className="w-full h-full object-cover" alt={pMeta.name} />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center text-5xl">🧙‍♂️</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-magical-navy/90 via-transparent to-transparent" />
            <div className="scanline" />
          </div>
          <div className="mt-5 text-center">
             <div className="bg-magical-gold text-magical-navy text-[9px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest inline-block mb-2 shadow-lg">Tú</div>
             <p className="text-base font-black text-white uppercase tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{player?.name}</p>
          </div>
        </div>

      </div>

      {/* Premium Narrative Log */}
      {lastEvent?.payload?.message && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] md:w-[70%] z-40 transition-all duration-500 animate-in slide-in-from-bottom-4">
          <div className="bg-night-blue/90 backdrop-blur-2xl border border-magical-gold/30 rounded-[2rem] p-5 text-center shadow-[0_10px_40px_rgba(0,0,0,0.6)] border-b-4 border-b-magical-gold">
            <p className="text-smoke-white text-xs md:text-sm italic font-medium leading-relaxed tracking-wide drop-shadow-sm">
              {lastEvent.payload.message}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

