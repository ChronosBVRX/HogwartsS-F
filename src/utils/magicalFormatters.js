export const HOUSE_MAP = {
  'Blue': 'Ravenclaw',
  'Red': 'Gryffindor',
  'Yellow': 'Hufflepuff',
  'Green': 'Slytherin',
  'BLUE': 'RAVENCLAW',
  'RED': 'GRYFFINDOR',
  'YELLOW': 'HUFFLEPUFF',
  'GREEN': 'SLYTHERIN',
  'blue': 'Ravenclaw',
  'red': 'Gryffindor',
  'yellow': 'Hufflepuff',
  'green': 'Slytherin'
}

export function formatMagicalText(text) {
  if (!text) return text
  let formatted = text
  Object.entries(HOUSE_MAP).forEach(([key, value]) => {
    // Usamos regex con límites de palabra para evitar reemplazar partes de otras palabras
    const regex = new RegExp(`\\b${key}\\b`, 'g')
    formatted = formatted.replace(regex, value)
  })
  return formatted
}
