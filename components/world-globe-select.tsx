"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Volume2, VolumeX } from "lucide-react"
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl"

import type { CityId } from "@/lib/city-config"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  artLatitude,
  artLatitudeOnGlobe,
  FLAT_CAMERA,
  GLOBE_CAMERA,
  WORLD_ART_STYLE,
} from "@/lib/world-art-map"
import {
  WORLD_STAGE_CITIES,
  type WorldStageCity,
} from "@/lib/world-stage-cities"
import { WorldMapSelect } from "@/components/world-map-select"

type WorldView = "globe" | "flat"

/** "globe" = rotating 3D globe, "flat" = full-world mercator map. */
const WORLD_VIEW = "flat" as WorldView

const IDLE_ROTATION_DEGREES_PER_FRAME = 0.015

/** The artwork position remap depends on the projection (see lib/world-art-map). */
function markerPositionForView(city: WorldStageCity): [number, number] {
  return [
    city.artLon,
    WORLD_VIEW === "globe"
      ? artLatitudeOnGlobe(city.artLat)
      : artLatitude(city.artLat),
  ]
}

type MeetupCountByCity = Partial<Record<CityId, number>>

function createQuestIndicator(count: number) {
  const wrapper = document.createElement("span")
  wrapper.style.position = "absolute"
  wrapper.style.top = "-16px"
  wrapper.style.left = "50%"
  wrapper.style.transform = "translateX(-50%)"
  wrapper.style.display = "flex"
  wrapper.style.flexDirection = "column"
  wrapper.style.alignItems = "center"
  wrapper.style.pointerEvents = "none"

  const bar = document.createElement("span")
  bar.style.width = "6px"
  bar.style.height = "12px"
  bar.style.background = "#ffe66d"
  bar.style.border = "2px solid #342414"
  bar.style.boxSizing = "border-box"

  const gap = document.createElement("span")
  gap.style.height = "2px"

  const dot = document.createElement("span")
  dot.style.width = "6px"
  dot.style.height = "6px"
  dot.style.background = "#ffe66d"
  dot.style.border = "2px solid #342414"
  dot.style.boxSizing = "border-box"

  wrapper.append(bar, gap, dot)

  if (count > 1) {
    const chip = document.createElement("span")
    chip.textContent = String(count)
    chip.style.position = "absolute"
    chip.style.top = "-3px"
    chip.style.left = "10px"
    chip.style.minWidth = "16px"
    chip.style.height = "14px"
    chip.style.display = "grid"
    chip.style.placeItems = "center"
    chip.style.background = "#fff7dd"
    chip.style.border = "2px solid #342414"
    chip.style.color = "#1a1a2e"
    chip.style.fontFamily = "var(--font-pixel)"
    chip.style.fontSize = "8px"
    chip.style.lineHeight = "1"
    chip.style.padding = "0 3px"
    chip.style.boxSizing = "border-box"
    wrapper.appendChild(chip)
  }

  return wrapper
}

function createCityMarker({
  city,
  active,
  meetupCount,
  onActiveCityChange,
  onCitySelect,
}: {
  city: WorldStageCity
  active: boolean
  meetupCount: number
  onActiveCityChange: (city: CityId) => void
  onCitySelect: (city: WorldStageCity) => void
}) {
  const button = document.createElement("button")
  button.type = "button"
  button.setAttribute("aria-label", `Open ${city.name} AI Startup Map`)
  button.style.display = "block"
  button.style.width = "70px"
  button.style.height = "70px"
  button.style.padding = "0"
  button.style.border = "0"
  button.style.background = "transparent"
  button.style.cursor = "pointer"
  button.style.transformOrigin = "50% 70%"
  button.style.filter = active
    ? "drop-shadow(0 8px 12px rgba(0, 0, 0, 0.45))"
    : "drop-shadow(0 5px 8px rgba(0, 0, 0, 0.35))"
  button.style.zIndex = active ? "10" : "1"

  const markerBody = document.createElement("span")
  markerBody.style.position = "absolute"
  markerBody.style.inset = "0"
  markerBody.style.transform = active ? "scale(1.12)" : "scale(1)"
  markerBody.style.transformOrigin = "50% 70%"
  markerBody.style.transition = "transform 180ms ease"

  if (meetupCount >= 1) {
    markerBody.appendChild(createQuestIndicator(meetupCount))
  }

  const image = document.createElement("img")
  image.src = "/map-assets/city-sign-marker.png"
  image.alt = ""
  image.draggable = false
  image.style.position = "absolute"
  image.style.inset = "0"
  image.style.width = "70px"
  image.style.height = "68px"
  image.style.objectFit = "contain"
  image.style.imageRendering = "pixelated"

  const label = document.createElement("span")
  label.textContent = city.code
  label.style.position = "absolute"
  label.style.top = "22px"
  label.style.left = "50%"
  label.style.transform = "translateX(-50%)"
  label.style.width = city.code.length > 2 ? "46px" : "38px"
  label.style.height = "14px"
  label.style.display = "grid"
  label.style.placeItems = "center"
  label.style.background = "rgba(60, 31, 18, 0.54)"
  label.style.border = "1px solid rgba(26, 26, 46, 0.85)"
  label.style.color = "#fff4ce"
  label.style.fontFamily = "var(--font-pixel)"
  label.style.fontSize = "9px"
  label.style.lineHeight = "1"
  label.style.textShadow = "1px 1px 0 #1a1a2e"

  markerBody.append(image, label)
  button.append(markerBody)
  button.addEventListener("mouseenter", () => onActiveCityChange(city.id))
  button.addEventListener("focus", () => onActiveCityChange(city.id))
  button.addEventListener("click", () => {
    onActiveCityChange(city.id)
    onCitySelect(city)
  })

  return button
}

