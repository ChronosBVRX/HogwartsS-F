/**
 * AudioManager.js
 * Handles all audio operations for the Magic Duels minigame.
 * Powered by ElevenLabs Cinematic Sound Effects and Dynamic Voice Variants.
 */

const STORAGE_KEY = 'hsf_audio_settings';

const AUDIO_MAP = {
  ambient: {
    duel_hall: '/audio/duels/ambient/ambient_duel_hall.mp3',
    castle_night: '/audio/duels/ambient/ambient_castle_night.mp3',
    magic_wind: '/audio/duels/ambient/ambient_magic_wind.mp3',
    forest_dark: '/audio/duels/ambient/ambient_forest_dark.mp3',
    dungeon_low: '/audio/duels/ambient/ambient_dungeon_low.mp3',
  },
  sfx: {
    spell_cast_light: '/audio/duels/sfx/spell_cast_light.mp3',
    spell_cast_heavy: '/audio/duels/sfx/spell_cast_heavy.mp3',
    spell_impact: '/audio/duels/sfx/spell_impact.mp3',
    shield_block: '/audio/duels/sfx/shield_block.mp3',
    heal_magic: '/audio/duels/sfx/heal_magic.mp3',
    energy_charge: '/audio/duels/sfx/energy_charge.mp3',
    control_spell: '/audio/duels/sfx/control_spell.mp3',
    damage_hit: '/audio/duels/sfx/damage_hit.mp3',
    victory_fanfare: '/audio/duels/sfx/victory_fanfare.mp3',
    defeat_dark: '/audio/duels/sfx/defeat_dark.mp3',
    ui_card_select: '/audio/duels/ui/ui_card_select.mp3',
    ui_card_confirm: '/audio/duels/ui/ui_card_confirm.mp3',
    ui_button_magic: '/audio/duels/ui/ui_button_magic.mp3',
    ui_timer_warning: '/audio/duels/ui/ui_timer_warning.mp3',
    ui_reward: '/audio/duels/ui/ui_reward.mp3',
    stance_select: '/audio/duels/ui/stance_select.mp3',
    strategy_confirm: '/audio/duels/ui/strategy_confirm.mp3',
    verdict_reveal: '/audio/duels/ui/verdict_reveal.mp3',
    damage_formula_tick: '/audio/duels/ui/damage_formula_tick.mp3',
    lesson_reveal: '/audio/duels/ui/lesson_reveal.mp3',
    interruption_hit: '/audio/duels/sfx/interruption_hit.mp3',
    disarm_spell: '/audio/duels/sfx/disarm_spell.mp3',
    counter_spell: '/audio/duels/sfx/counter_spell.mp3',
  },
  voices: {
    // Basic Narrative
    welcome: [
      '/audio/duels/voices/variants/welcome/welcome_01.mp3',
      '/audio/duels/voices/variants/welcome/welcome_02.mp3',
      '/audio/duels/voices/variants/welcome/welcome_03.mp3'
    ],
    instructions: [
      '/audio/duels/voices/variants/instructions/instructions_01.mp3',
      '/audio/duels/voices/variants/instructions/instructions_02.mp3'
    ],
    spell_guide_intro: [
      '/audio/duels/voices/variants/spell_guide_intro/spell_guide_intro_01.mp3',
      '/audio/duels/voices/variants/spell_guide_intro/spell_guide_intro_02.mp3'
    ],

    // Turn Management
    turn_start_neutral: [
      '/audio/duels/voices/variants/turn_start_neutral/turn_start_neutral_01.mp3',
      '/audio/duels/voices/variants/turn_start_neutral/turn_start_neutral_02.mp3',
      '/audio/duels/voices/variants/turn_start_neutral/turn_start_neutral_03.mp3',
      '/audio/duels/voices/variants/turn_start_neutral/turn_start_neutral_04.mp3',
      '/audio/duels/voices/variants/turn_start_neutral/turn_start_neutral_05.mp3'
    ],
    turn_start_pressure: [
      '/audio/duels/voices/variants/turn_start_pressure/turn_start_pressure_01.mp3',
      '/audio/duels/voices/variants/turn_start_pressure/turn_start_pressure_02.mp3',
      '/audio/duels/voices/variants/turn_start_pressure/turn_start_pressure_03.mp3',
      '/audio/duels/voices/variants/turn_start_pressure/turn_start_pressure_04.mp3'
    ],
    turn_start_advantage: [
      '/audio/duels/voices/variants/turn_start_advantage/turn_start_advantage_01.mp3',
      '/audio/duels/voices/variants/turn_start_advantage/turn_start_advantage_02.mp3',
      '/audio/duels/voices/variants/turn_start_advantage/turn_start_advantage_03.mp3',
      '/audio/duels/voices/variants/turn_start_advantage/turn_start_advantage_04.mp3'
    ],
    turn_start_disadvantage: [
      '/audio/duels/voices/variants/turn_start_disadvantage/turn_start_disadvantage_01.mp3',
      '/audio/duels/voices/variants/turn_start_disadvantage/turn_start_disadvantage_02.mp3',
      '/audio/duels/voices/variants/turn_start_disadvantage/turn_start_disadvantage_03.mp3',
      '/audio/duels/voices/variants/turn_start_disadvantage/turn_start_disadvantage_04.mp3'
    ],
    low_energy: [
      '/audio/duels/voices/variants/low_energy/low_energy_01.mp3',
      '/audio/duels/voices/variants/low_energy/low_energy_02.mp3',
      '/audio/duels/voices/variants/low_energy/low_energy_03.mp3',
      '/audio/duels/voices/variants/low_energy/low_energy_04.mp3'
    ],
    spell_confirmed: [
      '/audio/duels/voices/variants/spell_confirmed/spell_confirmed_01.mp3',
      '/audio/duels/voices/variants/spell_confirmed/spell_confirmed_02.mp3',
      '/audio/duels/voices/variants/spell_confirmed/spell_confirmed_03.mp3',
      '/audio/duels/voices/variants/spell_confirmed/spell_confirmed_04.mp3'
    ],
    
    // --- NEW STRATEGIC DUEL VOICES ---
    
    // 1. Strategic Verdicts
    verdict_player_won_strategy: [
      '/audio/duels/voices/variants/verdict_player_won_strategy/verdict_player_won_strategy_01.mp3',
      '/audio/duels/voices/variants/verdict_player_won_strategy/verdict_player_won_strategy_02.mp3',
      '/audio/duels/voices/variants/verdict_player_won_strategy/verdict_player_won_strategy_03.mp3'
    ],
    verdict_rival_won_strategy: [
      '/audio/duels/voices/variants/verdict_rival_won_strategy/verdict_rival_won_strategy_01.mp3',
      '/audio/duels/voices/variants/verdict_rival_won_strategy/verdict_rival_won_strategy_02.mp3',
      '/audio/duels/voices/variants/verdict_rival_won_strategy/verdict_rival_won_strategy_03.mp3'
    ],
    verdict_neutral_clash: [
      '/audio/duels/voices/variants/verdict_neutral_clash/verdict_neutral_clash_01.mp3',
      '/audio/duels/voices/variants/verdict_neutral_clash/verdict_neutral_clash_02.mp3',
      '/audio/duels/voices/variants/verdict_neutral_clash/verdict_neutral_clash_03.mp3'
    ],

    // 2. Impact & Damage
    impact_no_damage: [
      '/audio/duels/voices/variants/impact_no_damage/impact_no_damage_01.mp3',
      '/audio/duels/voices/variants/impact_no_damage/impact_no_damage_02.mp3',
      '/audio/duels/voices/variants/impact_no_damage/impact_no_damage_03.mp3'
    ],
    impact_low_damage: [
      '/audio/duels/voices/variants/impact_low_damage/impact_low_damage_01.mp3',
      '/audio/duels/voices/variants/impact_low_damage/impact_low_damage_02.mp3',
      '/audio/duels/voices/variants/impact_low_damage/impact_low_damage_03.mp3'
    ],
    impact_medium_damage: [
      '/audio/duels/voices/variants/impact_medium_damage/impact_medium_damage_01.mp3',
      '/audio/duels/voices/variants/impact_medium_damage/impact_medium_damage_02.mp3',
      '/audio/duels/voices/variants/impact_medium_damage/impact_medium_damage_03.mp3'
    ],
    impact_high_damage: [
      '/audio/duels/voices/variants/impact_high_damage/impact_high_damage_01.mp3',
      '/audio/duels/voices/variants/impact_high_damage/impact_high_damage_02.mp3',
      '/audio/duels/voices/variants/impact_high_damage/impact_high_damage_03.mp3'
    ],
    impact_devastating_damage: [
      '/audio/duels/voices/variants/impact_devastating_damage/impact_devastating_damage_01.mp3',
      '/audio/duels/voices/variants/impact_devastating_damage/impact_devastating_damage_02.mp3',
      '/audio/duels/voices/variants/impact_devastating_damage/impact_devastating_damage_03.mp3'
    ],

    // 3. Blocks & Defense
    impact_blocked: [
      '/audio/duels/voices/variants/impact_blocked/impact_blocked_01.mp3',
      '/audio/duels/voices/variants/impact_blocked/impact_blocked_02.mp3',
      '/audio/duels/voices/variants/impact_blocked/impact_blocked_03.mp3'
    ],
    impact_partial_block: [
      '/audio/duels/voices/variants/impact_partial_block/impact_partial_block_01.mp3',
      '/audio/duels/voices/variants/impact_partial_block/impact_partial_block_02.mp3',
      '/audio/duels/voices/variants/impact_partial_block/impact_partial_block_03.mp3'
    ],

    // 4. Second Action & Interruptions
    second_action_success: [
      '/audio/duels/voices/variants/second_action_success/second_action_success_01.mp3',
      '/audio/duels/voices/variants/second_action_success/second_action_success_02.mp3',
      '/audio/duels/voices/variants/second_action_success/second_action_success_03.mp3'
    ],
    second_action_interrupted: [
      '/audio/duels/voices/variants/second_action_interrupted/second_action_interrupted_01.mp3',
      '/audio/duels/voices/variants/second_action_interrupted/second_action_interrupted_02.mp3',
      '/audio/duels/voices/variants/second_action_interrupted/second_action_interrupted_03.mp3'
    ],
    energy_charge_success: [
      '/audio/duels/voices/variants/energy_charge_success/energy_charge_success_01.mp3',
      '/audio/duels/voices/variants/energy_charge_success/energy_charge_success_02.mp3',
      '/audio/duels/voices/variants/energy_charge_success/energy_charge_success_03.mp3'
    ],
    heal_success: [
      '/audio/duels/voices/variants/heal_success/heal_success_01.mp3',
      '/audio/duels/voices/variants/heal_success/heal_success_02.mp3',
      '/audio/duels/voices/variants/heal_success/heal_success_03.mp3'
    ],
    control_success: [
      '/audio/duels/voices/variants/control_success/control_success_01.mp3',
      '/audio/duels/voices/variants/control_success/control_success_02.mp3',
      '/audio/duels/voices/variants/control_success/control_success_03.mp3'
    ],
    counter_success: [
      '/audio/duels/voices/variants/counter_success/counter_success_01.mp3',
      '/audio/duels/voices/variants/counter_success/counter_success_02.mp3',
      '/audio/duels/voices/variants/counter_success/counter_success_03.mp3'
    ],

    // 5. Strategic Lessons & Stances
    lesson_use_protego_vs_heavy: ['/audio/duels/voices/variants/lesson_use_protego_vs_heavy/lesson_use_protego_vs_heavy_01.mp3'],
    lesson_control_vs_defense: ['/audio/duels/voices/variants/lesson_control_vs_defense/lesson_control_vs_defense_01.mp3'],
    lesson_dont_charge_against_heavy: ['/audio/duels/voices/variants/lesson_dont_charge_against_heavy/lesson_dont_charge_against_heavy_01.mp3'],
    lesson_offensive_stance_risky: ['/audio/duels/voices/variants/lesson_offensive_stance_risky/lesson_offensive_stance_risky_01.mp3'],
    lesson_watch_enemy_energy: ['/audio/duels/voices/variants/lesson_watch_enemy_energy/lesson_watch_enemy_energy_01.mp3'],
    lesson_low_hp_defend: ['/audio/duels/voices/variants/lesson_low_hp_defend/lesson_low_hp_defend_01.mp3'],

    stance_offensive_risk: ['/audio/duels/voices/variants/stance_offensive_risk/stance_offensive_risk_01.mp3'],
    stance_defensive_block: ['/audio/duels/voices/variants/stance_defensive_block/stance_defensive_block_01.mp3'],
    stance_concentrated_energy: ['/audio/duels/voices/variants/stance_concentrated_energy/stance_concentrated_energy_01.mp3'],
    stance_cunning_read: ['/audio/duels/voices/variants/stance_cunning_read/stance_cunning_read_01.mp3'],
    stance_desperate_risk: ['/audio/duels/voices/variants/stance_desperate_risk/stance_desperate_risk_01.mp3'],

    // Game End
    victory: [
      '/audio/duels/voices/variants/victory/victory_01.mp3',
      '/audio/duels/voices/variants/victory/victory_02.mp3',
      '/audio/duels/voices/variants/victory/victory_03.mp3',
      '/audio/duels/voices/variants/victory/victory_04.mp3'
    ],
    defeat: [
      '/audio/duels/voices/variants/defeat/defeat_01.mp3',
      '/audio/duels/voices/variants/defeat/defeat_02.mp3',
      '/audio/duels/voices/variants/defeat/defeat_03.mp3',
      '/audio/duels/voices/variants/defeat/defeat_04.mp3'
    ],

    // Misc Locations
    shop_welcome: [
      '/audio/duels/voices/variants/shop_welcome/shop_welcome_01.mp3',
      '/audio/duels/voices/variants/shop_welcome/shop_welcome_02.mp3'
    ],
    shop_purchase_success: [
      '/audio/duels/voices/variants/shop_purchase_success/shop_purchase_success_01.mp3',
      '/audio/duels/voices/variants/shop_purchase_success/shop_purchase_success_02.mp3',
      '/audio/duels/voices/variants/shop_purchase_success/shop_purchase_success_03.mp3'
    ],
    shop_not_enough_funds: [
      '/audio/duels/voices/variants/shop_not_enough_funds/shop_not_enough_funds_01.mp3',
      '/audio/duels/voices/variants/shop_not_enough_funds/shop_not_enough_funds_02.mp3',
      '/audio/duels/voices/variants/shop_not_enough_funds/shop_not_enough_funds_03.mp3'
    ],
    ranking_intro: [
      '/audio/duels/voices/variants/ranking_intro/ranking_intro_01.mp3',
      '/audio/duels/voices/variants/ranking_intro/ranking_intro_02.mp3'
    ],
    
    // Legacy support for older keys (mapping to new variants)
    turn_result_super: [
      '/audio/duels/voices/variants/verdict_player_won_strategy/verdict_player_won_strategy_01.mp3',
      '/audio/duels/voices/variants/turn_result_super/turn_result_super_01.mp3'
    ],
    turn_result_weak: [
      '/audio/duels/voices/variants/verdict_rival_won_strategy/verdict_rival_won_strategy_01.mp3',
      '/audio/duels/voices/variants/turn_result_weak/turn_result_weak_01.mp3'
    ],
    turn_result_neutral: [
      '/audio/duels/voices/variants/verdict_neutral_clash/verdict_neutral_clash_01.mp3',
      '/audio/duels/voices/variants/turn_result_neutral/turn_result_neutral_01.mp3'
    ],
    
    snape_mock_low_energy: '/audio/duels/voices/variants/low_energy/low_energy_01.mp3',
    snape_mock_bad_move: '/audio/duels/voices/variants/verdict_rival_won_strategy/verdict_rival_won_strategy_01.mp3',
    harry_cheer_good_move: '/audio/duels/voices/variants/verdict_player_won_strategy/verdict_player_won_strategy_01.mp3',
    harry_cheer_advantage: '/audio/duels/voices/variants/turn_start_advantage/turn_start_advantage_01.mp3',
  }
};

