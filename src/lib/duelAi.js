import { SPELLS } from './duelSpells'

export function chooseAiSpell({ aiHp, playerHp, aiEnergy, history = [], difficulty = 'normal' }) {
  const available = Object.values(SPELLS).filter(spell => spell.cost <= aiEnergy)
  if (available.length === 0) return 'accio' // Emergency energy recovery

  if (difficulty === 'easy') {
    return available[Math.floor(Math.random() * available.length)].key
  }

  const lastPlayerSpell = history?.[history.length - 1]?.player_spell
  const playerUsedAttackRecently = history.slice(-2).some(t =>
    ['attack', 'heavy'].includes(SPELLS[t.player_spell]?.family)
  )

  let weighted = []

  for (const spell of available) {
    let score = 10

    // Emergency healing
    if (aiHp <= 35 && spell.family === 'heal') score += 20
    if (aiHp <= 25 && spell.family === 'defense') score += 15
    
    // Aggressive finish
    if (playerHp <= 30 && ['attack', 'heavy'].includes(spell.family)) score += 15
    
    // Defensive response
    if (playerUsedAttackRecently && spell.family === 'defense') score += 10

    // Counter play
    if (lastPlayerSpell) {
      const lastFamily = SPELLS[lastPlayerSpell]?.family
      if (spell.beats.includes(lastFamily)) score += difficulty === 'hard' ? 15 : 8
    }

    weighted.push({ spell, score })
  }

  weighted.sort((a, b) => b.score - a.score)

  if (difficulty === 'hard') return weighted[0].spell.key
  
  // Normal mode picks from top 2-3 to feel human
  const poolSize = Math.min(3, weighted.length)
  return weighted[Math.floor(Math.random() * poolSize)].spell.key
}
