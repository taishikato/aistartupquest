"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl, {
  type ExpressionSpecification,
  type Map as MapLibreMap,
  type Marker,
} from "maplibre-gl"

import {
  getCompanyLogoUrl,
  getCompanyMonogram,
  type Company,
  type CompanyCategory,
} from "@/lib/companies"
import { PixelClouds } from "@/components/pixel-clouds"

type MapShellProps = {
  companies: Company[]
  selectedCompany: Company
  onSelectCompany: (slug: string) => void
}

const SF_CENTER: [number, number] = [-122.4167, 37.7793]
const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
const MAP_PITCH = 46
const MAP_BEARING = -18

const CATEGORY_COLORS: Record<CompanyCategory, string> = {
  "Core Labs": "#bb5a3c",
  "Consumer AI": "#5a9b6e",
  Devtools: "#d1ae4f",
  Infra: "#8b79b8",
  Agents: "#5e8dc7",
  "Vertical AI": "#c77e3d",
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

function addVoxelCityLayers(map: MapLibreMap) {
  if (!map.getSource("carto") || map.getLayer("minecraft-buildings")) {
    return
  }

  const rawHeight: ExpressionSpecification = [
    "coalesce",
    ["to-number", ["get", "render_height"]],
    ["to-number", ["get", "height"]],
    12,
  ]
  const snappedHeight: ExpressionSpecification = [
    "max",
    8,
    ["min", 180, ["*", ["round", ["/", rawHeight, 8]], 8]],
  ]

  map.addLayer(
    {
      id: "minecraft-buildings",
      type: "fill-extrusion",
      source: "carto",
      "source-layer": "building",
      minzoom: 11,
      paint: {
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          snappedHeight,
          8,
          "#c9a87c",
          32,
          "#d4b88e",
          72,
          "#dfc8a2",
          140,
          "#ebd8b8",
        ],
        "fill-extrusion-height": snappedHeight,
        "fill-extrusion-base": 0,
        "fill-extrusion-opacity": 0.88,
        "fill-extrusion-vertical-gradient": false,
      },
    },
    "boundary_country_outline"
  )
}

