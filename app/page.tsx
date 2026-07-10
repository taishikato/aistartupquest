import type { Metadata } from "next"

import { HomeEventsMap } from "@/components/home-events-map"

export const metadata: Metadata = {
  title: "AI Startup Quest: AI Events & Startup World Map",
  description:
    "Explore Cursor community events worldwide, then jump into city AI startup maps for San Francisco, Toronto, New York, London, Vancouver, and Tokyo.",
}

export default function Page() {
  return <HomeEventsMap />
}
