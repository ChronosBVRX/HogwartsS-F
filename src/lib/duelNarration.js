import { SPELLS } from './duelSpells'

const EFFECTIVENESS = {
  SUPER: '¡Fue muy efectivo!',
  NEUTRAL: 'Ambos hechizos chocaron sin ventaja clara.',
  WEAK: 'No fue muy efectivo...',
  BLOCK: 'El rival leyó tu movimiento.',
  PUNISH: 'Tu hechizo castigó la carga del rival.',
  CRITICAL: '¡Un impacto devastador!'
}

const FAMILY_EXPLANATIONS = {
  'defense_beats_attack': 'Los hechizos defensivos resisten los ataques directos.',
  'defense_beats_heavy': 'La defensa logró contener el impacto del ataque pesado.',
  'control_beats_defense': 'Los hechizos de control rompen defensas reduciendo su efectividad.',
  'counter_beats_control': 'El contrahechizo anuló el efecto de control antes de que hiciera efecto.',
  'heavy_beats_heal': 'El ataque pesado interrumpió la curación antes de estabilizarse.',
  'heavy_beats_charge': 'El ataque pesado castigó severamente el intento de carga.',
  'disarm_beats_heavy': 'El desarme interrumpió el flujo de un ataque pesado.',
  'attack_beats_charge': 'El ataque directo castigó al rival mientras reunía energía.',
  'heal_beats_defense': 'La curación aprovechó la pausa defensiva para restaurar vida.',
  'charge_beats_counter': 'La carga mágica fluyó libremente al no haber nada que cancelar.'
}

export function buildTurnAnnouncement({ payload, isP1 }) {
  if (!payload) return null

  // Format tolerance: map legacy names to unified variables
  const p1_spell = payload.p1_spell || payload.player_one_spell
  const p2_spell = payload.p2_spell || payload.player_two_spell
  
  if (!p1_spell || !p2_spell) return null

  const p1_damage = payload.p1_damage ?? payload.player_one_damage ?? 0
  const p2_damage = payload.p2_damage ?? payload.player_two_damage ?? 0
  const p1_blocked = payload.p1_blocked ?? payload.player_one_blocked ?? 0
  const p2_blocked = payload.p2_blocked ?? payload.player_two_blocked ?? 0
  const p1_bonus = payload.p1_bonus ?? payload.player_one_bonus ?? 0
  const p2_bonus = payload.p2_bonus ?? payload.player_two_bonus ?? 0
  const p1_penalty = payload.p1_penalty ?? payload.player_one_penalty ?? 0
  const p2_penalty = payload.p2_penalty ?? payload.player_two_penalty ?? 0
  const p1_heal = payload.p1_heal ?? payload.player_one_heal ?? 0
  const p2_heal = payload.p2_heal ?? payload.player_two_heal ?? 0
  const p1_cost = payload.p1_energy_cost ?? payload.player_one_energy_cost ?? 0
  const p1_gain = payload.p1_energy_gain ?? payload.player_one_energy_gain ?? 0
  const p2_cost = payload.p2_energy_cost ?? payload.player_two_energy_cost ?? 0
  const p2_gain = payload.p2_energy_gain ?? payload.player_two_energy_gain ?? 0
  const p1_interrupted = payload.p1_interrupted ?? payload.player_one_interrupted ?? false
  const p2_interrupted = payload.p2_interrupted ?? payload.player_two_interrupted ?? false

  const p1 = {
    spell: SPELLS[p1_spell],
    damage: p1_damage,
    blocked: p1_blocked,
    bonus: p1_bonus,
    penalty: p1_penalty,
    heal: p1_heal,
    cost: p1_cost,
    gain: p1_gain,
    interrupted: p1_interrupted
  }

  const p2 = {
    spell: SPELLS[p2_spell],
    damage: p2_damage,
    blocked: p2_blocked,
    bonus: p2_bonus,
    penalty: p2_penalty,
    heal: p2_heal,
    cost: p2_cost,
    gain: p2_gain,
    interrupted: p2_interrupted
  }

  const my = isP1 ? p1 : p2
  const rival = isP1 ? p2 : p1

  if (!my.spell || !rival.spell) return null

  const myWon = my.spell.beats.includes(rival.spell.family)
  const rivalWon = rival.spell.beats.includes(my.spell.family)

  let title = `Lanzaste ${my.spell.name}`
  let subtitle = `El rival respondió con ${rival.spell.name}`
  let result = EFFECTIVENESS.NEUTRAL
  let tone = 'neutral'

  if (myWon && !rivalWon) {
    tone = 'good'
    result = EFFECTIVENESS.SUPER
    if (rival.interrupted) result = EFFECTIVENESS.PUNISH
  } else if (rivalWon && !myWon) {
    tone = 'bad'
    result = EFFECTIVENESS.WEAK
  } else if (((isP1 ? p1_damage : p2_damage) === 0) && my.spell.block > 0) {
    // Fixed precedence bug: (damage === 0) && block > 0
    tone = 'good'
    result = EFFECTIVENESS.BLOCK
  }

  const key = myWon
    ? `${my.spell.family}_beats_${rival.spell.family}`
    : rivalWon
      ? `${rival.spell.family}_beats_${my.spell.family}`
      : null

  let explanation = key && FAMILY_EXPLANATIONS[key]
    ? FAMILY_EXPLANATIONS[key]
    : `${my.spell.name} es de tipo ${my.spell.family}, mientras que ${rival.spell.name} es de tipo ${rival.spell.family}.`

  if (my.heal > 0) explanation += ` ¡Recuperaste ${my.heal} HP!`
  if (my.interrupted) explanation += ` ¡Tu carga de energía fue interrumpida!`
  if (rival.interrupted) explanation += ` ¡Interrumpiste la carga del rival!`

  return {
    title,
    subtitle,
    result,
    explanation,
    tone,
    mySpell: my.spell,
    rivalSpell: rival.spell,
    myDamageTaken: isP1 ? p1_damage : p2_damage,
    rivalDamageTaken: isP1 ? p2_damage : p1_damage,
    myBreakdown: {
      base: my.spell.damage || 0,
      bonus: my.bonus,
      penalty: my.penalty,
      block: rival.blocked,
      heal: my.heal,
      energyCost: my.cost,
      energyGain: my.gain,
      interrupted: my.interrupted
    },
    rivalBreakdown: {
      base: rival.spell.damage || 0,
      bonus: rival.bonus,
      penalty: rival.penalty,
      block: my.blocked,
      heal: rival.heal,
      interrupted: rival.interrupted
    },
    effectivenessLabel: result
  }
}