class AudioManager {
  constructor() {
    this.enabled = true;
    this.ambientVolume = 0.4;
    this.sfxVolume = 0.6;
    this.voiceVolume = 1.0;
    
    this.currentAmbient = null;
    this.ambientAudio = null;
    this.currentVoice = null;
    
    this.lastVoiceByKey = {};
    this.lastVoicePlayedAt = {};
    this.voiceCooldownMs = 8000;
    
    this.isUnlocked = false;
    this.initialized = false;
    
    this.loadSettings();
  }

  loadSettings() {
    try {
      if (typeof window === 'undefined') return;
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { enabled, ambientVolume, sfxVolume, voiceVolume } = JSON.parse(saved);
        this.enabled = enabled ?? true;
        this.ambientVolume = ambientVolume ?? 0.4;
        this.sfxVolume = sfxVolume ?? 0.6;
        this.voiceVolume = voiceVolume ?? 1.0;
      }
    } catch (e) {
      console.warn('Failed to load audio settings', e);
    }
  }

  saveSettings() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          enabled: this.enabled,
          ambientVolume: this.ambientVolume,
          sfxVolume: this.sfxVolume,
          voiceVolume: this.voiceVolume
        }));
      }
    } catch (e) {
      console.error('Failed to save audio settings', e);
    }
  }

  initAudio() {
    if (this.initialized) return;
    this.initialized = true;
    console.log('Dynamic Audio Manager Initialized');
  }

  async unlockAudio() {
    if (this.isUnlocked) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      await context.resume();
      this.isUnlocked = true;
      if (this.currentAmbient && !this.ambientAudio && this.enabled) {
        this.playAmbient(this.currentAmbient);
      }
    } catch (e) {
      console.warn('Failed to unlock audio context', e);
    }
  }

  playAmbient(key) {
    if (typeof window === 'undefined') return;
    const url = AUDIO_MAP.ambient[key];
    if (!url) return;
    if (this.currentAmbient === key && this.ambientAudio) {
      this.ambientAudio.volume = this.enabled ? this.ambientVolume : 0;
      if (this.ambientAudio.paused && this.enabled) this.ambientAudio.play().catch(() => {});
      return;
    }
    this.stopAmbient();
    this.currentAmbient = key;
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = this.enabled ? this.ambientVolume : 0;
    this.ambientAudio = audio;
    if (this.isUnlocked && this.enabled) {
      audio.play().catch(err => console.warn('Ambient play failed', err));
    }
  }

  stopAmbient() {
    if (this.ambientAudio) {
      this.ambientAudio.pause();
      this.ambientAudio = null;
    }
  }

  playSfx(key) {
    if (typeof window === 'undefined' || !this.enabled || !this.isUnlocked) return;
    const url = AUDIO_MAP.sfx[key];
    if (!url) return;
    const audio = new Audio(url);
    audio.volume = this.sfxVolume;
    audio.play().catch(err => console.warn('SFX play failed', err));
  }

  pickVoiceUrl(key) {
    const entry = AUDIO_MAP.voices[key];
    if (!entry) return null;
    if (Array.isArray(entry)) {
      if (entry.length === 1) return entry[0];
      const last = this.lastVoiceByKey[key];
      const pool = entry.filter(url => url !== last);
      const selected = pool.length > 0 
        ? pool[Math.floor(Math.random() * pool.length)] 
        : entry[Math.floor(Math.random() * entry.length)];
      this.lastVoiceByKey[key] = selected;
      return selected;
    }
    return entry;
  }

  playVoice(key, options = {}) {
    if (typeof window === 'undefined' || !this.enabled || !this.isUnlocked) return;
    const now = Date.now();
    const cooldown = options.cooldownMs ?? this.voiceCooldownMs;
    if (!options.force && this.lastVoicePlayedAt[key] && now - this.lastVoicePlayedAt[key] < cooldown) {
      return Promise.resolve();
    }
    const url = this.pickVoiceUrl(key);
    if (!url) return Promise.resolve();
    this.lastVoicePlayedAt[key] = now;
    if (this.currentVoice && options.interrupt !== false) {
      this.currentVoice.pause();
      this.currentVoice = null;
    }
    const audio = new Audio(url);
    audio.volume = options.volume ?? this.voiceVolume;
    this.currentVoice = audio;
    
    return new Promise((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      setTimeout(() => {
        if (this.currentVoice === audio) {
          audio.play().catch(err => {
            console.warn('Voice play failed', err);
            resolve();
          });
        } else {
          resolve();
        }
      }, options.delayMs ?? 50);
    });
  }

  async playVoiceSequence(sequence, options = {}) {
    if (!this.enabled || !this.isUnlocked || !sequence.length) return;
    
    // Max 3 voices per sequence to avoid saturation
    const limitedSequence = sequence.slice(0, 3);
    
    for (const item of limitedSequence) {
      const key = typeof item === 'string' ? item : item.key;
      const itemOptions = typeof item === 'object' ? item : {};
      
      await new Promise(resolve => setTimeout(resolve, itemOptions.delayMs ?? 200));
      await this.playVoice(key, { ...options, ...itemOptions, interrupt: true, force: true });
    }
  }

  setAudioEnabled(value) {
    this.enabled = value;
    if (!value) {
      if (this.ambientAudio) this.ambientAudio.pause();
    } else {
      if (this.currentAmbient) this.playAmbient(this.currentAmbient);
    }
    this.saveSettings();
  }

  isAudioEnabled() {
    return this.enabled;
  }
}

const audioManager = new AudioManager();
export default audioManager;
