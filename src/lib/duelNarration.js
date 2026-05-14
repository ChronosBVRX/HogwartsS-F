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
    bonus: payload[myPrefix + 'bonus'] || 0,
    penalty: payload[myPrefix + 'penalty'] || 0,
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
    bonus: payload[rivalPrefix + 'bonus'] || 0,
    penalty: payload[rivalPrefix + 'penalty'] || 0,
    energyChange: payload[rivalPrefix + 'energy_change'] || 0,
    heal: payload[rivalPrefix + 'heal'] || 0,
    interrupted: payload[rivalPrefix + 'interrupted'] || false
  }

  // Análisis de ventaja estratégica (basado en la acción principal)
  const myFirstSpell = SPELLS[my.actions[0]?.key] || SPELLS.rictusempra
  const rivalFirstSpell = SPELLS[rival.actions[0]?.key] || SPELLS.rictusempra
  const myWon = myFirstSpell.beats.includes(rivalFirstSpell.family)
  const rivalWon = rivalFirstSpell.beats.includes(myFirstSpell.family)

  // 1. Veredicto
  let verdictTitle = "Choque Neutral"
  if (myWon && !rivalWon) verdictTitle = "¡Leíste mejor al rival!"
  else if (rivalWon && !myWon) verdictTitle = "El rival te leyó mejor"

  let verdictText = `Ambos chocaron sus hechizos en un duelo de voluntades.`
  if (myWon && !rivalWon) verdictText = `Tu ${myFirstSpell.name} dominó el intercambio estratégico.`
  else if (rivalWon && !myWon) verdictText = `El rival anticipó tu jugada con un ${rivalFirstSpell.name}.`

  // 2. Timeline detallada
  const timeline = []
  timeline.push(`Iniciaste el turno en postura ${STANCES[my.stance].name}.`)
  
  my.actions.forEach((a, i) => {
    const spell = SPELLS[a.key]
    if (spell) {
      if (i === 1 && my.interrupted) {
        timeline.push(`Intentaste lanzar ${spell.name}, ¡pero fuiste interrumpido!`)
      } else {
        timeline.push(`Lanzaste ${spell.name} (${spell.apCost} AP).`)
      }
    }
  })

  if (my.blocked > 0) timeline.push(`Tu defensa y postura absorbieron ${my.blocked} puntos de daño.`)
  if (my.heal > 0) timeline.push(`Recuperaste ${my.heal} HP mediante artes curativas.`)
  if (my.energyChange !== 0) timeline.push(`${my.energyChange > 0 ? 'Ganaste' : 'Perdiste'} ${Math.abs(my.energyChange)} de energía.`)

  // 3. Desglose de Daño Recibido
  const damageFormula = []
  const rivalPrimarySpell = SPELLS[rival.actions[0]?.key]
  if (rivalPrimarySpell && rivalPrimarySpell.damage > 0) {
    damageFormula.push({ label: `Daño base de ${rivalPrimarySpell.name}`, value: rivalPrimarySpell.damage, type: 'danger' })
  }
  
  if (rival.actions.length > 1 && !rival.interrupted) {
    const rivalSecondSpell = SPELLS[rival.actions[1]?.key]
    if (rivalSecondSpell && rivalSecondSpell.damage > 0) {
      damageFormula.push({ label: `Daño por segunda acción`, value: rivalSecondSpell.damage, type: 'danger' })
    }
  }

  if (payload[rivalPrefix + 'strategy_bonus'] > 0) {
    damageFormula.push({ label: "Bonus por ventaja táctica rival", value: `+${payload[rivalPrefix + 'strategy_bonus']}`, type: 'danger' })
  }

  if (payload[rivalPrefix + 'stance_bonus'] > 0) {
    damageFormula.push({ label: `Bonus por postura ${STANCES[rival.stance].name} rival`, value: `+${payload[rivalPrefix + 'stance_bonus']}`, type: 'danger' })
  }

  if (my.penalty > 0) {
    damageFormula.push({ label: `Penalización por tu postura ${STANCES[my.stance].name}`, value: `+${my.penalty}`, type: 'danger' })
  }

  if (my.blocked > 0) {
    damageFormula.push({ label: "Daño mitigado por bloqueo", value: `-${my.blocked}`, type: 'defense' })
  }

  damageFormula.push({ label: "Daño final recibido", value: my.damageTaken, type: 'final' })

  // 4. Lección
  let finalLesson = "Vigila la energía del rival; si tiene más de 2, un ataque pesado es inminente."
  if (my.interrupted) finalLesson = "Tu segunda acción fue interrumpida. Recibir un daño fuerte mientras lanzas hechizos lentos puede ser fatal."
  if (myWon) finalLesson = "¡Excelente lectura! Mantener la ventaja de familia es la clave para ganar sin gastar toda tu energía."

  return {
    verdictTitle,
    verdictText,
    damageReason: my.damageTaken > 0 ? `El rival logró conectar sus hechizos superando tu resistencia.` : `Lograste mitigar cualquier daño entrante con éxito.`,
    damageFormula,
    damageFormulaExact: true,
    finalLesson,
    timeline,
    tone: myWon ? 'good' : rivalWon ? 'bad' : 'neutral',
    myActions: my.actions.map(a => SPELLS[a.key]).filter(Boolean),
    rivalActions: rival.actions.map(a => SPELLS[a.key]).filter(Boolean),
    myStance: my.stance,
    rivalStance: rival.stance,
    myDamageTaken: my.damageTaken,
    rivalDamageTaken: my.damageDealt,
    myBreakdown: { 
      blocked: my.blocked, 
      energyChange: my.energyChange, 
      interrupted: my.interrupted,
      heal: my.heal
    }
  }
}
