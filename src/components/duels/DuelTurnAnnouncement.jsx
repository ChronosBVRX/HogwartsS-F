import React from 'react'
import { buildTurnAnnouncement } from '../../lib/duelNarration'
import { Zap, Heart, Shield, Swords, AlertTriangle } from 'lucide-react'
import audioManager from '../../lib/audioManager'

export default function DuelTurnAnnouncement({ lastEvent, isP1, onContinue }) {
  const announcement = buildTurnAnnouncement({
    payload: lastEvent?.payload,
    isP1
  })

  React.useEffect(() => {
    if (announcement && lastEvent) {
      const label = announcement.effectivenessLabel.toLowerCase()
      if (label.includes('exitosa')) {
        audioManager.playVoice('turn_result_super', { cooldownMs: 10000 })
      } else if (label.includes('neutral')) {
        audioManager.playVoice('turn_result_neutral', { cooldownMs: 10000 })
      } else {
        audioManager.playVoice('turn_result_weak', { cooldownMs: 10000 })
      }
    }
  }, [lastEvent?.id, announcement?.effectivenessLabel])

  if (!announcement) {
    return (
      <div className="rounded-[2.5rem] border border-impact-red/40 bg-impact-red/10 p-8 text-center backdrop-blur-2xl animate-in fade-in zoom-in">
        <AlertTriangle className="w-12 h-12 text-impact-red mx-auto mb-4" />
        <h3 className="text-xl font-black text-white uppercase italic">Error de Sincronización</h3>
        <p className="text-white/40 text-xs mb-6">Los datos del turno no pudieron ser interpretados.</p>
        <button onClick={onContinue} className="w-full py-4 bg-magical-gold text-magical-navy font-black uppercase rounded-xl">Continuar</button>
      </div>
    )
  }

  const toneClass = {
    good: 'border-healing-green/40 bg-healing-green/10 shadow-[0_0_40px_rgba(34,197,94,0.15)]',
    bad: 'border-impact-red/40 bg-impact-red/10 shadow-[0_0_40px_rgba(239,68,68,0.15)]',
    neutral: 'border-magical-gold/40 bg-magical-gold/5 shadow-[0_0_40px_rgba(212,175,55,0.1)]'
  }[announcement.tone]

  return (
    <div className={`rounded-[2.5rem] border p-6 md:p-10 shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-12 duration-700 ${toneClass}`}>
      
      {/* Title & Effectiveness */}
      <div className="text-center mb-8 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Resolución del Turno</p>
        <h2 className={`text-3xl md:text-5xl font-black italic uppercase tracking-tighter ${announcement.tone === 'good' ? 'text-healing-green' : announcement.tone === 'bad' ? 'text-impact-red' : 'text-magical-gold'}`}>
          {announcement.effectivenessLabel}
        </h2>
      </div>

      {/* Strategy Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <StrategyCard 
          label="Tu Estrategia" 
          actions={announcement.myActions} 
          stance={announcement.myStance} 
          isPlayer 
        />
        <StrategyCard 
          label="Estrategia Rival" 
          actions={announcement.rivalActions} 
          stance={announcement.rivalStance} 
        />
      </div>

      {/* Narrative Timeline */}
      <div className="bg-black/40 rounded-3xl p-6 border border-white/5 mb-8 space-y-4">
        <h4 className="text-[10px] font-black uppercase text-magical-gold tracking-widest mb-4">Línea de Eventos</h4>
        <div className="space-y-3">
          {announcement.timeline.map((line, i) => (
            <div key={i} className="flex gap-4 items-start animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 150}ms` }}>
              <span className="text-magical-gold font-black italic text-sm">{i + 1}.</span>
              <p className="text-sm text-white/80 leading-relaxed font-medium">{line}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Results Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatSummary label="Daño Causado" value={announcement.rivalDamageTaken} color="text-healing-green" />
        <StatSummary label="Daño Recibido" value={announcement.myDamageTaken} color="text-impact-red" />
        <StatSummary label="Bloqueo Total" value={announcement.myBreakdown.blocked} color="text-spell-blue" />
        <StatSummary label="Energía Neta" value={(announcement.myBreakdown.energyGain || 0) - (announcement.myBreakdown.energyCost || 0)} color="text-magical-gold" isEnergy />
      </div>

      <button
        onClick={onContinue}
        className="w-full py-5 md:py-7 bg-magical-gold text-magical-navy font-black uppercase italic tracking-widest rounded-2xl shadow-[0_15px_40px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm md:text-lg"
      >
        Continuar Duelo
      </button>
    </div>
  )
}

function StrategyCard({ label, actions, stance, isPlayer }) {
  const STANCE_ICONS = { offensive: '⚔️', defensive: '🛡️', concentrated: '🧘', cunning: '🧠', desperate: '🔥', neutral: '🪄' }
  return (
    <div className={`p-5 rounded-3xl border ${isPlayer ? 'bg-magical-gold/5 border-magical-gold/20' : 'bg-white/5 border-white/10'}`}>
      <p className={`text-[9px] font-black uppercase tracking-widest mb-3 ${isPlayer ? 'text-magical-gold' : 'text-white/40'}`}>{label}</p>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {actions.map((a, i) => (
            <span key={i} className="px-3 py-1 bg-black/60 rounded-lg text-[10px] font-bold text-white border border-white/5">
              {a.name}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg">{STANCE_ICONS[stance] || '🪄'}</span>
          <span className="text-[10px] font-black uppercase text-white/60 italic">{stance}</span>
        </div>
      </div>
    </div>
  )
}

function StatSummary({ label, value, color, isEnergy }) {
  return (
    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
      <p className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-1">{label}</p>
      <p className={`text-xl md:text-2xl font-black ${color}`}>
        {isEnergy && value >= 0 ? '+' : ''}{value}
      </p>
    </div>
  )
}
  )
}

function BreakdownCard({ label, total, details, isAttacker, heal }) {
  const colorClass = isAttacker ? 'text-healing-green' : 'text-impact-red'
  
  return (
    <div className="bg-black/60 rounded-2xl p-5 border border-white/5 space-y-4 relative overflow-hidden">
      <div className="flex justify-between items-start border-b border-white/5 pb-3 relative z-10">
        <div className="flex items-center gap-2">
          {isAttacker ? <Swords className="w-3 h-3 text-magical-gold" /> : <Shield className="w-3 h-3 text-impact-red" />}
          <p className="text-[9px] md:text-[11px] uppercase tracking-widest text-white/40 font-black">{label}</p>
        </div>
        <div className="text-right">
           <p className={`text-2xl md:text-3xl font-black ${colorClass}`}>-{total}</p>
           {heal > 0 && (
             <div className="flex items-center justify-end gap-1 text-healing-green">
               <Heart className="w-3 h-3 fill-current" />
               <span className="text-[10px] font-black">+{heal} HP</span>
             </div>
           )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-2 relative z-10">
        {details.base > 0 && <StatRow label="Daño Base" value={details.base} />}
        {details.bonus > 0 && <StatRow label="Bonus Estratégico" value={`+${details.bonus}`} color="text-healing-green" />}
        {details.penalty > 0 && <StatRow label="Penalización" value={`-${details.penalty}`} color="text-impact-red" />}
        {details.block > 0 && <StatRow label="Defensa Rival" value={`-${details.block}`} color="text-spell-blue" />}
        {details.interrupted && <StatRow label="Acción Interrumpida" value="SÍ" color="text-impact-red" />}
      </div>
      
      {/* Subtle background icon */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12">
        {isAttacker ? <Swords className="w-24 h-24" /> : <Shield className="w-24 h-24" />}
      </div>
    </div>
  )
}

function StatRow({ label, value, color = "text-white/50" }) {
  return (
    <div className="flex justify-between items-center text-[9px] md:text-[10px] uppercase font-bold tracking-wider">
      <span className="text-white/30">{label}</span>
      <span className={color}>{value}</span>
    </div>
  )
}
