"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const THEME_AUDIO_SRC = "/audio/sf-ai-startup-map-theme.mp3"
const THEME_AUDIO_VOLUME = 0.42

/**
 * Shared muted-by-default theme loop for city maps and the home world map.
 */
export function useThemeAudio() {
  const [isAudioMuted, setIsAudioMuted] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(THEME_AUDIO_SRC)
    audio.loop = true
    audio.preload = "auto"
    audio.volume = THEME_AUDIO_VOLUME
    audio.muted = true
    audioRef.current = audio

    audio.play().catch(() => {
      // Browsers usually allow muted autoplay, but failing closed is fine here.
    })

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    audio.muted = isAudioMuted
  }, [isAudioMuted])

  const toggleMute = useCallback(async () => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    const nextMuted = !isAudioMuted
    audio.muted = nextMuted
    setIsAudioMuted(nextMuted)

    if (!nextMuted) {
      try {
        await audio.play()
      } catch {
        setIsAudioMuted(true)
        audio.muted = true
      }
    }
  }, [isAudioMuted])

  return { isAudioMuted, toggleMute }
}
