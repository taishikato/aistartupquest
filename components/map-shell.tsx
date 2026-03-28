"use client"

import { useEffect, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"
import maplibregl, {
  type ExpressionSpecification,
  type Map as MapLibreMap,
  type Marker,
} from "maplibre-gl"

import { Button } from "@/components/ui/button"
import {
  CATEGORY_COLORS,
  getCompanyLogoUrl,
  getCompanyMonogram,
  type Company,
} from "@/lib/companies"
import { PixelClouds } from "@/components/pixel-clouds"
import { cn } from "@/lib/utils"

type MapShellProps = {
  companies: Company[]
  selectedCompany: Company
  onSelectCompany: (slug: string) => void
  isAudioMuted: boolean
  onToggleMute: () => void
}

const SF_CENTER: [number, number] = [-122.4167, 37.7793]
const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
// Oblique camera reads closer to isometric / retro city builders.
const MAP_PITCH = 54
const MAP_BEARING = -24

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

// Helper to create a styled div
function sd(styles: Partial<CSSStyleDeclaration>) {
  const el = document.createElement("div")
  Object.assign(el.style, styles)
  return el
}

// Logo badge: category-colored frame + light inner pad so logos stay readable.
function makeLogoBadge(
  company: Company,
  active: boolean,
  dense: boolean,
  categoryColor: string
) {
  const OL = "#342414"
  const sz = dense ? (active ? 24 : 20) : active ? 28 : 24
  // border-box: inner pad = sz - borders - padding
  const innerSz = Math.max(8, sz - 8)
  const rawLogoSz = dense ? (active ? 18 : 14) : active ? 22 : 18
  const logoSz = Math.min(rawLogoSz, Math.max(6, innerSz - 2))
  const badge = sd({
    width: `${sz}px`,
    height: `${sz}px`,
    border: `2px solid ${OL}`,
    background: categoryColor,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px",
    boxSizing: "border-box",
    boxShadow: active
      ? `0 0 0 2px rgba(255,242,199,0.7), 2px 2px 0 ${OL}`
      : `2px 2px 0 ${OL}`,
    marginBottom: "2px",
    position: "relative",
    zIndex: "5",
  })
  const inner = sd({
    width: `${innerSz}px`,
    height: `${innerSz}px`,
    background: "#fffefc",
    border: `1px solid ${OL}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  })
  const img = document.createElement("img")
  img.src = getCompanyLogoUrl(company)
  img.alt = company.name
  Object.assign(img.style, {
    width: `${logoSz}px`,
    height: `${logoSz}px`,
    objectFit: "contain",
  })
  const monogram = getCompanyMonogram(company)
  img.addEventListener("error", () => {
    img.replaceWith(createFallback(monogram, active, dense))
  })
  inner.appendChild(img)
  badge.appendChild(inner)
  return badge
}

function createSpriteMarker(
  company: Company,
  active: boolean,
  dense: boolean
) {
  const accent = CATEGORY_COLORS[company.category]
  const OL = "#342414"
  // Robot body sizes
  const w = dense ? (active ? 28 : 22) : active ? 34 : 28
  const h = dense ? (active ? 34 : 26) : active ? 42 : 34
  const bw = active ? 3 : 2
  const badgeW = dense ? (active ? 24 : 20) : active ? 28 : 24

  const wrapper = sd({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  })

  // Logo badge on top
  wrapper.appendChild(makeLogoBadge(company, active, dense, accent))

  // High-contrast category bar (readable when markers overlap)
  wrapper.appendChild(
    sd({
      width: `${badgeW}px`,
      height: "5px",
      background: accent,
      border: `2px solid ${OL}`,
      marginTop: "-1px",
      marginBottom: "2px",
      boxShadow: `2px 2px 0 ${OL}`,
      position: "relative",
      zIndex: "4",
    })
  )

  // === ROBOT SPRITE (all companies) ===
  // Antenna
  const dotSz = Math.max(6, Math.round(w * 0.18))
  const antenna = sd({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "-2px",
    position: "relative",
    zIndex: "2",
  })
  antenna.appendChild(
    sd({
      width: `${dotSz}px`,
      height: `${dotSz}px`,
      background: accent,
      border: `2px solid ${OL}`,
    })
  )
  antenna.appendChild(
    sd({
      width: `${Math.max(3, Math.round(w * 0.08))}px`,
      height: `${Math.round(h * 0.2)}px`,
      background: "#8a8a9a",
      borderLeft: `2px solid ${OL}`,
      borderRight: `2px solid ${OL}`,
    })
  )
  wrapper.appendChild(antenna)

  // Robot head — cool gray so category accent pops on land and water.
  const head = sd({
    width: `${w}px`,
    height: `${Math.round(h * 0.5)}px`,
    background: "#9aa3b0",
    border: `${bw}px solid ${OL}`,
    boxShadow: `4px 4px 0 ${OL}`,
    position: "relative",
  })
  // Eyes (category colored)
  const eSz = Math.max(5, Math.round(w * 0.16))
  for (const side of ["left", "right"] as const) {
    head.appendChild(
      sd({
        position: "absolute",
        top: `${Math.round(h * 0.06)}px`,
        [side]: `${Math.round(w * 0.14)}px`,
        width: `${eSz}px`,
        height: `${eSz}px`,
        background: accent,
        border: `2px solid ${OL}`,
      })
    )
  }
  // Mouth
  head.appendChild(
    sd({
      position: "absolute",
      bottom: `${Math.round(h * 0.06)}px`,
      left: "50%",
      transform: "translateX(-50%)",
      width: `${Math.round(w * 0.45)}px`,
      height: `${Math.max(3, Math.round(h * 0.05))}px`,
      background: OL,
    })
  )
  wrapper.appendChild(head)

  // Robot body
  wrapper.appendChild(
    sd({
      width: `${Math.round(w * 0.75)}px`,
      height: `${Math.round(h * 0.3)}px`,
      background: "#8a92a2",
      border: `${bw}px solid ${OL}`,
      marginTop: "-2px",
    })
  )

  // Feet
  const feet = sd({
    display: "flex",
    gap: `${Math.round(w * 0.15)}px`,
    marginTop: "-1px",
  })
  for (let i = 0; i < 2; i++) {
    feet.appendChild(
      sd({
        width: `${Math.round(w * 0.28)}px`,
        height: `${Math.round(h * 0.1)}px`,
        background: "#6a6a7a",
        border: `2px solid ${OL}`,
      })
    )
  }
  wrapper.appendChild(feet)

  // Ground shadow (chunky pixel ellipse, no blur)
  wrapper.appendChild(
    sd({
      width: `${Math.round(w * 0.85)}px`,
      height: "6px",
      background: "rgba(52,36,20,0.35)",
      marginTop: "2px",
      boxShadow: "0 0 0 1px rgba(52,36,20,0.15)",
    })
  )

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
  isAudioMuted,
  onToggleMute,
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
      element.appendChild(createSpriteMarker(company, active, dense))
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
        button.replaceChildren(createSpriteMarker(company, active, dense))
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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#fff3cf]/35 to-transparent" />
      <div className="pointer-events-none absolute top-4 left-4 border-[3px] border-[#342414] bg-[#f4ecd2] px-4 py-3 shadow-[4px_4px_0px_#342414]">
        <div className="font-[family-name:var(--font-pixel)] text-[8px] uppercase tracking-wider text-[#9a4d30]">
          SF AI Startup Map
        </div>
        <p className="mt-1 max-w-[220px] text-[11px] leading-4 text-[#4c3926]">
          Isometric pixel view of source-backed SF office locations.
        </p>
      </div>
      <div className="absolute top-24 left-4 z-10">
        <Button
          type="button"
          onClick={onToggleMute}
          aria-label={isAudioMuted ? "Unmute audio" : "Mute audio"}
          className={cn(
            "size-10 border-[3px] border-[#342414] bg-[#f4ecd2] p-0 text-[#4c3926] shadow-[4px_4px_0px_#342414] hover:bg-[#e7d8ae]",
            !isAudioMuted && "audio-unmuted-btn",
          )}
        >
          {isAudioMuted ? (
            <VolumeX className="size-3.5" />
          ) : (
            <Volume2 className="volume-unmuted-icon size-3.5" />
          )}
        </Button>
      </div>
      <div className="pointer-events-none absolute right-4 top-16 hidden flex-col gap-1 lg:flex">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div
            key={cat}
            className="flex items-center gap-1.5 border-2 border-[#342414] bg-[#f4ecd2] px-2 py-1 shadow-[3px_3px_0px_rgba(52,36,20,0.75)]"
          >
            <div
              className="size-3 border-2 border-[#342414]"
              style={{ backgroundColor: color, boxShadow: "2px 2px 0 #342414" }}
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
