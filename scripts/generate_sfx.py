import wave
import math
import struct
import random
import os

def generate_wave(filename, duration, type='sine', freq=440.0, volume=0.5, sample_rate=44100):
    n_samples = int(duration * sample_rate)
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        
        for i in range(n_samples):
            t = float(i) / sample_rate
            
            if type == 'sine':
                value = math.sin(2 * math.pi * freq * t)
            elif type == 'noise':
                value = random.uniform(-1.0, 1.0)
            elif type == 'chirp':
                # Linear frequency sweep
                f_current = freq[0] + (freq[1] - freq[0]) * (t / duration)
                value = math.sin(2 * math.pi * f_current * t)
            elif type == 'ambient_wind':
                # Low pass filtered noise (simple moving average)
                # Actually, just use random and some modulation
                mod = math.sin(2 * math.pi * 0.2 * t) * 0.5 + 0.5
                value = random.uniform(-1.0, 1.0) * mod
            else:
                value = 0
            
            # Apply envelope
            if 'envelope' in type:
                pass # TODO: implement envelopes
                
            sample = int(value * volume * 32767)
            f.writeframesraw(struct.pack('<h', sample))

def generate_complex_sfx(filename, duration, params, sample_rate=44100):
    n_samples = int(duration * sample_rate)
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        
        # Simple low-pass state
        lp_state = 0
        
        for i in range(n_samples):
            t = float(i) / duration # progress from 0 to 1
            
            final_value = 0
            
            # Combine components
            for comp in params:
                ctype = comp.get('type', 'sine')
                vol = comp.get('volume', 0.1)
                
                # Envelope
                env_type = comp.get('env', 'linear')
                if env_type == 'linear_decay':
                    env = 1.0 - t
                elif env_type == 'exp_decay':
                    env = math.exp(-5 * t)
                elif env_type == 'bell':
                    env = math.sin(math.pi * t)
                else:
                    env = 1.0
                
                if ctype == 'sine':
                    freq = comp.get('freq', 440.0)
                    if isinstance(freq, list): # Sweep
                        curr_f = freq[0] + (freq[1] - freq[0]) * t
                        val = math.sin(2 * math.pi * curr_f * (i / sample_rate))
                    else:
                        val = math.sin(2 * math.pi * freq * (i / sample_rate))
                elif ctype == 'noise':
                    val = random.uniform(-1.0, 1.0)
                
                final_value += val * vol * env
            
            # Simple Low-pass filter if requested
            lp_alpha = 0.1
            lp_state = lp_alpha * final_value + (1 - lp_alpha) * lp_state
            
            # Clip
            if lp_state > 1.0: lp_state = 1.0
            if lp_state < -1.0: lp_state = -1.0
            
            sample = int(lp_state * 32767)
            f.writeframesraw(struct.pack('<h', sample))

# Paths
BASE_DIR = "public/audio/duels"
AMBIENT_DIR = os.path.join(BASE_DIR, "ambient")
SFX_DIR = os.path.join(BASE_DIR, "sfx")
UI_DIR = os.path.join(BASE_DIR, "ui")

# 1. AMBIENT
print("Generating ambient sounds...")
# ambient_duel_hall
generate_complex_sfx(os.path.join(AMBIENT_DIR, "ambient_duel_hall.wav"), 10, [
    {'type': 'noise', 'volume': 0.05, 'env': 'none'}, # background hum
    {'type': 'sine', 'freq': 60, 'volume': 0.1, 'env': 'none'}, # low rumble
    {'type': 'sine', 'freq': 120, 'volume': 0.05, 'env': 'none'},
], 22050) # Lower sample rate for ambient to save space

# ambient_castle_night
generate_complex_sfx(os.path.join(AMBIENT_DIR, "ambient_castle_night.wav"), 10, [
    {'type': 'noise', 'volume': 0.02, 'env': 'none'},
    {'type': 'sine', 'freq': 50, 'volume': 0.08, 'env': 'none'},
], 22050)

# ambient_magic_wind
generate_complex_sfx(os.path.join(AMBIENT_DIR, "ambient_magic_wind.wav"), 10, [
    {'type': 'noise', 'volume': 0.1, 'env': 'bell'}, # Whoosh effect
], 22050)

# ambient_forest_dark
generate_complex_sfx(os.path.join(AMBIENT_DIR, "ambient_forest_dark.wav"), 10, [
    {'type': 'noise', 'volume': 0.05, 'env': 'none'},
    {'type': 'sine', 'freq': 40, 'volume': 0.1, 'env': 'none'},
], 22050)

# ambient_dungeon_low
generate_complex_sfx(os.path.join(AMBIENT_DIR, "ambient_dungeon_low.wav"), 10, [
    {'type': 'sine', 'freq': 30, 'volume': 0.15, 'env': 'none'},
    {'type': 'noise', 'volume': 0.02, 'env': 'none'},
], 22050)

