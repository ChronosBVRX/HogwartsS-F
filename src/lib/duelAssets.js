/**
 * duelAssets.js
 * Centralized mapping for duel assets to handle missing files and fallbacks.
 */

export const SPELL_IMAGE_MAP = {
  expelliarmus: '/assets/spells/expelliarmus.jpg',
  stupefy: '/assets/spells/stupefy.jpg',
  protego: '/assets/spells/protego.jpg',
  petrificus: '/assets/spells/petrificus.jpg',
  finite: '/assets/spells/finite.jpg',
  episkey: '/assets/spells/episkey.jpg',
  incendio: '/assets/spells/incendio.jpg',
  confundus: '/assets/duels/cards/control.webp',
  accio: '/assets/spells/accio.jpg',
  rictusempra: '/assets/duels/cards/attack.webp',
};

export const getSpellImage = (key) => {
  return SPELL_IMAGE_MAP[key] || '/assets/duels/cards/attack.webp';
};
