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
    avatar: '/assets/duels/avatars/avatar_red_idle.webp',
    color: 'text-impact-red',
    gradient: 'from-red-600 via-red-500 to-amber-500'
  },
  slytherin: {
    name: 'Slytherin',
    icon: '🐍',
    avatar: '/assets/duels/avatars/avatar_green_idle.webp',
    color: 'text-healing-green',
    gradient: 'from-green-700 via-green-600 to-emerald-400'
  },
  ravenclaw: {
    name: 'Ravenclaw',
    icon: '🦅',
    avatar: '/assets/duels/avatars/avatar_blue_idle.webp',
    color: 'text-spell-blue',
    gradient: 'from-blue-700 via-blue-600 to-cyan-400'
  },
  hufflepuff: {
    name: 'Hufflepuff',
    icon: '🦡',
    avatar: '/assets/duels/avatars/avatar_yellow_idle.webp',
    color: 'text-magical-gold',
    gradient: 'from-yellow-600 via-yellow-500 to-amber-400'
  },
  ai: {
    name: 'Rival Encantado',
    icon: '💀',
    avatar: '/assets/duels/avatars/avatar_ai_idle.webp',
    color: 'text-control-purple',
    gradient: 'from-purple-600 via-purple-500 to-pink-400'
  }
}

