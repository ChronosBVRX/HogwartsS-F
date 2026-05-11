import wizardGryffindor from '../assets/duels/wizard_gryffindor.png'
import wizardSlytherin from '../assets/duels/wizard_slytherin.png'
import wizardRavenclaw from '../assets/duels/wizard_ravenclaw.png'
import wizardHufflepuff from '../assets/duels/wizard_hufflepuff.png'
import wizardAi from '../assets/duels/wizard_ai.png'

export const HOUSE_NORMALIZER = {
  red: 'gryffindor',
  green: 'slytherin',
  blue: 'ravenclaw',
  yellow: 'hufflepuff',
  gryffindor: 'gryffindor',
  slytherin: 'slytherin',
  ravenclaw: 'ravenclaw',
  hufflepuff: 'hufflepuff',
  ai: 'ai'
}

export function normalizeHouseSlug(slug) {
  return HOUSE_NORMALIZER[slug] || slug || 'unknown'
}

export const HOUSE_META = {
  gryffindor: {
    name: 'Gryffindor',
    icon: '🦁',
    avatar: wizardGryffindor,
    color: 'text-red-500',
    gradient: 'from-red-600 via-red-500 to-amber-500'
  },
  slytherin: {
    name: 'Slytherin',
    icon: '🐍',
    avatar: wizardSlytherin,
    color: 'text-green-500',
    gradient: 'from-green-700 via-green-600 to-emerald-400'
  },
  ravenclaw: {
    name: 'Ravenclaw',
    icon: '🦅',
    avatar: wizardRavenclaw,
    color: 'text-blue-500',
    gradient: 'from-blue-700 via-blue-600 to-cyan-400'
  },
  hufflepuff: {
    name: 'Hufflepuff',
    icon: '🦡',
    avatar: wizardHufflepuff,
    color: 'text-yellow-500',
    gradient: 'from-yellow-600 via-yellow-500 to-amber-400'
  },
  ai: {
    name: 'Rival Encantado',
    icon: '💀',
    avatar: wizardAi,
    color: 'text-purple-500',
    gradient: 'from-purple-600 via-purple-500 to-pink-400'
  }
}
