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
      if (label.includes('muy efectivo')) {
        audioManager.playVoice('turn_result_super', { cooldownMs: 10000 })
      } else if (label.includes('no fue muy efectivo')) {
        audioManager.playVoice('turn_result_weak', { cooldownMs: 10000 })
      } else if (label.includes('leyó tu movimiento') || label.includes('detenido')) {
        audioManager.playVoice('turn_result_block', { cooldownMs: 10000 })
      } else if (label.includes('castigó')) {
        audioManager.playVoice('turn_result_punish', { cooldownMs: 10000 })
      } else {
        audioManager.playVoice('turn_result_neutral', { cooldownMs: 10000 })
      }
    }
  }, [lastEvent?.id, announcement?.effectivenessLabel])

  if (!announcement) {
    return (
      <div className="rounded-[2.5rem] border border-impact-red/40 bg-impact-red/10 p-8 md:p-12 text-center backdrop-blur-2xl animate-in fade-in zoom-in duration-500 shadow-2xl">
        <div className="w-20 h-20 bg-impact-red/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-impact-red/30">
           <AlertTriangle className="w-10 h-10 text-impact-red animate-pulse" />
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Error de Sincronización Arcana</h3>
        <p className="text-white/60 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
          No se pudo construir la explicación del turno. Revisa los datos del evento para depurar el flujo.
        </p>
        
        <div className="bg-black/60 rounded-2xl p-6 text-left mb-8 border border-white/5 overflow-hidden">
          <p className="text-[9px] font-black text-magical-gold uppercase tracking-[0.3em] mb-4">Debug Payload:</p>
          <pre className="text-[10px] text-white/40 font-mono overflow-auto max-h-[200px] custom-scrollbar leading-tight">
            {JSON.stringify(lastEvent?.payload, null, 2)}
          </pre>
        </div>

        <button 
          onClick={onContinue} 
          className="w-full py-4 md:py-6 bg-magical-gold text-magical-navy font-black uppercase italic tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Forzar Continuación
        </button>
      </div>
    )
  }

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
      {/* Spell Clash Header */}
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

      {/* Main Narrative Result */}
      <div className="space-y-4 text-center px-2 mb-8">
        <p className={`text-xl md:text-3xl font-black uppercase italic tracking-tight ${textToneClass} animate-pulse`}>
          {announcement.effectivenessLabel}
        </p>
        <p className="text-xs md:text-base text-white/70 leading-relaxed font-medium">
          {announcement.explanation}
        </p>
      </div>

      {/* Stats Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <BreakdownCard 
          label="Tu Impacto" 
          total={announcement.rivalDamageTaken} 
          details={announcement.myBreakdown}
          isAttacker={true}
          heal={announcement.myBreakdown.heal}
        />
        <BreakdownCard 
          label="Impacto Rival" 
          total={announcement.myDamageTaken} 
          details={announcement.rivalBreakdown}
          isAttacker={false}
          heal={announcement.rivalBreakdown.heal}
        />
      </div>

      {/* Energy & Action Row */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-night-blue/60 rounded-2xl p-4 border border-magical-gold/20 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${announcement.myBreakdown.interrupted ? 'bg-impact-red/10 border-impact-red/30' : 'bg-magical-gold/10 border-magical-gold/30'}`}>
               {announcement.myBreakdown.interrupted ? <AlertTriangle className="w-5 h-5 text-impact-red" /> : <Zap className="w-5 h-5 text-magical-gold" />}
             </div>
             <div>
               <p className={`text-[10px] font-black uppercase tracking-widest ${announcement.myBreakdown.interrupted ? 'text-impact-red' : 'text-magical-gold'}`}>
                 {announcement.myBreakdown.interrupted ? 'Carga Interrumpida' : 'Energía'}
               </p>
               <p className="text-xs font-bold text-white">
                 {announcement.myBreakdown.energyCost > 0 && `Gasto: -${announcement.myBreakdown.energyCost}`}
                 {announcement.myBreakdown.energyGain > 0 && !announcement.myBreakdown.interrupted && ` Carga: +${announcement.myBreakdown.energyGain}`}
                 {announcement.myBreakdown.interrupted && ` Carga anulada`}
               </p>
             </div>
           </div>
           <div className="text-right">
             <p className={`text-xl font-black ${announcement.myBreakdown.interrupted ? 'text-impact-red' : 'text-white'}`}>
               {announcement.myBreakdown.interrupted ? '+0' : (
                 <>
                   {(announcement.myBreakdown.energyGain || 0) - (announcement.myBreakdown.energyCost || 0) >= 0 ? '+' : ''}
                   {(announcement.myBreakdown.energyGain || 0) - (announcement.myBreakdown.energyCost || 0)}
                 </>
               )}
             </p>
           </div>
        </div>

        <button
          onClick={onContinue}
          className="flex-[2] py-4 md:py-6 bg-magical-gold text-magical-navy font-black uppercase italic tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Continuar Duelo
        </button>
      </div>
    </div>
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
