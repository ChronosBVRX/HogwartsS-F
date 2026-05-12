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

export function buildTurnAnnouncement({ payload, isP1 }) {
  if (!payload) return null

  // Normalización de datos (Soporta nombres viejos y nuevos)
  const getPData = (pNum) => {
    const prefix = pNum === 1 ? 'p1_' : 'p2_';
    const legacyPrefix = pNum === 1 ? 'player_one_' : 'player_two_';
    
    return {
      spellKey: payload[prefix + 'spell'] || payload[legacyPrefix + 'spell'] || payload[prefix + 'actions']?.[0]?.key,
      actions: payload[prefix + 'actions'] || [],
      stance: payload[prefix + 'stance'] || payload[legacyPrefix + 'stance'] || 'neutral',
      damageDealt: pNum === 1 ? (payload.p2_damage ?? payload.player_two_damage ?? 0) : (payload.p1_damage ?? payload.player_one_damage ?? 0),
      damageTaken: pNum === 1 ? (payload.p1_damage ?? payload.player_one_damage ?? 0) : (payload.p2_damage ?? payload.player_two_damage ?? 0),
      blocked: payload[prefix + 'blocked'] ?? payload[legacyPrefix + 'blocked'] ?? 0,
      heal: payload[prefix + 'heal'] ?? payload[legacyPrefix + 'heal'] ?? 0,
      cost: Math.abs(payload[prefix + 'energy_cost'] ?? payload[prefix + 'energy_change'] ?? 0),
      gain: payload[prefix + 'energy_gain'] ?? 0,
      interrupted: payload[prefix + 'interrupted'] ?? false,
      bonus: payload[prefix + 'bonus'] ?? 0,
      penalty: payload[prefix + 'penalty'] ?? 0
    }
  }

  const p1 = getPData(1)
  const p2 = getPData(2)
  const my = isP1 ? p1 : p2
  const rival = isP1 ? p2 : p1

  // Si no hay acciones mínimas, fallar con gracia
  if (my.actions.length === 0 && !my.spellKey) return null

  const timeline = []
  const myPrimaryAction = my.actions[0] || { key: my.spellKey }
  const rivalPrimaryAction = rival.actions[0] || { key: rival.spellKey }
  
  const mySpell = SPELLS[myPrimaryAction.key]
  const rivalSpell = SPELLS[rivalPrimaryAction.key]

  if (!mySpell || !rivalSpell) return null

  // 1. Postura
  timeline.push(`Adoptaste una postura ${STANCE_NAMES[my.stance]}.`)
  if (my.stance === 'offensive') timeline.push("Tu agresividad aumentó el daño, pero te dejó más expuesto.")
  if (my.stance === 'defensive') timeline.push("Tu guardia cerrada aumentó significativamente tu capacidad de bloqueo.")

  // 2. Acción Principal y Ventaja de Familia
  const myWon = mySpell.beats.includes(rivalSpell.family)
  const rivalWon = rivalSpell.beats.includes(mySpell.family)

  timeline.push(`Lanzaste ${mySpell.name} (${FAMILY_NAMES[mySpell.family]}) como acción principal.`)
  timeline.push(`El rival respondió con ${rivalSpell.name} (${FAMILY_NAMES[rivalSpell.family]}).`)

  if (myWon && !rivalWon) {
    timeline.push(`¡Ventaja Táctica! Tu ${mySpell.name} superó la estrategia del rival.`)
  } else if (rivalWon && !myWon) {
    timeline.push(`El rival tuvo la ventaja: su ${rivalSpell.name} contrarrestó tu movimiento.`)
  }

  // 3. Resultados de impacto
  if (my.blocked > 0) {
    timeline.push(`Tu estrategia bloqueó ${my.blocked} puntos de daño rival.`)
  }
  
  if (my.damageTaken > 0) {
    timeline.push(`Recibiste ${my.damageTaken} de daño tras el intercambio.`)
  } else {
    timeline.push("¡Defensa impecable! No recibiste daño este turno.")
  }

  // 4. Segunda Acción
  if (my.actions.length > 1) {
    const secondAction = SPELLS[my.actions[1].key]
    if (secondAction) {
      timeline.push(`Tu segunda acción fue ${secondAction.name}.`)
      if (my.interrupted) timeline.push(`¡Pero el impacto rival interrumpió tu carga mágica!`)
      else if (secondAction.energyGain > 0) timeline.push(`Lograste canalizar ${secondAction.energyGain} de energía extra.`)
    }
  }

  // 5. Energía y Recursos
  if (my.cost > 0) timeline.push(`Consumiste ${my.cost} puntos de energía en tu estrategia.`)
  if (my.gain > 0 && !my.interrupted) timeline.push(`Recuperaste ${my.gain} puntos de energía al final del turno.`)

  return {
    title: actionNames(my.actions) || `Turno ${payload.turn_number}`,
    subtitle: `Postura: ${STANCE_NAMES[my.stance]}`,
    effectivenessLabel: myWon ? '¡Estrategia Exitosa!' : rivalWon ? 'Rival con Ventaja' : 'Choque Neutral',
    tone: myWon ? 'good' : rivalWon ? 'bad' : 'neutral',
    timeline,
    myActions: my.actions.map(a => SPELLS[a.key]).filter(Boolean),
    rivalActions: rival.actions.map(a => SPELLS[a.key]).filter(Boolean),
    myStance: my.stance,
    rivalStance: rival.stance,
    myDamageTaken: my.damageTaken,
    rivalDamageTaken: my.damageDealt,
    myBreakdown: {
      base: mySpell.damage || 0,
      bonus: my.bonus,
      penalty: my.penalty,
      block: rival.blocked,
      heal: my.heal,
      energyCost: my.cost,
      energyGain: my.gain,
      interrupted: my.interrupted,
      blocked: my.blocked
    },
    rivalBreakdown: {
      base: rivalSpell.damage || 0,
      bonus: rival.bonus,
      penalty: rival.penalty,
      block: my.blocked,
      heal: rival.heal,
      interrupted: rival.interrupted
    }
  }
}

function actionNames(actions) {
  if (!actions || actions.length === 0) return null
  return actions.map(a => SPELLS[a.key]?.name).filter(Boolean).join(' + ')
}
