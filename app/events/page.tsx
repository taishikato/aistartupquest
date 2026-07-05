import type { Metadata } from "next"

import { EventsWorldMap } from "@/components/events-world-map"

export const metadata: Metadata = {
  title: "Cursor Community Events World Map: AI Startup Quest",
  description:
    "Explore Cursor community events worldwide on the AI Startup Quest pixel-art world map.",
}

export default function EventsPage() {
  return <EventsWorldMap />
}
