import requests
import os
import time

API_KEY = "sk_e5a86bede19e1884dba82b5cda1279f39db749afc8d1380b"
SFX_URL = "https://api.elevenlabs.io/v1/sound-generation"

SFX_MAP = {
    # Ambient (Longer duration)
    "ambient/ambient_duel_hall.mp3": ("Immersive ambient sound of a large magical hall with distant whispering, echoing footsteps on stone, and low magical humming.", 10),
    "ambient/ambient_castle_night.mp3": ("Nighttime at a medieval castle, distant owls, soft wind through stone corridors, mysterious magical atmosphere.", 10),
    "ambient/ambient_magic_wind.mp3": ("Magical swirling wind with sparkling chime textures and deep ethereal whooshes.", 10),
    "ambient/ambient_forest_dark.mp3": ("Dark forbidden forest, eerie silence, snapping twigs, distant magical creature growls, ominous wind.", 10),
    "ambient/ambient_dungeon_low.mp3": ("Damp dungeon ambiance, water dripping, low deep rumbling, distant clinking chains.", 10),

    # SFX
    "sfx/spell_cast_light.mp3": ("Quick magical wand flick sound, light energy burst, high frequency sparkle.", 2),
    "sfx/spell_cast_heavy.mp3": ("Powerful magical explosion cast, deep rumble followed by crackling energy.", 3),
    "sfx/spell_impact.mp3": ("Magical impact on a solid surface, energy shattering, glass-like resonance.", 2),
    "sfx/shield_block.mp3": ("Magical barrier blocking an attack, shimmering dome sound, solid crystalline hit.", 2),
    "sfx/heal_magic.mp3": ("Gentle healing magic aura, soft ascending shimmering chimes, soothing energy.", 4),
    "sfx/energy_charge.mp3": ("Gathering magical energy, low humming growing in intensity, electrical crackle.", 3),
    "sfx/control_spell.mp3": ("Hypnotic magical spell, swirling sound, mental influence energy.", 3),
    "sfx/damage_hit.mp3": ("Impact of magic on a body, energy dissipation, painful thud with magical resonance.", 1.5),
    "sfx/victory_fanfare.mp3": ("Short cinematic victory orchestral fanfare, triumphant brass and magical sparkles.", 5),
    "sfx/defeat_dark.mp3": ("Ominous defeat sound, low dissonant cello, fading magical energy, dark transition.", 5),

    # UI
    "ui/ui_card_select.mp3": ("Elegant magical parchment flip, soft crystal click.", 1),
    "ui/ui_card_confirm.mp3": ("Solid magical confirmation, deep bell-like chime with a pulse.", 1.5),
    "ui/ui_button_magic.mp3": ("Soft magical tap, high quality UI pop with a hint of sparkles.", 1),
    "ui/ui_timer_warning.mp3": ("Urgent magical ticking, low intensity warning pulse.", 2),
    "ui/ui_reward.mp3": ("Magical gift appearing, triumphant sparkling sound, high quality loot drop.", 3),
}

def generate_sfx(path, prompt, duration):
    print(f"Generating Premium SFX: {path}...")
    full_path = os.path.join("public/audio/duels", path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    headers = {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "text": prompt,
        "duration_seconds": duration,
        "prompt_influence": 0.8
    }
    
    response = requests.post(SFX_URL, json=payload, headers=headers)
    if response.status_code == 200:
        with open(full_path, "wb") as f:
            f.write(response.content)
        print(f"SUCCESS: {path}")
    else:
        print(f"ERROR {response.status_code}: {response.text}")

def main():
    for path, (prompt, duration) in SFX_MAP.items():
        generate_sfx(path, prompt, duration)
        time.sleep(2) # Cooldown for API

if __name__ == "__main__":
    main()
