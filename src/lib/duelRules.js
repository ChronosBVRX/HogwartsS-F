
/**
 * src/lib/duelRules.js
 * Única Fuente de Verdad para las reglas del sistema de Duelos Mágicos.
 */

export const DUEL_LIMITS = {
  maxHp: 100,
  maxEnergy: 5,
  maxTurns: 12,
  maxAP: 2
};

export const STANCES = {
  neutral: {
    key: 'neutral',
    name: 'Neutral',
    description: 'Postura equilibrada sin bonificaciones ni penalizaciones.',
    damageBonus: 0,
    damageTakenBonus: 0,
    blockBonus: 0,
    damagePenalty: 0
  },
  offensive: {
    key: 'offensive',
    name: 'Ofensiva',
    description: '+5 Daño causado / +4 Daño recibido',
    damageBonus: 5,
    damageTakenBonus: 4,
    blockBonus: 0,
    damagePenalty: 0
  },
  defensive: {
    key: 'defensive',
    name: 'Defensiva',
    description: '+8 Bloqueo / -4 Daño causado',
    damageBonus: 0,
    damageTakenBonus: 0,
    blockBonus: 8,
    damagePenalty: 4
  },
  concentrated: {
    key: 'concentrated',
    name: 'Concentrada',
    description: '+1 Energía extra al usar Accio exitosamente.',
    accioExtraEnergy: 1
  },
  cunning: {
    key: 'cunning',
    name: 'Astuta',
    description: '+4 Daño extra si tu familia de hechizos vence a la del rival.',
    familyWinBonus: 4
  },
  desperate: {
    key: 'desperate',
    name: 'Desesperada',
    description: '+6 Daño si tienes < 25 HP. Si no, -3 Daño causado.',
    lowHpThreshold: 25,
    lowHpDamageBonus: 6,
    normalDamagePenalty: 3
  }
};

/**
 * Normaliza el payload de Supabase para asegurar que el frontend siempre lea los mismos campos
 * sin importar si vienen en formato snake_case legacy o el nuevo formato abreviado.
 */
export function normalizeDuelPayload(payload) {
  if (!payload) return null;
  
  return {
    ...payload,
    // Daño
    p1_damage: payload.p1_damage ?? payload.player_one_damage ?? 0,
    p2_damage: payload.p2_damage ?? payload.player_two_damage ?? 0,
    
    // Bloqueo
    p1_blocked: payload.p1_blocked ?? payload.player_one_blocked ?? 0,
    p2_blocked: payload.p2_blocked ?? payload.player_two_blocked ?? 0,
    
    // Curación
    p1_heal: payload.p1_heal ?? payload.player_one_heal ?? 0,
    p2_heal: payload.p2_heal ?? payload.player_two_heal ?? 0,
    
    // Energía
    p1_energy_change: payload.p1_energy_change ?? payload.player_one_energy_change ?? 0,
    p2_energy_change: payload.p2_energy_change ?? payload.player_two_energy_change ?? 0,
    
    // Acciones
    p1_actions: payload.p1_actions ?? payload.player_one_actions ?? [],
    p2_actions: payload.p2_actions ?? payload.player_two_actions ?? [],
    
    // Posturas
    p1_stance: payload.p1_stance ?? payload.player_one_stance ?? 'neutral',
    p2_stance: payload.p2_stance ?? payload.player_two_stance ?? 'neutral',

    // Interrupciones
    p1_interrupted: payload.p1_interrupted ?? payload.player_one_interrupted ?? false,
    p2_interrupted: payload.p2_interrupted ?? payload.player_two_interrupted ?? false
  };
}
