import { SPELLS } from './duelSpells'

const FAMILY_LABELS = {
  attack: 'ataque directo',
  heavy: 'ataque pesado',
  defense: 'defensa',
  control: 'control',
  counter: 'contrahechizo',
  heal: 'curación',
  charge: 'carga mágica',
  disarm: 'desarme'
}

const FAMILY_EXPLANATIONS = {
  'defense_beats_attack': 'Los hechizos defensivos resisten muy bien los ataques directos.',
  'defense_beats_heavy': 'La defensa logró contener parte del ataque pesado.',
  'control_beats_defense': 'Los hechizos de control rompen defensas porque alteran el flujo mágico del rival.',
  'counter_beats_control': 'El contrahechizo anuló el efecto de control antes de que hiciera efecto.',
  'heavy_beats_heal': 'El ataque pesado interrumpió la curación antes de que pudiera estabilizarse.',
  'heavy_beats_charge': 'El ataque pesado castigó al rival mientras intentaba cargar energía.',
  'disarm_beats_heavy': 'El desarme fue efectivo porque interrumpió un hechizo pesado.',
  'attack_beats_charge': 'El ataque directo castigó al rival mientras intentaba reunir energía.',
  'heal_beats_defense': 'La curación aprovechó el turno defensivo para recuperar vida.',
  'charge_beats_counter': 'La carga mágica aprovechó que el contrahechizo no encontró nada que cancelar.'
}

export function buildTurnAnnouncement({ payload, isP1 }) {
  if (!payload || !payload.player_one_spell || !payload.player_two_spell) return null

  const mySpellKey = isP1 ? payload.player_one_spell : payload.player_two_spell
  const rivalSpellKey = isP1 ? payload.player_two_spell : payload.player_one_spell

  const myDamageTaken = isP1 ? payload.player_one_damage : payload.player_two_damage
  const rivalDamageTaken = isP1 ? payload.player_two_damage : payload.player_one_damage

  const mySpell = SPELLS[mySpellKey]
  const rivalSpell = SPELLS[rivalSpellKey]

  if (!mySpell || !rivalSpell) return null

  const myWon = mySpell.beats.includes(rivalSpell.family)
  const rivalWon = rivalSpell.beats.includes(mySpell.family)

  let title = `Usaste ${mySpell.name}`
  let subtitle = `El rival usó ${rivalSpell.name}`

  let result = 'Ambos hechizos chocaron sin una ventaja clara.'
  let tone = 'neutral'

  if (myWon && !rivalWon) {
    tone = 'good'
    result = `${mySpell.name} fue efectivo contra ${rivalSpell.name}.`
  } else if (rivalWon && !myWon) {
    tone = 'bad'
    result = `${rivalSpell.name} fue efectivo contra ${mySpell.name}.`
  } else if (myWon && rivalWon) {
    tone = 'clash'
    result = 'Ambos hechizos encontraron una ventaja parcial y el choque fue intenso.'
  }

  const key = myWon
    ? `${mySpell.family}_beats_${rivalSpell.family}`
    : rivalWon
      ? `${rivalSpell.family}_beats_${mySpell.family}`
      : null

  const explanation = key && FAMILY_EXPLANATIONS[key]
    ? FAMILY_EXPLANATIONS[key]
    : `${mySpell.name} es de tipo ${FAMILY_LABELS[mySpell.family] || mySpell.family}, mientras que ${rivalSpell.name} es de tipo ${FAMILY_LABELS[rivalSpell.family] || rivalSpell.family}.`

  return {
    title,
    subtitle,
    result,
    explanation,
    tone,
    mySpell,
    rivalSpell,
    myDamageTaken,
    rivalDamageTaken
  }
}
