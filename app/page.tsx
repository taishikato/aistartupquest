import type { Metadata } from "next"

import { WorldMapSelect } from "@/components/world-map-select"

export const metadata: Metadata = {
  title: "AI Startup Quest: Choose a City Startup Map",
  description:
    "Choose a city stage and jump into an AI startup map for San Francisco, Toronto, New York, London, Vancouver, or Tokyo.",
}

export default function Page() {
  return <WorldMapSelect />
}
