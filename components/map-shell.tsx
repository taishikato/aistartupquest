"use client"

import { useEffect, useRef, useState, type MutableRefObject } from "react"
import { Github, Volume2, VolumeX } from "lucide-react"
import maplibregl, {
  type ExpressionSpecification,
  type Map as MapLibreMap,
  type Marker,
  type StyleSpecification,
} from "maplibre-gl"

import type { CityMapConfig } from "@/lib/city-config"
import {
  CATEGORY_COLORS,
  getCompanyLogoUrl,
  getCompanyMonogram,
  type Company,
} from "@/lib/company"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CompanyRequestPanel } from "@/components/company-request-panel"
import { MeetupRequestPanel } from "@/components/meetup-request-panel"
import { PixelClouds } from "@/components/pixel-clouds"
import type { Meetup } from "@/lib/meetup"
import type { DiscoveryMode } from "@/lib/meetup"

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
const STARTUP_ROBOT_MONSTER_SRC = "/map-assets/startup-robot-monster.png"
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
  const skip =
    skipFirstBoundsRefitRef.current || skipNextBoundsRefitRef.current

  skipFirstBoundsRefitRef.current = false
  skipNextBoundsRefitRef.current = false

  return skip
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
    "road_pri_case_ramp",
    "road_trunk_case_ramp",
    "road_mot_case_ramp",
    "road_sec_case_noramp",
    "road_pri_case_noramp",
    "road_trunk_case_noramp",
    "road_mot_case_noramp",
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
    "tunnel_pri_case",
    "tunnel_trunk_case",
    "tunnel_mot_case",
  ]
  tunnelCases.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#645642")
  )

  const tunnelFills = [
    "tunnel_service_fill",
    "tunnel_minor_fill",
    "tunnel_sec_fill",
    "tunnel_pri_fill",
    "tunnel_trunk_fill",
    "tunnel_mot_fill",
  ]
  tunnelFills.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#887a5d")
  )

  const bridgeCases = [
    "bridge_service_case",
    "bridge_minor_case",
    "bridge_sec_case",
    "bridge_pri_case",
    "bridge_trunk_case",
    "bridge_mot_case",
  ]
  bridgeCases.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#473c2e")
  )

  const bridgeFills = [
    "bridge_service_fill",
    "bridge_minor_fill",
    "bridge_sec_fill",
    "bridge_pri_fill",
    "bridge_trunk_fill",
    "bridge_mot_fill",
  ]
  bridgeFills.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#978567")
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
    "place_city_dot_z7",
    "place_capital_dot_z7",
  ]
  cityDots.forEach((id) => {
    setPaintPropertyIfLayerExists(map, id, "text-color", "#2e2418")
    setPaintPropertyIfLayerExists(map, id, "text-halo-color", "#d9cb97")
    setPaintPropertyIfLayerExists(map, id, "text-halo-width", 1.5)
  })

  setPaintPropertyIfLayerExists(map, "place_state", "text-color", "#6b5a46")
  setPaintPropertyIfLayerExists(map, "place_country_1", "text-color", "#4f3f2d")
  setPaintPropertyIfLayerExists(map, "place_country_2", "text-color", "#4f3f2d")

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

  setPaintPropertyIfLayerExists(map, "poi_park", "text-color", "#346a28")
  setPaintPropertyIfLayerExists(map, "poi_stadium", "text-color", "#5a4a3a")

  setPaintPropertyIfLayerExists(map, "aeroway-runway", "line-color", "#8b8371")
  setPaintPropertyIfLayerExists(map, "aeroway-taxiway", "line-color", "#9d927e")
}

// Helper to create a styled div
function sd(styles: Partial<CSSStyleDeclaration>) {
  const el = document.createElement("div")
  Object.assign(el.style, styles)
  return el
}

function getMarkerFloatTiming(slug: string) {
  let hash = 0
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) % 10000
  }

  return {
    duration: `${3.9 + (hash % 7) * 0.16}s`,
    delay: `${((hash >> 1) % 9) * -0.35}s`,
  }
}

