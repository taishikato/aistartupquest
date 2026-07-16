"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import type { Map as MapLibreMap } from "maplibre-gl"

import { applyHomeMapView } from "@/components/home-events/apply-home-map-view"
import {
  filterCitiesByEvents,
  filterEventsByQuery,
  flattenUpcomingEvents,
} from "@/components/home-events/filter-events"
import {
  GuildBoardHeader,
  GuildBoardList,
} from "@/components/home-events/guild-board"
import { SelectedCityPanel } from "@/components/home-events/selected-city-panel"
import { useHomeMapUrlSync } from "@/components/home-events/use-home-map-url-sync"
import { useHomeWorldMap } from "@/components/home-events/use-home-world-map"
import { useIdleGlobeRotation } from "@/components/home-events/use-idle-globe-rotation"
import { QuestHeraldSignup } from "@/components/quest-herald-signup"
import { track } from "@/lib/analytics"
import {
  getUpcomingCities,
  type CursorCommunityCity,
} from "@/lib/cursor-community-events"
import { parseHomeMapView, type HomeMapView } from "@/lib/home-map-url"
import { cn } from "@/lib/utils"

type WorldView = HomeMapView

export function HomeEventsMap() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const viewRef = useRef<WorldView>(parseHomeMapView(searchParams.get("view")))
  const [view, setView] = useState<WorldView>(() =>
    parseHomeMapView(searchParams.get("view"))
  )
  const [query, setQuery] = useState("")
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [boardOpen, setBoardOpen] = useState(false)
  const { startIdleRotation, stopIdleRotation, rotationStoppedByUserRef } =
    useIdleGlobeRotation(mapRef, viewRef)

  const upcomingCities = useMemo(() => getUpcomingCities(), [])
  const allEvents = useMemo(
    () => flattenUpcomingEvents(upcomingCities),
    [upcomingCities]
  )
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filteredEvents = useMemo(
    () => filterEventsByQuery(allEvents, query),
    [allEvents, query]
  )
  const filteredCities = useMemo(
    () => filterCitiesByEvents(upcomingCities, filteredEvents),
    [filteredEvents, upcomingCities]
  )

  const selectedCityEvents = useMemo(
    () =>
      selectedCity
        ? (upcomingCities.find((city) => city.name === selectedCity)?.events ??
          [])
        : [],
    [selectedCity, upcomingCities]
  )

  const selectCity = useCallback((city: CursorCommunityCity) => {
    setSelectedCity(city.name)
    setBoardOpen(true)
    mapRef.current?.flyTo({
      center: [city.lon, city.lat],
      zoom: viewRef.current === "globe" ? 2.7 : 3,
      duration: 900,
    })
  }, [])

  const mapReady = useHomeWorldMap({
    containerRef,
    mapRef,
    filteredCities,
    selectedCity,
    selectCity,
    stopIdleRotation,
    rotationStoppedByUserRef,
  })

  useHomeMapUrlSync({
    mapReady,
    mapRef,
    viewRef,
    pathname,
    searchParams,
    selectedCity,
    view,
    upcomingCities,
    setView,
    selectCity,
    startIdleRotation,
    stopIdleRotation,
  })

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      track("event_search", {
        query: normalizedQuery,
        result_count: filteredEvents.length,
      })
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [normalizedQuery, filteredEvents.length])

  const switchView = (nextView: WorldView) => {
    const map = mapRef.current

    if (!map || view === nextView) {
      return
    }

    stopIdleRotation()
    track("map_view_toggle", { view: nextView })
    viewRef.current = nextView
    setView(nextView)
    applyHomeMapView(map, nextView, { easeToDefaultCamera: true })

    if (nextView === "globe") {
      startIdleRotation()
    }
  }

  useEffect(() => {
    viewRef.current = view
  }, [view])

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

      {/* Mobile: quest herald above guild board toggle */}
      {!boardOpen ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 z-30 flex justify-center px-3 md:hidden">
          <QuestHeraldSignup source="home_map_footer_mobile" />
        </div>
      ) : null}

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

      {/* Desktop quest herald footer */}
      {!selectedCity ? (
        <div className="pointer-events-none absolute bottom-6 left-[calc(min(380px,calc(100vw-24px))+1rem)] z-30 hidden md:block">
          <QuestHeraldSignup source="home_map_footer" />
        </div>
      ) : null}

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

      {selectedCity ? (
        <SelectedCityPanel
          selectedCity={selectedCity}
          events={selectedCityEvents}
          onClose={() => setSelectedCity(null)}
        />
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
