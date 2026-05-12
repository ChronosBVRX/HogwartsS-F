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
    avatar_male: '/assets/duels/avatars/avatar_red_idle.webp',
    avatar_female: '/assets/duels/avatars/avatar_red_female.webp',
    color: 'text-impact-red',
    gradient: 'from-red-600 via-red-500 to-amber-500'
  },
  slytherin: {
    name: 'Slytherin',
    icon: '🐍',
    avatar_male: '/assets/duels/avatars/avatar_green_idle.webp',
    avatar_female: '/assets/duels/avatars/avatar_green_female.webp',
    color: 'text-healing-green',
    gradient: 'from-green-700 via-green-600 to-emerald-400'
  },
  ravenclaw: {
    name: 'Ravenclaw',
    icon: '🦅',
    avatar_male: '/assets/duels/avatars/avatar_blue_idle.webp',
    avatar_female: '/assets/duels/avatars/avatar_blue_female.webp',
    color: 'text-spell-blue',
    gradient: 'from-blue-700 via-blue-600 to-cyan-400'
  },
  hufflepuff: {
    name: 'Hufflepuff',
    icon: '🦡',
    avatar_male: '/assets/duels/avatars/avatar_yellow_idle.webp',
    avatar_female: '/assets/duels/avatars/avatar_yellow_female.webp',
    color: 'text-magical-gold',
    gradient: 'from-yellow-600 via-yellow-500 to-amber-400'
  },
  ai: {
    name: 'Rival Encantado',
    icon: '💀',
    avatar_male: '/assets/duels/avatars/avatar_ai_idle.webp',
    avatar_female: '/assets/duels/avatars/avatar_ai_idle.webp',
    color: 'text-control-purple',
    gradient: 'from-purple-600 via-purple-500 to-pink-400'
  }
}

export function getAvatar(house, gender = 'male') {
  const norm = normalizeHouseSlug(house)
  const meta = HOUSE_META[norm] || HOUSE_META.gryffindor
  return gender === 'female' ? meta.avatar_female : meta.avatar_male
}

