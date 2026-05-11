import { SPELLS } from './duelSpells'

export function getSpellResult(spellAKey, spellBKey) {
  const a = SPELLS[spellAKey]
  const b = SPELLS[spellBKey]

  if (!a || !b) return null

  let aModifier = 0
  let bModifier = 0
  let aFocus = 0
  let bFocus = 0

  // Advantage logic
  if (a.beats.includes(b.family)) {
    aModifier += 8
    aFocus += 1
  }
  if (b.beats.includes(a.family)) {
    bModifier += 8
    bFocus += 1
  }

  // Disadvantage logic
  if (a.losesTo.includes(b.family)) {
    aModifier -= 6
  }
  if (b.losesTo.includes(a.family)) {
    bModifier -= 6
  }

  // Same family penalty
  if (a.family === b.family) {
    aModifier -= 4
    bModifier -= 4
  }

  const aDamage = Math.max(0, (a.damage || 0) + aModifier - (b.block || 0))
  const bDamage = Math.max(0, (b.damage || 0) + bModifier - (a.block || 0))

  const aHeal = Math.max(0, a.heal || 0)
  const bHeal = Math.max(0, b.heal || 0)

  return {
    aDamage,
    bDamage,
    aHeal,
    bHeal,
    aFocus,
    bFocus,
    message: buildDuelMessage(a, b, aDamage, bDamage)
  }
}

function buildDuelMessage(a, b, aDamage, bDamage) {
  if (aDamage > bDamage) return `¡${a.name} superó a ${b.name}!`
  if (bDamage > aDamage) return `¡${b.name} respondió con fuerza contra ${a.name}!`
  return `Los hechizos ${a.name} y ${b.name} chocaron violentamente.`
}

export function getAvailableHand(turnNumber, playerEnergy, cooldowns = {}) {
  const all = Object.values(SPELLS)
  const usable = all.filter(spell => (cooldowns[spell.key] || 0) <= 0)

  const attack = usable.filter(s => ['attack', 'heavy', 'disarm'].includes(s.family))
  const defense = usable.filter(s => ['defense', 'counter', 'heal', 'control'].includes(s.family))

  const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)]

  return [
    randomFrom(attack) || randomFrom(usable),
    randomFrom(defense) || randomFrom(usable),
    randomFrom(usable)
  ].filter(Boolean)
}