function createFloatingMarkerFrame(company: Company) {
  return createFloatingMarkerFrameFromSlug(company.slug)
}

function createFloatingMarkerFrameFromSlug(slug: string) {
  const { duration, delay } = getMarkerFloatTiming(slug)

  return sd({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animationName: "marker-float",
    animationDuration: duration,
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    animationDelay: delay,
    willChange: "transform",
  })
}

// Logo badge: category-colored frame + light inner pad so logos stay readable.
function makeLogoBadge(
  company: Company,
  active: boolean,
  dense: boolean,
  categoryColor: string
) {
  const OL = "#342414"
  const sz = dense ? (active ? 34 : 28) : active ? 42 : 34
  // border-box: inner pad = sz - borders - padding
  const innerSz = Math.max(18, sz - 6)
  const rawLogoSz = dense ? (active ? 27 : 22) : active ? 34 : 27
  const logoSz = Math.min(rawLogoSz, Math.max(14, innerSz - 3))
  const badge = sd({
    width: `${sz}px`,
    height: `${sz}px`,
    border: `1px solid ${OL}`,
    background: categoryColor,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1px",
    boxSizing: "border-box",
    boxShadow: active
      ? `0 0 0 1px rgba(255,242,199,0.75), 2px 2px 0 ${OL}`
      : `2px 2px 0 rgba(52,36,20,0.9)`,
    marginBottom: dense ? "-2px" : "-3px",
    position: "relative",
    zIndex: "7",
  })
  const inner = sd({
    width: `${innerSz}px`,
    height: `${innerSz}px`,
    background: "#fffefc",
    border: "0",
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

function createSpriteMarker(company: Company, active: boolean, dense: boolean) {
  const accent = CATEGORY_COLORS[company.category]
  const OL = "#342414"
  const monsterSize = dense ? (active ? 46 : 38) : active ? 58 : 48
  const badge = makeLogoBadge(company, active, dense, accent)

  const wrapper = sd({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  })
  const sprite = createFloatingMarkerFrame(company)

  const stage = sd({
    width: `${monsterSize}px`,
    height: `${monsterSize}px`,
    position: "relative",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    filter: active
      ? `drop-shadow(0 0 4px ${accent}) drop-shadow(3px 3px 0 ${OL})`
      : `drop-shadow(3px 3px 0 ${OL})`,
  })

  const monster = document.createElement("img")
  monster.src = STARTUP_ROBOT_MONSTER_SRC
  monster.alt = ""
  monster.draggable = false
  Object.assign(monster.style, {
    width: `${monsterSize}px`,
    height: `${monsterSize}px`,
    imageRendering: "pixelated",
    objectFit: "contain",
    pointerEvents: "none",
    userSelect: "none",
  })

  stage.appendChild(monster)
  sprite.appendChild(badge)
  sprite.appendChild(stage)

  sprite.appendChild(
    sd({
      width: `${Math.round(monsterSize * 0.48)}px`,
      height: dense ? "5px" : "6px",
      background: accent,
      border: `2px solid ${OL}`,
      marginTop: dense ? "-2px" : "-3px",
      boxShadow: `2px 2px 0 ${OL}`,
      position: "relative",
      zIndex: "4",
    })
  )

  wrapper.appendChild(sprite)

  wrapper.appendChild(
    sd({
      width: `${Math.round(monsterSize * 0.68)}px`,
      height: dense ? "5px" : "6px",
      background: "rgba(52,36,20,0.35)",
      marginTop: "1px",
      boxShadow: "0 0 0 1px rgba(52,36,20,0.15)",
    })
  )

  return wrapper
}

// YC / landmark: YC brand orange + cream trim — reads as "boss" vs neutral robots.
function makeBossLogoBadge(
  company: Company,
  active: boolean,
  dense: boolean,
  brandOrange: string,
  trimCream: string
) {
  const OL = "#342414"
  const sz = dense ? (active ? 30 : 24) : active ? 36 : 30
  const innerSz = Math.max(10, sz - 10)
  const rawLogoSz = dense ? (active ? 22 : 16) : active ? 26 : 20
  const logoSz = Math.min(rawLogoSz, Math.max(8, innerSz - 2))
  const badge = sd({
    width: `${sz}px`,
    height: `${sz}px`,
    border: `3px solid ${trimCream}`,
    background: brandOrange,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px",
    boxSizing: "border-box",
    boxShadow: active
      ? `0 0 0 2px rgba(255,248,240,0.95), 0 0 0 4px rgba(242,101,34,0.5), 3px 3px 0 ${OL}`
      : `3px 3px 0 ${OL}`,
    marginBottom: "2px",
    position: "relative",
    zIndex: "6",
  })
  const inner = sd({
    width: `${innerSz}px`,
    height: `${innerSz}px`,
    background: "#fff8f0",
    border: `2px solid ${OL}`,
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

function createBossSpriteMarker(
  company: Company,
  active: boolean,
  dense: boolean
) {
  // Y Combinator–style orange (high saturation, readable on the map).
  const orange = "#f26522"
  const orangeDeep = "#d94d12"
  const orangeMid = "#ea5a1a"
  const orangeLight = "#ff8f4d"
  const trimCream = "#fff8f0"
  const OL = "#342414"
  const eyeWhite = "#fffef8"
  const w = dense ? (active ? 36 : 30) : active ? 44 : 36
  const h = dense ? (active ? 46 : 38) : active ? 54 : 44
  const bw = active ? 3 : 2

  const wrapper = sd({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    filter: active ? "none" : "brightness(0.97)",
  })
  const sprite = createFloatingMarkerFrame(company)

  sprite.appendChild(
    makeBossLogoBadge(company, active, dense, orange, trimCream)
  )

  sprite.appendChild(
    sd({
      width: `${Math.round(w * 0.92)}px`,
      height: "6px",
      background: orangeDeep,
      border: `2px solid ${OL}`,
      marginTop: "-1px",
      marginBottom: "3px",
      boxShadow: `2px 2px 0 ${OL}, 0 0 8px rgba(242,101,34,0.55)`,
      position: "relative",
      zIndex: "5",
    })
  )

  const horns = sd({
    display: "flex",
    flexDirection: "row",
    gap: `${Math.round(w * 0.22)}px`,
    marginBottom: "-4px",
    position: "relative",
    zIndex: "3",
  })
  for (let i = 0; i < 2; i++) {
    horns.appendChild(
      sd({
        width: "0",
        height: "0",
        borderLeft: `${Math.round(w * 0.12)}px solid transparent`,
        borderRight: `${Math.round(w * 0.12)}px solid transparent`,
        borderBottom: `${Math.round(h * 0.14)}px solid ${orangeLight}`,
        filter: "drop-shadow(2px 2px 0 #342414)",
      })
    )
  }
  sprite.appendChild(horns)

  const head = sd({
    width: `${w}px`,
    height: `${Math.round(h * 0.52)}px`,
    background: orange,
    border: `${bw}px solid ${OL}`,
    boxShadow: active
      ? `5px 5px 0 ${OL}, 0 0 12px rgba(242,101,34,0.65)`
      : `5px 5px 0 ${OL}`,
    position: "relative",
  })

  const eSz = Math.max(6, Math.round(w * 0.2))
  for (const side of ["left", "right"] as const) {
    head.appendChild(
      sd({
        position: "absolute",
        top: `${Math.round(h * 0.07)}px`,
        [side]: `${Math.round(w * 0.1)}px`,
        width: `${eSz}px`,
        height: `${eSz}px`,
        background: eyeWhite,
        border: `2px solid ${OL}`,
        boxShadow: "inset -1px -1px 0 rgba(0,0,0,0.12)",
      })
    )
  }

  head.appendChild(
    sd({
      position: "absolute",
      bottom: `${Math.round(h * 0.07)}px`,
      left: "50%",
      transform: "translateX(-50%)",
      width: `${Math.round(w * 0.52)}px`,
      height: `${Math.max(4, Math.round(h * 0.06))}px`,
      background: OL,
      borderTop: `2px solid ${orangeDeep}`,
    })
  )
  sprite.appendChild(head)

  const shoulders = sd({
    display: "flex",
    flexDirection: "row",
    gap: `${Math.round(w * 0.08)}px`,
    marginTop: "-3px",
  })
  for (let i = 0; i < 2; i++) {
    shoulders.appendChild(
      sd({
        width: `${Math.round(w * 0.42)}px`,
        height: `${Math.round(h * 0.12)}px`,
        background: orangeMid,
        border: `2px solid ${OL}`,
        boxShadow: `2px 2px 0 ${OL}`,
      })
    )
  }
  sprite.appendChild(shoulders)

  sprite.appendChild(
    sd({
      width: `${Math.round(w * 0.72)}px`,
      height: `${Math.round(h * 0.28)}px`,
      background: orangeDeep,
      border: `${bw}px solid ${OL}`,
      marginTop: "-2px",
      boxShadow: `inset 0 -6px 0 rgba(180,60,10,0.35)`,
    })
  )

  const feet = sd({
    display: "flex",
    gap: `${Math.round(w * 0.18)}px`,
    marginTop: "-1px",
  })
  for (let i = 0; i < 2; i++) {
    feet.appendChild(
      sd({
        width: `${Math.round(w * 0.3)}px`,
        height: `${Math.round(h * 0.11)}px`,
        background: orangeDeep,
        border: `2px solid ${OL}`,
      })
    )
  }
  sprite.appendChild(feet)

  wrapper.appendChild(sprite)

  wrapper.appendChild(
    sd({
      width: `${Math.round(w * 0.95)}px`,
      height: "8px",
      background: "rgba(52,36,20,0.35)",
      marginTop: "3px",
      boxShadow: "0 0 0 1px rgba(242,101,34,0.25)",
    })
  )

  return wrapper
}

function createMarkerSprite(company: Company, active: boolean, dense: boolean) {
  if (company.mapSprite === "boss") {
    return createBossSpriteMarker(company, active, dense)
  }

  return createSpriteMarker(company, active, dense)
}

function createMeetupSignboardMarker(
  meetup: Meetup,
  active: boolean,
  dense: boolean
) {
  const OL = "#342414"
  const wood = active ? "#b77438" : "#95602f"
  const woodDark = "#5c3a1e"
  const paper = active ? "#f5e7bf" : "#ead9ab"
  const paperLine = "#8c6b3d"
  const plank = dense ? (active ? 24 : 22) : active ? 28 : 24
  const h = dense ? (active ? 30 : 28) : active ? 36 : 32

  const wrapper = sd({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  })

  const float = createFloatingMarkerFrameFromSlug(meetup.slug)

  const posts = sd({
    display: "flex",
    flexDirection: "row",
    gap: `${Math.round(plank * 0.34)}px`,
    marginBottom: "-3px",
  })
  for (let i = 0; i < 2; i++) {
    posts.appendChild(
      sd({
        width: `${Math.max(3, Math.round(plank * 0.12))}px`,
        height: `${Math.round(h * 0.3)}px`,
        background: woodDark,
        border: `2px solid ${OL}`,
      })
    )
  }
  float.appendChild(posts)

  const board = sd({
    width: `${plank}px`,
    minHeight: `${h}px`,
    background: wood,
    border: `${active ? 3 : 2}px solid ${OL}`,
    boxShadow: active
      ? `0 0 0 2px rgba(255,230,109,0.32), 3px 3px 0 ${OL}`
      : `3px 3px 0 ${OL}`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 3px",
    position: "relative",
  })

  board.appendChild(
    sd({
      position: "absolute",
      top: "3px",
      width: "5px",
      height: "5px",
      background: "#5a5a5a",
      border: `1px solid ${OL}`,
    })
  )

  const flyer = sd({
    width: `${Math.round(plank * 0.54)}px`,
    height: `${Math.round(h * 0.48)}px`,
    background: paper,
    border: `1px solid ${OL}`,
    boxSizing: "border-box",
    marginTop: "4px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
  })

  flyer.appendChild(
    sd({
      width: `${Math.round(plank * 0.24)}px`,
      height: `${Math.max(2, Math.round(h * 0.06))}px`,
      background: paperLine,
    })
  )
  flyer.appendChild(
    sd({
      width: `${Math.round(plank * 0.24)}px`,
      height: `${Math.round(plank * 0.24)}px`,
      border: `1px solid ${paperLine}`,
      boxSizing: "border-box",
      background: "rgba(255,255,255,0.16)",
    })
  )
  flyer.appendChild(
    sd({
      width: `${Math.round(plank * 0.2)}px`,
      height: `${Math.max(2, Math.round(h * 0.05))}px`,
      background: paperLine,
    })
  )
  board.appendChild(flyer)

  float.appendChild(board)
  wrapper.appendChild(float)

  wrapper.appendChild(
    sd({
      width: `${Math.round(plank * 0.9)}px`,
      height: "5px",
      background: "rgba(52,36,20,0.35)",
      marginTop: "2px",
    })
  )

  return wrapper
}

function createFallback(monogram: string, active: boolean, dense: boolean) {
  const el = document.createElement("span")
  el.textContent = monogram
  el.style.fontSize = dense
    ? active
      ? "13px"
      : "11px"
    : active
      ? "16px"
      : "13px"
  el.style.fontWeight = "700"
  el.style.lineHeight = "1"
  el.style.color = "#342414"
  return el
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

  useEffect(() => {
    selectedSlugRef.current =
      mode === "startups"
        ? selectedCompany.slug
        : selectedMeetup?.slug ?? ""
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
      meetups.forEach((meetup) => {
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

      const markerSetSignature = [...meetups]
        .map((m) => m.slug)
        .sort()
        .join("|")
      const modeMarkerSetSignature = `meetups:${markerSetSignature}`
      const shouldRefit =
        modeMarkerSetSignature !== mapMarkersSignatureRef.current &&
        meetups.length > 0
      mapMarkersSignatureRef.current = modeMarkerSetSignature

      if (shouldRefit) {
        if (
          !shouldSkipBoundsRefit(
            skipFirstBoundsRefitRef,
            skipNextBoundsRefitRef
          )
        ) {
          const bounds = new maplibregl.LngLatBounds()
          meetups.forEach((m) => bounds.extend(m.coordinates))

          if (meetups.length === 1) {
            map.jumpTo({
              center: meetups[0].coordinates,
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
    prevModeRef.current = mode
  }, [
    companies,
    denseMeetups,
    denseStartups,
    mapReady,
    meetups,
    mode,
    onSelectCompany,
    onSelectMeetup,
  ])

  useEffect(() => {
    if (mode === "startups") {
      const dense = denseStartups
      markersRef.current.forEach((marker, slug) => {
        const button = marker.getElement() as HTMLButtonElement
        const active = slug === selectedCompany.slug
        const company = companies.find((item) => item.slug === slug)

        button.style.zIndex = active ? "10" : "1"
        if (company) {
          button.replaceChildren(createMarkerSprite(company, active, dense))
        }
      })
    } else {
      const dense = denseMeetups
      markersRef.current.forEach((marker, slug) => {
        const button = marker.getElement() as HTMLButtonElement
        const active = slug === selectedMeetup?.slug
        const meetup = meetups.find((item) => item.slug === slug)

        button.style.zIndex = active ? "10" : "1"
        if (meetup) {
          button.replaceChildren(
            createMeetupSignboardMarker(meetup, active, dense)
          )
        }
      })
    }
  }, [
    companies,
    denseMeetups,
    denseStartups,
    meetups,
    mode,
    selectedCompany,
    selectedMeetup,
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
