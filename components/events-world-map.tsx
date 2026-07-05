"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import maplibregl, {
  type Map as MapLibreMap,
  type Marker,
  type StyleSpecification,
} from "maplibre-gl"

import cursorCommunityEvents from "@/lib/data/cursor-community-events.json"
import { cn } from "@/lib/utils"
import { artLatitude, GLOBE_CAMERA, WORLD_ART_STYLE } from "@/lib/world-art-map"

type WorldView = "mercator" | "globe"

type CursorCommunityCity = {
  name: string
  lat: number
  lon: number
}

type CursorCommunityEvent = {
  id: string
  title: string
  city: string
  date: string
  url: string
}

type CityWithEvents = CursorCommunityCity & {
  events: CursorCommunityEvent[]
}

const IDLE_ROTATION_DEGREES_PER_FRAME = 0.015

/**
 * Softened rendering of the shared artwork for this page: linear
 * resampling smooths the chunky pixels and negative saturation/contrast
 * tone down the heavy greens without touching the source image.
 */
const EVENTS_ART_STYLE: StyleSpecification = {
  ...WORLD_ART_STYLE,
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#2b5590",
      },
    },
    {
      id: "world",
      type: "raster",
      source: "world",
      paint: {
        "raster-fade-duration": 0,
        "raster-resampling": "linear",
        "raster-saturation": -0.35,
        "raster-contrast": -0.08,
      },
    },
  ],
}

/**
 * Unlike the stage-select page, events span both hemispheres, so the flat
 * view centers near the equator and zooms out enough to show every pin.
 */
const EVENTS_FLAT_CAMERA = {
  center: [5, 14] as [number, number],
  zoom: 1.34,
  minZoom: 1.2,
}

const TODAY = new Date().toISOString().slice(0, 10)

function getUpcomingCities(): CityWithEvents[] {
  const eventsByCity = new Map<string, CursorCommunityEvent[]>()

  ;(cursorCommunityEvents.events as CursorCommunityEvent[]).forEach((event) => {
    if (event.date < TODAY) {
      return
    }

    const cityEvents = eventsByCity.get(event.city) ?? []
    cityEvents.push(event)
    eventsByCity.set(event.city, cityEvents)
  })

  eventsByCity.forEach((events) => {
    events.sort((a, b) => a.date.localeCompare(b.date))
  })

  return (cursorCommunityEvents.cities as CursorCommunityCity[])
    .map((city) => ({
      ...city,
      events: eventsByCity.get(city.name) ?? [],
    }))
    .filter((city) => city.events.length >= 1)
}

function createEventCityMarker({
  city,
  onSelectCity,
}: {
  city: CityWithEvents
  onSelectCity: (cityName: string) => void
}) {
  const button = document.createElement("button")
  button.type = "button"
  button.setAttribute("aria-label", `Show Cursor events in ${city.name}`)
  button.style.display = "flex"
  button.style.flexDirection = "column"
  button.style.alignItems = "center"
  button.style.width = "36px"
  button.style.padding = "0"
  button.style.border = "0"
  button.style.background = "transparent"
  button.style.cursor = "pointer"

  const indicator = document.createElement("span")
  indicator.style.display = "flex"
  indicator.style.flexDirection = "column"
  indicator.style.alignItems = "center"
  indicator.style.pointerEvents = "none"

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

  const plaque = document.createElement("span")
  plaque.textContent = String(city.events.length)
  plaque.style.marginTop = "3px"
  plaque.style.background = "#95602f"
  plaque.style.border = "2px solid #342414"
  plaque.style.boxShadow = "2px 2px 0 #342414"
  plaque.style.color = "#fff4ce"
  plaque.style.fontFamily = "var(--font-pixel)"
  plaque.style.fontSize = "8px"
  plaque.style.lineHeight = "1"
  plaque.style.padding = "1px 4px"
  plaque.style.boxSizing = "border-box"
  plaque.style.pointerEvents = "none"

  indicator.append(bar, gap, dot)
  button.append(indicator, plaque)
  button.addEventListener("click", () => onSelectCity(city.name))

  return button
}

