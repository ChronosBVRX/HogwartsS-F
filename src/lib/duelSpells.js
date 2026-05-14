export const SPELLS = {
  expelliarmus: {
    key: 'expelliarmus',
    name: 'Expelliarmus',
    family: 'disarm',
    apCost: 1,
    energyCost: 1,
    damage: 12,
    block: 0,
    heal: 0,
    cooldown: 1,
    beats: ['heavy', 'attack'],
    losesTo: ['defense'],
    animation: 'red_disarm',
    description: 'Desarma e interrumpe. Si golpea un ataque pesado, reduce su daño un 50%.'
  },
  stupefy: {
    key: 'stupefy',
    name: 'Stupefy',
    family: 'heavy',
    apCost: 2,
    energyCost: 2,
    damage: 30,
    block: 0,
    heal: 0,
    cooldown: 2,
    beats: ['heal', 'charge'],
    losesTo: ['disarm', 'defense'],
    animation: 'blue_impact',
    description: 'Ataque pesado (2 AP). Impacto devastador que ignora bloqueos menores.'
  },
  protego: {
    key: 'protego',
    name: 'Protego',
    family: 'defense',
    apCost: 1,
    energyCost: 1,
    damage: 0,
    block: 22,
    heal: 0,
    cooldown: 1,
    beats: ['attack', 'heavy'],
    losesTo: ['control'],
    animation: 'gold_shield',
    description: 'Defensa activa. Si bloquea un ataque fuerte, recuperas +1 Energía.'
  },
  petrificus: {
    key: 'petrificus',
    name: 'Petrificus Totalus',
    family: 'control',
    apCost: 2,
    energyCost: 2,
    damage: 10,
    block: 0,
    heal: 0,
    cooldown: 2,
    beats: ['defense'],
    losesTo: ['counter'],
    animation: 'stone_bind',
    description: 'Control (2 AP). Reduce la energía rival y bloquea su segunda acción.'
  },
  finite: {
    key: 'finite',
    name: 'Finite Incantatem',
    family: 'counter',
    apCost: 1,
    energyCost: 1,
    damage: 8,
    block: 0,
    heal: 0,
    cooldown: 1,
    beats: ['control'],
    losesTo: ['attack'],
    animation: 'silver_cancel',
    description: 'Contrahechizo. Anula efectos de control y recupera energía.'
  },
  episkey: {
    key: 'episkey',
    name: 'Episkey',
    family: 'heal',
    apCost: 2,
    energyCost: 2,
    damage: 0,
    block: 0,
    heal: 20,
    cooldown: 3,
    beats: ['defense'],
    losesTo: ['heavy'],
    animation: 'green_heal',
    description: 'Curación táctica. Recupera 20 HP. Vulnerable a ataques pesados.'
  },
  incendio: {
    key: 'incendio',
    name: 'Incendio',
    family: 'attack',
    apCost: 2,
    energyCost: 2,
    damage: 14,
    burn: 5,
    block: 0,
    heal: 0,
    cooldown: 2,
    beats: ['charge'],
    losesTo: ['defense'],
    animation: 'fire_bolt',
    description: 'Fuego mágico. Inflige 5 de daño extra durante 2 turnos.'
  },
  confundus: {
    key: 'confundus',
    name: 'Confundus',
    family: 'control',
    apCost: 2,
    energyCost: 2,
    damage: 6,
    block: 0,
    heal: 0,
    cooldown: 3,
    beats: ['defense'],
    losesTo: ['counter'],
    animation: 'purple_mist',
    description: 'Confusión (2 AP). Oculta las pistas del rival el próximo turno.'
  },
  accio: {
    key: 'accio',
    name: 'Accio Energía',
    family: 'charge',
    apCost: 1,
    energyCost: 0,
    damage: 0,
    block: 0,
    heal: 0,
    energyGain: 2,
    cooldown: 2,
    beats: ['counter'],
    losesTo: ['attack', 'heavy'],
    animation: 'energy_pull',
    description: 'Atrae energía (+2 ⚡). +3 si estás en postura concentrada.'
  },
  rictusempra: {
    key: 'rictusempra',
    name: 'Rictusempra',
    family: 'attack',
    apCost: 1,
    energyCost: 1,
    damage: 12,
    block: 0,
    heal: 0,
    cooldown: 1,
    beats: ['charge'],
    losesTo: ['defense'],
    animation: 'gold_spark',
    description: 'Ataque ligero. Reduce ligeramente el daño del próximo ataque rival.'
  }
}

export const HOUSE_POWERS = {
  red: {
    name: "Coraje Final",
    description: "Al bajar de 35 HP, recibes un bono automático de +6 de daño."
  },
  green: {
    name: "Astucia",
    description: "Muestra pistas más precisas sobre la estrategia del rival."
  },
  blue: {
    name: "Claridad Mental",
    description: "Reducción de cooldowns acelerada y bonus por Finite exitoso."
  },
  yellow: {
    name: "Resistencia Leal",
    description: "Tus defensas y curaciones son un 25% más efectivas."
  }
}
