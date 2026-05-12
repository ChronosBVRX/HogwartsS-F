import { normalizeHouseSlug, HOUSE_META, getAvatar } from '../../lib/houses'
import audioManager from '../../lib/audioManager'
import { useEffect } from 'react'

export default function DuelArena({ duel, lastEvent, isResolving, player, opponent, isP1 }) {
  const normPlayer = normalizeHouseSlug(player?.house)
  const normOpponent = normalizeHouseSlug(opponent?.house)
  
  const pAvatar = getAvatar(normPlayer, player?.gender)
  const oAvatar = getAvatar(normOpponent, opponent?.gender)

  const pMeta = HOUSE_META[normPlayer] || { name: 'Mago' }
  const oMeta = HOUSE_META[normOpponent] || { name: 'Rival' }

  const p1Damage = lastEvent?.payload?.p1_damage || 0
  const p2Damage = lastEvent?.payload?.p2_damage || 0

  // Perspective based damage
  const myDamageTaken = isP1 ? p1Damage : p2Damage
  const rivalDamageTaken = isP1 ? p2Damage : p1Damage

  useEffect(() => {
    if (isResolving) {
      audioManager.playSfx('spell_impact');
      if (p1Damage > 0 || p2Damage > 0) {
        setTimeout(() => audioManager.playSfx('damage_hit'), 500);
      }
    }
  }, [isResolving]);

  return (
    <section className="relative h-[400px] md:h-[600px] rounded-[2.5rem] overflow-hidden border border-magical-gold/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-magical-navy">
      {/* Premium Arena Background */}
      <div className="absolute inset-0">
        <img 
          src="/assets/duels/arenas/arena_great_hall_mobile.webp" 
          className="w-full h-full object-cover opacity-80 scale-105" 
          alt="Arena" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-magical-navy via-transparent to-magical-navy/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05),transparent_70%)]" />
        
        {/* Particle Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-magical-gold rounded-full animate-pulse" />
          <div className="absolute top-1/3 left-2/3 w-2 h-2 bg-magical-gold rounded-full animate-float" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-soft-gold rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Turn Indicator Overlay */}
      <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-night-blue/80 backdrop-blur-md px-6 md:px-8 py-2 md:py-3 rounded-2xl border border-magical-gold/30 text-center shadow-xl">
          <p className="text-[7px] md:text-[9px] uppercase tracking-[0.5em] text-text-gray font-black mb-1">Arena de Duelos</p>
          <p className="text-magical-gold text-xs md:text-sm font-black uppercase italic tracking-widest leading-none">
            {duel?.status === 'finished' ? 'Finalizado' : `Turno ${duel?.turn_number || 1} / 12`}
          </p>
        </div>
      </div>

      {/* Combatants Container */}
      <div className="absolute inset-0 flex items-end justify-between px-4 md:px-16 pb-12 md:pb-16 gap-2 md:gap-8">
        
        {/* Opponent (Left) */}
        <div className="relative flex-1 flex flex-col items-center group max-w-[140px] md:max-w-none">
          <div className={`relative w-full aspect-square rounded-3xl overflow-hidden border-2 transition-all duration-700 ${isResolving && rivalDamageTaken > 0 ? 'animate-duel-hit' : 'animate-float'} border-impact-red/30 shadow-[0_0_40px_rgba(255,77,90,0.2)] bg-night-blue`}>
            {oAvatar ? (
              <img src={oAvatar} className="w-full h-full object-cover brightness-[0.9] contrast-[1.1]" alt={oMeta.name} />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center text-4xl">💀</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-magical-navy/80 via-transparent to-transparent" />
            <div className="scanline" />
          </div>
          <div className="mt-3 md:mt-5 text-center w-full px-2">
             <div className="bg-impact-red/20 text-impact-red text-[7px] md:text-[9px] font-black px-3 py-1 rounded-lg border border-impact-red/30 uppercase tracking-widest inline-block mb-1 md:mb-2 backdrop-blur-sm">Rival</div>
             <p className="text-[10px] md:text-base font-black text-white uppercase tracking-tight drop-shadow-md truncate">{opponent?.name}</p>
          </div>
        </div>

        {/* VS / Action Layer */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          {!isResolving && (
            <span className="text-2xl md:text-5xl font-black text-white italic tracking-tighter opacity-10 translate-y-4">VS</span>
          )}
          {isResolving && (
            <>
              {/* Dynamic Beam Effect */}
              <div className="spell-beam w-[60%] origin-left" style={{ 
                '--beam-color': rivalDamageTaken > 0 ? '#D4AF37' : '#4DA1FF',
                transform: 'rotate(-5deg)'
              }} />
              
              {/* Floating Damage Text - RIVAL (Left) */}
              {rivalDamageTaken > 0 && (
                <div className="damage-text text-xl md:text-3xl" style={{ left: '20%' }}>
                  -{rivalDamageTaken}
                </div>
              )}
              
              {/* Floating Damage Text - PLAYER (Right) */}
              {myDamageTaken > 0 && (
                <div className="damage-text text-xl md:text-3xl" style={{ left: '75%' }}>
                  -{myDamageTaken}
                </div>
              )}
            </>
          )}
        </div>

        {/* Player (Right) */}
        <div className="relative flex-1 flex flex-col items-center group max-w-[140px] md:max-w-none">
          <div className={`relative w-full aspect-square rounded-3xl overflow-hidden border-2 transition-all duration-700 ${isResolving ? 'animate-duel-cast' : 'animate-float'} border-magical-gold/40 shadow-[0_0_40px_rgba(212,175,55,0.3)] bg-night-blue`} style={{ animationDelay: '0.5s' }}>
            {pAvatar ? (
              <img src={pAvatar} className="w-full h-full object-cover brightness-[0.9] contrast-[1.1]" alt={pMeta.name} />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center text-4xl">🧙‍♂️</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-magical-navy/80 via-transparent to-transparent" />
            <div className="scanline" />
          </div>
          <div className="mt-3 md:mt-5 text-center w-full px-2">
             <div className="bg-magical-gold text-magical-navy text-[7px] md:text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest inline-block mb-1 md:mb-2 shadow-lg">Tú</div>
             <p className="text-[10px] md:text-base font-black text-white uppercase tracking-tight drop-shadow-md truncate">{player?.name}</p>
          </div>
        </div>

      </div>

      {/* Premium Narrative Log */}
      {lastEvent?.payload?.message && (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[94%] md:w-[70%] z-40 transition-all duration-500 animate-in slide-in-from-bottom-4">
          <div className="bg-night-blue/95 backdrop-blur-2xl border border-magical-gold/30 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-5 text-center shadow-2xl border-b-4 border-b-magical-gold">
            <p className="text-smoke-white text-[10px] md:text-sm italic font-medium leading-relaxed tracking-wide">
              {lastEvent.payload.message}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
