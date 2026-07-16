import type { Metadata } from "next"
import { Suspense } from "react"

import { HomeEventsMap } from "@/components/home-events-map"
import { buildPageMetadata } from "@/lib/config"
import {
  groupEventsByCity,
  toCommunityEvent,
} from "@/lib/events"
import { getUpcomingEvents } from "@/lib/events-query"
import { buildEventItemListJsonLd } from "@/lib/structured-data"

export const metadata: Metadata = buildPageMetadata({
  title: "AI Startup Quest: AI Events & Startup World Map",
  description:
    "Explore Cursor community events worldwide, then jump into city AI startup maps for San Francisco, Toronto, New York, London, Vancouver, and Tokyo.",
  path: "/",
})

export default async function Page() {
  const eventRows = await getUpcomingEvents()
  const upcomingCities = groupEventsByCity(eventRows)
  const upcomingEvents = eventRows.slice(0, 20).map(toCommunityEvent)
  const jsonLd = buildEventItemListJsonLd(upcomingEvents)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <HomeEventsMap upcomingCities={upcomingCities} />
      </Suspense>
    </>
  )
}
