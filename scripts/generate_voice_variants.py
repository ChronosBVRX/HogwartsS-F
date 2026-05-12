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
    "welcome": [
        {"voice": VOICE_DUMBLEDORE, "text": "Bienvenido a los Duelos Mágicos. Aquí no gana quien grita más fuerte, sino quien domina su varita.", "name": "welcome_01.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Has entrado a la arena. Que tu casa esté orgullosa… o al menos que no se avergüence demasiado.", "name": "welcome_02.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "La magia no perdona la duda. Prepárate para demostrar de qué estás hecho.", "name": "welcome_03.mp3"}
    ],
    "instructions": [
        {"voice": VOICE_DUMBLEDORE, "text": "Elige un hechizo cada turno. Administra tu energía, estudia al rival y usa las ventajas de cada tipo para dominar el duelo.", "name": "instructions_01.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Ataque, defensa, control, curación y carga. Cada decisión importa. Un mal hechizo puede costarte la victoria.", "name": "instructions_02.mp3"}
    ],
    "spell_guide_intro": [
        {"voice": VOICE_DUMBLEDORE, "text": "El conocimiento es el hechizo más poderoso. Estudia bien cada movimiento.", "name": "spell_guide_intro_01.mp3"},
        {"voice": VOICE_HARRY, "text": "Aquí puedes ver qué hace cada hechizo. Elige bien según la situación.", "name": "spell_guide_intro_02.mp3"}
    ],
    "turn_start_neutral": [
        {"voice": VOICE_HARRY, "text": "Nuevo turno. Observa, calcula y lanza con precisión.", "name": "turn_start_neutral_01.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "La arena espera tu decisión.", "name": "turn_start_neutral_02.mp3"},
        {"voice": VOICE_HARRY, "text": "Respira. La magia responde mejor a una mente clara.", "name": "turn_start_neutral_03.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Tu turno ha comenzado. Elige sabiamente.", "name": "turn_start_neutral_04.mp3"},
        {"voice": VOICE_HARRY, "text": "El duelo continúa. No desperdicies tu oportunidad.", "name": "turn_start_neutral_05.mp3"}
    ],
    "turn_start_pressure": [
        {"voice": VOICE_SNAPE, "text": "Cuidado. Tu energía está baja y el rival lo sabe.", "name": "turn_start_pressure_01.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "No es momento de lucirse, es momento de sobrevivir.", "name": "turn_start_pressure_02.mp3"},
        {"voice": VOICE_SNAPE, "text": "La presión aumenta. Un error más puede ser definitivo.", "name": "turn_start_pressure_03.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Estás contra las cuerdas. Piensa antes de lanzar.", "name": "turn_start_pressure_04.mp3"}
    ],
    "turn_start_advantage": [
        {"voice": VOICE_HARRY, "text": "Tienes la ventaja. No la desperdicies con arrogancia.", "name": "turn_start_advantage_01.mp3"},
        {"voice": VOICE_HARRY, "text": "El rival tambalea. Este puede ser el momento decisivo.", "name": "turn_start_advantage_02.mp3"},
        {"voice": VOICE_HARRY, "text": "La arena empieza a inclinarse a tu favor.", "name": "turn_start_advantage_03.mp3"},
        {"voice": VOICE_HARRY, "text": "Dominas el ritmo del combate. Mantén la presión.", "name": "turn_start_advantage_04.mp3"}
    ],
    "turn_start_disadvantage": [
        {"voice": VOICE_DUMBLEDORE, "text": "El rival tiene la ventaja. Pero un buen hechizo puede cambiarlo todo.", "name": "turn_start_disadvantage_01.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Vas abajo, pero la magia aún no ha dictado sentencia.", "name": "turn_start_disadvantage_02.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Este duelo no está perdido. Todavía puedes responder.", "name": "turn_start_disadvantage_03.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Necesitas precisión. La fuerza bruta no bastará.", "name": "turn_start_disadvantage_04.mp3"}
    ],
    "low_energy": [
        {"voice": VOICE_SNAPE, "text": "No tienes energía suficiente para ese hechizo.", "name": "low_energy_01.mp3"},
        {"voice": VOICE_SNAPE, "text": "Tu varita no responde. Te falta energía.", "name": "low_energy_02.mp3"},
        {"voice": VOICE_SNAPE, "text": "Ambicioso… pero imposible con esa energía.", "name": "low_energy_03.mp3"},
        {"voice": VOICE_SNAPE, "text": "Primero carga poder, después intenta presumir.", "name": "low_energy_04.mp3"}
    ],
    "spell_confirmed": [
        {"voice": VOICE_HARRY, "text": "Hechizo preparado.", "name": "spell_confirmed_01.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Movimiento registrado.", "name": "spell_confirmed_02.mp3"},
        {"voice": VOICE_HARRY, "text": "La varita ha elegido.", "name": "spell_confirmed_03.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Que así sea.", "name": "spell_confirmed_04.mp3"}
    ],
    "turn_result_super": [
        {"voice": VOICE_DUMBLEDORE, "text": "Excelente elección. Tu hechizo encontró la debilidad del rival.", "name": "turn_result_super_01.mp3"},
        {"voice": VOICE_HARRY, "text": "Impacto perfecto. Eso fue estrategia, no suerte.", "name": "turn_result_super_02.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Muy efectivo. El rival acaba de aprender una lección dolorosa.", "name": "turn_result_super_03.mp3"},
        {"voice": VOICE_HARRY, "text": "La ventaja fue clara. Bien jugado.", "name": "turn_result_super_04.mp3"}
    ],
    "turn_result_weak": [
        {"voice": VOICE_SNAPE, "text": "No fue la mejor elección. El rival leyó tu intención.", "name": "turn_result_weak_01.mp3"},
        {"voice": VOICE_HARRY, "text": "Ese hechizo perdió fuerza al chocar contra la respuesta rival.", "name": "turn_result_weak_02.mp3"},
        {"voice": VOICE_SNAPE, "text": "Mal intercambio. Necesitas ajustar tu estrategia.", "name": "turn_result_weak_03.mp3"},
        {"voice": VOICE_HARRY, "text": "La magia fue débil esta vez.", "name": "turn_result_weak_04.mp3"}
    ],
    "turn_result_block": [
        {"voice": VOICE_SNAPE, "text": "El rival leyó tu movimiento y logró contener el impacto.", "name": "turn_result_block_01.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Bloqueo efectivo. Tu hechizo no encontró camino.", "name": "turn_result_block_02.mp3"},
        {"voice": VOICE_SNAPE, "text": "La defensa rival hizo su trabajo.", "name": "turn_result_block_03.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Tu ataque fue detenido antes de causar estragos.", "name": "turn_result_block_04.mp3"}
    ],
    "turn_result_punish": [
        {"voice": VOICE_HARRY, "text": "Castigaste la carga del rival. Excelente lectura.", "name": "turn_result_punish_01.mp3"},
        {"voice": VOICE_HARRY, "text": "El rival intentó reunir poder y pagó el precio.", "name": "turn_result_punish_02.mp3"},
        {"voice": VOICE_HARRY, "text": "Interrupción perfecta. Ese movimiento dolió.", "name": "turn_result_punish_03.mp3"},
        {"voice": VOICE_HARRY, "text": "Tu hechizo llegó justo cuando el rival bajó la guardia.", "name": "turn_result_punish_04.mp3"}
    ],
    "turn_result_neutral": [
        {"voice": VOICE_DUMBLEDORE, "text": "Ambos hechizos chocaron sin una ventaja clara.", "name": "turn_result_neutral_01.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "El intercambio fue parejo. El duelo sigue abierto.", "name": "turn_result_neutral_02.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Ninguno cedió terreno esta vez.", "name": "turn_result_neutral_03.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "La magia se equilibró en el centro de la arena.", "name": "turn_result_neutral_04.mp3"}
    ],
    "victory": [
        {"voice": VOICE_DUMBLEDORE, "text": "Victoria. Tu casa recordará este duelo.", "name": "victory_01.mp3"},
        {"voice": VOICE_HARRY, "text": "Has dominado la arena. Excelente combate.", "name": "victory_02.mp3"},
        {"voice": VOICE_HAT, "text": "El rival cayó. Tu magia fue superior.", "name": "victory_03.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Victoria merecida. Hoy la varita obedeció.", "name": "victory_04.mp3"}
    ],
    "defeat": [
        {"voice": VOICE_DUMBLEDORE, "text": "Derrota. Dolorosa, sí. Definitiva, no.", "name": "defeat_01.mp3"},
        {"voice": VOICE_SNAPE, "text": "Has caído en la arena, pero aún puedes volver más fuerte.", "name": "defeat_02.mp3"},
        {"voice": VOICE_HARRY, "text": "El rival fue superior esta vez.", "name": "defeat_03.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "La derrota también enseña… aunque duela.", "name": "defeat_04.mp3"}
    ],
    "shop_welcome": [
        {"voice": VOICE_DUMBLEDORE, "text": "Bienvenido a la boutique mágica. El estilo también puede ser una forma de poder.", "name": "shop_welcome_01.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Revisa los objetos disponibles. Algunos magos ganan por estrategia, otros por venir mejor equipados.", "name": "shop_welcome_02.mp3"}
    ],
    "shop_purchase_success": [
        {"voice": VOICE_HARRY, "text": "Adquisición completada. Excelente elección.", "name": "shop_purchase_success_01.mp3"},
        {"voice": VOICE_HARRY, "text": "Objeto conseguido. Que te sirva en la arena.", "name": "shop_purchase_success_02.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Compra realizada. Tu inventario acaba de mejorar.", "name": "shop_purchase_success_03.mp3"}
    ],
    "shop_not_enough_funds": [
        {"voice": VOICE_SNAPE, "text": "No tienes suficientes galeones o fragmentos.", "name": "shop_not_enough_funds_01.mp3"},
        {"voice": VOICE_SNAPE, "text": "La magia es poderosa, pero la tienda no fía.", "name": "shop_not_enough_funds_02.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "Fondos insuficientes. Vuelve cuando hayas ganado más duelos.", "name": "shop_not_enough_funds_03.mp3"}
    ],
    "ranking_intro": [
        {"voice": VOICE_DUMBLEDORE, "text": "Aquí se escribe la gloria de las casas y de los mejores duelistas.", "name": "ranking_intro_01.mp3"},
        {"voice": VOICE_DUMBLEDORE, "text": "El ranking revela quién domina realmente la arena.", "name": "ranking_intro_02.mp3"}
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
