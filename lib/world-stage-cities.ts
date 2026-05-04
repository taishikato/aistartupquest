import type { CityId } from "@/lib/city-config"

export type WorldStageCity = {
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

export const WORLD_STAGE_CITIES: WorldStageCity[] = [
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
