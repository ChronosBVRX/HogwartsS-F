import os
import requests
import time

API_KEY = "sk_e5a86bede19e1884dba82b5cda1279f39db749afc8d1380b"
BASE_URL = "https://api.elevenlabs.io/v1/sound-generation"

SOUNDS = {
    # Ambients
    "ambient/ambient_duel_hall.mp3": "Instrumental cinematic magical ambience, ancient stone duel hall, spacious castle interior, soft mystical wind, distant sparkling magical energy, elegant reverb, no vocals, no melody.",
    "ambient/ambient_castle_night.mp3": "Instrumental dark magical castle night ambience, cold wind outside ancient towers, mysterious fantasy school atmosphere, soft drones, subtle bells, cinematic, no vocals.",
    "ambient/ambient_magic_wind.mp3": "Ethereal magical wind ambience, shimmering particles, soft arcane energy, airy fantasy texture, bright but mysterious, no vocals, no percussion.",
    "ambient/ambient_forest_dark.mp3": "Dark enchanted forest ambience, low drones, distant branches, mysterious tension, cinematic fantasy, no vocals.",
    "ambient/ambient_dungeon_low.mp3": "Low dungeon ambience, damp stone chamber, deep resonant air, slow magical hum, dark reverb, heavy atmosphere, no vocals.",
    
    # SFX
    "sfx/spell_cast_light.mp3": "Short magical wand spell cast sound, bright whoosh, sparkling arcane particles, quick energy release, elegant cinematic fantasy.",
    "sfx/spell_cast_heavy.mp3": "Powerful heavy magical spell cast, deep energy charge, strong wand whoosh, explosive arcane release, cinematic fantasy duel.",
    "sfx/spell_impact.mp3": "Short magical impact, arcane energy collision, sparkle burst, low thump, cinematic duel hit.",
    "sfx/shield_block.mp3": "Magical shield block, crystalline resonance, metallic glass energy barrier, defensive spell deflection, bright shimmer.",
    "sfx/heal_magic.mp3": "Warm magical healing sound, ascending shimmer, soft bells, golden arcane energy, gentle restoration, positive.",
    "sfx/energy_charge.mp3": "Rising magical energy charge, arcane vibration, growing intensity, shimmering particles, tension build.",
    "sfx/control_spell.mp3": "Hypnotic control magic sound, swirling arcane waves, mental spell, subtle pulsing shimmer, mysterious.",
    "sfx/damage_hit.mp3": "Short dark damage hit, low thump, magical crack, brief pain impact, cinematic fantasy duel.",
    "sfx/victory_fanfare.mp3": "Short original magical victory fanfare, heroic, bright, celebratory, fantasy school duel victory, orchestral.",
    "sfx/defeat_dark.mp3": "Short original dark defeat cue, descending magical energy, dramatic but elegant, shadowy cinematic fantasy.",
    
    # UI
    "ui/ui_card_select.mp3": "Tiny magical card selection click, soft sparkle, elegant UI sound, short, polished.",
    "ui/ui_button_magic.mp3": "Tiny magical button press, bright shimmer click, responsive UI feedback, short, polished.",
    "ui/ui_timer_warning.mp3": "Short magical timer warning, urgent, subtle bell and pulse, clear countdown tension.",
    "ui/ui_reward.mp3": "Short magical reward sound, bright sparkle, positive unlock, small fanfare shimmer."
}

def generate_sound(path, prompt):
    full_path = os.path.join("public/audio/duels", path)
    if os.path.exists(full_path):
        print(f"Skipping {path} (already exists)")
        return

    print(f"Generating {path}...")
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    headers = {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "text": prompt,
        "duration_seconds": 10 if "ambient" in path else 2
    }
    
    for attempt in range(3):
        try:
            response = requests.post(BASE_URL, json=payload, headers=headers)
            if response.status_code == 200:
                with open(full_path, "wb") as f:
                    f.write(response.content)
                print(f"SUCCESS: {path}")
                return
            else:
                print(f"ERROR {response.status_code} on {path}: {response.text}")
                if response.status_code == 429: # Rate limit
                    time.sleep(10)
                else:
                    break
        except Exception as e:
            print(f"EXCEPTION on {path}: {str(e)}")
        time.sleep(2)

def main():
    for path, prompt in SOUNDS.items():
        generate_sound(path, prompt)
        time.sleep(2)

if __name__ == "__main__":
    main()
