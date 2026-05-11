export const SPELLS = {
  expelliarmus: {
    key: 'expelliarmus',
    name: 'Expelliarmus',
    family: 'disarm',
    cost: 1,
    damage: 14,
    block: 0,
    heal: 0,
    cooldown: 1,
    beats: ['heavy'],
    losesTo: ['defense'],
    animation: 'red_disarm',
    description: 'Hechizo de desarme. Si vence, el rival pierde 1 energía.'
  },
  stupefy: {
    key: 'stupefy',
    name: 'Stupefy',
    family: 'heavy',
    cost: 2,
    damage: 26,
    block: 0,
    heal: 0,
    cooldown: 2,
    beats: ['heal', 'charge'],
    losesTo: ['disarm', 'defense'],
    animation: 'blue_impact',
    description: 'Ataque pesado con gran daño de impacto.'
  },
  protego: {
    key: 'protego',
    name: 'Protego',
    family: 'defense',
    cost: 1,
    damage: 0,
    block: 20,
    heal: 0,
    cooldown: 1,
    beats: ['attack', 'heavy'],
    losesTo: ['control'],
    animation: 'gold_shield',
    description: 'Escudo protector que reduce el daño recibido.'
  },
  petrificus: {
    key: 'petrificus',
    name: 'Petrificus Totalus',
    family: 'control',
    cost: 2,
    damage: 10,
    block: 0,
    heal: 0,
    cooldown: 2,
    beats: ['defense'],
    losesTo: ['counter'],
    animation: 'stone_bind',
    description: 'Inmovilización total. Reduce la energía rival.'
  },
  finite: {
    key: 'finite',
    name: 'Finite Incantatem',
    family: 'counter',
    cost: 1,
    damage: 8,
    block: 0,
    heal: 0,
    cooldown: 1,
    beats: ['control'],
    losesTo: ['attack'],
    animation: 'silver_cancel',
    description: 'Cancela los efectos de control enemigos.'
  },
  episkey: {
    key: 'episkey',
    name: 'Episkey',
    family: 'heal',
    cost: 2,
    damage: 0,
    block: 0,
    heal: 18,
    cooldown: 3,
    beats: ['defense'],
    losesTo: ['heavy'],
    animation: 'green_heal',
    description: 'Magia sanadora que recupera vida.'
  },
  incendio: {
    key: 'incendio',
    name: 'Incendio',
    family: 'attack',
    cost: 2,
    damage: 16,
    burn: 5,
    block: 0,
    heal: 0,
    cooldown: 2,
    beats: ['charge'],
    losesTo: ['defense'],
    animation: 'fire_bolt',
    description: 'Ataque de fuego con daño por quemadura.'
  },
  confundus: {
    key: 'confundus',
    name: 'Confundus',
    family: 'control',
    cost: 2,
    damage: 6,
    block: 0,
    heal: 0,
    cooldown: 3,
    beats: ['defense'],
    losesTo: ['counter'],
    animation: 'purple_mist',
    description: 'Confunde al rival limitando sus opciones.'
  },
  accio: {
    key: 'accio',
    name: 'Accio Energía',
    family: 'charge',
    cost: 0,
    damage: 0,
    block: 0,
    heal: 0,
    energyGain: 2,
    cooldown: 2,
    beats: ['counter'],
    losesTo: ['attack', 'heavy'],
    animation: 'energy_pull',
    description: 'Atrae energía mágica (+2 ⚡).'
  },
  rictusempra: {
    key: 'rictusempra',
    name: 'Rictusempra',
    family: 'attack',
    cost: 1,
    damage: 12,
    block: 0,
    heal: 0,
    cooldown: 1,
    beats: ['charge'],
    losesTo: ['defense'],
    animation: 'gold_spark',
    description: 'Hechizo de cosquillas que reduce el daño rival.'
  }
}

export const HOUSE_POWERS = {
  red: {
    name: "Coraje Final",
    description: "Al bajar de 35 HP, ganas +1 concentración y +4 de daño este turno."
  },
  green: {
    name: "Astucia",
    description: "Puedes ver una pista del próximo movimiento rival."
  },
  blue: {
    name: "Claridad Mental",
    description: "Reduce cooldown en 1. Contrahechizo exitoso da +1 concentración."
  },
  yellow: {
    name: "Resistencia Leal",
    description: "Primera curación +6 HP. Primera defensa exitosa +6 bloqueo."
  }
}
