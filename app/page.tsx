import type { Metadata } from "next"
import { Suspense } from "react"

import { HomeEventsMap } from "@/components/home-events-map"
import { buildPageMetadata } from "@/lib/config"
import cursorCommunityEvents from "@/lib/data/cursor-community-events.json"
import {
  buildEventItemListJsonLd,
  selectUpcomingEvents,
} from "@/lib/structured-data"

export const metadata: Metadata = buildPageMetadata({
  title: "AI Startup Quest: AI Events & Startup World Map",
  description:
    "Explore Cursor community events worldwide, then jump into city AI startup maps for San Francisco, Toronto, New York, London, Vancouver, and Tokyo.",
  path: "/",
})

export default function Page() {
  const upcomingEvents = selectUpcomingEvents(cursorCommunityEvents.events)
  const jsonLd = buildEventItemListJsonLd(upcomingEvents)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <HomeEventsMap />
      </Suspense>
    </>
  )
}
