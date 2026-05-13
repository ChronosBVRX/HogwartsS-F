# Sistema de audio de Aventura Mágica

## Objetivo

La aventura debe sentirse como una experiencia mágica guiada por voces, ambiente y efectos, no como una trivia simple.

## Tipos de audio

### Ambiente
Loops suaves de 30 a 60 segundos:
- castle_loop.mp3
- scanner_loop.mp3
- reward_loop.mp3
- tension_loop.mp3

Volumen recomendado:
0.12 a 0.22

### Efectos UI
Efectos cortos de 0.3 a 2 segundos:
- map_open.mp3
- camera_start.mp3
- portal_scan.mp3
- correct.mp3
- wrong.mp3
- reward_fanfare.mp3

Volumen recomendado:
0.55 a 0.85

### Voces
Narraciones cortas de 3 a 12 segundos.
No saturar la experiencia con textos demasiado largos.

## Regla importante

El audio debe activarse con interacción del usuario mediante el botón:
"Activar magia sonora"

Esto evita bloqueos de autoplay en móviles.

## Seguridad

La API key de ElevenLabs nunca debe estar en frontend.
No usar VITE_ELEVENLABS_API_KEY.
La generación debe hacerse con script local o backend seguro.

## Flujo ideal

1. Usuario entra a aventura.
2. Activa magia sonora.
3. Suena ambiente.
4. Escanea sello.
5. Suena portal.
6. Aparece pregunta con voz.
7. Responde.
8. Suena correcto o incorrecto.
9. Si es correcto, se narra pista y avanza a escaneo.
10. Si termina, se abre recompensa con fanfarria.