// Apply a blocky voxel-like palette without changing the data layers.
function applyMinecraftStyle(map: MapLibreMap) {
  setPaintPropertyIfLayerExists(
    map,
    "background",
    "background-color",
    "#a5c76e"
  )

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

  setPaintPropertyIfLayerExists(map, "water", "fill-color", "#4b83c2")
  setPaintPropertyIfLayerExists(map, "water_shadow", "fill-color", "#325f97")
  setPaintPropertyIfLayerExists(map, "waterway", "line-color", "#4479b1")
  setPaintPropertyIfLayerExists(map, "waterway", "line-width", 2.4)

  setPaintPropertyIfLayerExists(map, "building", "fill-color", "#c4a87a")
  setPaintPropertyIfLayerExists(map, "building", "fill-opacity", 0.2)
  setPaintPropertyIfLayerExists(map, "building-top", "fill-color", "#e0cca0")
  setPaintPropertyIfLayerExists(map, "building-top", "fill-opacity", 0)

  const roadCases = [
    "road_service_case",
    "road_minor_case",
    "road_pri_case_ramp", "road_trunk_case_ramp", "road_mot_case_ramp",
    "road_sec_case_noramp", "road_pri_case_noramp",
    "road_trunk_case_noramp", "road_mot_case_noramp",
  ]
  roadCases.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#3f3427")
  )

  const roadFills = [
    "road_service_fill",
    "road_minor_fill",
    "road_pri_fill_ramp", "road_trunk_fill_ramp", "road_mot_fill_ramp",
    "road_sec_fill_noramp", "road_pri_fill_noramp",
  ]
  roadFills.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#8f856a")
  )

  setPaintPropertyIfLayerExists(
    map,
    "road_trunk_fill_noramp",
    "line-color",
    "#a79b76"
  )
  setPaintPropertyIfLayerExists(
    map,
    "road_mot_fill_noramp",
    "line-color",
    "#8a7c5b"
  )

  setPaintPropertyIfLayerExists(map, "road_path", "line-color", "#735d3a")

  setPaintPropertyIfLayerExists(map, "rail", "line-color", "#5a5650")
  setPaintPropertyIfLayerExists(map, "rail_dash", "line-color", "#b1aa94")

  const tunnelCases = [
    "tunnel_service_case",
    "tunnel_minor_case",
    "tunnel_sec_case",
    "tunnel_pri_case", "tunnel_trunk_case", "tunnel_mot_case",
  ]
  tunnelCases.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#645642")
  )

  const tunnelFills = [
    "tunnel_service_fill",
    "tunnel_minor_fill",
    "tunnel_sec_fill",
    "tunnel_pri_fill", "tunnel_trunk_fill", "tunnel_mot_fill",
  ]
  tunnelFills.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#887a5d")
  )

  const bridgeCases = [
    "bridge_service_case",
    "bridge_minor_case",
    "bridge_sec_case",
    "bridge_pri_case", "bridge_trunk_case", "bridge_mot_case",
  ]
  bridgeCases.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#473c2e")
  )

  const bridgeFills = [
    "bridge_service_fill",
    "bridge_minor_fill",
    "bridge_sec_fill",
    "bridge_pri_fill", "bridge_trunk_fill", "bridge_mot_fill",
  ]
  bridgeFills.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#978567")
  )

  setPaintPropertyIfLayerExists(
    map,
    "boundary_county",
    "line-color",
    "#8d6c49"
  )
  setPaintPropertyIfLayerExists(
    map,
    "boundary_state",
    "line-color",
    "#725536"
  )

  const placeLabels = [
    "place_hamlet",
    "place_suburbs",
    "place_villages",
    "place_town", "place_city_r6", "place_city_r5",
  ]
  placeLabels.forEach((id) => {
    setPaintPropertyIfLayerExists(map, id, "text-color", "#3d2e1f")
    setPaintPropertyIfLayerExists(map, id, "text-halo-color", "#d9cb97")
    setPaintPropertyIfLayerExists(map, id, "text-halo-width", 1.5)
  })

  const cityDots = [
    "place_city_dot_r7",
    "place_city_dot_r4",
    "place_city_dot_r2",
    "place_city_dot_z7", "place_capital_dot_z7",
  ]
  cityDots.forEach((id) => {
    setPaintPropertyIfLayerExists(map, id, "text-color", "#2e2418")
    setPaintPropertyIfLayerExists(map, id, "text-halo-color", "#d9cb97")
    setPaintPropertyIfLayerExists(map, id, "text-halo-width", 1.5)
  })

  setPaintPropertyIfLayerExists(map, "place_state", "text-color", "#6b5a46")
  setPaintPropertyIfLayerExists(
    map,
    "place_country_1",
    "text-color",
    "#4f3f2d"
  )
  setPaintPropertyIfLayerExists(
    map,
    "place_country_2",
    "text-color",
    "#4f3f2d"
  )

  const waterLabels = [
    "watername_ocean",
    "watername_sea",
    "watername_lake",
    "watername_lake_line", "waterway_label",
  ]
  waterLabels.forEach((id) => {
    setPaintPropertyIfLayerExists(map, id, "text-color", "#244e82")
    setPaintPropertyIfLayerExists(map, id, "text-halo-color", "#78a7db")
    setPaintPropertyIfLayerExists(map, id, "text-halo-width", 1)
  })

  setPaintPropertyIfLayerExists(map, "poi_park", "text-color", "#346a28")
  setPaintPropertyIfLayerExists(map, "poi_stadium", "text-color", "#5a4a3a")

  setPaintPropertyIfLayerExists(
    map,
    "aeroway-runway",
    "line-color",
    "#8b8371"
  )
  setPaintPropertyIfLayerExists(
    map,
    "aeroway-taxiway",
    "line-color",
    "#9d927e"
  )
}

