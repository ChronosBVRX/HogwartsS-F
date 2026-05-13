
import React from 'react';
import { Sparkles, Calendar, TrendingUp } from 'lucide-react';

export default function SeasonBanner({ season }) {
  if (!season) return null;

  const progress = Number(season.season_progress || 0);

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-magical-navy p-8 md:p-10 shadow-2xl animate-in fade-in slide-in-from-top duration-700">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at top right, ${season.accent_hex || '#d4af37'}, transparent 45%)`
        }}
      />
      <Sparkles className="absolute -right-8 -bottom-8 w-40 h-40 text-white/5 opacity-20" />

      <div className="relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-magical-gold/20 bg-magical-gold/10 px-4 py-1.5 text-[10px] font-black tracking-[0.3em] text-magical-gold uppercase">
          <Calendar className="w-3 h-3" />
          {season.season_label}
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
            {season.season_title}
          </h1>
          <p className="text-magical-gold/80 text-sm md:text-lg font-bold uppercase tracking-widest italic">
            {season.season_subtitle}
          </p>
        </div>

        <p className="max-w-3xl text-sm md:text-base leading-relaxed text-white/60 italic border-l-2 border-magical-gold/30 pl-6">
          {season.season_lore}
        </p>

        <div className="grid gap-4 sm:grid-cols-3 pt-4">
          <div className="glass-card !bg-white/5 p-5 rounded-2xl border border-white/5">
            <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">Semana actual</p>
            <p className="mt-1 text-2xl font-black text-white italic tracking-tight">Semana {season.week_number}</p>
          </div>
          <div className="glass-card !bg-white/5 p-5 rounded-2xl border border-white/5">
            <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">Termina el</p>
            <p className="mt-1 text-2xl font-black text-white italic tracking-tight">
              {new Date(season.ends_on).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
            </p>
          </div>
          <div className="glass-card !bg-white/5 p-5 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center">
              <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">Progreso</p>
              <TrendingUp className="w-3 h-3 text-magical-gold" />
            </div>
            <p className="mt-1 text-2xl font-black text-magical-gold italic tracking-tight">{progress}%</p>
          </div>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-white/5 mt-2">
          <div 
            className="h-full rounded-full bg-magical-gold shadow-[0_0_10px_rgba(212,175,55,0.5)] transition-all duration-1000" 
            style={{ width: `${Math.min(progress, 100)}%` }} 
          />
        </div>
      </div>
    </section>
  );
}
