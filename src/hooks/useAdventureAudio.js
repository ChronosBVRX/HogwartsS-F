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
  const voiceRef = useRef(null)
  const ambientRef = useRef(null)
  const sfxRefs = useRef(new Set())
  const sequenceTokenRef = useRef(0)
  const contextRef = useRef(null)

  const [enabled, setEnabled] = useState(getStoredAudioEnabled)
  const [playing, setPlaying] = useState(false)
  const [lastError, setLastError] = useState(null)

  const isDev = import.meta.env.DEV

  const stopVoice = useCallback(() => {
    if (voiceRef.current) {
      if (isDev) console.log('[AUDIO] Stopping voice')
      voiceRef.current.pause()
      voiceRef.current.currentTime = 0
    }
    setPlaying(false)
  }, [isDev])

  const stopAmbient = useCallback(() => {
    if (ambientRef.current) {
      if (isDev) console.log('[AUDIO] Stopping ambient')
      ambientRef.current.pause()
      ambientRef.current.currentTime = 0
    }
  }, [isDev])

  const stopSfx = useCallback(() => {
    if (isDev && sfxRefs.current.size > 0) console.log(`[AUDIO] Stopping ${sfxRefs.current.size} SFX`)
    sfxRefs.current.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
    sfxRefs.current.clear()
  }, [isDev])

  const stopSequence = useCallback(() => {
    if (isDev) console.log('[AUDIO] Sequence cancelled (token incremented)')
    sequenceTokenRef.current++
  }, [isDev])

  const stopAll = useCallback(() => {
    stopVoice()
    stopAmbient()
    stopSfx()
    stopSequence()
  }, [stopVoice, stopAmbient, stopSfx, stopSequence])

  const setAudioContext = useCallback((contextId) => {
    if (contextRef.current !== contextId) {
      if (isDev) console.log(`[AUDIO CONTEXT] ${contextId}`)
      contextRef.current = contextId
      // When context changes, we stop sequences and voices, but keep ambient if needed
      // (playAmbient will handle transition if the src changes)
      stopSequence()
      stopVoice()
    }
  }, [isDev, stopSequence, stopVoice])

  const playSfx = useCallback(async (src, options = {}) => {
    if (!src || (!enabled && !getStoredAudioEnabled())) return false

    try {
      const audio = new Audio(src)
      audio.volume = options.volume ?? 0.7
      
      sfxRefs.current.add(audio)
      
      audio.onended = () => sfxRefs.current.delete(audio)
      audio.onerror = () => sfxRefs.current.delete(audio)

      if (isDev) console.log(`[AUDIO PLAY SFX] ${src}`)
      await audio.play()
      return true
    } catch (err) {
      console.warn('[AUDIO SFX ERROR]', src, err)
      return false
    }
  }, [enabled, isDev])

  const playVoice = useCallback(async (src, options = {}) => {
    if (!src || (!enabled && !getStoredAudioEnabled())) return false

    try {
      stopVoice()
      
      const audio = new Audio(src)
      audio.volume = options.volume ?? 0.95
      audio.preload = 'auto'

      voiceRef.current = audio
      setPlaying(true)
      setLastError(null)

      audio.onended = () => setPlaying(false)
      audio.onerror = () => {
        setLastError(`Error cargando voz: ${src}`)
        setPlaying(false)
      }

      if (isDev) console.log(`[AUDIO PLAY VOICE] ${src}`)
      await audio.play()
      return true
    } catch (err) {
      setLastError(`Error reproduciendo voz: ${src}`)
      setPlaying(false)
      return false
    }
  }, [enabled, isDev, stopVoice])

  const playAmbient = useCallback(async (src, options = {}) => {
    if (!src || (!enabled && !getStoredAudioEnabled())) return false

    try {
      if (ambientRef.current) {
        if (ambientRef.current.src.includes(src) && !options.force) return true
        stopAmbient()
      }

      const audio = new Audio(src)
      audio.volume = options.volume ?? 0.2
      audio.loop = true
      audio.preload = 'auto'

      ambientRef.current = audio
      if (isDev) console.log(`[AUDIO PLAY AMBIENT] ${src}`)
      await audio.play()
      return true
    } catch (err) {
      setLastError(`Error ambiente: ${src}`)
      return false
    }
  }, [enabled, isDev, stopAmbient])

  const playSequence = useCallback(async (items = [], options = {}) => {
    if (!items.length || (!enabled && !getStoredAudioEnabled())) return false

    const token = ++sequenceTokenRef.current
    if (isDev) console.log(`[AUDIO SEQUENCE START] Token: ${token}`)

    for (const item of items) {
      if (token !== sequenceTokenRef.current) {
        if (isDev) console.log(`[AUDIO SEQUENCE CANCELLED] Token ${token} is stale`)
        return false
      }

      const src = typeof item === 'string' ? item : item.src
      const type = typeof item === 'string' ? 'voice' : item.type ?? 'voice'
      const volume = typeof item === 'string' ? 0.9 : item.volume ?? 0.9
      const delay = typeof item === 'string' ? 0 : item.delay ?? 0

      if (!src) continue

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      if (token !== sequenceTokenRef.current) return false

      await new Promise(resolve => {
        try {
          if (type === 'voice') stopVoice()
          
          const audio = new Audio(src)
          audio.volume = volume
          audio.preload = 'auto'

          if (type === 'voice') {
            voiceRef.current = audio
            setPlaying(true)
          } else {
            sfxRefs.current.add(audio)
          }

          audio.onended = () => {
            if (type === 'voice') setPlaying(false)
            else sfxRefs.current.delete(audio)
            resolve()
          }

          audio.onerror = () => {
            if (type === 'voice') setPlaying(false)
            else sfxRefs.current.delete(audio)
            resolve()
          }

          if (isDev) console.log(`[AUDIO SEQUENCE ITEM] ${type}: ${src}`)
          audio.play().catch(err => {
            console.warn('[AUDIO SEQUENCE ITEM ERROR]', src, err)
            resolve()
          })
        } catch (err) {
          resolve()
        }
      })
    }
    
    return token === sequenceTokenRef.current
  }, [enabled, isDev, stopVoice])

  const unlockAudio = useCallback(async () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {}
    setEnabled(true)

    // First real audio to unlock
    return playVoice(adventureAudio.ui.unlock || adventureAudio.ui.magicClick, { volume: 0.8 })
  }, [playVoice])

  const disableAudio = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'false')
    } catch {}
    setEnabled(false)
    stopAll()
  }, [stopAll])

  const testAudio = useCallback(() => {
    return playSfx(adventureAudio.ui.magicClick, { volume: 0.9 })
  }, [playSfx])

  // Legacy support for general play
  const play = useCallback((src, options = {}) => {
    if (options.ambient) return playAmbient(src, options)
    return playVoice(src, options)
  }, [playAmbient, playVoice])

  useEffect(() => {
    return () => {
      // Clean up all audio on unmount
      if (voiceRef.current) voiceRef.current.pause()
      if (ambientRef.current) ambientRef.current.pause()
      sfxRefs.current.forEach(a => a.pause())
      sequenceTokenRef.current++
    }
  }, [])

  return useMemo(() => ({
    enabled,
    playing,
    lastError,
    setAudioContext,
    playVoice,
    playSfx,
    playAmbient,
    playSequence,
    play,
    unlockAudio,
    disableAudio,
    testAudio,
    stopVoice,
    stopAmbient,
    stopSfx,
    stopSequence,
    stopAll
  }), [
    enabled,
    playing,
    lastError,
    setAudioContext,
    playVoice,
    playSfx,
    playAmbient,
    playSequence,
    play,
    unlockAudio,
    disableAudio,
    testAudio,
    stopVoice,
    stopAmbient,
    stopSfx,
    stopSequence,
    stopAll
  ])
}
