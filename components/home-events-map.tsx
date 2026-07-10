"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl"

import cursorCommunityEvents from "@/lib/data/cursor-community-events.json"
import { cn } from "@/lib/utils"
import { GLOBE_CAMERA } from "@/lib/world-art-map"
import {
  applyRpgAtlasPaint,
  loadWorldAtlasStyle,
} from "@/lib/world-atlas-style"
import {
  WORLD_STAGE_CITIES,
  type WorldStageCity,
} from "@/lib/world-stage-cities"

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

const FLAT_CAMERA = {
  center: [5, 14] as [number, number],
  zoom: 1.34,
  minZoom: 1.2,
}

const IDLE_ROTATION_DEGREES_PER_FRAME = 0.015
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
  active,
  onSelectCity,
}: {
  city: CityWithEvents
  active: boolean
  onSelectCity: (city: CityWithEvents) => void
}) {
  const button = document.createElement("button")
  button.type = "button"
  button.className = active
    ? "quest-event-marker is-active"
    : "quest-event-marker"
  button.setAttribute("aria-label", `Show Cursor events in ${city.name}`)
  button.style.display = "block"
  button.style.position = "relative"
  button.style.width = "42px"
  button.style.height = "42px"
  button.style.padding = "0"
  button.style.border = "0"
  button.style.background = "transparent"
  button.style.cursor = "pointer"
  button.style.transformOrigin = "50% 100%"
  button.style.zIndex = active ? "20" : "1"

  // Bounce animates this wrapper so it does not fight the active scale transform.
  const body = document.createElement("span")
  body.className = "quest-event-marker__body"
  body.style.display = "block"
  body.style.position = "relative"
  body.style.width = "42px"
  body.style.height = "42px"
  body.style.pointerEvents = "none"

  const image = document.createElement("img")
  image.src = "/map-assets/quest-marker.png"
  image.alt = ""
  image.draggable = false
  image.style.display = "block"
  image.style.width = "42px"
  image.style.height = "42px"

  const count = document.createElement("span")
  count.textContent = String(city.events.length)
  count.style.position = "absolute"
  // Parchment sits in the middle ~50% of the art, slightly below vertical center.
  count.style.top = "56%"
  count.style.left = "50%"
  count.style.transform = "translate(-50%, -50%)"
  count.style.color = "#5a3d1e"
  count.style.fontFamily = "var(--font-pixel)"
  count.style.fontSize = "10px"
  count.style.lineHeight = "1"
  count.style.pointerEvents = "none"

  body.append(image, count)
  button.append(body)
  button.addEventListener("click", () => onSelectCity(city))

  return button
}

function createCityMarker(city: WorldStageCity) {
  const anchor = document.createElement("a")
  anchor.href = city.href
  anchor.setAttribute("aria-label", `Open ${city.name} AI Startup Map`)
  anchor.style.display = "block"
  anchor.style.width = "70px"
  anchor.style.height = "70px"
  anchor.style.transformOrigin = "50% 70%"
  anchor.style.filter = "drop-shadow(0 5px 8px rgba(0, 0, 0, 0.35))"

  const markerBody = document.createElement("span")
  markerBody.style.position = "absolute"
  markerBody.style.inset = "0"

  const image = document.createElement("img")
  image.src = "/map-assets/city-sign-marker.png"
  image.alt = ""
  image.draggable = false
  image.style.position = "absolute"
  image.style.inset = "0"
  image.style.width = "70px"
  image.style.height = "68px"
  image.style.objectFit = "contain"

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
  anchor.append(markerBody)
  return anchor
}