export function WorldGlobeSelect() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Map<CityId, Marker>>(new Map())
  const rotationFrameRef = useRef<number | null>(null)
  const [mapReady, setMapReady] = useState<MapLibreMap | null>(null)
  const [activeCityId, setActiveCityId] = useState<CityId>("sf")
  const [isSoundOn, setIsSoundOn] = useState(false)
  const [meetupCounts, setMeetupCounts] = useState<MeetupCountByCity>({})
  const [shouldUseFallback, setShouldUseFallback] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const activeCity = useMemo(
    () =>
      WORLD_STAGE_CITIES.find((city) => city.id === activeCityId) ??
      WORLD_STAGE_CITIES[0],
    [activeCityId]
  )

  const toggleSound = async () => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    if (isSoundOn) {
      audio.pause()
      setIsSoundOn(false)
      return
    }

    try {
      audio.volume = 0.45
      await audio.play()
      setIsSoundOn(true)
    } catch {
      setIsSoundOn(false)
    }
  }

  useEffect(() => {
    let disposed = false

    async function loadMeetupCounts() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("published_upcoming_meetups")
        .select("city")
        .match({ status: "published" })

      if (error) {
        throw error
      }

      const counts = (data ?? []).reduce<MeetupCountByCity>((acc, row) => {
        const city = row.city as CityId
        acc[city] = (acc[city] ?? 0) + 1
        return acc
      }, {})

      if (!disposed) {
        setMeetupCounts(counts)
      }
    }

    loadMeetupCounts().catch((error: unknown) => {
      console.error(error)
    })

    return () => {
      disposed = true
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current || shouldUseFallback) {
      return
    }

    let disposed = false
    let didLoad = false
    let hasStoppedRotation = false
    const markers = markersRef.current
    const canvasListeners: Array<{
      type: keyof HTMLElementEventMap
      listener: EventListener
    }> = []

    const stopRotation = () => {
      hasStoppedRotation = true

      if (rotationFrameRef.current !== null) {
        window.cancelAnimationFrame(rotationFrameRef.current)
        rotationFrameRef.current = null
      }
    }

    const fallBackToStaticMap = (map: MapLibreMap | null) => {
      if (disposed || didLoad) {
        return
      }

      stopRotation()
      markers.forEach((marker) => marker.remove())
      markers.clear()
      map?.remove()
      mapRef.current = null
      setMapReady(null)
      setShouldUseFallback(true)
    }

    const rotate = () => {
      const map = mapRef.current

      if (!map || hasStoppedRotation || disposed) {
        return
      }

      const center = map.getCenter()
      map.jumpTo({
        center: [center.lng + IDLE_ROTATION_DEGREES_PER_FRAME, center.lat],
      })
      rotationFrameRef.current = window.requestAnimationFrame(rotate)
    }

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          ...WORLD_ART_STYLE,
          projection: { type: WORLD_VIEW === "globe" ? "globe" : "mercator" },
        },
        center:
          WORLD_VIEW === "globe" ? GLOBE_CAMERA.center : FLAT_CAMERA.center,
        zoom: WORLD_VIEW === "globe" ? GLOBE_CAMERA.zoom : FLAT_CAMERA.zoom,
        minZoom:
          WORLD_VIEW === "globe" ? GLOBE_CAMERA.minZoom : FLAT_CAMERA.minZoom,
        maxZoom: 4.5,
        minPitch: 0,
        maxPitch: 0,
        attributionControl: false,
        renderWorldCopies: false,
        dragRotate: false,
        touchPitch: false,
      })

      mapRef.current = map

      const canvas = map.getCanvas()
      ;(["pointerdown", "wheel", "touchstart"] as const).forEach((type) => {
        const listener = () => stopRotation()
        canvas.addEventListener(type, listener, { once: true })
        canvasListeners.push({ type, listener })
      })

      map.once("load", () => {
        if (disposed) {
          return
        }

        didLoad = true
        map.resize()
        setMapReady(map)

        if (WORLD_VIEW === "globe") {
          rotationFrameRef.current = window.requestAnimationFrame(rotate)
        }
      })

      map.on("error", () => {
        fallBackToStaticMap(map)
      })
    } catch (error) {
      console.error(error)
      fallBackToStaticMap(mapRef.current)
    }

    return () => {
      disposed = true
      stopRotation()
      canvasListeners.forEach(({ type, listener }) => {
        mapRef.current?.getCanvas().removeEventListener(type, listener)
      })
      markers.forEach((marker) => marker.remove())
      markers.clear()
      mapRef.current?.remove()
      mapRef.current = null
      setMapReady(null)
    }
  }, [shouldUseFallback])

  useEffect(() => {
    const map = mapReady

    if (!map) {
      return
    }

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    WORLD_STAGE_CITIES.forEach((city) => {
      const marker = new maplibregl.Marker({
        element: createCityMarker({
          city,
          active: city.id === activeCityId,
          meetupCount: meetupCounts[city.id] ?? 0,
          onActiveCityChange: setActiveCityId,
          onCitySelect: (selectedCity) => router.push(selectedCity.href),
        }),
        anchor: "bottom",
        offset: [city.signDx ?? 0, city.signDy ?? 0],
      })
        .setLngLat(markerPositionForView(city))
        .addTo(map)

      markersRef.current.set(city.id, marker)
    })
  }, [activeCityId, mapReady, meetupCounts, router])

  if (shouldUseFallback) {
    return <WorldMapSelect />
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[#123a9b] text-[#1a1a2e]">
      <audio
        ref={audioRef}
        src="/audio/sf-ai-startup-map-theme.mp3"
        loop
        preload="none"
        onPause={() => setIsSoundOn(false)}
        onPlay={() => setIsSoundOn(true)}
      />
      <div className="absolute inset-0">
        <div
          ref={containerRef}
          className="h-full w-full bg-[#123a9b] [image-rendering:pixelated]"
        />
      </div>

      <header className="pointer-events-none absolute top-0 right-0 left-0 z-30 flex items-start gap-3 p-4 sm:p-6">
        <div className="pointer-events-auto flex min-w-0 items-center gap-3 border-2 border-[#1a1a2e] bg-white px-3 py-2 shadow-[4px_4px_0_#1a1a2e]">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
            aria-label="AI Startup Quest home"
          >
            <Image
              src="/brand-mark.png"
              alt=""
              width={30}
              height={30}
              className="shrink-0"
              priority
            />
            <span className="hidden truncate font-(family-name:--font-pixel) text-[11px] leading-5 text-[#1a1a2e] sm:block">
              AI Startup Quest
            </span>
          </Link>
          <button
            type="button"
            onClick={toggleSound}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center border-2 border-[#1a1a2e] bg-[#fff7dd] text-[#1a1a2e] shadow-[2px_2px_0_#1a1a2e] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe66d] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
              isSoundOn && "bg-[#ffe66d]"
            )}
            aria-label={isSoundOn ? "Pause theme music" : "Play theme music"}
            aria-pressed={isSoundOn}
          >
            {isSoundOn ? (
              <Volume2
                className="size-5"
                aria-hidden="true"
                strokeWidth={2.4}
              />
            ) : (
              <VolumeX
                className="size-5"
                aria-hidden="true"
                strokeWidth={2.4}
              />
            )}
          </button>
        </div>
      </header>

      <div className="pointer-events-none absolute right-4 bottom-4 z-30 max-w-[min(360px,calc(100vw-32px))] border-2 border-[#1a1a2e] bg-white px-4 py-3 shadow-[4px_4px_0_#4ecdc4] sm:right-6 sm:bottom-6">
        <div className="font-(family-name:--font-pixel) text-[13px] leading-5 text-[#1a1a2e]">
          {activeCity.name}
        </div>
        <div className="mt-1 truncate text-xs text-[#1a1a2e]/65">
          {activeCity.region} / {activeCity.tagline}
        </div>
      </div>
    </main>
  )
}
