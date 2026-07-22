"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import type { Map as MapLibreMap } from "maplibre-gl"

import { track } from "@/lib/analytics"
import type { CityWithEvents, EventCity } from "@/lib/events"
import { parseHomeMapView, type HomeMapView } from "@/lib/home-map-url"
import {
  GLOBE_THEME_AUDIO_SRC,
  useThemeAudio,
} from "@/hooks/use-theme-audio"
import { applyHomeMapView } from "@/components/home-events/apply-home-map-view"
import { HomeMapControls } from "@/components/home-events/home-map-controls"
import { HomeMapGuildShell } from "@/components/home-events/home-map-guild-shell"
import { HomeMapStyles } from "@/components/home-events/home-map-styles"
import { HomeMapViewToggle } from "@/components/home-events/home-map-view-toggle"
import { SelectedCityPanel } from "@/components/home-events/selected-city-panel"
import { useHomeEventFilters } from "@/components/home-events/use-home-event-filters"
import { useHomeMapLocate } from "@/components/home-events/use-home-map-locate"
import { useHomeMapUrlSync } from "@/components/home-events/use-home-map-url-sync"
import { useHomeWorldMap } from "@/components/home-events/use-home-world-map"
import { useIdleGlobeRotation } from "@/components/home-events/use-idle-globe-rotation"
import { SpaceBackdrop } from "@/components/space-backdrop"

type WorldView = HomeMapView

type HomeEventsMapProps = {
  upcomingCities: CityWithEvents[]
}

export function HomeEventsMap({ upcomingCities }: HomeEventsMapProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const viewRef = useRef<WorldView>(parseHomeMapView(searchParams.get("view")))
  const [view, setView] = useState<WorldView>(() =>
    parseHomeMapView(searchParams.get("view"))
  )
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [boardOpen, setBoardOpen] = useState(false)
  const { isAudioMuted, toggleMute } = useThemeAudio({
    src: GLOBE_THEME_AUDIO_SRC,
  })
  const { startIdleRotation, stopIdleRotation, rotationStoppedByUserRef } =
    useIdleGlobeRotation(mapRef, viewRef)
  const { query, setQuery, allEvents, filteredEvents, filteredCities } =
    useHomeEventFilters(upcomingCities)

  const selectedCityEvents = useMemo(
    () =>
      selectedCity
        ? (upcomingCities.find((city) => city.name === selectedCity)?.events ??
          [])
        : [],
    [selectedCity, upcomingCities]
  )

  const selectCity = useCallback((city: EventCity) => {
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

  const { userLocationStatus, handleLocateUser } = useHomeMapLocate({
    mapReady,
    mapRef,
    view,
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

  const switchView = (nextView: WorldView) => {
    const map = mapRef.current

    if (!map || view === nextView) {
      return
    }

    stopIdleRotation()
    track("map_view_toggle", { view: nextView })
    viewRef.current = nextView
    setView(nextView)
    applyHomeMapView(map, nextView, { defaultCamera: "ease" })

    if (nextView === "globe") {
      startIdleRotation()
    }
  }

  useEffect(() => {
    viewRef.current = view
  }, [view])

  return (
    <main className="relative h-dvh overflow-hidden bg-[#0a0a1f] text-[#1a1a2e]">
      {/* MapLibre overrides the container's position, so size comes from a wrapper.
          Isolate stacking so marker z-index (e.g. player at 40) cannot paint above
          the guild board and other chrome (z-30+). */}
      <div className="absolute inset-0 isolate z-0">
        {view === "globe" ? <SpaceBackdrop /> : null}
        <div ref={containerRef} className="h-full w-full" />
      </div>

      <HomeMapGuildShell
        upcomingCities={upcomingCities}
        allEventCount={allEvents.length}
        filteredEvents={filteredEvents}
        query={query}
        onQueryChange={setQuery}
        selectedCity={selectedCity}
        onSelectCity={selectCity}
        boardOpen={boardOpen}
        onToggleBoard={() => setBoardOpen((open) => !open)}
      />

      <HomeMapControls
        isAudioMuted={isAudioMuted}
        onToggleMute={toggleMute}
        userLocationStatus={userLocationStatus}
        onLocateUser={handleLocateUser}
      />

      <HomeMapViewToggle view={view} onSwitchView={switchView} />

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

      <HomeMapStyles />
    </main>
  )
}
