"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import maplibregl, {
  type Map as MapLibreMap,
  type Marker,
  type StyleSpecification,
} from "maplibre-gl"

import type { CityId } from "@/lib/city-config"
import {
  WORLD_STAGE_CITIES,
  type WorldStageCity,
} from "@/lib/world-stage-cities"

const MAP_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"

const MAPLIBRE_MARKER_OFFSETS: Record<CityId, [number, number]> = {
  sf: [0, 0],
  vancouver: [0, 0],
  toronto: [0, 0],
  ny: [0, 0],
  london: [0, 0],
  tokyo: [0, 0],
}

async function loadWorldStyle(signal: AbortSignal): Promise<StyleSpecification> {
  const response = await fetch(MAP_STYLE_URL, { signal })

  if (!response.ok) {
    throw new Error(`Failed to load map style: ${response.status}`)
  }

  const style = (await response.json()) as StyleSpecification

  return {
    ...style,
    projection: { type: "mercator" },
  }
}

function setPaintPropertyIfLayerExists(
  map: MapLibreMap,
  layerId: string,
  property: string,
  value: unknown
) {
  if (!map.getLayer(layerId)) {
    return
  }

  map.setPaintProperty(layerId, property, value)
}

function applyWorldStageStyle(map: MapLibreMap) {
  setPaintPropertyIfLayerExists(map, "background", "background-color", "#a5c76e")
  setPaintPropertyIfLayerExists(map, "water", "fill-color", "#4b83c2")
  setPaintPropertyIfLayerExists(map, "water_shadow", "fill-color", "#325f97")
  setPaintPropertyIfLayerExists(map, "waterway", "line-color", "#4479b1")
  setPaintPropertyIfLayerExists(map, "waterway", "line-width", 2.4)

  setPaintPropertyIfLayerExists(map, "landcover", "fill-color", "#7ea64a")
  setPaintPropertyIfLayerExists(map, "landcover", "fill-opacity", 0.96)
  ;["park_national_park", "park_nature_reserve"].forEach((id) => {
    setPaintPropertyIfLayerExists(map, id, "fill-color", "#5f9235")
    setPaintPropertyIfLayerExists(map, id, "fill-opacity", 0.92)
  })

  setPaintPropertyIfLayerExists(
    map,
    "landuse_residential",
    "fill-color",
    "#ddd2ac"
  )
  setPaintPropertyIfLayerExists(map, "landuse", "fill-color", "#d6c99a")
  setPaintPropertyIfLayerExists(map, "landuse", "fill-opacity", 0.88)

  const roadCases = [
    "road_service_case",
    "road_minor_case",
    "road_pri_case_ramp",
    "road_trunk_case_ramp",
    "road_mot_case_ramp",
    "road_sec_case_noramp",
    "road_pri_case_noramp",
    "road_trunk_case_noramp",
    "road_mot_case_noramp",
    "tunnel_service_case",
    "tunnel_minor_case",
    "tunnel_sec_case",
    "tunnel_pri_case",
    "tunnel_trunk_case",
    "tunnel_mot_case",
    "bridge_service_case",
    "bridge_minor_case",
    "bridge_sec_case",
    "bridge_pri_case",
    "bridge_trunk_case",
    "bridge_mot_case",
  ]
  roadCases.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#3f3427")
  )

  const roadFills = [
    "road_service_fill",
    "road_minor_fill",
    "road_pri_fill_ramp",
    "road_trunk_fill_ramp",
    "road_mot_fill_ramp",
    "road_sec_fill_noramp",
    "road_pri_fill_noramp",
    "road_trunk_fill_noramp",
    "road_mot_fill_noramp",
    "tunnel_service_fill",
    "tunnel_minor_fill",
    "tunnel_sec_fill",
    "tunnel_pri_fill",
    "tunnel_trunk_fill",
    "tunnel_mot_fill",
    "bridge_service_fill",
    "bridge_minor_fill",
    "bridge_sec_fill",
    "bridge_pri_fill",
    "bridge_trunk_fill",
    "bridge_mot_fill",
  ]
  roadFills.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#958868")
  )

  setPaintPropertyIfLayerExists(map, "road_path", "line-color", "#735d3a")
  setPaintPropertyIfLayerExists(map, "rail", "line-color", "#5a5650")
  setPaintPropertyIfLayerExists(map, "rail_dash", "line-color", "#b1aa94")

  setPaintPropertyIfLayerExists(
    map,
    "boundary_country_outline",
    "line-color",
    "#f3e2a5"
  )
  setPaintPropertyIfLayerExists(
    map,
    "boundary_country_outline",
    "line-opacity",
    0.78
  )
  setPaintPropertyIfLayerExists(map, "boundary_county", "line-color", "#8d6c49")
  setPaintPropertyIfLayerExists(map, "boundary_state", "line-color", "#725536")

  const placeLabels = [
    "place_hamlet",
    "place_suburbs",
    "place_villages",
    "place_town",
    "place_city_r6",
    "place_city_r5",
    "place_state",
    "place_country_1",
    "place_country_2",
  ]
  placeLabels.forEach((id) => {
    setPaintPropertyIfLayerExists(map, id, "text-color", "#3d2e1f")
    setPaintPropertyIfLayerExists(map, id, "text-halo-color", "#d9cb97")
    setPaintPropertyIfLayerExists(map, id, "text-halo-width", 1.5)
  })

  const waterLabels = [
    "watername_ocean",
    "watername_sea",
    "watername_lake",
    "watername_lake_line",
    "waterway_label",
  ]
  waterLabels.forEach((id) => {
    setPaintPropertyIfLayerExists(map, id, "text-color", "#244e82")
    setPaintPropertyIfLayerExists(map, id, "text-halo-color", "#78a7db")
    setPaintPropertyIfLayerExists(map, id, "text-halo-width", 1)
  })
}

