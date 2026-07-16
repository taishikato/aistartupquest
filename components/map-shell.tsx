"use client"

import { useEffect, useRef, useState } from "react"
import { Crosshair, Github, Volume2, VolumeX } from "lucide-react"
import maplibregl, {
  type Map as MapLibreMap,
  type StyleSpecification,
} from "maplibre-gl"

import { track } from "@/lib/analytics"
import type { CityMapConfig } from "@/lib/city-config"
import { type Company } from "@/lib/company"
import { logNonAbortError } from "@/lib/is-abort-error"
import { addVoxelCityLayers, applyMinecraftStyle } from "@/lib/map-paint"
import type { UserLocationStatus } from "@/lib/user-location"
import { cn } from "@/lib/utils"
import { useUserLocation } from "@/hooks/use-user-location"
import { Button } from "@/components/ui/button"
import { CompanyAddInvite } from "@/components/company-add-invite"
import { useMapMarkers } from "@/components/map-markers/use-map-markers"
import { useUserLocationMarker } from "@/components/map-markers/use-user-location-marker"
import { PixelClouds } from "@/components/pixel-clouds"
import { QuestHeraldSignup } from "@/components/quest-herald-signup"

type MapShellProps = {
  companies: Company[]
  selectedCompany: Company
  config: CityMapConfig
  onSelectCompany: (slug: string) => void
  isAudioMuted: boolean
  onToggleMute: () => void
}

const MAP_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
// Oblique camera reads closer to isometric / retro city builders.
const MAP_PITCH = 54
const MAP_BEARING = -24

async function loadMapStyle(signal: AbortSignal): Promise<StyleSpecification> {
  const response = await fetch(MAP_STYLE_URL, { signal })

  if (!response.ok) {
    throw new Error(`Failed to load map style: ${response.status}`)
  }

  const style = (await response.json()) as StyleSpecification

  return {
    ...style,
    projection: style.projection ?? { type: "mercator" },
  }
}

