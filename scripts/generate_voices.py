import requests
import os
import time

API_KEY = "sk_e5a86bede19e1884dba82b5cda1279f39db749afc8d1380b"
TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/"

# Selected Voices
VOICE_DUMBLEDORE = "9TcPbUAhHnAV8mzFDAWU" # El Faraon 2 (Old Narrator)
VOICE_HAT = "twq6c9tK89O36XNHCv2Q"        # Sombrero
VOICE_SNAPE = "PZwYzXK45TUNWPGmFt8r"      # Snape

VOICE_LINES = {
    "welcome": {
        "voice": VOICE_HAT,
        "text": "¡Bienvenidos a la gran arena de Hogwarts! Que el honor de su casa los guíe en este duelo.",
        "path": "voices/welcome.mp3"
    },
    "instructions": {
        "voice": VOICE_DUMBLEDORE,
        "text": "Recuerden jóvenes magos: cada hechizo consume su energía vital. Elijan sus cartas con sabiduría.",
        "path": "voices/instructions.mp3"
    },
    "victory": {
        "voice": VOICE_DUMBLEDORE,
        "text": "¡Maravilloso! Una demostración de maestría mágica verdaderamente excepcional. ¡Diez puntos para su casa!",
        "path": "voices/victory.mp3"
    },
    "defeat": {
        "voice": VOICE_DUMBLEDORE,
        "text": "No se desanimen por este tropiezo. Hasta los más grandes magos han conocido la derrota. Sigan practicando.",
        "path": "voices/defeat.mp3"
    },
    "turn_start": {
        "voice": VOICE_SNAPE,
        "text": "Es su turno. No me hagan perder el tiempo.",
        "path": "voices/turn_start.mp3"
    },
    "low_energy": {
        "voice": VOICE_SNAPE,
        "text": "Su energía es patética. Debería haber prestado más atención en clase.",
        "path": "voices/low_energy.mp3"
    }
}

def generate_voice(key, data):
    print(f"Generating voice line: {key}...")
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
