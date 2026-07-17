"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const CITY_THEME_AUDIO_SRC = "/audio/sf-ai-startup-map-theme.mp3"
export const GLOBE_THEME_AUDIO_SRC = "/audio/orbit-drift.mp3"
const THEME_AUDIO_VOLUME = 0.42

type UseThemeAudioOptions = {
  src?: string
  /** When false, the loop is paused (e.g. home mercator view). */
  enabled?: boolean
}

/**
 * Muted-by-default theme loop.
 * City maps use the default track; the home globe passes Orbit Drift and
 * enables playback only while the globe view is active.
 */
export function useThemeAudio({
  src = CITY_THEME_AUDIO_SRC,
  enabled = true,
}: UseThemeAudioOptions = {}) {
  const [isAudioMuted, setIsAudioMuted] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mutedRef = useRef(true)

  useEffect(() => {
    mutedRef.current = isAudioMuted
  }, [isAudioMuted])

  useEffect(() => {
    const audio = new Audio(src)
    audio.loop = true
    audio.preload = "auto"
    audio.volume = THEME_AUDIO_VOLUME
    audio.muted = mutedRef.current
    audioRef.current = audio

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [src])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    if (!enabled) {
      audio.pause()
      return
    }

    audio.muted = isAudioMuted
    audio.play().catch(() => {
      // Browsers usually allow muted autoplay, but failing closed is fine here.
    })
  }, [enabled, isAudioMuted])

  const toggleMute = useCallback(async () => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    const nextMuted = !isAudioMuted
    audio.muted = nextMuted
    setIsAudioMuted(nextMuted)

    if (!nextMuted && enabled) {
      try {
        await audio.play()
      } catch {
        setIsAudioMuted(true)
        audio.muted = true
      }
    }
  }, [enabled, isAudioMuted])

  return { isAudioMuted, toggleMute }
}
