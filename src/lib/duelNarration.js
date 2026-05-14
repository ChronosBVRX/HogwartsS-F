import { SPELLS } from './duelSpells'
import { STANCES, normalizeDuelPayload } from './duelRules'

const FAMILY_NAMES = {
  attack: 'Ataque Directo',
  heavy: 'Ataque Pesado',
  defense: 'Defensa',
  control: 'Control',
  counter: 'Contrahechizo',
  heal: 'Curación',
  charge: 'Carga Mágica',
  disarm: 'Desarme'
}

const STRATEGIC_REASONS = {
  'defense_beats_attack': "La defensa resiste ataques directos.",
  'defense_beats_heavy': "La defensa contiene ataques pesados.",
  'control_beats_defense': "El control rompe defensas.",
  'counter_beats_control': "El contrahechizo cancela el control.",
  'heavy_beats_heal': "El ataque pesado interrumpe curaciones.",
  'heavy_beats_charge': "El ataque pesado castiga la carga de energía.",
  'disarm_beats_heavy': "El desarme corta ataques pesados.",
  'attack_beats_charge': "El ataque directo castiga intentos de cargar energía.",
  'heal_beats_defense': "La curación aprovecha turnos defensivos.",
  'charge_beats_counter': "La carga gana cuando no hay magia que cancelar."
}

