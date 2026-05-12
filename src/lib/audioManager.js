/**
 * AudioManager.js
 * Handles all audio operations for the Magic Duels minigame.
 * Powered by ElevenLabs Cinematic Sound Effects.
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
  }
};

class AudioManager {
  constructor() {
    this.enabled = true;
    this.ambientVolume = 0.4;
    this.sfxVolume = 0.6;
    this.currentAmbient = null;
    this.ambientAudio = null;
    this.isUnlocked = false;
    this.initialized = false;
    
    this.loadSettings();
  }

  loadSettings() {
    try {
      if (typeof window === 'undefined') return;
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { enabled, ambientVolume, sfxVolume } = JSON.parse(saved);
        this.enabled = enabled ?? true;
        this.ambientVolume = ambientVolume ?? 0.4;
        this.sfxVolume = sfxVolume ?? 0.6;
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
          sfxVolume: this.sfxVolume
        }));
      }
    } catch (e) {
      console.error('Failed to save audio settings', e);
    }
  }

  initAudio() {
    if (this.initialized) return;
    this.initialized = true;
    console.log('ElevenLabs Audio Manager Initialized');
  }

  async unlockAudio() {
    if (this.isUnlocked) return;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      await context.resume();
      this.isUnlocked = true;
      console.log('Audio Context Unlocked');
      
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
      if (this.ambientAudio.paused && this.enabled) {
        this.ambientAudio.play().catch(() => {});
      }
      return;
    }

    this.stopAmbient();
    this.currentAmbient = key;

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = this.enabled ? this.ambientVolume : 0;
    this.ambientAudio = audio;

    if (this.isUnlocked && this.enabled) {
      audio.play().catch(err => {
        console.warn('Ambient play failed', err);
      });
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
    audio.play().catch(err => {
      console.warn('SFX play failed', err);
    });
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
