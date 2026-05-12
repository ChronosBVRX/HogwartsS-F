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
  'control_beats_defense': 'Los hechizos de control rompen defensas porque alteran el flujo mágico.',
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

  const mySpellKey = isP1 ? payload.p1_spell : payload.p2_spell
  const rivalSpellKey = isP1 ? payload.p2_spell : payload.p1_spell

  const myDamageTaken = isP1 ? payload.p1_damage : payload.p2_damage
  const rivalDamageTaken = isP1 ? payload.p2_damage : payload.p1_damage

  const mySpell = SPELLS[mySpellKey]
  const rivalSpell = SPELLS[rivalSpellKey]

  if (!mySpell || !rivalSpell) return null

  const myWon = mySpell.beats.includes(rivalSpell.family)
  const rivalWon = rivalSpell.beats.includes(mySpell.family)

  let title = `Lanzaste ${mySpell.name}`
  let subtitle = `El rival respondió con ${rivalSpell.name}`
  let result = EFFECTIVENESS.NEUTRAL
  let tone = 'neutral'

  if (myWon && !rivalWon) {
    tone = 'good'
    result = EFFECTIVENESS.SUPER
  } else if (rivalWon && !myWon) {
    tone = 'bad'
    result = EFFECTIVENESS.WEAK
  } else if (myDamageTaken === 0 && mySpell.block > 0) {
    tone = 'good'
    result = EFFECTIVENESS.BLOCK
  }

  const key = myWon
    ? `${mySpell.family}_beats_${rivalSpell.family}`
    : rivalWon
      ? `${rivalSpell.family}_beats_${mySpell.family}`
      : null

  const explanation = key && FAMILY_EXPLANATIONS[key]
    ? FAMILY_EXPLANATIONS[key]
    : `${mySpell.name} es de tipo ${mySpell.family}, mientras que ${rivalSpell.name} es de tipo ${rivalSpell.family}.`

  // Build Breakdown (Simplified reconstruction for UI)
  const myBreakdown = {
    base: mySpell.damage || 0,
    bonus: myWon ? 14 : 0,
    penalty: rivalWon ? 8 : (mySpell.family === rivalSpell.family ? 6 : 0),
    block: rivalSpell.block || 0
  }

  const rivalBreakdown = {
    base: rivalSpell.damage || 0,
    bonus: rivalWon ? 14 : 0,
    penalty: myWon ? 8 : (mySpell.family === rivalSpell.family ? 6 : 0),
    block: mySpell.block || 0
  }

  return {
    title,
    subtitle,
    result,
    explanation,
    tone,
    mySpell,
    rivalSpell,
    myDamageTaken,
    rivalDamageTaken,
    myBreakdown,
    rivalBreakdown,
    effectivenessLabel: result
  }
}
