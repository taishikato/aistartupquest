"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import Image from "next/image"
import Link from "next/link"

import type { CityId } from "@/lib/city-config"
import { cn } from "@/lib/utils"

type WorldStageCity = {
  id: CityId
  href: string
  stage: string
  code: string
  name: string
  region: string
  tagline: string
  lat: number
  lon: number
  accent: string
  markerX?: number
  markerY?: number
}

type WorldFeatureCollection = {
  type: "FeatureCollection"
  features: WorldFeature[]
}

type WorldFeature = {
  type: "Feature"
  properties: {
    name?: string
    continent?: string
  }
  geometry: {
    type: "Polygon" | "MultiPolygon"
    coordinates: PolygonCoordinates | MultiPolygonCoordinates
  }
}

type Position = [number, number]
type PolygonCoordinates = Position[][]
type MultiPolygonCoordinates = Position[][][]

const WORLD_STAGE_CITIES: WorldStageCity[] = [
  {
    id: "sf",
    href: "/sf",
    stage: "Stage 01",
    code: "SF",
    name: "San Francisco",
    region: "United States",
    tagline: "Founders, labs, frontier models",
    lat: 37.7749,
    lon: -122.4194,
    accent: "#ff6b6b",
    markerX: 20,
    markerY: 54,
  },
  {
    id: "vancouver",
    href: "/vancouver",
    stage: "Stage 02",
    code: "VAN",
    name: "Vancouver",
    region: "Canada",
    tagline: "Robotics, climate, applied AI",
    lat: 49.2827,
    lon: -123.1207,
    accent: "#4ecdc4",
    markerX: 10,
    markerY: 33,
  },
  {
    id: "toronto",
    href: "/toronto",
    stage: "Stage 03",
    code: "TO",
    name: "Toronto",
    region: "Canada",
    tagline: "Research depth, enterprise AI",
    lat: 43.6532,
    lon: -79.3832,
    accent: "#ffe66d",
    markerX: 28,
    markerY: 36,
  },
  {
    id: "ny",
    href: "/ny",
    stage: "Stage 04",
    code: "NY",
    name: "New York",
    region: "United States",
    tagline: "Media, finance, creative tools",
    lat: 40.7128,
    lon: -74.006,
    accent: "#7bd88f",
    markerX: 36,
    markerY: 56,
  },
  {
    id: "london",
    href: "/london",
    stage: "Stage 05",
    code: "LDN",
    name: "London",
    region: "United Kingdom",
    tagline: "Agents, voice, regulated markets",
    lat: 51.5074,
    lon: -0.1278,
    accent: "#a78bfa",
    markerX: 50,
    markerY: 35,
  },
  {
    id: "tokyo",
    href: "/tokyo",
    stage: "Stage 06",
    code: "TKY",
    name: "Tokyo",
    region: "Japan",
    tagline: "Research, hardware, consumer AI",
    lat: 35.6762,
    lon: 139.6503,
    accent: "#f472b6",
    markerX: 88,
    markerY: 55,
  },
]

const WORLD_MAP_WIDTH = 1200
const WORLD_MAP_HEIGHT = 600

const CONTINENT_COLORS: Record<string, string> = {
  "North America": "#7bd88f",
  "South America": "#ffe66d",
  Europe: "#a78bfa",
  Africa: "#ff9f43",
  Asia: "#f472b6",
  Oceania: "#4ecdc4",
  Antarctica: "#f8faf7",
}

