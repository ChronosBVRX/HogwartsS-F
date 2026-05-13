import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { adventureAudio } from '../data/adventureAudioManifest'

const STORAGE_KEY = 'hsf_magic_audio_enabled'

function getStoredAudioEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function useAdventureAudio() {
  const currentAudioRef = useRef(null)
  const ambientAudioRef = useRef(null)
  const unlockedRef = useRef(false)

  const [enabled, setEnabled] = useState(getStoredAudioEnabled)
  const [playing, setPlaying] = useState(false)
  const [lastError, setLastError] = useState(null)

  const stopVoice = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
    }
    setPlaying(false)
  }, [])

  const stopAmbient = useCallback(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause()
      ambientAudioRef.current.currentTime = 0
    }
  }, [])

  const stopAll = useCallback(() => {
    stopVoice()
    stopAmbient()
  }, [stopVoice, stopAmbient])

  const playRaw = useCallback(async (src, options = {}) => {
    if (!src) return false

    try {
      if (currentAudioRef.current && !options.overlap) {
        currentAudioRef.current.pause()
        currentAudioRef.current.currentTime = 0
      }

      const audio = new Audio(src)
      audio.volume = options.volume ?? 0.9
      audio.loop = options.loop ?? false
      audio.preload = 'auto'

      currentAudioRef.current = audio
      setPlaying(true)
      setLastError(null)

      audio.onended = () => setPlaying(false)
      audio.onerror = () => {
        const msg = `No se pudo cargar audio: ${src}`
        console.warn(msg)
        setLastError(msg)
        setPlaying(false)
      }

      await audio.play()
      return true
    } catch (err) {
      const msg = `No se pudo reproducir audio: ${src}`
      console.warn(msg, err)
      setLastError(msg)
      setPlaying(false)
      return false
    }
  }, [])

  const unlockAudio = useCallback(async () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {}

    setEnabled(true)

    const ok = await playRaw(adventureAudio.ui.unlock || adventureAudio.ui.magicClick, {
      volume: 0.8,
      force: true
    })

    unlockedRef.current = ok

    if (!ok) {
      console.warn('El navegador no desbloqueó el audio. Revisa permisos, modo silencio o ruta del archivo.')
    }

    return ok
  }, [playRaw])

  const disableAudio = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'false')
    } catch {}

    setEnabled(false)
    unlockedRef.current = false
    stopAll()
  }, [stopAll])

  const play = useCallback(async (src, options = {}) => {
    const shouldPlay = options.force || enabled || getStoredAudioEnabled()
    if (!shouldPlay || !src) return false

    return playRaw(src, options)
  }, [enabled, playRaw])

  const testAudio = useCallback(async () => {
    return playRaw(adventureAudio.ui.unlock || adventureAudio.ui.magicClick, {
      volume: 0.9,
      force: true
    })
  }, [playRaw])

  const playSequence = useCallback(async (items = []) => {
    if ((!enabled && !getStoredAudioEnabled()) || !items.length) return

    for (const item of items) {
      const src = typeof item === 'string' ? item : item.src
      const volume = typeof item === 'string' ? 0.9 : item.volume ?? 0.9
      const delay = typeof item === 'string' ? 0 : item.delay ?? 0

      if (!src) continue

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      await new Promise(resolve => {
        try {
          if (currentAudioRef.current) {
            currentAudioRef.current.pause()
            currentAudioRef.current.currentTime = 0
          }

          const audio = new Audio(src)
          audio.volume = volume
          audio.preload = 'auto'

          currentAudioRef.current = audio
          setPlaying(true)
          setLastError(null)

          audio.onended = () => {
            setPlaying(false)
            resolve()
          }

          audio.onerror = () => {
            const msg = `No se pudo cargar audio de secuencia: ${src}`
            console.warn(msg)
            setLastError(msg)
            setPlaying(false)
            resolve()
          }

          audio.play().catch(err => {
            console.warn('No se pudo reproducir secuencia:', src, err)
            setLastError(`No se pudo reproducir secuencia: ${src}`)
            setPlaying(false)
            resolve()
          })
        } catch (err) {
          console.warn('Error en secuencia de audio:', err)
          resolve()
        }
      })
    }
  }, [enabled])

  const playAmbient = useCallback(async (src, options = {}) => {
    if ((!enabled && !getStoredAudioEnabled()) || !src) return false

    try {
      if (ambientAudioRef.current) {
        if (ambientAudioRef.current.src.includes(src) && !options.force) return true

        ambientAudioRef.current.pause()
        ambientAudioRef.current.currentTime = 0
      }

      const audio = new Audio(src)
      audio.volume = options.volume ?? 0.22
      audio.loop = true
      audio.preload = 'auto'

      ambientAudioRef.current = audio
      await audio.play()
      setLastError(null)
      return true
    } catch (err) {
      const msg = `No se pudo reproducir ambiente: ${src}`
      console.warn(msg, err)
      setLastError(msg)
      return false
    }
  }, [enabled])

  useEffect(() => {
    return () => {
      if (currentAudioRef.current) currentAudioRef.current.pause()
      if (ambientAudioRef.current) ambientAudioRef.current.pause()
    }
  }, [])

  return useMemo(() => ({
    enabled,
    playing,
    lastError,
    unlockAudio,
    disableAudio,
    testAudio,
    play,
    playSequence,
    playAmbient,
    stopVoice,
    stopAmbient,
    stopAll
  }), [
    enabled,
    playing,
    lastError,
    unlockAudio,
    disableAudio,
    testAudio,
    play,
    playSequence,
    playAmbient,
    stopVoice,
    stopAmbient,
    stopAll
  ])
}
