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
  offensive: 'Ataque Valiente',
  defensive: 'Guardia Protegida',
  concentrated: 'Enfoque Arcano',
  cunning: 'Lectura Táctica',
  desperate: 'Último Recurso',
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

  // Normalización de datos con lectura profunda de bonus y fallbacks
  const getPData = (pNum) => {
    const prefix = pNum === 1 ? 'p1_' : 'p2_';
    const rivalPrefix = pNum === 1 ? 'p2_' : 'p1_';
    
    return {
      actions: payload[prefix + 'actions'] || [],
      stance: payload[prefix + 'stance'] || 'neutral',
      damageTaken: payload[prefix + 'damage'] ?? 0,
      damageDealt: payload[prefix + 'damage_dealt'] ?? payload[rivalPrefix + 'damage'] ?? 0,
      blocked: payload[prefix + 'blocked'] ?? 0,
      bonus: payload[prefix + 'bonus'] ?? 0,
      penalty: payload[prefix + 'penalty'] ?? 0,
      energyChange: payload[prefix + 'energy_change'] ?? 0,
      heal: payload[prefix + 'heal'] ?? 0,
      interrupted: payload[prefix + 'interrupted'] ?? false
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

  // 1. Veredicto Estratégico Específico
  let verdictTitle = "Choque Neutral"
  let strategicReason = "Ninguna estrategia dominó por completo."

  const reasonKey = `${mySpell.family}_beats_${rivalSpell.family}`
  const rivalReasonKey = `${rivalSpell.family}_beats_${mySpell.family}`

  if (myWon && !rivalWon) {
    verdictTitle = "¡Leíste mejor al rival!"
    strategicReason = STRATEGIC_REASONS[reasonKey] || `Tu ${mySpell.name} superó su ${rivalSpell.name}.`
  } else if (rivalWon && !myWon) {
    verdictTitle = "El rival te leyó mejor"
    strategicReason = STRATEGIC_REASONS[rivalReasonKey] || `Su ${rivalSpell.name} superó tu ${mySpell.name}.`
  }

  const verdictText = myWon && !rivalWon 
    ? `Usaste ${mySpell.name} (${FAMILY_NAMES[mySpell.family]}) contra su ${rivalSpell.name} (${FAMILY_NAMES[rivalSpell.family]}). ${strategicReason}`
    : rivalWon && !myWon
    ? `Intentaste usar ${mySpell.name}, pero el rival respondió con ${rivalSpell.name}. ${strategicReason}`
    : `Ambos lanzaron sus hechizos con convicción. ${strategicReason}`;

  // 2. Razón de Daño Específica y Posturas
  let damageReason = ""
  if (my.damageTaken > 0) {
    damageReason = `Recibiste ${my.damageTaken} de daño porque el ${rivalSpell.name} del rival impactó tu estrategia.`
    if (rivalWon) damageReason += ` Al ser ${FAMILY_NAMES[rivalSpell.family]}, tuvo ventaja contra tu ${FAMILY_NAMES[mySpell.family]}.`
    if (rival.stance === 'offensive') damageReason += ` Además, el rival usó ${STANCE_NAMES.offensive}, aumentando su potencia.`
    if (my.stance === 'offensive') damageReason += ` Tu postura de ${STANCE_NAMES.offensive} te dejó más vulnerable.`
  } else {
    damageReason = `Tu ${mySpell.name} y tu postura de ${STANCE_NAMES[my.stance]} neutralizaron el ataque rival.`
  }

  // 3. Fórmula de Daño Real (Matemática)
  // El bonus real puede venir de la postura del rival + la ventaja táctica
  const damageFormula = [
    { label: `Poder base de ${rivalSpell.name}`, value: rivalSpell.damage || 15, type: 'danger' },
  ]
  
  if (rival.bonus > 0) damageFormula.push({ label: "Bonus del rival (Postura/Ventaja)", value: `+${rival.bonus}`, type: 'danger' })
  if (my.penalty > 0) damageFormula.push({ label: "Penalización por postura", value: `+${my.penalty}`, type: 'danger' })
  if (my.blocked > 0) damageFormula.push({ label: "Tu bloqueo aplicado", value: `-${my.blocked}`, type: 'defense' })
  
  damageFormula.push({ label: "Daño final recibido", value: my.damageTaken, type: 'final' })

  const damageFormulaExact = (payload.p1_bonus !== undefined || payload.p2_bonus !== undefined)

  // 4. Lección
  let finalLesson = "Observa los AP y energía del rival; un ataque pesado requiere 2 movimientos y mucha energía."
  if (rivalWon && rivalSpell.family === 'heavy') finalLesson = "Consejo: Usa Protego o Desarme cuando sospeches que el rival lanzará un ataque pesado."
  if (my.stance === 'offensive' && my.damageTaken > 20) finalLesson = "Consejo: No uses la postura ofensiva si tu salud es baja, el riesgo es demasiado alto."
  if (rivalSpell.family === 'defense' && my.damageTaken === 0) finalLesson = "Consejo: Si el rival se protege constantemente, rómpelo con hechizos de Control."

  // 5. Timeline Refinada
  const timeline = [
    `Levantaste tu ${STANCE_NAMES[my.stance]} para encarar el turno.`,
    `Lanzaste ${mySpell.name} como tu movimiento principal.`,
  ]
  
  if (my.damageTaken > 0 || !myWon) {
    timeline.push(`El rival respondió con ${rivalSpell.name}.`)
  } else {
    timeline.push(`El rival intentó responder con ${rivalSpell.name}, pero tu estrategia lo contuvo.`)
  }

  if (myWon) timeline.push(`¡Ventaja estratégica! ${strategicReason}`)
  if (my.blocked > 0) timeline.push(`Tu defensa absorbió ${my.blocked} puntos de daño.`)

  return {
    verdictTitle,
    verdictText,
    damageReason,
    damageFormula,
    damageFormulaExact,
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