export function WorldMapSelect() {
  const [activeCityId, setActiveCityId] = useState<CityId>("sf")
  const activeCity = useMemo(
    () =>
      WORLD_STAGE_CITIES.find((city) => city.id === activeCityId) ??
      WORLD_STAGE_CITIES[0],
    [activeCityId]
  )

  return (
    <main className="grid h-dvh overflow-hidden bg-[#f8faf7] text-[#1a1a2e]">
      <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)]">
        <header className="border-b-3 border-[#1a1a2e] bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-3"
              aria-label="AI Startup Quest home"
            >
              <Image
                src="/brand-mark.svg"
                alt=""
                width={34}
                height={34}
                className="shrink-0"
                priority
              />
              <span className="truncate font-(family-name:--font-pixel) text-[11px] leading-5 text-[#1a1a2e] sm:text-sm">
                AI Startup Quest
              </span>
            </Link>
            <Link
              href="/"
              className="border-2 border-[#1a1a2e] bg-[#ffe66d] px-3 py-2 font-(family-name:--font-pixel) text-[8px] text-[#1a1a2e] shadow-[3px_3px_0_#1a1a2e] transition-colors hover:bg-[#fff4a8] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4ecdc4] sm:text-[9px]"
            >
              3D Globe
            </Link>
          </div>
        </header>

        <section className="mx-auto grid min-h-0 w-full max-w-7xl grid-rows-[minmax(0,1fr)_minmax(190px,0.62fr)] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:grid-rows-1 lg:gap-6 lg:py-6">
          <div className="relative min-h-0 overflow-hidden border-3 border-[#1a1a2e] bg-[#5aa0d8] shadow-[6px_6px_0_#1a1a2e]">
            <div className="absolute top-4 left-4 z-20 border-2 border-[#1a1a2e] bg-[#ffe66d] px-3 py-2 font-(family-name:--font-pixel) text-[8px] text-[#1a1a2e] shadow-[3px_3px_0_#ff6b6b]">
              World Map
            </div>
            <div className="absolute right-4 bottom-4 z-20 border-2 border-[#1a1a2e] bg-white px-3 py-2 shadow-[3px_3px_0_#4ecdc4]">
              <div className="font-(family-name:--font-pixel) text-[8px] text-[#ff6b6b]">
                {activeCity.stage}
              </div>
              <div className="mt-1 font-(family-name:--font-pixel) text-[11px] text-[#1a1a2e]">
                {activeCity.name}
              </div>
            </div>

            <WorldMapCanvas
              cities={WORLD_STAGE_CITIES}
              activeCity={activeCity}
              onActiveCityChange={setActiveCityId}
            />
          </div>

          <aside className="flex min-h-0 flex-col border-3 border-[#1a1a2e] bg-white text-[#1a1a2e] shadow-[6px_6px_0_#4ecdc4]">
            <div className="shrink-0 border-b-2 border-[#1a1a2e] px-4 py-4">
              <p className="font-(family-name:--font-pixel) text-[8px] text-[#0f8f87]">
                Select Stage
              </p>
              <h1 className="mt-3 font-(family-name:--font-pixel) text-base leading-7 text-[#1a1a2e] sm:text-lg">
                City Startup Map
              </h1>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="grid gap-3">
                {WORLD_STAGE_CITIES.map((city) => {
                  const isActive = city.id === activeCity.id
                  return (
                    <Link
                      key={city.id}
                      href={city.href}
                      onMouseEnter={() => setActiveCityId(city.id)}
                      onFocus={() => setActiveCityId(city.id)}
                      className={cn(
                        "grid grid-cols-[64px_minmax(0,1fr)] gap-3 border-2 p-3 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4ecdc4]",
                        isActive
                          ? "border-[#1a1a2e] bg-[#fff4a8] shadow-[4px_4px_0_#1a1a2e]"
                          : "border-[#1a1a2e] bg-[#f8faf7] hover:bg-[#e9fbf8]"
                      )}
                      aria-label={`Open ${city.name} AI Startup Map`}
                    >
                      <div
                        className="grid h-12 place-items-center border-2 border-[#1a1a2e] font-(family-name:--font-pixel) text-[10px] text-[#1a1a2e] shadow-[3px_3px_0_#0f1022]"
                        style={{ backgroundColor: city.accent }}
                      >
                        {city.code}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-(family-name:--font-pixel) text-[7px] text-[#4ecdc4]">
                            {city.stage}
                          </span>
                          <span className="font-(family-name:--font-pixel) text-[6px] text-[#1a1a2e]/50">
                            Ready
                          </span>
                        </div>
                        <h2 className="mt-2 truncate font-(family-name:--font-pixel) text-[10px] text-[#1a1a2e]">
                          {city.name}
                        </h2>
                        <p className="mt-1 truncate text-xs text-[#1a1a2e]/65">
                          {city.region} / {city.tagline}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

function WorldMapCanvas({
  cities,
  activeCity,
  onActiveCityChange,
}: {
  cities: WorldStageCity[]
  activeCity: WorldStageCity
  onActiveCityChange: (city: CityId) => void
}) {
  const [worldData, setWorldData] = useState<WorldFeatureCollection | null>(
    null
  )

  useEffect(() => {
    let cancelled = false

    fetch("/world-countries.geojson")
      .then((response) => response.json() as Promise<WorldFeatureCollection>)
      .then((data) => {
        if (!cancelled) {
          setWorldData(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWorldData({ type: "FeatureCollection", features: [] })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const countryPaths = useMemo(() => {
    return (
      worldData?.features.map((feature, index) => ({
        id: `${feature.properties.name ?? "country"}-${index}`,
        d: geometryToPath(feature.geometry),
        fill: CONTINENT_COLORS[feature.properties.continent ?? ""] ?? "#d6c99a",
      })) ?? []
    )
  }, [worldData])

  return (
    <div className="absolute inset-0 flex items-start justify-center px-3 pt-20 pb-5 sm:px-5 sm:pt-24 sm:pb-8">
      <div className="relative aspect-video max-h-full w-full max-w-[1160px] overflow-hidden border-2 border-[#1a1a2e] bg-[#4b83c2] shadow-[4px_4px_0_#1a1a2e]">
        <svg
          viewBox={`0 0 ${WORLD_MAP_WIDTH} ${WORLD_MAP_HEIGHT}`}
          role="img"
          aria-label="World map with selectable startup city stages"
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect
            width={WORLD_MAP_WIDTH}
            height={WORLD_MAP_HEIGHT}
            fill="#4b83c2"
          />
          <g opacity="0.2">
            {Array.from({ length: 11 }, (_, index) => (
              <line
                key={`lat-${index}`}
                x1="0"
                x2={WORLD_MAP_WIDTH}
                y1={index * 60}
                y2={index * 60}
                stroke="#f8faf7"
                strokeWidth="2"
              />
            ))}
            {Array.from({ length: 13 }, (_, index) => (
              <line
                key={`lon-${index}`}
                x1={index * 100}
                x2={index * 100}
                y1="0"
                y2={WORLD_MAP_HEIGHT}
                stroke="#1a1a2e"
                strokeWidth="1.5"
              />
            ))}
          </g>
          <g stroke="#342414" strokeLinejoin="miter" strokeWidth="2.2">
            {countryPaths.map((country) => (
              <path key={country.id} d={country.d} fill={country.fill} />
            ))}
          </g>
          <g opacity="0.18">
            {countryPaths.map((country) => (
              <path
                key={`${country.id}-shade`}
                d={country.d}
                fill="none"
                stroke="#f8faf7"
                strokeWidth="0.9"
              />
            ))}
          </g>
        </svg>
        <div className="absolute inset-0">
          {cities.map((city) => {
            const isActive = city.id === activeCity.id
            const position = projectCity(city)
            return (
              <Link
                key={city.id}
                href={city.href}
                onMouseEnter={() => onActiveCityChange(city.id)}
                onFocus={() => onActiveCityChange(city.id)}
                className="absolute z-20 flex -translate-x-1/2 -translate-y-full flex-col items-center text-[#1a1a2e] no-underline transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4ecdc4]"
                style={
                  {
                    left: `${city.markerX ?? position.x}%`,
                    top: `${city.markerY ?? position.y}%`,
                    transform: `translate(-50%, -100%) scale(${
                      isActive ? 1.14 : 1
                    })`,
                  } as CSSProperties
                }
                aria-label={`Open ${city.name} AI Startup Map`}
              >
                <span
                  className="grid h-6 min-w-8 place-items-center border-2 border-[#1a1a2e] px-2 font-(family-name:--font-pixel) text-[8px] leading-none shadow-[3px_3px_0_#1a1a2e] max-sm:h-5 max-sm:min-w-6 max-sm:px-1 max-sm:text-[6px]"
                  style={{
                    backgroundColor: isActive ? "#ffe66d" : "#fffefc",
                    boxShadow: isActive
                      ? `0 0 0 2px ${city.accent}, 4px 4px 0 #1a1a2e`
                      : "3px 3px 0 #1a1a2e",
                  }}
                >
                  {city.code}
                </span>
                <span
                  className="-mt-px h-2.5 w-2 border-x-2 border-[#1a1a2e] max-sm:h-2 max-sm:w-1.5"
                  style={{ backgroundColor: city.accent }}
                />
                <span
                  className="h-1.5 w-4 border-2 border-[#1a1a2e] shadow-[2px_2px_0_#1a1a2e] max-sm:h-1 max-sm:w-3"
                  style={{
                    backgroundColor: isActive ? "#ffe66d" : city.accent,
                  }}
                />
              </Link>
            )
          })}
        </div>
        <div className="pointer-events-none absolute inset-0 border-[10px] border-[#1a1a2e]/8" />
      </div>
    </div>
  )
}

function geometryToPath(geometry: WorldFeature["geometry"]) {
  if (geometry.type === "Polygon") {
    return polygonToPath(geometry.coordinates as PolygonCoordinates)
  }

  return (geometry.coordinates as MultiPolygonCoordinates)
    .map((polygon) => polygonToPath(polygon))
    .join(" ")
}

function polygonToPath(polygon: PolygonCoordinates) {
  return polygon
    .map((ring) => {
      const commands = ring.map(([lon, lat], index) => {
        const { x, y } = projectLonLat(lon, lat)
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`
      })

      return `${commands.join(" ")} Z`
    })
    .join(" ")
}

function projectCity(city: WorldStageCity) {
  const { x, y } = projectLonLat(city.lon, city.lat)

  return {
    x: (x / WORLD_MAP_WIDTH) * 100,
    y: (y / WORLD_MAP_HEIGHT) * 100,
  }
}

function projectLonLat(lon: number, lat: number) {
  return {
    x: ((lon + 180) / 360) * WORLD_MAP_WIDTH,
    y: ((90 - lat) / 180) * WORLD_MAP_HEIGHT,
  }
}
