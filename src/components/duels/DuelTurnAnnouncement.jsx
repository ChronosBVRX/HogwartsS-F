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
    <div className={`rounded-[2rem] border p-6 md:p-8 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 ${toneClass}`}>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
          <p className="text-[9px] uppercase tracking-[0.2em] text-magical-gold font-black mb-1">Tú</p>
          <p className="text-sm md:text-xl font-black text-white uppercase italic tracking-tighter">
            {announcement.mySpell.name}
          </p>
          <p className="text-[8px] text-white/40 uppercase font-bold">{announcement.mySpell.family}</p>
        </div>

        <div className="bg-black/40 rounded-2xl p-4 border border-white/5 text-right">
          <p className="text-[9px] uppercase tracking-[0.2em] text-impact-red font-black mb-1">Rival</p>
          <p className="text-sm md:text-xl font-black text-white uppercase italic tracking-tighter">
            {announcement.rivalSpell.name}
          </p>
          <p className="text-[8px] text-white/40 uppercase font-bold">{announcement.rivalSpell.family}</p>
        </div>
      </div>

      <div className="space-y-4 text-center px-2 mb-6">
        <p className={`text-xl md:text-3xl font-black uppercase italic tracking-tight ${textToneClass} animate-pulse`}>
          {announcement.effectivenessLabel}
        </p>
        <p className="text-xs md:text-base text-white/70 leading-relaxed font-medium">
          {announcement.explanation}
        </p>
      </div>

      {/* Numerical Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <BreakdownCard 
          label="Tu Ataque" 
          total={announcement.rivalDamageTaken} 
          details={announcement.myBreakdown}
          isAttacker={true}
        />
        <BreakdownCard 
          label="Ataque Rival" 
          total={announcement.myDamageTaken} 
          details={announcement.rivalBreakdown}
          isAttacker={false}
        />
      </div>

      <button
        onClick={onContinue}
        className="w-full py-4 md:py-6 bg-magical-gold text-magical-navy font-black uppercase italic tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        Continuar Duelo
      </button>
    </div>
  )
}

function BreakdownCard({ label, total, details, isAttacker }) {
  const colorClass = isAttacker ? 'text-healing-green' : 'text-impact-red'
  
  return (
    <div className="bg-black/60 rounded-2xl p-4 border border-white/5 space-y-3">
      <div className="flex justify-between items-end border-b border-white/5 pb-2">
        <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/30 font-black">{label}</p>
        <p className={`text-xl md:text-2xl font-black ${colorClass}`}>-{total}</p>
      </div>
      
      <div className="space-y-1">
        <StatRow label="Base" value={details.base} />
        {details.bonus > 0 && <StatRow label="Ventaja" value={`+${details.bonus}`} color="text-healing-green" />}
        {details.penalty > 0 && <StatRow label="Penalización" value={`-${details.penalty}`} color="text-impact-red" />}
        {details.block > 0 && <StatRow label="Bloqueo" value={`-${details.block}`} color="text-spell-blue" />}
      </div>
    </div>
  )
}

function StatRow({ label, value, color = "text-white/40" }) {
  return (
    <div className="flex justify-between items-center text-[8px] md:text-[9px] uppercase font-bold tracking-widest">
      <span>{label}</span>
      <span className={color}>{value}</span>
    </div>
  )
}
