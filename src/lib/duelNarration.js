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
  'heavy_beats_charge': 'El ataque pesado castigó severamente el intento de cargar energía.',
  'disarm_beats_heavy': 'El desarme interrumpió el flujo de un ataque pesado.',
  'attack_beats_charge': 'El ataque directo castigó al rival mientras reunía energía.',
  'heal_beats_defense': 'La curación aprovechó la pausa defensiva para restaurar vida.',
  'charge_beats_counter': 'La carga mágica fluyó libremente al no haber nada que cancelar.'
}

export function buildTurnAnnouncement({ payload, isP1 }) {
  if (!payload || !payload.p1_spell || !payload.p2_spell) return null

  const p1 = {
    spell: SPELLS[payload.p1_spell],
    damage: payload.p1_damage,
    blocked: payload.p1_blocked,
    bonus: payload.p1_bonus,
    penalty: payload.p1_penalty,
    heal: payload.p1_heal,
    cost: payload.p1_cost,
    gain: payload.p1_gain
  }

  const p2 = {
    spell: SPELLS[payload.p2_spell],
    damage: payload.p2_damage,
    blocked: payload.p2_blocked,
    bonus: payload.p2_bonus,
    penalty: payload.p2_penalty,
    heal: payload.p2_heal,
    cost: payload.p2_cost,
    gain: payload.p2_gain
  }

  const my = isP1 ? p1 : p2
  const rival = isP1 ? p2 : p1

  if (!my.spell || !rival.spell) return null

  // Determination of tone and effectiveness
  const myWon = my.spell.beats.includes(rival.spell.family)
  const rivalWon = rival.spell.beats.includes(my.spell.family)

  let title = `Lanzaste ${my.spell.name}`
  let subtitle = `El rival respondió con ${rival.spell.name}`
  let result = EFFECTIVENESS.NEUTRAL
  let tone = 'neutral'

  if (myWon && !rivalWon) {
    tone = 'good'
    result = EFFECTIVENESS.SUPER
  } else if (rivalWon && !myWon) {
    tone = 'bad'
    result = EFFECTIVENESS.WEAK
  } else if (isP1 ? payload.p2_damage === 0 : payload.p1_damage === 0 && my.spell.block > 0) {
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
  if (rival.heal > 0) explanation += ` El rival recuperó ${rival.heal} HP.`

  return {
    title,
    subtitle,
    result,
    explanation,
    tone,
    mySpell: my.spell,
    rivalSpell: rival.spell,
    myDamageTaken: isP1 ? payload.p1_damage : payload.p2_damage,
    rivalDamageTaken: isP1 ? payload.p2_damage : payload.p1_damage,
    myBreakdown: {
      base: my.spell.damage || 0,
      bonus: my.bonus,
      penalty: my.penalty,
      block: rival.blocked,
      heal: my.heal,
      energyCost: my.cost,
      energyGain: my.gain
    },
    rivalBreakdown: {
      base: rival.spell.damage || 0,
      bonus: rival.bonus,
      penalty: rival.penalty,
      block: my.blocked,
      heal: rival.heal
    },
    effectivenessLabel: result
  }
}