function createSignMarker(
  company: Company,
  active: boolean,
  dense: boolean
) {
  const monogram = getCompanyMonogram(company)
  const accent = CATEGORY_COLORS[company.category]
  const frameSize = dense ? (active ? 30 : 24) : active ? 36 : 28
  const logoSize = dense ? (active ? 16 : 12) : active ? 20 : 15
  const baseWidth = dense ? (active ? 26 : 22) : active ? 30 : 24
  const baseHeight = dense ? (active ? 12 : 10) : active ? 14 : 12
  const postHeight = dense ? (active ? 10 : 8) : active ? 12 : 9

  const wrapper = document.createElement("div")
  wrapper.style.display = "flex"
  wrapper.style.flexDirection = "column"
  wrapper.style.alignItems = "center"
  wrapper.style.gap = "0"

  const frame = document.createElement("div")
  frame.style.width = `${frameSize}px`
  frame.style.height = `${frameSize}px`
  frame.style.border = "3px solid #342414"
  frame.style.background = "#f4ecd2"
  frame.style.display = "flex"
  frame.style.alignItems = "center"
  frame.style.justifyContent = "center"
  frame.style.boxShadow = active
    ? "0 0 0 3px rgba(255, 242, 199, 0.65), 4px 4px 0 #342414"
    : "3px 3px 0 #342414"
  frame.style.position = "relative"

  const frameAccent = document.createElement("div")
  frameAccent.style.position = "absolute"
  frameAccent.style.top = "0"
  frameAccent.style.left = "0"
  frameAccent.style.right = "0"
  frameAccent.style.height = `${Math.max(5, Math.round(frameSize * 0.18))}px`
  frameAccent.style.background = accent
  frameAccent.style.borderBottom = "2px solid #342414"
  frame.appendChild(frameAccent)

  const image = document.createElement("img")
  image.src = getCompanyLogoUrl(company)
  image.alt = `${company.name} logo`
  image.style.width = `${logoSize}px`
  image.style.height = `${logoSize}px`
  image.style.objectFit = "contain"
  image.style.position = "relative"
  image.style.zIndex = "1"

  image.addEventListener("error", () => {
    image.replaceWith(createFallback(monogram, active, dense))
  })
  frame.appendChild(image)

  const grassTop = document.createElement("div")
  grassTop.style.width = `${baseWidth}px`
  grassTop.style.height = `${Math.max(5, Math.round(baseHeight * 0.42))}px`
  grassTop.style.border = "2px solid #342414"
  grassTop.style.borderBottom = "0"
  grassTop.style.background =
    "repeating-linear-gradient(90deg, #7fa64c 0 5px, #6d9242 5px 10px)"

  const dirt = document.createElement("div")
  dirt.style.width = `${baseWidth}px`
  dirt.style.height = `${baseHeight}px`
  dirt.style.border = "2px solid #342414"
  dirt.style.background =
    "repeating-linear-gradient(90deg, #8b5a34 0 6px, #754626 6px 12px)"
  dirt.style.boxShadow = "3px 3px 0 rgba(52, 36, 20, 0.45)"

  const post = document.createElement("div")
  post.style.width = `${dense ? 6 : 7}px`
  post.style.height = `${postHeight}px`
  post.style.background = "#6d4a2b"
  post.style.borderLeft = "2px solid #342414"
  post.style.borderRight = "2px solid #342414"

  const shadow = document.createElement("div")
  shadow.style.width = `${Math.round(baseWidth * 0.9)}px`
  shadow.style.height = "4px"
  shadow.style.background = "rgba(52, 36, 20, 0.22)"
  shadow.style.filter = "blur(1px)"

  wrapper.appendChild(frame)
  wrapper.appendChild(post)
  wrapper.appendChild(grassTop)
  wrapper.appendChild(dirt)
  wrapper.appendChild(shadow)

  return wrapper
}

function createFallback(monogram: string, active: boolean, dense: boolean) {
  const el = document.createElement("span")
  el.textContent = monogram
  el.style.fontSize = dense
    ? active ? "10px" : "8px"
    : active ? "12px" : "9px"
  el.style.fontWeight = "700"
  el.style.lineHeight = "1"
  el.style.color = "#342414"
  return el
}

