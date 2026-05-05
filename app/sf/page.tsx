import { Suspense } from "react"
import type { Metadata } from "next"

import { sfMapConfig } from "@/lib/city-config"
import { loadCityMapPageData } from "@/lib/city-page-data"
import { CityMap } from "@/components/city-map"

export const metadata: Metadata = {
  title: "SF AI Startup Map: Explore AI Native Startups in San Francisco",
  description:
    "Browse AI-native startups across San Francisco on an interactive retro map, with category filters, source-backed locations, and direct company links.",
}

export default async function Page() {
  const { companies } = await loadCityMapPageData("sf")

  return (
    <Suspense fallback={null}>
      <CityMap key="sf" companies={companies} config={sfMapConfig} />
    </Suspense>
  )
}