export function EventsWorldMap() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Marker[]>([])
  const rotationFrameRef = useRef<number | null>(null)
  const rotationStoppedByUserRef = useRef(false)
  const viewRef = useRef<WorldView>("mercator")
  const [mapReady, setMapReady] = useState<MapLibreMap | null>(null)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [view, setView] = useState<WorldView>("mercator")
  const upcomingCities = useMemo(() => getUpcomingCities(), [])
  const selectedCityEvents = selectedCity
    ? (upcomingCities.find((city) => city.name === selectedCity)?.events ?? [])
    : []
  const totalUpcomingEvents = upcomingCities.reduce(
    (total, city) => total + city.events.length,
    0
  )

  useEffect(() => {
    viewRef.current = view
  }, [view])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return
    }

    let disposed = false
    const canvasListeners: Array<{
      type: keyof HTMLElementEventMap
      listener: EventListener
    }> = []

    const stopRotation = () => {
      if (rotationFrameRef.current !== null) {
        window.cancelAnimationFrame(rotationFrameRef.current)
        rotationFrameRef.current = null
      }
    }

    const stopRotationPermanently = () => {
      rotationStoppedByUserRef.current = true
      stopRotation()
    }

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          ...EVENTS_ART_STYLE,
          projection: { type: "mercator" },
        },
        center: EVENTS_FLAT_CAMERA.center,
        zoom: EVENTS_FLAT_CAMERA.zoom,
        minZoom: EVENTS_FLAT_CAMERA.minZoom,
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
        canvas.addEventListener(type, stopRotationPermanently, { once: true })
        canvasListeners.push({ type, listener: stopRotationPermanently })
      })

      map.once("load", () => {
        if (disposed) {
          return
        }

        map.resize()
        setMapReady(map)
      })

      map.on("error", (error) => {
        console.error(error)
      })
    } catch (error) {
      console.error(error)
    }

    return () => {
      disposed = true
      stopRotation()
      const map = mapRef.current
      canvasListeners.forEach(({ type, listener }) => {
        map?.getCanvas().removeEventListener(type, listener)
      })
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map?.remove()
      mapRef.current = null
      setMapReady(null)
    }
  }, [])

  useEffect(() => {
    const map = mapReady

    if (!map) {
      return
    }

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = upcomingCities.map((city) =>
      new maplibregl.Marker({
        element: createEventCityMarker({
          city,
          onSelectCity: setSelectedCity,
        }),
        anchor: "bottom",
        opacityWhenCovered: "0",
      })
        .setLngLat([city.lon, artLatitude(city.lat)])
        .addTo(map)
    )

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
    }
  }, [mapReady, upcomingCities])

  const switchView = (nextView: WorldView) => {
    const map = mapRef.current

    if (!map || view === nextView) {
      return
    }

    if (rotationFrameRef.current !== null) {
      window.cancelAnimationFrame(rotationFrameRef.current)
      rotationFrameRef.current = null
    }

    const camera = nextView === "globe" ? GLOBE_CAMERA : EVENTS_FLAT_CAMERA

    viewRef.current = nextView
    setView(nextView)
    map.setProjection({ type: nextView })
    map.setMinZoom(camera.minZoom)
    map.easeTo({
      center: camera.center,
      zoom: camera.zoom,
      duration: 700,
    })

    if (nextView === "globe" && !rotationStoppedByUserRef.current) {
      rotationFrameRef.current = window.requestAnimationFrame(() => {
        const currentMap = mapRef.current

        if (
          !currentMap ||
          viewRef.current !== "globe" ||
          rotationStoppedByUserRef.current
        ) {
          rotationFrameRef.current = null
          return
        }

        const center = currentMap.getCenter()
        currentMap.jumpTo({
          center: [center.lng + IDLE_ROTATION_DEGREES_PER_FRAME, center.lat],
        })
        rotationFrameRef.current = window.requestAnimationFrame(
          function rotate() {
            const rotatingMap = mapRef.current

            if (
              !rotatingMap ||
              viewRef.current !== "globe" ||
              rotationStoppedByUserRef.current
            ) {
              rotationFrameRef.current = null
              return
            }

            const nextCenter = rotatingMap.getCenter()
            rotatingMap.jumpTo({
              center: [
                nextCenter.lng + IDLE_ROTATION_DEGREES_PER_FRAME,
                nextCenter.lat,
              ],
            })
            rotationFrameRef.current = window.requestAnimationFrame(rotate)
          }
        )
      })
    }
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[#123a9b] text-[#1a1a2e]">
      <div className="absolute inset-0">
        <div
          ref={containerRef}
          className="h-full w-full bg-[#123a9b] [image-rendering:pixelated]"
        />
      </div>

      <header className="pointer-events-none absolute top-0 left-0 z-30 p-4 sm:p-6">
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
          <span className="border-2 border-[#1a1a2e] bg-[#ffe66d] px-2 py-1 font-(family-name:--font-pixel) text-[8px] leading-4 text-[#1a1a2e]">
            EVENTS
          </span>
        </div>
      </header>

      <div className="pointer-events-none absolute top-4 right-0 left-0 z-30 flex justify-center px-4 sm:top-6">
        <div className="pointer-events-auto flex shadow-[3px_3px_0_#1a1a2e]">
          <button
            type="button"
            onClick={() => switchView("mercator")}
            className={cn(
              "border-2 border-[#1a1a2e] px-4 py-2 font-(family-name:--font-pixel) text-[9px] leading-4 text-[#1a1a2e] transition-colors",
              view === "mercator" ? "bg-[#ffe66d]" : "bg-white"
            )}
            aria-pressed={view === "mercator"}
          >
            MAP
          </button>
          <button
            type="button"
            onClick={() => switchView("globe")}
            className={cn(
              "-ml-0.5 border-2 border-[#1a1a2e] px-4 py-2 font-(family-name:--font-pixel) text-[9px] leading-4 text-[#1a1a2e] transition-colors",
              view === "globe" ? "bg-[#ffe66d]" : "bg-white"
            )}
            aria-pressed={view === "globe"}
          >
            GLOBE
          </button>
        </div>
      </div>

      <section className="pointer-events-none absolute bottom-4 left-4 z-30 max-w-[min(400px,calc(100vw-32px))] sm:bottom-6 sm:left-6">
        {selectedCity ? (
          <div className="pointer-events-auto max-h-[40vh] overflow-y-auto border-2 border-[#1a1a2e] bg-white p-4 shadow-[4px_4px_0_#1a1a2e]">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-(family-name:--font-pixel) text-[13px] leading-5 text-[#1a1a2e]">
                {selectedCity}
              </h1>
              <button
                type="button"
                onClick={() => setSelectedCity(null)}
                className="flex size-7 shrink-0 items-center justify-center border-2 border-[#1a1a2e] bg-white font-(family-name:--font-pixel) text-[10px] text-[#1a1a2e] shadow-[2px_2px_0_#1a1a2e]"
                aria-label="Close selected city"
              >
                X
              </button>
            </div>
            <div className="mt-3 grid gap-3">
              {selectedCityEvents.map((event) => (
                <article
                  key={event.id}
                  className="grid gap-2 border-2 border-[#1a1a2e] bg-[#fff7dd] p-3 sm:grid-cols-[48px_1fr_auto] sm:items-center"
                >
                  <time
                    dateTime={event.date}
                    className="font-(family-name:--font-pixel) text-[9px] leading-4 text-[#95602f]"
                  >
                    {format(new Date(`${event.date}T00:00:00`), "MMM d")}
                  </time>
                  <h2 className="text-sm leading-5 font-bold text-[#1a1a2e]">
                    {event.title}
                  </h2>
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noreferrer"
                    className="justify-self-start border-2 border-[#1a1a2e] bg-[#4ecdc4] px-2 py-1 text-xs font-bold text-[#1a1a2e] shadow-[2px_2px_0_#1a1a2e] sm:justify-self-end"
                  >
                    Register ↗
                  </a>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="pointer-events-auto border-2 border-[#1a1a2e] bg-white px-4 py-3 text-xs font-bold text-[#1a1a2e] shadow-[4px_4px_0_#1a1a2e]">
            {totalUpcomingEvents} upcoming events in {upcomingCities.length}{" "}
            cities - tap a pin
          </div>
        )}
      </section>
    </main>
  )
}
