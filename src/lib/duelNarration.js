import { SPELLS } from './duelSpells'

const EFFECTIVENESS = {
  SUPER: '¡Fue muy efectivo!',
  NEUTRAL: 'Ambos hechizos chocaron sin ventaja clara.',
  WEAK: 'No fue muy efectivo...',
  BLOCK: '¡Defensa Exitosa!',
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

  // Format tolerance: map legacy or new strategy fields
  const p1_spell_key = payload.p1_spell || (payload.p1_actions?.[0]?.key) || payload.player_one_spell
  const p2_spell_key = payload.p2_spell || (payload.p2_actions?.[0]?.key) || payload.player_two_spell
  
  if (!p1_spell_key || !p2_spell_key) return null

  const p1 = {
    spell: SPELLS[p1_spell_key],
    actions: payload.p1_actions || [{ type: 'spell', key: p1_spell_key }],
    stance: payload.p1_stance || 'neutral',
    damage: payload.p1_damage ?? 0,
    blocked: payload.p1_blocked ?? 0,
    bonus: payload.p1_bonus ?? 0,
    penalty: payload.p1_penalty ?? 0,
    heal: payload.p1_heal ?? 0,
    cost: payload.p1_energy_cost ?? payload.p1_energy_change ?? 0,
    gain: payload.p1_energy_gain ?? 0,
    interrupted: payload.p1_interrupted ?? false
  }

  const p2 = {
    spell: SPELLS[p2_spell_key],
    actions: payload.p2_actions || [{ type: 'spell', key: p2_spell_key }],
    stance: payload.p2_stance || 'neutral',
    damage: payload.p2_damage ?? 0,
    blocked: payload.p2_blocked ?? 0,
    bonus: payload.p2_bonus ?? 0,
    penalty: payload.p2_penalty ?? 0,
    heal: payload.p2_heal ?? 0,
    cost: payload.p2_energy_cost ?? payload.p2_energy_change ?? 0,
    gain: payload.p2_energy_gain ?? 0,
    interrupted: payload.p2_interrupted ?? false
  }

  const my = isP1 ? p1 : p2
  const rival = isP1 ? p2 : p1

  if (!my.spell || !rival.spell) return null

  // Title generation
  const actionNames = my.actions.map(a => SPELLS[a.key]?.name).filter(Boolean)
  let title = actionNames.length > 1 
    ? `Combo: ${actionNames.join(' y ')}`
    : `Lanzaste ${my.spell.name}`

  const rivalActionNames = rival.actions.map(a => SPELLS[a.key]?.name).filter(Boolean)
  let subtitle = rivalActionNames.length > 1
    ? `El rival ejecutó ${rivalActionNames.join(' y ')}`
    : `El rival respondió con ${rival.spell.name}`

  // Effectiveness logic
  const myWon = my.spell.beats.includes(rival.spell.family)
  const rivalWon = rival.spell.beats.includes(my.spell.family)

  let result = EFFECTIVENESS.NEUTRAL
  let tone = 'neutral'

  if (myWon && !rivalWon) {
    tone = 'good'
    result = EFFECTIVENESS.SUPER
  } else if (rivalWon && !myWon) {
    tone = 'bad'
    result = EFFECTIVENESS.WEAK
  }

  // Explanation with Stance info
  const STANCE_NAMES = {
    offensive: 'ataque valiente',
    defensive: 'guardia protegida',
    concentrated: 'concentración arcana',
    cunning: 'astucia táctica',
    desperate: 'último recurso',
    neutral: 'postura neutral'
  }

  let explanation = `Tu postura de ${STANCE_NAMES[my.stance] || 'combate'} marcó el ritmo del intercambio.`
  
  const key = myWon
    ? `${my.spell.family}_beats_${rival.spell.family}`
    : rivalWon
      ? `${rival.spell.family}_beats_${my.spell.family}`
      : null

  if (key && FAMILY_EXPLANATIONS[key]) {
    explanation += ` ${FAMILY_EXPLANATIONS[key]}`
  }

  if (my.damage === 0 && my.blk > 0) explanation += ' Tu defensa fue impecable.'
  if (my.interrupted) explanation += ' ¡Pero tu concentración fue rota por el ataque rival!'

  return {
    title,
    subtitle,
    result,
    explanation,
    tone,
    mySpell: my.spell,
    rivalSpell: rival.spell,
    myDamageTaken: my.damage,
    rivalDamageTaken: rival.damage,
    myBreakdown: {
      base: my.spell.damage || 0,
      bonus: my.bonus,
      penalty: my.penalty,
      block: rival.blocked,
      heal: my.heal,
      energyCost: Math.abs(my.cost),
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
