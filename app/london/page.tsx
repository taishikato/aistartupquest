import { Suspense } from "react"
import type { Metadata } from "next"

import { londonMapConfig } from "@/lib/city-config"
import { loadCityMapPageData } from "@/lib/city-page-data"
import { CityMap } from "@/components/city-map"

export const metadata: Metadata = {
  title: "London AI Startup Map: Explore AI Native Startups in London",
  description:
    "Browse AI-native startups across London on an interactive map, with category filters, source-backed locations, and direct company links.",
}

export default async function Page() {
  const { companies } = await loadCityMapPageData("london")

  return (
    <Suspense fallback={null}>
      <CityMap key="london" companies={companies} config={londonMapConfig} />
    </Suspense>
  )
}