export function MapShell({
  companies,
  selectedCompany,
  onSelectCompany,
}: MapShellProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const hasInteractedRef = useRef(false)
  const [mapReady, setMapReady] = useState<MapLibreMap | null>(null)
  const dense = companies.length >= 60

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return
    }

    const markers = markersRef.current
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: SF_CENTER,
      zoom: 11.95,
      pitch: MAP_PITCH,
      bearing: MAP_BEARING,
      minZoom: 11.1,
      maxZoom: 15.8,
      attributionControl: false,
      renderWorldCopies: false,
    })

    map.dragRotate.disable()
    map.touchZoomRotate.disableRotation()
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    )
    map.on("load", () => {
      applyMinecraftStyle(map)
      addVoxelCityLayers(map)
      map.resize()
      setMapReady(map)
    })
    mapRef.current = map

    const resizeObserver = new ResizeObserver(() => {
      map.resize()
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      markers.forEach((marker) => marker.remove())
      markers.clear()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) {
      return
    }

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    companies.forEach((company) => {
      const active = company.slug === selectedCompany.slug
      const element = document.createElement("button")
      element.type = "button"
      element.setAttribute("aria-label", company.name)
      element.style.cursor = "pointer"
      element.style.padding = "0"
      element.style.outline = "none"
      element.style.background = "none"
      element.style.border = "none"
      element.appendChild(createSignMarker(company, active, dense))
      element.addEventListener("click", () => onSelectCompany(company.slug))

      const marker = new maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat(company.coordinates)
        .addTo(map)

      markersRef.current.set(company.slug, marker)
    })
  }, [companies, dense, onSelectCompany, selectedCompany.slug])

  useEffect(() => {
    markersRef.current.forEach((marker, slug) => {
      const button = marker.getElement() as HTMLButtonElement
      const active = slug === selectedCompany.slug
      const company = companies.find((item) => item.slug === slug)

      button.style.zIndex = active ? "10" : "1"
      if (company) {
        button.replaceChildren(createSignMarker(company, active, dense))
      }
    })
  }, [companies, dense, selectedCompany])

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
      zoom: 13.05,
      pitch: MAP_PITCH,
      bearing: MAP_BEARING,
      speed: 0.65,
      curve: 1.2,
      essential: true,
    })
  }, [selectedCompany])

  return (
    <div className="relative h-full overflow-hidden bg-[#cdb98b] lg:min-h-160">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(53,37,20,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(53,37,20,0.14) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>
      {mapReady && <PixelClouds map={mapReady} />}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#fff3cf]/35 to-transparent" />
      <div className="pointer-events-none absolute top-4 left-4 border-[3px] border-[#342414] bg-[#f4ecd2] px-4 py-3 shadow-[4px_4px_0px_#342414]">
        <div className="font-[family-name:var(--font-pixel)] text-[8px] uppercase tracking-wider text-[#9a4d30]">
          SF AI Startup Map
        </div>
        <p className="mt-1 max-w-[220px] text-[11px] leading-4 text-[#4c3926]">
          Voxel-style view of source-backed SF office locations.
        </p>
      </div>
      <div className="pointer-events-none absolute right-4 bottom-4 border-[3px] border-[#342414] bg-[#f4ecd2] px-3 py-2 shadow-[4px_4px_0px_#342414]">
        <span className="font-[family-name:var(--font-pixel)] text-[7px] text-[#4c3926]">
          ► {selectedCompany.name}
        </span>
      </div>
      <div className="pointer-events-none absolute right-4 top-16 flex flex-col gap-1">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div
            key={cat}
            className="flex items-center gap-1.5 border-2 border-[#342414] bg-[#f4ecd2] px-2 py-1 shadow-[3px_3px_0px_rgba(52,36,20,0.75)]"
          >
            <div
              className="size-2.5 border border-[#342414]"
              style={{ backgroundColor: color, boxShadow: "1px 1px 0 #342414" }}
            />
            <span className="text-[9px] font-medium text-[#4c3926]">
              {cat}
            </span>
          </div>
        ))}
      </div>
      <style jsx global>{`
        .maplibregl-canvas {
          image-rendering: pixelated;
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
      `}</style>
    </div>
  )
}
