"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react"
import { Github, Volume2, VolumeX } from "lucide-react"
import maplibregl, {
  type Map as MapLibreMap,
  type Marker,
  type StyleSpecification,
} from "maplibre-gl"

import type { CityMapConfig } from "@/lib/city-config"
import { type Company } from "@/lib/company"
import {
  createMarkerSprite,
  createMeetupSignboardMarker,
} from "@/components/map-markers/sprites"
import {
  addVoxelCityLayers,
  applyMinecraftStyle,
} from "@/lib/map-paint"
import {
  spreadOverlappingMeetups,
  type DiscoveryMode,
  type Meetup,
} from "@/lib/meetup"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CompanyRequestPanel } from "@/components/company-request-panel"
import { MeetupRequestPanel } from "@/components/meetup-request-panel"
import { PixelClouds } from "@/components/pixel-clouds"

type MapShellProps = {
  mode: DiscoveryMode
  companies: Company[]
  meetups: Meetup[]
  selectedCompany: Company
  selectedMeetup: Meetup | null
  config: CityMapConfig
  onSelectCompany: (slug: string) => void
  onSelectMeetup: (slug: string) => void
  isAudioMuted: boolean
  onToggleMute: () => void
}

function cityHrefWithMode(baseHref: string, mapMode: DiscoveryMode) {
  if (mapMode === "meetups") {
    return baseHref === "/" ? "/?mode=meetups" : `${baseHref}?mode=meetups`
  }
  return baseHref
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

function shouldSkipBoundsRefit(
  skipFirstBoundsRefitRef: MutableRefObject<boolean>,
  skipNextBoundsRefitRef: MutableRefObject<boolean>
) {
  const skip = skipFirstBoundsRefitRef.current || skipNextBoundsRefitRef.current

  skipFirstBoundsRefitRef.current = false
  skipNextBoundsRefitRef.current = false

  return skip
}

export function MapShell({
  mode,
  companies,
  meetups,
  selectedCompany,
  selectedMeetup,
  config,
  onSelectCompany,
  onSelectMeetup,
  isAudioMuted,
  onToggleMute,
}: MapShellProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const prevActiveSlugRef = useRef<string | null>(null)
  const hasInteractedRef = useRef(false)
  const hasRenderedMarkersRef = useRef(false)
  const mapMarkersSignatureRef = useRef("")
  const prevModeRef = useRef(mode)
  const selectedSlugRef = useRef(selectedCompany.slug)
  const initialCenterRef = useRef(config.mapCenter)
  const skipNextBoundsRefitRef = useRef(false)
  const skipFirstBoundsRefitRef = useRef(true)
  const [mapReady, setMapReady] = useState<MapLibreMap | null>(null)
  const denseStartups = companies.length >= 60
  const denseMeetups = meetups.length >= 60
  const spreadMeetups = useMemo(
    () => spreadOverlappingMeetups(meetups),
    [meetups]
  )

  useEffect(() => {
    selectedSlugRef.current =
      mode === "startups" ? selectedCompany.slug : (selectedMeetup?.slug ?? "")
  }, [mode, selectedCompany.slug, selectedMeetup?.slug])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return
    }

    const markers = markersRef.current
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
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        console.error(error)
      })

    return () => {
      disposed = true
      controller.abort()
      resizeObserver?.disconnect()
      markers.forEach((marker) => marker.remove())
      markers.clear()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapReady
    if (!map) {
      return
    }

    const isModeSwitch =
      hasRenderedMarkersRef.current && prevModeRef.current !== mode
    if (isModeSwitch) {
      skipNextBoundsRefitRef.current = true
    }

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    if (mode === "startups") {
      const dense = denseStartups
      companies.forEach((company) => {
        const active = company.slug === selectedSlugRef.current
        const element = document.createElement("button")
        element.type = "button"
        element.setAttribute("aria-label", company.name)
        element.style.cursor = "pointer"
        element.style.padding = "0"
        element.style.outline = "none"
        element.style.background = "none"
        element.style.border = "none"
        element.appendChild(createMarkerSprite(company, active, dense))
        element.addEventListener("click", () => onSelectCompany(company.slug))

        const marker = new maplibregl.Marker({ element, anchor: "bottom" })
          .setLngLat(company.coordinates)
          .addTo(map)

        markersRef.current.set(company.slug, marker)
      })

      const markerSetSignature = [...companies]
        .map((c) => c.slug)
        .sort()
        .join("|")
      const modeMarkerSetSignature = `startups:${markerSetSignature}`
      const shouldRefit =
        modeMarkerSetSignature !== mapMarkersSignatureRef.current &&
        companies.length > 0
      mapMarkersSignatureRef.current = modeMarkerSetSignature

      if (shouldRefit) {
        if (
          !shouldSkipBoundsRefit(
            skipFirstBoundsRefitRef,
            skipNextBoundsRefitRef
          )
        ) {
          const bounds = new maplibregl.LngLatBounds()
          companies.forEach((c) => bounds.extend(c.coordinates))

          if (companies.length === 1) {
            map.jumpTo({
              center: companies[0].coordinates,
              zoom: 12.5,
              pitch: MAP_PITCH,
              bearing: MAP_BEARING,
            })
          } else {
            map.fitBounds(bounds, {
              padding: 56,
              maxZoom: 12.35,
              duration: 0,
            })
            map.setPitch(MAP_PITCH)
            map.setBearing(MAP_BEARING)
          }
        }
      }
    } else {
      const dense = denseMeetups
      spreadMeetups.forEach((meetup) => {
        const active = meetup.slug === selectedSlugRef.current
        const element = document.createElement("button")
        element.type = "button"
        element.setAttribute("aria-label", meetup.title)
        element.style.cursor = "pointer"
        element.style.padding = "0"
        element.style.outline = "none"
        element.style.background = "none"
        element.style.border = "none"
        element.appendChild(createMeetupSignboardMarker(meetup, active, dense))
        element.addEventListener("click", () => onSelectMeetup(meetup.slug))

        const marker = new maplibregl.Marker({ element, anchor: "bottom" })
          .setLngLat(meetup.coordinates)
          .addTo(map)

        markersRef.current.set(meetup.slug, marker)
      })

      const markerSetSignature = [...spreadMeetups]
        .map((m) => m.slug)
        .sort()
        .join("|")
      const modeMarkerSetSignature = `meetups:${markerSetSignature}`
      const shouldRefit =
        modeMarkerSetSignature !== mapMarkersSignatureRef.current &&
        spreadMeetups.length > 0
      mapMarkersSignatureRef.current = modeMarkerSetSignature

      if (shouldRefit) {
        if (
          !shouldSkipBoundsRefit(
            skipFirstBoundsRefitRef,
            skipNextBoundsRefitRef
          )
        ) {
          const bounds = new maplibregl.LngLatBounds()
          spreadMeetups.forEach((m) => bounds.extend(m.coordinates))

          if (spreadMeetups.length === 1) {
            map.jumpTo({
              center: spreadMeetups[0].coordinates,
              zoom: 12.5,
              pitch: MAP_PITCH,
              bearing: MAP_BEARING,
            })
          } else {
            map.fitBounds(bounds, {
              padding: 56,
              maxZoom: 12.35,
              duration: 0,
            })
            map.setPitch(MAP_PITCH)
            map.setBearing(MAP_BEARING)
          }
        }
      }
    }

    hasRenderedMarkersRef.current = true
    prevActiveSlugRef.current = selectedSlugRef.current || null
    prevModeRef.current = mode
  }, [
    companies,
    denseMeetups,
    denseStartups,
    mapReady,
    mode,
    onSelectCompany,
    onSelectMeetup,
    spreadMeetups,
  ])

  useEffect(() => {
    const activeSlug =
      mode === "startups" ? selectedCompany.slug : (selectedMeetup?.slug ?? null)
    const prevSlug = prevActiveSlugRef.current

    if (prevSlug === activeSlug) {
      return
    }

    if (mode === "startups") {
      const dense = denseStartups
      const companyBySlug = new Map(companies.map((c) => [c.slug, c]))

      for (const slug of [prevSlug, activeSlug]) {
        if (!slug) {
          continue
        }

        const marker = markersRef.current.get(slug)
        if (!marker) {
          continue
        }

        const button = marker.getElement() as HTMLButtonElement
        const active = slug === activeSlug
        const company = companyBySlug.get(slug)

        button.style.zIndex = active ? "10" : "1"
        if (company) {
          button.replaceChildren(createMarkerSprite(company, active, dense))
        }
      }
    } else {
      const dense = denseMeetups
      const meetupBySlug = new Map(spreadMeetups.map((m) => [m.slug, m]))

      for (const slug of [prevSlug, activeSlug]) {
        if (!slug) {
          continue
        }

        const marker = markersRef.current.get(slug)
        if (!marker) {
          continue
        }

        const button = marker.getElement() as HTMLButtonElement
        const active = slug === activeSlug
        const meetup = meetupBySlug.get(slug)

        button.style.zIndex = active ? "10" : "1"
        if (meetup) {
          button.replaceChildren(
            createMeetupSignboardMarker(meetup, active, dense)
          )
        }
      }
    }

    prevActiveSlugRef.current = activeSlug
  }, [
    companies,
    denseMeetups,
    denseStartups,
    mode,
    selectedCompany,
    selectedMeetup,
    spreadMeetups,
  ])

  useEffect(() => {
    const map = mapRef.current
    if (!map) {
      return
    }

    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true
      return
    }

    const nextCenter =
      mode === "startups"
        ? selectedCompany.coordinates
        : selectedMeetup?.coordinates

    if (!nextCenter) {
      return
    }

    map.flyTo({
      center: nextCenter,
      zoom: map.getZoom(),
      pitch: MAP_PITCH,
      bearing: MAP_BEARING,
      speed: 0.65,
      curve: 1.2,
      essential: true,
    })
  }, [mode, selectedCompany, selectedMeetup])

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
      {mode === "startups" ? (
        <CompanyRequestPanel initialCity={config.city} />
      ) : (
        <MeetupRequestPanel initialCity={config.city} />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#fff3cf]/35 to-transparent" />
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
            href={cityHrefWithMode(option.href, mode)}
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