function createCityMarker(
  city: WorldStageCity,
  active: boolean,
  onActiveCityChange: (city: CityId) => void
) {
  const anchor = document.createElement("a")
  anchor.href = city.href
  anchor.setAttribute("aria-label", `Open ${city.name} AI Startup Map`)
  anchor.style.display = "block"
  anchor.style.width = "70px"
  anchor.style.height = "70px"
  anchor.style.transformOrigin = "50% 70%"
  anchor.style.filter = active
    ? "drop-shadow(0 8px 12px rgba(0, 0, 0, 0.45))"
    : "drop-shadow(0 5px 8px rgba(0, 0, 0, 0.35))"
  anchor.style.zIndex = active ? "10" : "1"

  const markerBody = document.createElement("span")
  markerBody.style.position = "absolute"
  markerBody.style.inset = "0"
  markerBody.style.transform = active ? "scale(1.12)" : "scale(1)"
  markerBody.style.transformOrigin = "50% 70%"
  markerBody.style.transition = "transform 180ms ease"

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
  anchor.addEventListener("mouseenter", () => onActiveCityChange(city.id))
  anchor.addEventListener("focus", () => onActiveCityChange(city.id))

  return anchor
}

export function MapLibreWorldSelect() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Map<CityId, Marker>>(new Map())
  const [mapReady, setMapReady] = useState<MapLibreMap | null>(null)
  const [activeCityId, setActiveCityId] = useState<CityId>("sf")
  const activeCity = useMemo(
    () =>
      WORLD_STAGE_CITIES.find((city) => city.id === activeCityId) ??
      WORLD_STAGE_CITIES[0],
    [activeCityId]
  )

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return
    }

    const controller = new AbortController()
    const markers = markersRef.current
    let disposed = false

    loadWorldStyle(controller.signal)
      .then((style) => {
        if (disposed || !containerRef.current || mapRef.current) {
          return
        }

        const map = new maplibregl.Map({
          container: containerRef.current,
          style,
          center: [18, 24],
          zoom: 1.08,
          minZoom: 0.48,
          maxZoom: 5.5,
          attributionControl: false,
          renderWorldCopies: true,
        })

        map.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          "bottom-right"
        )
        map.on("load", () => {
          applyWorldStageStyle(map)
          map.resize()
          setMapReady(map)
        })
        mapRef.current = map
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
      markers.forEach((marker) => marker.remove())
      markers.clear()
      mapRef.current?.remove()
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
    markersRef.current.clear()

    WORLD_STAGE_CITIES.forEach((city) => {
      const marker = new maplibregl.Marker({
        element: createCityMarker(city, city.id === activeCityId, setActiveCityId),
        anchor: "bottom",
        offset: MAPLIBRE_MARKER_OFFSETS[city.id],
      })
        .setLngLat([city.lon, city.lat])
        .addTo(map)

      markersRef.current.set(city.id, marker)
    })
  }, [activeCityId, mapReady])

  return (
    <main className="relative h-dvh overflow-hidden bg-[#84b8dc] text-[#1a1a2e]">
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,transparent_62%,rgba(255,255,255,0.22)_100%)]" />

      <header className="pointer-events-none absolute top-0 right-0 left-0 z-30 flex items-start justify-between gap-3 p-4 sm:p-6">
        <Link
          href="/"
          className="pointer-events-auto flex min-w-0 items-center gap-3 border-2 border-[#1a1a2e] bg-white px-3 py-2 shadow-[4px_4px_0_#1a1a2e]"
          aria-label="Back to RPG world map"
        >
          <Image
            src="/brand-mark.svg"
            alt=""
            width={30}
            height={30}
            className="shrink-0"
            priority
          />
          <span className="hidden truncate font-(family-name:--font-pixel) text-[10px] leading-5 text-[#1a1a2e] sm:block">
            MapLibre Map
          </span>
        </Link>
        <Link
          href="/"
          className="pointer-events-auto border-2 border-[#1a1a2e] bg-[#ffe66d] px-3 py-2 font-(family-name:--font-pixel) text-[9px] leading-5 text-[#1a1a2e] shadow-[4px_4px_0_#1a1a2e]"
        >
          RPG Map
        </Link>
      </header>

      <div className="pointer-events-none absolute right-4 bottom-4 z-30 max-w-[min(380px,calc(100vw-32px))] border-2 border-[#1a1a2e] bg-white px-4 py-3 shadow-[4px_4px_0_#4ecdc4] sm:right-6 sm:bottom-6">
        <div className="font-(family-name:--font-pixel) text-[13px] leading-5 text-[#1a1a2e]">
          {activeCity.name}
        </div>
        <div className="mt-1 truncate text-xs text-[#1a1a2e]/65">
          {activeCity.region} / {activeCity.tagline}
        </div>
      </div>

      <style jsx global>{`
        .maplibregl-canvas {
          image-rendering: auto;
        }

        .maplibregl-ctrl-group {
          border: 2px solid #1a1a2e !important;
          border-radius: 0 !important;
          background: #fffefc !important;
          box-shadow: 4px 4px 0 #1a1a2e !important;
        }

        .maplibregl-ctrl-group button {
          border-radius: 0 !important;
        }
      `}</style>
    </main>
  )
}
