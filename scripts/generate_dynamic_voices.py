import requests
import os
import time

API_KEY = "sk_e5a86bede19e1884dba82b5cda1279f39db749afc8d1380b"
TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/"

# Voice IDs from previous list
VOICE_SNAPE = "PZwYzXK45TUNWPGmFt8r"
VOICE_HARRY = "race19ljmfSkreQGGOQj"

VOICE_LINES = {
    "snape_mock_low_energy": {
        "voice": VOICE_SNAPE,
        "text": "Se ha quedado sin energía... ¿acaso esperaba que la victoria se le entregara en bandeja de plata?",
        "path": "voices/snape_mock_low_energy.mp3"
    },
    "snape_mock_bad_move": {
        "voice": VOICE_SNAPE,
        "text": "Qué movimiento tan... predecible. Patético.",
        "path": "voices/snape_mock_bad_move.mp3"
    },
    "harry_cheer_good_move": {
        "voice": VOICE_HARRY,
        "text": "¡Buen tiro! ¡Eso es, sigue así!",
        "path": "voices/harry_cheer_good_move.mp3"
    },
    "harry_cheer_advantage": {
        "voice": VOICE_HARRY,
        "text": "¡Increíble! ¡Tienes la ventaja, no lo dejes escapar!",
        "path": "voices/harry_cheer_advantage.mp3"
    }
}

def generate_voice(key, data):
    print(f"Generating dynamic voice line: {key}...")
    full_path = os.path.join("public/audio/duels", data["path"])
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    url = f"{TTS_URL}{data['voice']}"
    headers = {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "text": data["text"],
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 200:
        with open(full_path, "wb") as f:
            f.write(response.content)
        print(f"SUCCESS: {data['path']}")
    else:
        print(f"ERROR {response.status_code}: {response.text}")

def main():
    for key, data in VOICE_LINES.items():
        generate_voice(key, data)
        time.sleep(2)

if __name__ == "__main__":
    main()
