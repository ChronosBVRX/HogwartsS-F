import React from 'react'
import { buildTurnAnnouncement } from '../../lib/duelNarration'

export default function DuelTurnAnnouncement({ lastEvent, isP1, onContinue }) {
  const announcement = buildTurnAnnouncement({
    payload: lastEvent?.payload,
    isP1
  })

  if (!announcement) return null

  const toneClass = {
    good: 'border-healing-green/40 bg-healing-green/10 shadow-[0_0_30px_rgba(34,197,94,0.1)]',
    bad: 'border-impact-red/40 bg-impact-red/10 shadow-[0_0_30px_rgba(239,68,68,0.1)]',
    clash: 'border-magical-gold/40 bg-magical-gold/10 shadow-[0_0_30px_rgba(212,175,55,0.1)]',
    neutral: 'border-white/10 bg-white/5'
  }[announcement.tone]

  const textToneClass = {
    good: 'text-healing-green',
    bad: 'text-impact-red',
    clash: 'text-magical-gold',
    neutral: 'text-white'
  }[announcement.tone]

  return (
    <div className={`rounded-3xl border p-4 md:p-6 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500 ${toneClass}`}>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
          <p className="text-[9px] uppercase tracking-[0.2em] text-magical-gold font-black mb-1">Tu hechizo</p>
          <p className="text-sm md:text-xl font-black text-white uppercase italic tracking-tighter">
            {announcement.mySpell.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[8px] text-white/40 uppercase font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              {announcement.mySpell.family}
            </span>
            <span className="text-[8px] text-magical-gold font-bold bg-magical-gold/5 px-2 py-0.5 rounded-full border border-magical-gold/10">
              {announcement.mySpell.cost} ⚡
            </span>
          </div>
        </div>

        <div className="bg-black/40 rounded-2xl p-4 border border-white/5 text-right">
          <p className="text-[9px] uppercase tracking-[0.2em] text-impact-red font-black mb-1">Rival</p>
          <p className="text-sm md:text-xl font-black text-white uppercase italic tracking-tighter">
            {announcement.rivalSpell.name}
          </p>
          <div className="flex items-center gap-2 mt-1 justify-end">
            <span className="text-[8px] text-magical-gold font-bold bg-magical-gold/5 px-2 py-0.5 rounded-full border border-magical-gold/10">
              {announcement.rivalSpell.cost} ⚡
            </span>
            <span className="text-[8px] text-white/40 uppercase font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              {announcement.rivalSpell.family}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-center px-2">
        <p className={`text-sm md:text-xl font-black uppercase italic tracking-tight ${textToneClass}`}>
          {announcement.result}
        </p>
        <p className="text-xs md:text-base text-white/70 leading-relaxed font-medium">
          {announcement.explanation}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="text-center bg-black/40 rounded-2xl p-3 border border-white/5">
          <p className="text-[9px] uppercase tracking-widest text-white/30 font-black mb-1">Daño recibido</p>
          <p className="text-xl md:text-3xl font-black text-impact-red tabular-nums drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">
            -{announcement.myDamageTaken || 0}
          </p>
        </div>

        <div className="text-center bg-black/40 rounded-2xl p-3 border border-white/5">
          <p className="text-[9px] uppercase tracking-widest text-white/30 font-black mb-1">Daño causado</p>
          <p className="text-xl md:text-3xl font-black text-healing-green tabular-nums drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">
            -{announcement.rivalDamageTaken || 0}
          </p>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full mt-6 py-4 bg-magical-gold text-magical-navy font-black uppercase italic tracking-widest rounded-2xl shadow-[0_10px_20px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        Continuar Duelo
      </button>
    </div>
  )
}
