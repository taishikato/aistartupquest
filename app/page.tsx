import type { Metadata } from "next"
import { Suspense } from "react"

import { buildPageMetadata } from "@/lib/config"
import { HomeEventsMap } from "@/components/home-events-map"

export const metadata: Metadata = buildPageMetadata({
  title: "AI Startup Quest: AI Events & Startup World Map",
  description:
    "Explore Cursor community events worldwide, then jump into city AI startup maps for San Francisco, Toronto, New York, London, Vancouver, and Tokyo.",
  path: "/",
})

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomeEventsMap />
    </Suspense>
  )
}
