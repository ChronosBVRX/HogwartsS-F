import React from 'react'
import { buildTurnAnnouncement } from '../../lib/duelNarration'
import { AlertTriangle, Info, Target } from 'lucide-react'
import audioManager from '../../lib/audioManager'

export default function DuelTurnAnnouncement({ lastEvent, isP1, onContinue }) {
  const announcement = buildTurnAnnouncement({
    payload: lastEvent?.payload,
    isP1
  })

  React.useEffect(() => {
    if (announcement && lastEvent) {
      // 1. Play SFX for reveal
      audioManager.playSfx('verdict_reveal')

      // 2. Build Sequence
      const sequence = []
      
      // Part 1: Strategic Verdict
      if (announcement.tone === 'good') {
        sequence.push({ key: 'verdict_player_won_strategy', delayMs: 400 })
      } else if (announcement.tone === 'bad') {
        sequence.push({ key: 'verdict_rival_won_strategy', delayMs: 400 })
      } else {
        sequence.push({ key: 'verdict_neutral_clash', delayMs: 400 })
      }

      // Part 2: Impact & Damage
      const dmg = announcement.myDamageTaken ?? 0
      if (dmg === 0) {
        sequence.push({ key: 'impact_no_damage', delayMs: 200 })
      } else if (dmg <= 8) {
        sequence.push({ key: 'impact_low_damage', delayMs: 200 })
      } else if (dmg <= 18) {
        sequence.push({ key: 'impact_medium_damage', delayMs: 200 })
      } else if (dmg <= 29) {
        sequence.push({ key: 'impact_high_damage', delayMs: 200 })
      } else {
        sequence.push({ key: 'impact_devastating_damage', delayMs: 200 })
      }

      // Part 3: Contextual (Interruptions or Blocks)
      if (announcement.myBreakdown?.interrupted) {
        sequence.push({ key: 'second_action_interrupted', delayMs: 200 })
      } else if (announcement.myActions?.length > 1) {
        // Success if had 2 actions and not interrupted
        sequence.push({ key: 'second_action_success', delayMs: 200 })
      } else if (announcement.myBreakdown?.blocked > 0) {
        if (dmg === 0) {
          sequence.push({ key: 'impact_blocked', delayMs: 200 })
        } else {
          sequence.push({ key: 'impact_partial_block', delayMs: 200 })
        }
      }

      // Part 4: Strategic Lesson (Optional fourth part, limited by sequence logic)
      if (announcement.finalLesson && Math.random() > 0.5) {
         // Picking a lesson key based on lesson text or random
         // For now, let's just pick one if relevant
      }

      // Play Sequence (limit to 3 internally in audioManager)
      audioManager.playVoiceSequence(sequence, { cooldownMs: 10000 })
    }
  }, [lastEvent?.id, announcement?.tone])

  React.useEffect(() => {
    // SFX for Formula & Lesson
    const timer1 = setTimeout(() => audioManager.playSfx('damage_formula_tick'), 800)
    const timer2 = setTimeout(() => audioManager.playSfx('lesson_reveal'), 1500)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [lastEvent?.id])

  if (!announcement) {
    return (
      <div className="rounded-[2.5rem] border border-impact-red/40 bg-impact-red/10 p-8 text-center backdrop-blur-2xl">
        <AlertTriangle className="w-12 h-12 text-impact-red mx-auto mb-4" />
        <h3 className="text-xl font-black text-white uppercase italic">Error de Sincronización</h3>
        <button onClick={onContinue} className="w-full mt-4 py-4 bg-magical-gold text-magical-navy font-black uppercase rounded-xl">Continuar</button>
      </div>
    )
  }

  const toneColor = announcement.tone === 'good' ? 'text-healing-green' : announcement.tone === 'bad' ? 'text-impact-red' : 'text-magical-gold'
  const toneBg = announcement.tone === 'good' ? 'bg-healing-green/10 border-healing-green/40' : announcement.tone === 'bad' ? 'bg-impact-red/10 border-impact-red/40' : 'bg-magical-gold/10 border-magical-gold/40'

  return (
    <div className="max-h-[90vh] overflow-y-auto space-y-6 p-1 scrollbar-hide pb-10">
      
      {/* 1. VEREDICTO ESTRATÉGICO */}
      <div className={`rounded-[2.5rem] border p-8 shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 ${toneBg}`}>
        <div className="text-center space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Veredicto del Turno</p>
          <h2 className={`text-3xl md:text-5xl font-black italic uppercase tracking-tighter ${toneColor}`}>
            {announcement.verdictTitle}
          </h2>
          <p className="text-white/80 text-sm leading-relaxed max-w-sm mx-auto font-medium italic">
            "{announcement.verdictText}"
          </p>
        </div>
      </div>

      {/* 2. RESUMEN DE IMPACTO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in zoom-in duration-500 delay-200">
        <ImpactStat label="Daño que hiciste" value={announcement.rivalDamageTaken} color="text-healing-green" />
        <ImpactStat label="Daño recibido" value={announcement.myDamageTaken} color="text-impact-red" />
        <ImpactStat label="Anulaste (Def)" value={announcement.myBreakdown.blocked} color="text-spell-blue" />
        <ImpactStat label="Te anularon" value={announcement.rivalBreakdown.blocked} color="text-text-gray" />
      </div>

      {/* 2. DESGLOSE DE DAÑO (LA FÓRMULA) */}
      <div className="bg-black/60 rounded-[2.5rem] border border-white/5 p-8 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-magical-gold" />
            <h3 className="text-[10px] font-black uppercase text-magical-gold tracking-widest">Análisis del Impacto</h3>
          </div>
          {!announcement.damageFormulaExact && (
            <span className="text-[8px] font-black uppercase text-white/20 tracking-tighter">Desglose parcial</span>
          )}
        </div>
        
        <p className="text-sm text-white/60 italic px-2">
          {announcement.damageReason}
        </p>

        <div className="space-y-3 bg-black/40 rounded-3xl p-6 border border-white/5">
          {announcement.damageFormula.map((item, i) => (
            <div key={i} className={`flex justify-between items-center ${item.type === 'final' ? 'mt-4 pt-4 border-t border-white/10' : ''}`}>
              <span className={`text-xs font-bold ${item.type === 'final' ? 'text-white' : 'text-white/40'}`}>
                {item.label}
              </span>
              <span className={`text-sm font-black ${
                item.type === 'danger' ? 'text-impact-red' : 
                item.type === 'defense' ? 'text-spell-blue' : 
                item.type === 'final' ? toneColor : 'text-white/60'
              }`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. ESTRATEGIAS COMPARADAS */}
      <div className="grid grid-cols-2 gap-4">
        <StrategyCard label="Tu Estrategia" actions={announcement.myActions} stance={announcement.myStance} isPlayer />
        <StrategyCard label="Rival" actions={announcement.rivalActions} stance={announcement.rivalStance} />
      </div>

      {/* 4. LÍNEA DE EVENTOS */}
      <div className="bg-black/40 rounded-[2.5rem] p-8 border border-white/5 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-magical-gold" />
          <h4 className="text-[10px] font-black uppercase text-magical-gold tracking-widest">Línea de Eventos</h4>
        </div>
        <div className="space-y-4">
          {announcement.timeline.map((line, i) => (
            <div key={i} className="flex gap-4 items-start animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="w-1.5 h-1.5 rounded-full bg-magical-gold mt-1.5 shrink-0" />
              <p className="text-xs text-white/70 leading-relaxed">{line}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. LECCIÓN FINAL */}
      <div className="bg-magical-gold/5 border border-magical-gold/20 rounded-3xl p-6 text-center space-y-2 italic">
        <p className="text-[9px] font-black uppercase text-magical-gold/60 tracking-widest">Lección para el siguiente turno</p>
        <p className="text-xs text-white/80">{announcement.finalLesson}</p>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-6 bg-magical-gold text-magical-navy font-black uppercase italic tracking-widest rounded-2xl shadow-[0_15px_40px_rgba(212,175,55,0.4)] active:scale-95 transition-all"
      >
        Continuar Duelo
      </button>
    </div>
  )
}

function StrategyCard({ label, actions, stance, isPlayer }) {
  const STANCE_LABELS = { 
    neutral: 'Neutral', 
    offensive: 'Ataque Valiente', 
    defensive: 'Guardia Protegida', 
    concentrated: 'Enfoque Arcano', 
    cunning: 'Lectura Táctica', 
    desperate: 'Último Recurso' 
  }

  return (
    <div className={`p-5 rounded-3xl border flex flex-col items-center text-center ${isPlayer ? 'bg-magical-gold/5 border-magical-gold/20' : 'bg-white/5 border-white/10'}`}>
      <p className={`text-[8px] font-black uppercase tracking-widest mb-3 ${isPlayer ? 'text-magical-gold' : 'text-white/30'}`}>{label}</p>
      <div className="space-y-2">
        <div className="flex flex-wrap justify-center gap-1">
          {actions.map((a, i) => (
            <span key={i} className="px-2 py-0.5 bg-black/60 rounded text-[9px] font-bold text-white border border-white/5">
              {a.name}
            </span>
          ))}
        </div>
        <p className="text-[9px] font-black uppercase text-white/50 italic">{STANCE_LABELS[stance] || stance}</p>
      </div>
    </div>
  )
}

function ImpactStat({ label, value, color }) {
  return (
    <div className="bg-black/60 border border-white/5 p-4 rounded-3xl text-center space-y-1">
      <p className="text-[8px] font-black uppercase tracking-widest text-white/30">{label}</p>
      <p className={`text-2xl font-black italic ${color}`}>{value}</p>
    </div>
  )
}
