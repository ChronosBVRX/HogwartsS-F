
import React from 'react';
import { Wand2, Gift, Lock, Sparkles } from 'lucide-react';

export default function SeasonAdventureGrid({ adventures = [], onStartAdventure }) {
  return (
    <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {adventures.map((adventure) => {
        const isLocked = adventure.unlock_status === 'bloqueado';
        
        return (
          <article 
            key={adventure.adventure_id} 
            className={`glass-card group relative flex flex-col p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden ${
              isLocked 
                ? 'opacity-60 grayscale border-white/5 bg-white/2' 
                : 'hover:border-magical-gold/40 border-white/10 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]'
            }`}
          >
            {adventure.featured && !isLocked && (
              <div className="absolute top-0 right-0 p-4">
                <Sparkles className="w-5 h-5 text-magical-gold animate-pulse" />
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                isLocked ? 'border-white/10 text-white/40' : 'border-magical-gold/30 text-magical-gold bg-magical-gold/5'
              }`}>
                {adventure.featured ? 'Destacada' : `Semana ${adventure.unlock_week}`}
              </div>
              {isLocked && <Lock className="w-4 h-4 text-white/20" />}
            </div>

            <div className="space-y-3 flex-1">
              <h2 className={`text-xl font-black uppercase italic tracking-tighter transition-colors ${
                isLocked ? 'text-white/40' : 'text-white group-hover:text-magical-gold'
              }`}>
                {adventure.title}
              </h2>
              <p className="text-sm text-white/50 line-clamp-3 italic leading-relaxed">
                {adventure.intro_text}
              </p>
            </div>

            <div className={`mt-6 p-4 rounded-2xl border transition-colors ${
              isLocked ? 'bg-white/2 border-white/5' : 'bg-magical-gold/5 border-magical-gold/10 group-hover:bg-magical-gold/10'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <Gift className={`w-3 h-3 ${isLocked ? 'text-white/20' : 'text-magical-gold'}`} />
                <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">Recompensa</p>
              </div>
              <p className={`text-xs font-black uppercase italic ${isLocked ? 'text-white/30' : 'text-white'}`}>
                {adventure.reward_title}
              </p>
            </div>

            <button
              type="button"
              disabled={isLocked}
              onClick={() => onStartAdventure?.(adventure)}
              className={`mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all ${
                isLocked 
                  ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                  : 'btn-gold shadow-lg hover:scale-[1.02] active:scale-95'
              }`}
            >
              {!isLocked && <Wand2 className="w-4 h-4" />}
              {isLocked ? 'Bloqueada por fecha' : 'Iniciar aventura'}
            </button>
          </article>
        );
      })}
    </section>
  );
}
