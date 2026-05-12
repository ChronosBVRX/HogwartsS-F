import { SPELLS } from './duelSpells'

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

const STANCE_NAMES = {
  offensive: 'Ofensiva (Ataque Valiente)',
  defensive: 'Defensiva (Guardia Protegida)',
  concentrated: 'Concentrada (Enfoque Arcano)',
  cunning: 'Astuta (Lectura Táctica)',
  desperate: 'Desesperada (Último Recurso)',
  neutral: 'Neutral'
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

export function buildTurnAnnouncement({ payload, isP1 }) {
  if (!payload) return null

  // Normalización de datos
  const getPData = (pNum) => {
    const prefix = pNum === 1 ? 'p1_' : 'p2_';
    return {
      actions: payload[prefix + 'actions'] || [],
      stance: payload[prefix + 'stance'] || 'neutral',
      damageTaken: payload[prefix + 'damage'] ?? 0,
      damageDealt: payload[pNum === 1 ? 'p2_damage_dealt' : 'p1_damage_dealt'] ?? 0,
      blocked: payload[prefix + 'blocked'] ?? 0,
      energyChange: payload[prefix + 'energy_change'] ?? 0,
      heal: payload[prefix + 'heal'] ?? 0
    }
  }

  const p1 = getPData(1)
  const p2 = getPData(2)
  const my = isP1 ? p1 : p2
  const rival = isP1 ? p2 : p1

  const myAction = my.actions[0] || { key: 'rictusempra' }
  const rivalAction = rival.actions[0] || { key: 'rictusempra' }
  const mySpell = SPELLS[myAction.key] || SPELLS.rictusempra
  const rivalSpell = SPELLS[rivalAction.key] || SPELLS.rictusempra

  const myWon = mySpell.beats.includes(rivalSpell.family)
  const rivalWon = rivalSpell.beats.includes(mySpell.family)

  // 1. Veredicto Estratégico
  let verdictTitle = "Choque Neutral"
  let verdictText = "Ambos chocaron sin una ventaja clara en este intercambio."
  let strategicReason = "Ninguna estrategia dominó por completo."

  const reasonKey = `${mySpell.family}_beats_${rivalSpell.family}`
  const rivalReasonKey = `${rivalSpell.family}_beats_${mySpell.family}`

  if (myWon && !rivalWon) {
    verdictTitle = "¡Leíste mejor al rival!"
    strategicReason = STRATEGIC_REASONS[reasonKey] || `Tu ${mySpell.name} superó su ${rivalSpell.name}.`
    verdictText = `Usaste ${mySpell.name} justo cuando el rival intentó ${rivalSpell.name}. ${strategicReason}`
  } else if (rivalWon && !myWon) {
    verdictTitle = "El rival te leyó mejor"
    strategicReason = STRATEGIC_REASONS[rivalReasonKey] || `Su ${rivalSpell.name} superó tu ${mySpell.name}.`
    verdictText = `Intentaste usar ${mySpell.name}, pero el rival respondió con ${rivalSpell.name}. ${strategicReason}`
  }

  // 2. Severidad y Fórmula de Daño
  const getSeverity = (dmg) => {
    if (dmg === 0) return "No recibiste daño."
    if (dmg < 10) return "El daño fue bajo."
    if (dmg < 20) return "El daño fue moderado."
    if (dmg < 35) return "El daño fue alto."
    return "¡El golpe fue devastador!"
  }

  const damageSeverityText = getSeverity(my.damageTaken)
  const damageReason = my.damageTaken > 0 
    ? (rivalWon ? `Recibiste daño alto porque el rival tenía ventaja estratégica.` : `Recibiste daño porque el poder del rival superó tu defensa.`)
    : "Tu estrategia defensiva fue impecable."

  // Construir fórmula (Simplificada con los datos disponibles)
  const damageFormula = [
    { label: `Poder de ${rivalSpell.name}`, value: rivalSpell.damage || 15, type: 'danger' },
    { label: "Bonus por postura/ventaja", value: rivalWon ? "+5" : (rival.stance === 'offensive' ? "+5" : "+0"), type: 'danger' },
    { label: "Tu bloqueo aplicado", value: my.blocked > 0 ? `-${my.blocked}` : "0", type: 'defense' },
    { label: "Daño final recibido", value: my.damageTaken, type: 'final' }
  ]

  // 3. Lección
  let finalLesson = "Prueba a observar el nivel de energía del rival antes de cargar la tuya."
  if (rivalWon && rivalSpell.family === 'heavy') finalLesson = "Lección: Protego es una buena respuesta contra ataques pesados."
  if (my.stance === 'offensive' && my.damageTaken > 20) finalLesson = "Lección: La postura ofensiva te hace más fuerte, pero muy vulnerable."
  if (rivalSpell.family === 'defense' && my.damageTaken === 0) finalLesson = "Lección: Si el rival se defiende mucho, prueba hechizos de Control."

  // 4. Timeline (Cinematográfica)
  const timeline = [
    `Levantaste tu ${STANCE_NAMES[my.stance]} para encarar el turno.`,
    `Lanzaste ${mySpell.name} como tu movimiento principal.`,
    `El rival intentó responder con ${rivalSpell.name}.`,
  ]
  if (myWon) timeline.push(`¡Éxito! ${strategicReason}`)
  if (rivalWon) timeline.push(`¡Cuidado! ${strategicReason}`)
  if (my.blocked > 0) timeline.push(`Tu defensa logró contener ${my.blocked} puntos de daño rival.`)
  timeline.push(damageSeverityText)

  return {
    verdictTitle,
    verdictText,
    damageReason,
    damageFormula,
    finalLesson,
    timeline,
    tone: myWon ? 'good' : rivalWon ? 'bad' : 'neutral',
    myActions: my.actions.length > 0 ? my.actions.map(a => SPELLS[a.key]).filter(Boolean) : [mySpell],
    rivalActions: rival.actions.length > 0 ? rival.actions.map(a => SPELLS[a.key]).filter(Boolean) : [rivalSpell],
    myStance: my.stance,
    rivalStance: rival.stance,
    myDamageTaken: my.damageTaken,
    rivalDamageTaken: my.damageDealt,
    myBreakdown: { blocked: my.blocked, energyChange: my.energyChange }
  }
}
