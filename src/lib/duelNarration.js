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

  // Normalización de datos con Fallbacks Legacy robustos
  const getPData = (pNum) => {
    const prefix = pNum === 1 ? 'p1_' : 'p2_';
    const legacyPrefix = pNum === 1 ? 'player_one_' : 'player_two_';
    const rivalPrefix = pNum === 1 ? 'p2_' : 'p1_';
    const rivalLegacyPrefix = pNum === 1 ? 'player_two_' : 'player_one_';
    
    return {
      actions: payload[prefix + 'actions'] || [],
      spellKey: payload[prefix + 'spell'] || payload[legacyPrefix + 'spell'] || payload[prefix + 'actions']?.[0]?.key,
      stance: payload[prefix + 'stance'] || payload[legacyPrefix + 'stance'] || 'neutral',
      damageTaken: payload[prefix + 'damage'] ?? payload[legacyPrefix + 'damage'] ?? 0,
      damageDealt: payload[prefix + 'damage_dealt'] ?? payload[rivalPrefix + 'damage'] ?? payload[rivalLegacyPrefix + 'damage'] ?? 0,
      blocked: payload[prefix + 'blocked'] ?? payload[legacyPrefix + 'blocked'] ?? 0,
      bonus: payload[prefix + 'bonus'] ?? 0,
      penalty: payload[prefix + 'penalty'] ?? 0,
      energyChange: payload[prefix + 'energy_change'] ?? 0,
      heal: payload[prefix + 'heal'] ?? payload[legacyPrefix + 'heal'] ?? 0,
      interrupted: payload[prefix + 'interrupted'] ?? false
    }
  }

  const p1 = getPData(1)
  const p2 = getPData(2)
  const my = isP1 ? p1 : p2
  const rival = isP1 ? p2 : p1

  const myAction = my.actions[0] || { key: my.spellKey || 'rictusempra' }
  const rivalAction = rival.actions[0] || { key: rival.spellKey || 'rictusempra' }
  const mySpell = SPELLS[myAction.key] || SPELLS.rictusempra
  const rivalSpell = SPELLS[rivalAction.key] || SPELLS.rictusempra

  const myWon = mySpell.beats.includes(rivalSpell.family)
  const rivalWon = rivalSpell.beats.includes(mySpell.family)

  // 1. Veredicto Estratégico Hiper-Específico
  let verdictTitle = "Choque Neutral"
  let strategicReason = "Ninguna estrategia dominó por completo este intercambio."

  const reasonKey = `${mySpell.family}_beats_${rivalSpell.family}`
  const rivalReasonKey = `${rivalSpell.family}_beats_${mySpell.family}`

  if (myWon && !rivalWon) {
    verdictTitle = "¡Leíste mejor al rival!"
    strategicReason = `${mySpell.name} es ${FAMILY_NAMES[mySpell.family]} y venció a su ${rivalSpell.name}, que es ${FAMILY_NAMES[rivalSpell.family]}. ${STRATEGIC_REASONS[reasonKey] || ''}`
  } else if (rivalWon && !myWon) {
    verdictTitle = "El rival te leyó mejor"
    strategicReason = `${rivalSpell.name} es ${FAMILY_NAMES[rivalSpell.family]} y venció a tu ${mySpell.name}, que es ${FAMILY_NAMES[mySpell.family]}. ${STRATEGIC_REASONS[rivalReasonKey] || ''}`
  }

  const verdictText = myWon && !rivalWon 
    ? `Tu ${mySpell.name} dominó el turno. ${strategicReason}`
    : rivalWon && !myWon
    ? `El rival anticipó tu ${mySpell.name} con un ${rivalSpell.name}. ${strategicReason}`
    : `Ambos chocaron sus hechizos. ${strategicReason}`;

  // 2. Razón de Daño y Posturas
  let damageReason = ""
  if (my.damageTaken > 0) {
    damageReason = `Recibiste ${my.damageTaken} de daño porque el ${rivalSpell.name} del rival superó tu estrategia.`
    if (rivalWon) damageReason += ` Al ser ${FAMILY_NAMES[rivalSpell.family]}, castigó severamente tu ${mySpell.name}.`
    if (rival.stance === 'offensive') damageReason += ` El rival usó ${STANCE_NAMES.offensive}, potenciando su golpe.`
    if (my.stance === 'offensive') damageReason += ` Tu propia postura de ${STANCE_NAMES.offensive} te dejó más expuesto.`
  } else {
    damageReason = `Tu ${mySpell.name} y tu postura de ${STANCE_NAMES[my.stance]} neutralizaron por completo el ataque rival.`
  }

  // 3. Fórmula de Daño con Reconciliación Matemática
  const baseDamage = rivalSpell.damage || 15
  const rivalBonus = rival.bonus || 0
  const myPenalty = my.penalty || 0
  const myBlock = my.blocked || 0
  
  const formulaTotal = baseDamage + rivalBonus + myPenalty - myBlock
  const adjustment = my.damageTaken - formulaTotal

  const damageFormula = [
    { label: `Poder base de ${rivalSpell.name}`, value: baseDamage, type: 'danger' },
  ]
  
  if (rivalBonus > 0) damageFormula.push({ label: "Bonus del rival (Postura/Ventaja)", value: `+${rivalBonus}`, type: 'danger' })
  if (myPenalty > 0) damageFormula.push({ label: "Penalización propia por postura", value: `+${myPenalty}`, type: 'danger' })
  if (myBlock > 0) damageFormula.push({ label: "Tu bloqueo aplicado", value: `-${myBlock}`, type: 'defense' })
  
  if (adjustment !== 0) {
    damageFormula.push({ 
      label: "Otros modificadores (Casa/Especial)", 
      value: adjustment > 0 ? `+${adjustment}` : `${adjustment}`, 
      type: adjustment > 0 ? 'danger' : 'defense' 
    })
  }
  
  damageFormula.push({ label: "Daño final recibido", value: my.damageTaken, type: 'final' })

  const damageFormulaExact = (
    payload[isP1 ? 'p1_damage' : 'p2_damage'] !== undefined && 
    payload[isP1 ? 'p2_bonus' : 'p1_bonus'] !== undefined
  )

  // 4. Timeline Completa (Restaurada)
  const timeline = [
    `Levantaste tu ${STANCE_NAMES[my.stance]} para encarar el turno.`,
    `Lanzaste ${mySpell.name} como tu movimiento principal.`,
  ]
  
  const wasBlocked = my.damageTaken === 0 && rivalSpell.damage > 0
  if (wasBlocked) {
    timeline.push(`El rival intentó responder con ${rivalSpell.name}, pero tu estrategia lo contuvo.`)
  } else {
    timeline.push(`El rival respondió con ${rivalSpell.name}.`)
  }

  if (myWon) timeline.push(`¡Ventaja táctica! Tu ${mySpell.name} superó su jugada.`)
  if (my.blocked > 0) timeline.push(`Tu defensa absorbió ${my.blocked} puntos de daño.`)

  // Segunda Acción e Interrupciones
  if (my.actions.length > 1) {
    const secondAction = SPELLS[my.actions[1].key]
    if (secondAction) {
      timeline.push(`Tu segunda acción fue ${secondAction.name}.`)
      if (my.interrupted) {
        timeline.push(`¡Pero el impacto rival fue tan fuerte que interrumpió tu segunda acción!`)
      } else if (secondAction.energyGain > 0) {
        timeline.push(`Lograste canalizar energía extra con éxito.`)
      }
    }
  }

  // 5. Lección Final
  let finalLesson = "Observa los AP y energía del rival; las jugadas potentes son predecibles si vigilas sus recursos."
  if (rivalWon && rivalSpell.family === 'heavy') finalLesson = `Consejo: ${rivalSpell.name} es devastador contra Cargas Mágicas. ¡Usa Protego para defenderte!`
  if (my.stance === 'offensive' && my.damageTaken > 20) finalLesson = "Consejo: La postura ofensiva es una apuesta arriesgada. Si tienes poca vida, elige Guardia Protegida."
  if (rivalSpell.family === 'defense' && my.damageTaken === 0) finalLesson = "Consejo: Si el rival se protege constantemente, rómpelo con hechizos de Control como Accio."

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
    myBreakdown: { blocked: my.blocked, energyChange: my.energyChange, interrupted: my.interrupted }
  }
}