# 2. SFX
print("Generating SFX...")
# spell_cast_light
generate_complex_sfx(os.path.join(SFX_DIR, "spell_cast_light.wav"), 0.5, [
    {'type': 'sine', 'freq': [400, 1200], 'volume': 0.4, 'env': 'linear_decay'},
    {'type': 'noise', 'volume': 0.2, 'env': 'exp_decay'}
])

# spell_cast_heavy
generate_complex_sfx(os.path.join(SFX_DIR, "spell_cast_heavy.wav"), 1.2, [
    {'type': 'sine', 'freq': [100, 400], 'volume': 0.6, 'env': 'linear_decay'},
    {'type': 'noise', 'volume': 0.4, 'env': 'exp_decay'}
])

# spell_impact
generate_complex_sfx(os.path.join(SFX_DIR, "spell_impact.wav"), 0.6, [
    {'type': 'noise', 'volume': 0.8, 'env': 'exp_decay'}
])

# shield_block
generate_complex_sfx(os.path.join(SFX_DIR, "shield_block.wav"), 0.8, [
    {'type': 'sine', 'freq': 880, 'volume': 0.5, 'env': 'exp_decay'},
    {'type': 'sine', 'freq': 440, 'volume': 0.3, 'env': 'exp_decay'}
])

# heal_magic
generate_complex_sfx(os.path.join(SFX_DIR, "heal_magic.wav"), 1.5, [
    {'type': 'sine', 'freq': [200, 800], 'volume': 0.3, 'env': 'bell'},
    {'type': 'sine', 'freq': [300, 900], 'volume': 0.2, 'env': 'bell'}
])

# energy_charge
generate_complex_sfx(os.path.join(SFX_DIR, "energy_charge.wav"), 1.8, [
    {'type': 'sine', 'freq': [100, 600], 'volume': 0.4, 'env': 'linear'},
    {'type': 'noise', 'volume': 0.1, 'env': 'linear'}
])

# control_spell
generate_complex_sfx(os.path.join(SFX_DIR, "control_spell.wav"), 1.5, [
    {'type': 'sine', 'freq': [400, 300], 'volume': 0.3, 'env': 'bell'},
    {'type': 'noise', 'volume': 0.05, 'env': 'none'}
])

# damage_hit
generate_complex_sfx(os.path.join(SFX_DIR, "damage_hit.wav"), 0.5, [
    {'type': 'noise', 'volume': 0.6, 'env': 'exp_decay'},
    {'type': 'sine', 'freq': 100, 'volume': 0.4, 'env': 'exp_decay'}
])

# victory_fanfare
generate_complex_sfx(os.path.join(SFX_DIR, "victory_fanfare.wav"), 3.0, [
    {'type': 'sine', 'freq': 440, 'volume': 0.3, 'env': 'bell'},
    {'type': 'sine', 'freq': 554, 'volume': 0.3, 'env': 'bell'},
    {'type': 'sine', 'freq': 659, 'volume': 0.3, 'env': 'bell'},
])

# defeat_dark
generate_complex_sfx(os.path.join(SFX_DIR, "defeat_dark.wav"), 3.0, [
    {'type': 'sine', 'freq': [200, 100], 'volume': 0.4, 'env': 'linear_decay'},
    {'type': 'noise', 'volume': 0.1, 'env': 'linear_decay'}
])

# 3. UI
print("Generating UI sounds...")
# ui_card_select
generate_complex_sfx(os.path.join(UI_DIR, "ui_card_select.wav"), 0.2, [
    {'type': 'sine', 'freq': 1200, 'volume': 0.3, 'env': 'exp_decay'}
])

# ui_button_magic
generate_complex_sfx(os.path.join(UI_DIR, "ui_button_magic.wav"), 0.3, [
    {'type': 'sine', 'freq': [800, 1600], 'volume': 0.3, 'env': 'exp_decay'}
])

# ui_timer_warning
generate_complex_sfx(os.path.join(UI_DIR, "ui_timer_warning.wav"), 0.4, [
    {'type': 'sine', 'freq': 440, 'volume': 0.4, 'env': 'bell'}
])

# ui_reward
generate_complex_sfx(os.path.join(UI_DIR, "ui_reward.wav"), 1.0, [
    {'type': 'sine', 'freq': [600, 1200], 'volume': 0.4, 'env': 'bell'},
    {'type': 'sine', 'freq': [800, 1400], 'volume': 0.2, 'env': 'bell'}
])

# ui_card_confirm
generate_complex_sfx(os.path.join(UI_DIR, "ui_card_confirm.wav"), 0.3, [
    {'type': 'sine', 'freq': [1200, 2400], 'volume': 0.4, 'env': 'exp_decay'},
    {'type': 'sine', 'freq': [800, 1600], 'volume': 0.2, 'env': 'exp_decay'}
])

print("All audio files generated successfully.")
