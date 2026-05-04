import type { Metadata } from "next"

import { MapLibreWorldSelect } from "@/components/map-libre-world-select"

export const metadata: Metadata = {
  title: "MapLibre Map: AI Startup Quest",
  description:
    "Compare the RPG world map with a MapLibre-powered world map city selector.",
}

export default function MapLibrePage() {
  return <MapLibreWorldSelect />
}