export function MapShell({
  companies,
  selectedCompany,
  config,
  onSelectCompany,
  isAudioMuted,
  onToggleMute,
}: MapShellProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const hasInteractedRef = useRef(false)
  const pendingFlyToUserRef = useRef(false)
  const initialCenterRef = useRef(config.mapCenter)
  const [mapReady, setMapReady] = useState<MapLibreMap | null>(null)
  const denseStartups = companies.length >= 60
  const {
    status: userLocationStatus,
    coordinates: userCoordinates,
    requestLocation,
  } = useUserLocation()

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return
    }

    const controller = new AbortController()
    let disposed = false
    let resizeObserver: ResizeObserver | null = null

    loadMapStyle(controller.signal)
      .then((style) => {
        if (disposed || !containerRef.current || mapRef.current) {
          return
        }

        const map = new maplibregl.Map({
          container: containerRef.current,
          style,
          center: initialCenterRef.current,
          zoom: 11.95,
          pitch: MAP_PITCH,
          bearing: MAP_BEARING,
          minZoom: 9.5,
          maxZoom: 15.8,
          attributionControl: false,
          renderWorldCopies: false,
        })

        map.dragRotate.disable()
        map.touchZoomRotate.disableRotation()
        map.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          "bottom-right"
        )
        map.on("load", () => {
          applyMinecraftStyle(map)
          addVoxelCityLayers(map)
          map.resize()
          setMapReady(map)
        })
        mapRef.current = map

        resizeObserver = new ResizeObserver(() => {
          map.resize()
        })

        resizeObserver.observe(containerRef.current)
      })
      .catch(logNonAbortError)

    return () => {
      disposed = true
      controller.abort()
      resizeObserver?.disconnect()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useMapMarkers({
    mapReady,
    companies,
    denseStartups,
    selectedCompany,
    onSelectCompany,
  })

  useUserLocationMarker({
    mapReady,
    coordinates: userCoordinates,
  })

  useEffect(() => {
    const map = mapRef.current
    if (!map || !userCoordinates || !pendingFlyToUserRef.current) {
      return
    }

    pendingFlyToUserRef.current = false
    hasInteractedRef.current = true
    map.flyTo({
      center: [userCoordinates.lng, userCoordinates.lat],
      zoom: Math.max(map.getZoom(), 13.2),
      pitch: MAP_PITCH,
      bearing: MAP_BEARING,
      speed: 0.7,
      curve: 1.15,
      essential: true,
    })
  }, [userCoordinates])

  useEffect(() => {
    const map = mapRef.current
    if (!map) {
      return
    }

    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true
      return
    }

    map.flyTo({
      center: selectedCompany.coordinates,
      zoom: map.getZoom(),
      pitch: MAP_PITCH,
      bearing: MAP_BEARING,
      speed: 0.65,
      curve: 1.2,
      essential: true,
    })
  }, [selectedCompany])

  const handleLocateUser = () => {
    if (userLocationStatus === "unsupported") {
      return
    }

    track("user_locate_click", {
      city: config.city,
      status: userLocationStatus,
    })

    if (userCoordinates && userLocationStatus === "tracking") {
      const map = mapRef.current
      if (!map) {
        return
      }

      hasInteractedRef.current = true
      map.flyTo({
        center: [userCoordinates.lng, userCoordinates.lat],
        zoom: Math.max(map.getZoom(), 13.2),
        pitch: MAP_PITCH,
        bearing: MAP_BEARING,
        speed: 0.7,
        curve: 1.15,
        essential: true,
      })
      return
    }

    pendingFlyToUserRef.current = true
    requestLocation()
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-[#cdb98b] lg:min-h-160">
      <div
        className="h-full w-full [&_.maplibregl-map]:filter-[contrast(1.07)_saturate(1.06)]"
        ref={containerRef}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.38]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(53,37,20,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(53,37,20,0.2) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 0 0",
          }}
        />
      </div>
      {mapReady && <PixelClouds map={mapReady} />}
      <CompanyAddInvite />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#fff3cf]/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-start px-3 pr-14 sm:bottom-4 sm:px-4 lg:bottom-5">
        <QuestHeraldSignup source="city_map_footer" />
      </div>
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <Button
          type="button"
          onClick={onToggleMute}
          aria-label={isAudioMuted ? "Unmute audio" : "Mute audio"}
          className={cn(
            "size-10 border-[3px] border-[#342414] bg-[#f4ecd2] p-0 text-[#4c3926] shadow-[4px_4px_0px_#342414] hover:bg-[#e7d8ae]",
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
            "size-10 border-[3px] border-[#342414] bg-[#f4ecd2] p-0 text-[#4c3926] shadow-[4px_4px_0px_#342414] hover:bg-[#e7d8ae]",
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
        <a
          href={config.sourceHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-10 items-center justify-center border-[3px] border-[#342414] bg-[#f4ecd2] text-[#4c3926] shadow-[4px_4px_0px_#342414] transition-colors hover:bg-[#e7d8ae]"
          aria-label="View source on GitHub"
        >
          <Github className="size-3.5" strokeWidth={2} aria-hidden />
        </a>
        {config.switchOptions.map((option) => (
          <a
            key={option.city}
            href={option.href}
            className="flex size-10 items-center justify-center border-[3px] border-[#342414] bg-[#f4ecd2] text-[#4c3926] shadow-[4px_4px_0px_#342414] transition-colors hover:bg-[#e7d8ae]"
            aria-label={option.ariaLabel}
          >
            <span
              className="font-(family-name:--font-pixel) text-[11px] leading-none tracking-tight"
              aria-hidden
            >
              {option.label}
            </span>
          </a>
        ))}
      </div>
      <style jsx global>{`
        .maplibregl-canvas {
          image-rendering: pixelated;
          image-rendering: crisp-edges;
          image-rendering: -moz-crisp-edges;
        }

        .maplibregl-ctrl-group {
          border-radius: 0 !important;
          box-shadow: 4px 4px 0 #342414 !important;
          border: 3px solid #342414 !important;
          background: #f4ecd2 !important;
          overflow: hidden;
        }

        .maplibregl-ctrl-group button {
          border-radius: 0 !important;
          background: #f4ecd2 !important;
          color: #4c3926 !important;
        }

        .maplibregl-ctrl-group button:hover {
          background: #e0d2ab !important;
        }

        .maplibregl-ctrl-icon {
          filter: sepia(1) saturate(0.8) brightness(0.45);
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

        @media (prefers-reduced-motion: reduce) {
          @keyframes marker-float {
            0%,
            100% {
              transform: translateY(0);
            }
          }
        }

        @keyframes volume-unmuted-beat {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          40% {
            transform: scale(1.22);
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
    </div>
  )
}

function locateButtonLabel(status: UserLocationStatus) {
  switch (status) {
    case "requesting":
      return "Finding your location"
    case "tracking":
      return "Center on your location"
    case "denied":
      return "Location permission denied"
    case "unavailable":
      return "Location unavailable"
    case "unsupported":
      return "Location not supported"
    default:
      return "Show my location"
  }
}
