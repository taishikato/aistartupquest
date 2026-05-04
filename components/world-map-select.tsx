"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import type { CityId } from "@/lib/city-config"

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
  signDx?: number
  signDy?: number
}

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
    signDx: -24,
    signDy: 12,
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
    signDx: -8,
    signDy: -10,
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
    signDx: -15,
    signDy: -4,
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
    signDx: 18,
    signDy: 4,
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
  },
]

const WORLD_MAP_WIDTH = 1200
const WORLD_MAP_HEIGHT = 600

export function WorldMapSelect() {
  const [activeCityId, setActiveCityId] = useState<CityId>("sf")
  const activeCity = useMemo(
    () =>
      WORLD_STAGE_CITIES.find((city) => city.id === activeCityId) ??
      WORLD_STAGE_CITIES[0],
    [activeCityId]
  )

  return (
    <main className="relative h-dvh overflow-hidden bg-[#1439b8] text-[#1a1a2e]">
      <WorldMapCanvas
        cities={WORLD_STAGE_CITIES}
        activeCity={activeCity}
        onActiveCityChange={setActiveCityId}
      />

      <header className="pointer-events-none absolute top-0 right-0 left-0 z-30 flex items-start gap-3 p-4 sm:p-6">
        <Link
          href="/"
          className="pointer-events-auto flex min-w-0 items-center gap-3 border-2 border-[#1a1a2e] bg-white px-3 py-2 shadow-[4px_4px_0_#1a1a2e]"
          aria-label="AI Startup Quest home"
        >
          <Image
            src="/brand-mark.svg"
            alt=""
            width={30}
            height={30}
            className="shrink-0"
            priority
          />
          <span className="hidden truncate font-(family-name:--font-pixel) text-[11px] leading-5 text-[#1a1a2e] sm:block">
            AI Startup Quest
          </span>
        </Link>
      </header>

      <div className="pointer-events-none absolute right-4 bottom-4 z-30 max-w-[min(360px,calc(100vw-32px))] border-2 border-[#1a1a2e] bg-white px-4 py-3 shadow-[4px_4px_0_#4ecdc4] sm:right-6 sm:bottom-6">
        <div className="font-(family-name:--font-pixel) text-[13px] leading-5 text-[#1a1a2e]">
          {activeCity.name}
        </div>
        <div className="mt-1 truncate text-xs text-[#1a1a2e]/65">
          {activeCity.region} / {activeCity.tagline}
        </div>
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
  return (
    <div className="absolute inset-0">
      <div className="relative h-full w-full overflow-hidden bg-[#062b72]">
        <svg
          viewBox={`0 0 ${WORLD_MAP_WIDTH} ${WORLD_MAP_HEIGHT}`}
          role="img"
          aria-label="World map with selectable startup city stages"
          className="h-full w-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern
              id="magic-ocean-sparkles"
              width="80"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <g opacity="0.82">
                <rect x="5" y="9" width="8" height="2" fill="#dff7ff" />
                <rect x="24" y="31" width="5" height="2" fill="#61c6ff" />
                <rect x="44" y="15" width="7" height="2" fill="#f5ffff" />
                <rect x="66" y="38" width="5" height="2" fill="#4ca8ef" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0 0; 24 -4; 0 0"
                  dur="9s"
                  repeatCount="indefinite"
                />
              </g>
            </pattern>
          </defs>
          <image
            href="/map-assets/rpg-world-map.webp"
            x="0"
            y="0"
            width={WORLD_MAP_WIDTH}
            height={WORLD_MAP_HEIGHT}
            preserveAspectRatio="xMidYMid slice"
          />
          <rect
            width={WORLD_MAP_WIDTH}
            height={WORLD_MAP_HEIGHT}
            fill="url(#magic-ocean-sparkles)"
            opacity="0.22"
          />
          <rect
            width={WORLD_MAP_WIDTH}
            height={WORLD_MAP_HEIGHT}
            fill="#06133a"
            opacity="0.06"
          />
          {cities.map((city) => {
            const isActive = city.id === activeCity.id
            const position = projectLonLat(city.lon, city.lat)
            return (
              <a
                key={city.id}
                href={city.href}
                onMouseEnter={() => onActiveCityChange(city.id)}
                onFocus={() => onActiveCityChange(city.id)}
                aria-label={`Open ${city.name} AI Startup Map`}
                className="focus:outline-none"
              >
                <g
                  transform={`translate(${position.x.toFixed(1)} ${position.y.toFixed(1)}) scale(${
                    isActive ? 1.14 : 1
                  })`}
                >
                  <WoodSignMarker
                    code={city.code}
                    signDx={city.signDx ?? 0}
                    signDy={city.signDy ?? 0}
                  />
                </g>
              </a>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function WoodSignMarker({
  code,
  signDx,
  signDy,
}: {
  code: string
  signDx: number
  signDy: number
}) {
  const labelWidth = code.length > 2 ? 48 : 40

  return (
    <>
      <line
        x1="0"
        y1="0"
        x2={signDx}
        y2={signDy + 2}
        stroke="#1a1a2e"
        strokeWidth="2"
        opacity="0.7"
      />
      <image
        href="/map-assets/city-sign-marker.png"
        x={signDx - 31}
        y={signDy - 47}
        width="62"
        height="62"
        preserveAspectRatio="xMidYMid meet"
      />
      <rect
        x={signDx - labelWidth / 2}
        y={signDy - 25}
        width={labelWidth}
        height="14"
        fill="rgba(60, 31, 18, 0.54)"
        stroke="#1a1a2e"
        strokeWidth="0.8"
        opacity="0.64"
      />
      <text
        x={signDx}
        y={signDy - 15}
        textAnchor="middle"
        fill="#fff4ce"
        fontSize="9.5"
        stroke="#1a1a2e"
        strokeWidth="0.5"
        paintOrder="stroke"
        style={{ fontFamily: "var(--font-pixel)" }}
      >
        {code}
      </text>
    </>
  )
}

function projectLonLat(lon: number, lat: number) {
  return {
    x: ((lon + 180) / 360) * WORLD_MAP_WIDTH,
    y: ((90 - lat) / 180) * WORLD_MAP_HEIGHT,
  }
}
