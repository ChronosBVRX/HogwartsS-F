import requests
import os
import time

API_KEY = "sk_e5a86bede19e1884dba82b5cda1279f39db749afc8d1380b"
TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/"

# Voice IDs
VOICE_DUMBLEDORE = "9TcPbUAhHnAV8mzFDAWU"
VOICE_HAT = "twq6c9tK89O36XNHCv2Q"
VOICE_SNAPE = "PZwYzXK45TUNWPGmFt8r"
VOICE_HARRY = "race19ljmfSkreQGGOQj"

VARIANTS = {
    "turn_start_neutral": [
        {"voice": VOICE_HARRY, "text": "Tu turno.", "name": "turn_start_neutral_01.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Adelante, mago.", "name": "turn_start_neutral_02.mp3"},
        {"voice": VOICE_HARRY, "text": "Elige tu hechizo.", "name": "turn_start_neutral_03.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "La varita está en tus manos.", "name": "turn_start_neutral_04.mp3"},
        {"voice": VOICE_HARRY, "text": "Piensa rápido.", "name": "turn_start_neutral_05.mp3"}
    ],
    "turn_start_pressure": [
        {"voice": VOICE_SNAPE, "text": "No es momento de dudar.", "name": "turn_start_pressure_01.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Cada hechizo cuenta.", "name": "turn_start_pressure_02.mp3"},
        {"voice": VOICE_SNAPE, "text": "La arena está esperando.", "name": "turn_start_pressure_03.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Un mal movimiento puede costarte el duelo.", "name": "turn_start_pressure_04.mp3"}
    ],
    "turn_start_advantage": [
        {"voice": VOICE_HARRY, "text": "Lo tienes contra las cuerdas.", "name": "turn_start_advantage_01.mp3"},
        {"voice": VOICE_HARRY, "text": "Mantén la presión.", "name": "turn_start_advantage_02.mp3"},
        {"voice": VOICE_HARRY, "text": "Buen ritmo, no te confíes.", "name": "turn_start_advantage_03.mp3"},
        {"voice": VOICE_HARRY, "text": "El rival empieza a ceder.", "name": "turn_start_advantage_04.mp3"}
    ],
    "turn_start_disadvantage": [
        {"voice": VOICE_DUMBLEDORE, "text": "Aún puedes remontar.", "name": "turn_start_disadvantage_01.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Defiéndete con inteligencia.", "name": "turn_start_disadvantage_02.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "No todo está perdido.", "name": "turn_start_disadvantage_03.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Respira, apunta y responde.", "name": "turn_start_disadvantage_04.mp3"}
    ],
    "low_energy": [
        {"voice": VOICE_SNAPE, "text": "Tu energía mágica está baja.", "name": "low_energy_01.mp3"},
        {"voice": VOICE_SNAPE, "text": "Quizá sea momento de recuperar poder.", "name": "low_energy_02.mp3"},
        {"voice": VOICE_SNAPE, "text": "No puedes lanzar todo sin pensar.", "name": "low_energy_03.mp3"},
        {"voice": VOICE_SNAPE, "text": "Carga energía o defiéndete.", "name": "low_energy_04.mp3"}
    ],
    "victory": [
        {"voice": VOICE_DUMBLEDORE, "text": "¡Maravilloso! Una demostración de maestría mágica verdaderamente excepcional.", "name": "victory_01.mp3"},
        {"voice": VOICE_HAT, "text": "¡Victoria! Has defendido el honor de tu casa.", "name": "victory_02.mp3"},
        {"voice": VOICE_HARRY, "text": "¡Lo logramos! Sabía que podías hacerlo.", "name": "victory_03.mp3"}
    ],
    "defeat": [
        {"voice": VOICE_DUMBLEDORE, "text": "No se desanimen por este tropiezo. Sigan practicando.", "name": "defeat_01.mp3"},
        {"voice": VOICE_SNAPE, "text": "Derrotado... como era de esperarse.", "name": "defeat_02.mp3"},
        {"voice": VOICE_HARRY, "text": "Estuvimos cerca, la próxima vez será nuestra.", "name": "defeat_03.mp3"}
    ]
}

def generate_voice(path, data):
    print(f"Generating variant: {data['name']}...")
    full_path = os.path.join("public/audio/duels/voices/variants", path, data["name"])
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
        print(f"SUCCESS: {data['name']}")
    else:
        print(f"ERROR {response.status_code}: {response.text}")

def main():
    for category, items in VARIANTS.items():
        for item in items:
            generate_voice(category, item)
            time.sleep(1)

if __name__ == "__main__":
    main()
