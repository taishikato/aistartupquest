"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Crosshair, Volume2, VolumeX } from "lucide-react"
import type { Map as MapLibreMap } from "maplibre-gl"

import { track } from "@/lib/analytics"
import type { CityWithEvents, EventCity } from "@/lib/events"
import { parseHomeMapView, type HomeMapView } from "@/lib/home-map-url"
import { locateButtonLabel, type UserCoordinates } from "@/lib/user-location"
import { cn } from "@/lib/utils"
import { useUserLocation } from "@/hooks/use-user-location"
import { Button } from "@/components/ui/button"
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
import { useUserLocationMarker } from "@/components/map-markers/use-user-location-marker"
import { QuestHeraldSignup } from "@/components/quest-herald-signup"
import { SpaceBackdrop } from "@/components/space-backdrop"

// Home world maxZoom is 5.5; zoom in enough to read the player sprite.
const USER_LOCATION_ZOOM = 4.6

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
  const [query, setQuery] = useState("")
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [boardOpen, setBoardOpen] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const pendingFlyToUserRef = useRef(false)
  const { startIdleRotation, stopIdleRotation, rotationStoppedByUserRef } =
    useIdleGlobeRotation(mapRef, viewRef)
  const {
    status: userLocationStatus,
    coordinates: userCoordinates,
    requestLocation,
  } = useUserLocation()

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

  useUserLocationMarker({
    mapReady,
    coordinates: userCoordinates,
  })

  const flyToUser = useCallback(
    (coordinates: UserCoordinates) => {
      const map = mapRef.current
      if (!map) {
        return
      }

      rotationStoppedByUserRef.current = true
      stopIdleRotation()
      map.flyTo({
        center: [coordinates.lng, coordinates.lat],
        zoom: Math.max(map.getZoom(), USER_LOCATION_ZOOM),
        duration: 900,
        essential: true,
      })
    },
    [rotationStoppedByUserRef, stopIdleRotation]
  )

  useEffect(() => {
    if (!userCoordinates || !pendingFlyToUserRef.current) {
      return
    }

    pendingFlyToUserRef.current = false
    flyToUser(userCoordinates)
  }, [flyToUser, userCoordinates])

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

  useEffect(() => {
    const audio = new Audio("/audio/sf-ai-startup-map-theme.mp3")
    audio.loop = true
    audio.preload = "auto"
    audio.volume = 0.42
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

  const handleToggleMute = async () => {
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
  }

  const handleLocateUser = () => {
    if (userLocationStatus === "unsupported") {
      return
    }

    track("user_locate_click", {
      surface: "home_map",
      view,
      status: userLocationStatus,
    })

    // Zoom only happens from this control - never from auto-resume on visit.
    if (userCoordinates && userLocationStatus === "tracking") {
      flyToUser(userCoordinates)
      return
    }

    pendingFlyToUserRef.current = true
    if (userLocationStatus !== "requesting") {
      requestLocation()
    }
  }

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
    <main className="relative h-dvh overflow-hidden bg-[#0a0a1f] text-[#1a1a2e]">
      {/* MapLibre overrides the container's position, so size comes from a wrapper. */}
      <div className="absolute inset-0">
        {/* Transparent map background reveals space sprites around the globe. */}
        {view === "globe" ? <SpaceBackdrop /> : null}
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

      {/* Mute + locate (theme audio shared with city maps) */}
      <div className="pointer-events-none absolute top-4 left-4 z-30 flex items-center gap-2 md:top-6 md:left-[calc(min(380px,calc(100vw-24px))+1rem)]">
        <Button
          type="button"
          onClick={handleToggleMute}
          aria-label={isAudioMuted ? "Unmute audio" : "Mute audio"}
          className={cn(
            "pointer-events-auto size-10 border-[3px] border-[#342414] bg-[#f4ecd2] p-0 text-[#4c3926] shadow-[4px_4px_0px_#342414] hover:bg-[#e7d8ae]",
            !isAudioMuted && "audio-unmuted-btn"
          )}
        >
          {isAudioMuted ? (
            <VolumeX className="size-3.5" />
          ) : (
            <Volume2 className="volume-unmuted-icon size-3.5" />
          )}
        </Button>
        <Button
          type="button"
          onClick={handleLocateUser}
          disabled={
            userLocationStatus === "unsupported" ||
            userLocationStatus === "requesting"
          }
          aria-label={locateButtonLabel(userLocationStatus)}
          title={locateButtonLabel(userLocationStatus)}
          className={cn(
            "pointer-events-auto size-10 border-[3px] border-[#342414] bg-[#f4ecd2] p-0 text-[#4c3926] shadow-[4px_4px_0px_#342414] hover:bg-[#e7d8ae]",
            userLocationStatus === "tracking" &&
              "border-[#2a9d96] bg-[#dff7f4] text-[#1a6f6a]",
            (userLocationStatus === "denied" ||
              userLocationStatus === "unavailable") &&
              "text-[#9a4d30]"
          )}
        >
          <Crosshair
            className={cn(
              "size-3.5",
              userLocationStatus === "requesting" && "animate-pulse"
            )}
          />
        </Button>
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

        @keyframes marker-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes player-beacon-pulse {
          0% {
            transform: scale(0.85);
            opacity: 0.9;
          }
          70% {
            transform: scale(1.7);
            opacity: 0.25;
          }
          100% {
            transform: scale(1.9);
            opacity: 0;
          }
        }

        .player-location-marker__pulse {
          position: absolute;
          inset: 1px;
          border-radius: 50%;
          box-sizing: border-box;
          background: transparent;
          border: 2px solid #4ecdc4;
          box-shadow: 0 0 0 1px #342414;
          animation: player-beacon-pulse 1.8s steps(3) infinite;
        }

        .quest-event-marker.is-active {
          transform: scale(1.2);
        }

        .quest-event-marker:hover .quest-event-marker__body,
        .quest-event-marker.is-active .quest-event-marker__body {
          animation: quest-marker-bounce 0.5s steps(2) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes marker-float {
            0%,
            100% {
              transform: translateY(0);
            }
          }

          .player-location-marker__character,
          .player-location-marker__pulse {
            animation: none !important;
          }

          .player-location-marker__pulse {
            opacity: 0.45;
            transform: scale(1.15);
          }
        }

        @keyframes volume-unmuted-beat {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.88;
          }
          55% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        @keyframes audio-unmuted-ring {
          0%,
          100% {
            box-shadow: 4px 4px 0 #342414;
          }
          50% {
            box-shadow:
              4px 4px 0 #342414,
              0 0 0 2px rgba(154, 77, 48, 0.45);
          }
        }

        .volume-unmuted-icon {
          transform-origin: center;
          animation: volume-unmuted-beat 1.1s ease-in-out infinite;
        }

        .audio-unmuted-btn {
          animation: audio-unmuted-ring 1.1s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .volume-unmuted-icon,
          .audio-unmuted-btn {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  )
}