export function HomeEventsMap() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const eventMarkersRef = useRef<Marker[]>([])
  const cityMarkersRef = useRef<Marker[]>([])
  const rotationFrameRef = useRef<number | null>(null)
  const rotationStoppedByUserRef = useRef(false)
  const viewRef = useRef<WorldView>("mercator")
  const [mapReady, setMapReady] = useState<MapLibreMap | null>(null)
  const [view, setView] = useState<WorldView>("mercator")
  const [query, setQuery] = useState("")
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [boardOpen, setBoardOpen] = useState(false)

  const upcomingCities = useMemo(() => getUpcomingCities(), [])
  const allEvents = useMemo(
    () =>
      upcomingCities
        .flatMap((city) => city.events)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [upcomingCities]
  )
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filteredEvents = useMemo(
    () =>
      allEvents.filter(
        (event) =>
          !normalizedQuery ||
          event.title.toLocaleLowerCase().includes(normalizedQuery) ||
          event.city.toLocaleLowerCase().includes(normalizedQuery)
      ),
    [allEvents, normalizedQuery]
  )
  const filteredCities = useMemo(() => {
    const eventIds = new Set(filteredEvents.map((event) => event.id))

    return upcomingCities
      .map((city) => ({
        ...city,
        events: city.events.filter((event) => eventIds.has(event.id)),
      }))
      .filter((city) => city.events.length > 0)
  }, [filteredEvents, upcomingCities])

  const selectedCityEvents = selectedCity
    ? (upcomingCities.find((city) => city.name === selectedCity)?.events ?? [])
    : []

  const stopIdleRotation = useCallback(() => {
    if (rotationFrameRef.current !== null) {
      window.cancelAnimationFrame(rotationFrameRef.current)
      rotationFrameRef.current = null
    }
  }, [])

  const startIdleRotation = useCallback(() => {
    stopIdleRotation()

    if (rotationStoppedByUserRef.current || viewRef.current !== "globe") {
      return
    }

    rotationFrameRef.current = window.requestAnimationFrame(function rotate() {
      const rotatingMap = mapRef.current

      if (
        !rotatingMap ||
        viewRef.current !== "globe" ||
        rotationStoppedByUserRef.current
      ) {
        rotationFrameRef.current = null
        return
      }

      const center = rotatingMap.getCenter()
      rotatingMap.jumpTo({
        center: [center.lng + IDLE_ROTATION_DEGREES_PER_FRAME, center.lat],
      })
      rotationFrameRef.current = window.requestAnimationFrame(rotate)
    })
  }, [stopIdleRotation])

  const selectCity = useCallback((city: CursorCommunityCity) => {
    setSelectedCity(city.name)
    setBoardOpen(true)
    mapRef.current?.flyTo({
      center: [city.lon, city.lat],
      zoom: viewRef.current === "globe" ? 2.7 : 3,
      duration: 900,
    })
  }, [])

  const switchView = (nextView: WorldView) => {
    const map = mapRef.current

    if (!map || view === nextView) {
      return
    }

    stopIdleRotation()

    const camera = nextView === "globe" ? GLOBE_CAMERA : FLAT_CAMERA

    viewRef.current = nextView
    setView(nextView)
    map.setProjection({ type: nextView })
    map.setRenderWorldCopies(nextView === "mercator")
    map.dragRotate.disable()
    map.setMinZoom(camera.minZoom)
    map.easeTo({
      center: camera.center,
      zoom: camera.zoom,
      duration: 700,
    })

    if (nextView === "globe") {
      startIdleRotation()
    }
  }

  useEffect(() => {
    viewRef.current = view
  }, [view])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return
    }

    const controller = new AbortController()
    let disposed = false
    let sidebarPaddingCleanup: (() => void) | null = null
    const canvasListeners: Array<{
      type: keyof HTMLElementEventMap
      listener: EventListener
    }> = []

    const stopRotationPermanently = () => {
      rotationStoppedByUserRef.current = true
      stopIdleRotation()
    }

    loadWorldAtlasStyle(controller.signal)
      .then((style) => {
        if (disposed || !containerRef.current || mapRef.current) {
          return
        }

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: {
            ...style,
            projection: { type: "mercator" },
          },
          center: FLAT_CAMERA.center,
          zoom: FLAT_CAMERA.zoom,
          minZoom: FLAT_CAMERA.minZoom,
          maxZoom: 5.5,
          minPitch: 0,
          maxPitch: 0,
          attributionControl: false,
          renderWorldCopies: true,
          dragRotate: false,
          touchPitch: false,
        })

        mapRef.current = map

        // Keep camera center in the visible area beside the fixed sidebar.
        const sidebarMediaQuery = window.matchMedia("(min-width: 768px)")
        const syncSidebarPadding = () => {
          map.setPadding({
            left: sidebarMediaQuery.matches ? 380 : 0,
            top: 0,
            right: 0,
            bottom: 0,
          })
        }
        syncSidebarPadding()
        sidebarMediaQuery.addEventListener("change", syncSidebarPadding)
        sidebarPaddingCleanup = () => {
          sidebarMediaQuery.removeEventListener("change", syncSidebarPadding)
        }

        const canvas = map.getCanvas()
        ;(["pointerdown", "wheel", "touchstart"] as const).forEach((type) => {
          canvas.addEventListener(type, stopRotationPermanently, { once: true })
          canvasListeners.push({ type, listener: stopRotationPermanently })
        })

        map.once("load", () => {
          if (disposed) {
            return
          }

          applyRpgAtlasPaint(map)
          map.resize()
          setMapReady(map)
        })

        map.on("error", (error) => {
          console.error(error)
        })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        console.error(error)
      })

    return () => {
      disposed = true
      controller.abort()
      stopIdleRotation()
      sidebarPaddingCleanup?.()
      canvasListeners.forEach(({ type, listener }) => {
        mapRef.current?.getCanvas().removeEventListener(type, listener)
      })
      eventMarkersRef.current.forEach((marker) => marker.remove())
      cityMarkersRef.current.forEach((marker) => marker.remove())
      eventMarkersRef.current = []
      cityMarkersRef.current = []
      mapRef.current?.remove()
      mapRef.current = null
      setMapReady(null)
    }
  }, [stopIdleRotation])

  useEffect(() => {
    if (!mapReady) {
      return
    }

    cityMarkersRef.current.forEach((marker) => marker.remove())
    cityMarkersRef.current = WORLD_STAGE_CITIES.map((city) =>
      new maplibregl.Marker({
        element: createCityMarker(city),
        anchor: "bottom",
        opacityWhenCovered: "0",
      })
        .setLngLat([city.lon, city.lat])
        .addTo(mapReady)
    )

    return () => {
      cityMarkersRef.current.forEach((marker) => marker.remove())
      cityMarkersRef.current = []
    }
  }, [mapReady])

  useEffect(() => {
    if (!mapReady) {
      return
    }

    eventMarkersRef.current.forEach((marker) => marker.remove())
    eventMarkersRef.current = filteredCities.map((city) =>
      new maplibregl.Marker({
        element: createEventCityMarker({
          city,
          active: city.name === selectedCity,
          onSelectCity: selectCity,
        }),
        anchor: "bottom",
        opacityWhenCovered: "0",
      })
        .setLngLat([city.lon, city.lat])
        .addTo(mapReady)
    )

    return () => {
      eventMarkersRef.current.forEach((marker) => marker.remove())
      eventMarkersRef.current = []
    }
  }, [filteredCities, mapReady, selectCity, selectedCity])

  return (
    <main className="relative h-dvh overflow-hidden bg-[#151527] text-[#1a1a2e]">
      {/* MapLibre overrides the container's position, so size comes from a wrapper. */}
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* Desktop guild notice board */}
      <aside
        className={cn(
          "absolute top-0 bottom-0 left-0 z-30 hidden w-[min(380px,calc(100vw-24px))] flex-col border-r-[3px] border-[#1a1a2e] bg-[#23233b] shadow-[4px_0_0_#1a1a2e] md:flex"
        )}
      >
        <GuildBoardHeader
          eventCount={allEvents.length}
          cityCount={upcomingCities.length}
          query={query}
          onQueryChange={setQuery}
        />
        <GuildBoardList
          events={filteredEvents}
          upcomingCities={upcomingCities}
          selectedCity={selectedCity}
          onSelectCity={selectCity}
        />
      </aside>

      {/* Mobile board toggle + bottom sheet */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 md:hidden">
        <div className="pointer-events-auto flex justify-center p-3">
          <button
            type="button"
            onClick={() => setBoardOpen((open) => !open)}
            className="border-2 border-[#1a1a2e] bg-[#ead9ab] px-4 py-2 font-(family-name:--font-pixel) text-[9px] leading-4 text-[#1a1a2e] shadow-[3px_3px_0_#1a1a2e]"
            aria-expanded={boardOpen}
          >
            {boardOpen ? "Close board" : "Guild board"}
          </button>
        </div>
        {boardOpen ? (
          <div className="pointer-events-auto flex max-h-[55vh] flex-col border-t-[3px] border-[#1a1a2e] bg-[#23233b] shadow-[0_-4px_0_#1a1a2e]">
            <GuildBoardHeader
              eventCount={allEvents.length}
              cityCount={upcomingCities.length}
              query={query}
              onQueryChange={setQuery}
            />
            <GuildBoardList
              events={filteredEvents}
              upcomingCities={upcomingCities}
              selectedCity={selectedCity}
              onSelectCity={selectCity}
            />
          </div>
        ) : null}
      </div>

      {/* Compact city nav */}
      <div className="pointer-events-none absolute top-4 right-4 z-30 flex flex-col items-end gap-3 md:top-6 md:right-6">
        <nav
          className="pointer-events-auto flex flex-wrap justify-end gap-1 border-2 border-[#1a1a2e] bg-white p-1 shadow-[3px_3px_0_#1a1a2e]"
          aria-label="City maps"
        >
          {WORLD_STAGE_CITIES.map((city) => (
            <Link
              key={city.id}
              href={city.href}
              className="border-2 border-[#1a1a2e] bg-[#ffe66d] px-2 py-1 font-(family-name:--font-pixel) text-[8px] leading-4 text-[#1a1a2e]"
            >
              {city.code}
            </Link>
          ))}
        </nav>
      </div>

      {/* MAP / GLOBE toggle */}
      <div className="pointer-events-none absolute top-4 right-0 left-0 z-30 flex justify-center px-4 md:top-6 md:left-[min(380px,calc(100vw-24px))]">
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

      {/* Selected city panel (desktop map area) */}
      {selectedCity ? (
        <section className="pointer-events-none absolute right-4 bottom-12 z-30 hidden max-w-[min(360px,calc(100vw-32px))] md:right-auto md:bottom-6 md:left-[calc(min(380px,calc(100vw-24px))+1.5rem)] md:block">
          <div className="pointer-events-auto max-h-[40vh] overflow-y-auto border-2 border-[#1a1a2e] bg-white p-4 shadow-[4px_4px_0_#1a1a2e]">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-(family-name:--font-pixel) text-[13px] leading-5 text-[#1a1a2e]">
                {selectedCity}
              </h2>
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
                  className="grid gap-2 border-2 border-[#1a1a2e] bg-[#fff7dd] p-3"
                >
                  <time
                    dateTime={event.date}
                    className="font-(family-name:--font-pixel) text-[9px] leading-4 text-[#95602f]"
                  >
                    {format(new Date(`${event.date}T00:00:00`), "MMM d")}
                  </time>
                  <h3 className="text-sm leading-5 font-bold text-[#1a1a2e]">
                    {event.title}
                  </h3>
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noreferrer"
                    className="justify-self-start border-2 border-[#1a1a2e] bg-[#4ecdc4] px-2 py-1 text-xs font-bold text-[#1a1a2e] shadow-[2px_2px_0_#1a1a2e]"
                  >
                    Register ↗
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="pointer-events-none absolute right-3 bottom-3 z-30 border border-[#1a1a2e] bg-white/85 px-1.5 text-[10px] leading-4 text-[#1a1a2e] sm:right-6 sm:bottom-6">
        (c) CARTO (c) OpenStreetMap
      </div>

      <style jsx global>{`
        @keyframes quest-marker-bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .quest-event-marker.is-active {
          transform: scale(1.2);
        }

        .quest-event-marker:hover .quest-event-marker__body,
        .quest-event-marker.is-active .quest-event-marker__body {
          animation: quest-marker-bounce 0.5s steps(2) infinite;
        }
      `}</style>
    </main>
  )
}

function GuildBoardHeader({
  eventCount,
  cityCount,
  query,
  onQueryChange,
}: {
  eventCount: number
  cityCount: number
  query: string
  onQueryChange: (value: string) => void
}) {
  return (
    <header className="shrink-0 border-b-[3px] border-[#1a1a2e] bg-[#ead9ab] p-4">
      <div className="flex items-center gap-3">
        <Image src="/brand-mark.png" alt="" width={38} height={38} priority />
        <h1 className="font-(family-name:--font-pixel) text-[11px] leading-5 text-[#1a1a2e]">
          AI Startup Quest
        </h1>
      </div>
      <p className="mt-3 font-(family-name:--font-pixel) text-[8px] leading-4 text-[#95602f]">
        {eventCount} upcoming events in {cityCount} cities
      </p>
      <label className="mt-3 block">
        <span className="sr-only">Search events or cities</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search events or cities"
          className="w-full border-2 border-[#1a1a2e] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#1a1a2e]/45 focus:shadow-[3px_3px_0_#4ecdc4]"
        />
      </label>
    </header>
  )
}

function GuildBoardList({
  events,
  upcomingCities,
  selectedCity,
  onSelectCity,
}: {
  events: CursorCommunityEvent[]
  upcomingCities: CityWithEvents[]
  selectedCity: string | null
  onSelectCity: (city: CursorCommunityCity) => void
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="grid gap-3">
        {events.map((event) => {
          const city = upcomingCities.find((item) => item.name === event.city)
          const active = selectedCity === event.city

          return (
            <article
              key={event.id}
              className={cn(
                "border-2 border-[#1a1a2e] bg-[#fff7dd] p-3 shadow-[3px_3px_0_#1a1a2e]",
                active && "bg-[#ffe66d] shadow-[3px_3px_0_#4ecdc4]"
              )}
            >
              <button
                type="button"
                onClick={() => city && onSelectCity(city)}
                className="block w-full text-left"
              >
                <time
                  dateTime={event.date}
                  className="font-(family-name:--font-pixel) text-[8px] leading-4 text-[#95602f]"
                >
                  {format(new Date(`${event.date}T00:00:00`), "MMM d")}
                </time>
                <h2 className="mt-1 text-sm leading-5 font-bold text-[#1a1a2e]">
                  {event.title}
                </h2>
                <p className="mt-1 text-xs font-bold text-[#95602f]">
                  {event.city}
                </p>
              </button>
              <a
                href={event.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block border-2 border-[#1a1a2e] bg-[#4ecdc4] px-2 py-1 text-xs font-bold text-[#1a1a2e] shadow-[2px_2px_0_#1a1a2e]"
              >
                Register ↗
              </a>
            </article>
          )
        })}
      </div>

      {events.length === 0 ? (
        <p className="border-2 border-[#1a1a2e] bg-[#fff7dd] p-4 text-sm font-bold text-[#1a1a2e] shadow-[3px_3px_0_#1a1a2e]">
          No matching quests found.
        </p>
      ) : null}
    </div>
  )
}
