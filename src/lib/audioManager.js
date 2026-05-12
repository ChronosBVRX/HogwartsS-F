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
    ui_button_magic: '/audio/duels/ui/ui_button_magic.mp3',
    ui_timer_warning: '/audio/duels/ui/ui_timer_warning.mp3',
    ui_reward: '/audio/duels/ui/ui_reward.mp3',
  },
  voices: {
    welcome: '/audio/duels/voices/welcome.mp3',
    instructions: '/audio/duels/voices/instructions.mp3',
    
    // New Dynamic Variants
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
    victory: [
      '/audio/duels/voices/variants/victory/victory_01.mp3',
      '/audio/duels/voices/variants/victory/victory_02.mp3',
      '/audio/duels/voices/variants/victory/victory_03.mp3'
    ],
    defeat: [
      '/audio/duels/voices/variants/defeat/defeat_01.mp3',
      '/audio/duels/voices/variants/defeat/defeat_02.mp3',
      '/audio/duels/voices/variants/defeat/defeat_03.mp3'
    ],
    
    // Legacy support for older keys
    snape_mock_low_energy: '/audio/duels/voices/snape_mock_low_energy.mp3',
    snape_mock_bad_move: '/audio/duels/voices/snape_mock_bad_move.mp3',
    harry_cheer_good_move: '/audio/duels/voices/harry_cheer_good_move.mp3',
    harry_cheer_advantage: '/audio/duels/voices/harry_cheer_advantage.mp3',
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
      const options = entry.filter(url => url !== last);
      const pool = options.length ? options : entry;
      const selected = pool[Math.floor(Math.random() * pool.length)];
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
      return;
    }
    const url = this.pickVoiceUrl(key);
    if (!url) return;
    this.lastVoicePlayedAt[key] = now;
    if (this.currentVoice && options.interrupt !== false) {
      this.currentVoice.pause();
      this.currentVoice = null;
    }
    const audio = new Audio(url);
    audio.volume = options.volume ?? this.voiceVolume;
    this.currentVoice = audio;
    setTimeout(() => {
      if (this.currentVoice === audio) {
        audio.play().catch(err => console.warn('Voice play failed', err));
      }
    }, options.delayMs ?? 50);
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