export function buildTurnAnnouncement({ payload: rawPayload, isP1 }) {
  if (!rawPayload) return null
  
  const payload = normalizeDuelPayload(rawPayload)
  const myPrefix = isP1 ? 'p1_' : 'p2_'
  const rivalPrefix = isP1 ? 'p2_' : 'p1_'

  const my = {
    actions: payload[myPrefix + 'actions'] || [],
    stance: payload[myPrefix + 'stance'] || 'neutral',
    damageTaken: payload[myPrefix + 'damage'] || 0,
    damageDealt: payload[myPrefix + 'damage_dealt'] || 0,
    blocked: payload[myPrefix + 'blocked'] || 0,
    bonus: payload[myPrefix + 'stance_bonus'] || 0,
    takenBonus: payload[myPrefix + 'damage_taken_bonus'] || 0,
    dealtPenalty: payload[myPrefix + 'damage_dealt_penalty'] || 0,
    strategyBonus: payload[myPrefix + 'strategy_bonus'] || 0,
    energyChange: payload[myPrefix + 'energy_change'] || 0,
    heal: payload[myPrefix + 'heal'] || 0,
    interrupted: payload[myPrefix + 'interrupted'] || false
  }

  const rival = {
    actions: payload[rivalPrefix + 'actions'] || [],
    stance: payload[rivalPrefix + 'stance'] || 'neutral',
    damageTaken: payload[rivalPrefix + 'damage'] || 0,
    damageDealt: payload[rivalPrefix + 'damage_dealt'] || 0,
    blocked: payload[rivalPrefix + 'blocked'] || 0,
    bonus: payload[rivalPrefix + 'stance_bonus'] || 0,
    takenBonus: payload[rivalPrefix + 'damage_taken_bonus'] || 0,
    dealtPenalty: payload[rivalPrefix + 'damage_dealt_penalty'] || 0,
    strategyBonus: payload[rivalPrefix + 'strategy_bonus'] || 0,
    energyChange: payload[rivalPrefix + 'energy_change'] || 0,
    heal: payload[rivalPrefix + 'heal'] || 0,
    interrupted: payload[rivalPrefix + 'interrupted'] || false
  }

  // Análisis de ventaja estratégica (COMBO COMPLETO)
  const myFamilies = my.actions.map(a => SPELLS[a.key]?.family).filter(Boolean)
  const rivalFamilies = rival.actions.map(a => SPELLS[a.key]?.family).filter(Boolean)
  
  let myAdvantageCount = 0
  let rivalAdvantageCount = 0

  my.actions.forEach(a => {
    const s = SPELLS[a.key]
    if (s) {
      rivalFamilies.forEach(rf => {
        if (s.beats.includes(rf)) myAdvantageCount++
      })
    }
  })

  rival.actions.forEach(a => {
    const s = SPELLS[a.key]
    if (s) {
      myFamilies.forEach(mf => {
        if (s.beats.includes(mf)) rivalAdvantageCount++
      })
    }
  })

  const myWon = myAdvantageCount > rivalAdvantageCount
  const rivalWon = rivalAdvantageCount > myAdvantageCount

  // 1. Veredicto
  let verdictTitle = "Choque de Voluntades"
  if (myWon) verdictTitle = "¡Dominio Estratégico!"
  else if (rivalWon) verdictTitle = "Rival al Acecho"

  let verdictText = `Un intercambio neutral donde ambos magos mantuvieron su posición.`
  if (myWon) verdictText = `Tu combinación de hechizos logró superar las defensas y el ritmo del rival.`
  else if (rivalWon) verdictText = `El rival leyó tus movimientos y logró posicionarse mejor en el duelo.`

  // 2. Timeline
  const timeline = []
  timeline.push(`Iniciaste en postura ${STANCES[my.stance].name}.`)
  my.actions.forEach((a, i) => {
    const s = SPELLS[a.key]
    if (s) {
      if (i === 1 && my.interrupted) timeline.push(`¡${s.name} fue interrumpido por el impacto rival!`)
      else timeline.push(`Lanzaste ${s.name}.`)
    }
  })
  if (my.blocked > 0) timeline.push(`Bloqueaste ${my.blocked} de daño.`)
  if (my.heal > 0) timeline.push(`Te curaste ${my.heal} HP.`)
  
  if (payload[myPrefix + 'burn'] > 0) {
    timeline.push(`¡Sufres quemaduras! (Recibes 5 de daño extra).`)
  }
  if (payload[myPrefix + 'weakness'] > 0) {
    timeline.push(`Te sientes débil; tu próximo ataque será menos potente.`)
  }
  if (my.actions.some(a => a.key === 'finite')) {
    timeline.push(`Finite Incantatem anuló todos los efectos de control sobre ti.`)
  }

  // 3. Fórmula (Daño Recibido)
  const damageFormula = []
  rival.actions.forEach((a, i) => {
    const s = SPELLS[a.key]
    if (s && s.damage > 0) {
      if (i === 1 && rival.interrupted) return
      damageFormula.push({ label: `Daño de ${s.name}`, value: s.damage, type: 'danger' })
    }
  })

  if (rival.strategyBonus > 0) damageFormula.push({ label: "Bonus táctico rival", value: `+${rival.strategyBonus}`, type: 'danger' })
  if (rival.bonus > 0) damageFormula.push({ label: "Bonus de postura rival", value: `+${rival.bonus}`, type: 'danger' })
  if (my.takenBonus > 0) damageFormula.push({ label: `Vulnerabilidad (${STANCES[my.stance].name})`, value: `+${my.takenBonus}`, type: 'danger' })
  if (rival.dealtPenalty > 0) damageFormula.push({ label: "Penalización rival", value: `-${rival.dealtPenalty}`, type: 'defense' })
  if (my.blocked > 0) damageFormula.push({ label: "Tu bloqueo total", value: `-${my.blocked}`, type: 'defense' })
  
  damageFormula.push({ label: "Daño final recibido", value: my.damageTaken, type: 'final' })

  return {
    verdictTitle,
    verdictText,
    damageReason: my.damageTaken > 0 ? `El impacto rival superó tu umbral de defensa.` : `Tu estrategia defensiva fue perfecta este turno.`,
    damageFormula,
    damageFormulaExact: true,
    finalLesson: myWon ? "¡Sigue así! Mantener la presión obliga al rival a gastar energía en defenderse." : "Observa sus recursos; un rival sin energía es vulnerable a hechizos pesados.",
    timeline,
    tone: myWon ? 'good' : rivalWon ? 'bad' : 'neutral',
    myActions: my.actions.map(a => SPELLS[a.key]).filter(Boolean),
    rivalActions: rival.actions.map(a => SPELLS[a.key]).filter(Boolean),
    myStance: my.stance,
    rivalStance: rival.stance,
    myDamageTaken: my.damageTaken,
    rivalDamageTaken: my.damageDealt,
    myBreakdown: { 
      blocked: payload[myPrefix + 'cancelled_damage'] || 0, 
      energyChange: my.energyChange, 
      interrupted: my.interrupted, 
      heal: my.heal,
      burn: payload[myPrefix + 'burn'] || 0,
      weakness: payload[myPrefix + 'weakness'] || 0
    },
    rivalBreakdown: { 
      blocked: payload[rivalPrefix + 'cancelled_damage'] || 0, 
      energyChange: rival.energyChange, 
      interrupted: rival.interrupted, 
      heal: rival.heal,
      burn: payload[rivalPrefix + 'burn'] || 0,
      weakness: payload[rivalPrefix + 'weakness'] || 0
    }
  }
}
