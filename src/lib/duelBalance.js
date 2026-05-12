import { SPELLS } from './duelSpells'

export function getSpellResult(spellAKey, spellBKey) {
  const a = SPELLS[spellAKey]
  const b = SPELLS[spellBKey]

  if (!a || !b) return null

  // CONSTANTS FOR BALANCE (Matched with requested values)
  const ADVANTAGE_BONUS = 14
  const DISADVANTAGE_PENALTY = 8
  const SAME_FAMILY_PENALTY = 6

  let aBonus = 0
  let bBonus = 0
  let aPenalty = 0
  let bPenalty = 0
  let aSamePenalty = 0
  let bSamePenalty = 0

  // Advantage logic
  if (a.beats.includes(b.family)) aBonus = ADVANTAGE_BONUS
  if (b.beats.includes(a.family)) bBonus = ADVANTAGE_BONUS

  // Disadvantage logic
  if (a.losesTo.includes(b.family)) aPenalty = DISADVANTAGE_PENALTY
  if (b.losesTo.includes(a.family)) bPenalty = DISADVANTAGE_PENALTY

  // Same family penalty
  if (a.family === b.family) {
    aSamePenalty = SAME_FAMILY_PENALTY
    bSamePenalty = SAME_FAMILY_PENALTY
  }

  // Calculate final damage
  // Final Damage = Base + Bonus - Penalty - SamePenalty - RivalBlock
  const aDamage = Math.max(0, (a.damage || 0) + aBonus - aPenalty - aSamePenalty - (b.block || 0))
  const bDamage = Math.max(0, (b.damage || 0) + bBonus - bPenalty - bSamePenalty - (a.block || 0))

  const aHeal = Math.max(0, a.heal || 0)
  const bHeal = Math.max(0, b.heal || 0)

  return {
    aDamage,
    bDamage,
    aHeal,
    bHeal,
    aFocus: aBonus > 0 ? 1 : 0,
    bFocus: bBonus > 0 ? 1 : 0,
    breakdown: {
      a: {
        baseDamage: a.damage || 0,
        advantageBonus: aBonus,
        disadvantagePenalty: aPenalty,
        sameFamilyPenalty: aSamePenalty,
        blockedByOpponent: b.block || 0,
        finalDamage: aDamage
      },
      b: {
        baseDamage: b.damage || 0,
        advantageBonus: bBonus,
        disadvantagePenalty: bPenalty,
        sameFamilyPenalty: bSamePenalty,
        blockedByOpponent: a.block || 0,
        finalDamage: bDamage
      }
    }
  }
}

export function getAvailableHand(turnNumber, playerEnergy, cooldowns = {}) {
  const all = Object.values(SPELLS)
  
  // Filter usable spells (cooldown and cost)
  const usable = all.filter(spell => 
    (cooldowns[spell.key] || 0) <= 0 && 
    spell.cost <= playerEnergy
  )

  // Ensure variety
  const offense = usable.filter(s => ['attack', 'heavy'].includes(s.family))
  const tactical = usable.filter(s => ['defense', 'counter', 'disarm'].includes(s.family))
  const utility = usable.filter(s => ['heal', 'charge', 'control'].includes(s.family))

  const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)]

  const hand = new Set()
  
  // Add 1 offense
  if (offense.length) hand.add(randomFrom(offense))
  // Add 1 tactical
  if (tactical.length) hand.add(randomFrom(tactical))
  // Add 1 utility/random
  if (utility.length) hand.add(randomFrom(utility))

  // Fill up to 3 if needed
  while (hand.size < 3 && usable.length > hand.size) {
    hand.add(randomFrom(usable))
  }

  // Emergency: if no energy, definitely include energy spells or cheap ones
  if (playerEnergy < 2) {
    const energySpells = all.filter(s => s.family === 'charge' || s.cost === 0)
    if (energySpells.length && !Array.from(hand).some(s => s.cost === 0)) {
      const arr = Array.from(hand)
      arr[0] = randomFrom(energySpells)
      return arr
    }
  }

  return Array.from(hand)
}
