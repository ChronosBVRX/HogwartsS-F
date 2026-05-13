import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'hsf_magic_audio_enabled'

export function useAdventureAudio() {
  const currentAudioRef = useRef(null)
  const ambientAudioRef = useRef(null)

  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  const [playing, setPlaying] = useState(false)

  const unlockAudio = useCallback(async () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setEnabled(true)

    try {
      const silent = new Audio()
      silent.volume = 0
      await silent.play().catch(() => {})
    } catch {}
  }, [])

  const disableAudio = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'false')
    setEnabled(false)
    stopAll()
  }, [])

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

  const play = useCallback(async (src, options = {}) => {
    if (localStorage.getItem(STORAGE_KEY) !== 'true' || !src) return

    try {
      if (currentAudioRef.current && !options.overlap) {
        currentAudioRef.current.pause()
        currentAudioRef.current.currentTime = 0
      }

      const audio = new Audio(src)
      audio.volume = options.volume ?? 0.9
      audio.loop = options.loop ?? false

      currentAudioRef.current = audio
      setPlaying(true)

      audio.onended = () => setPlaying(false)
      audio.onerror = () => setPlaying(false)

      await audio.play()
    } catch (err) {
      console.warn('No se pudo reproducir audio:', src, err)
      setPlaying(false)
    }
  }, [])

  const playSequence = useCallback(async (items = []) => {
    if (localStorage.getItem(STORAGE_KEY) !== 'true' || !items.length) return

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
          const audio = new Audio(src)
          audio.volume = volume
          currentAudioRef.current = audio
          setPlaying(true)

          audio.onended = () => {
            setPlaying(false)
            resolve()
          }

          audio.onerror = () => {
            setPlaying(false)
            resolve()
          }

          audio.play().catch(() => resolve())
        } catch {
          resolve()
        }
      })
    }
  }, [])

  const playAmbient = useCallback(async (src, options = {}) => {
    if (localStorage.getItem(STORAGE_KEY) !== 'true' || !src) return

    try {
      if (ambientAudioRef.current) {
        // Only restart if source changed or explicitly forced
        if (ambientAudioRef.current.src.includes(src) && !options.force) return
        
        ambientAudioRef.current.pause()
        ambientAudioRef.current.currentTime = 0
      }

      const audio = new Audio(src)
      audio.volume = options.volume ?? 0.22
      audio.loop = true

      ambientAudioRef.current = audio
      await audio.play()
    } catch (err) {
      console.warn('No se pudo reproducir ambiente:', src, err)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (currentAudioRef.current) currentAudioRef.current.pause()
      if (ambientAudioRef.current) ambientAudioRef.current.pause()
    }
  }, [])

  return useMemo(() => ({
    enabled,
    playing,
    unlockAudio,
    disableAudio,
    play,
    playSequence,
    playAmbient,
    stopVoice,
    stopAmbient,
    stopAll
  }), [enabled, playing, unlockAudio, disableAudio, play, playSequence, playAmbient, stopVoice, stopAmbient, stopAll])
}
