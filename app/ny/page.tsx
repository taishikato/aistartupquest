import { Suspense } from "react"
import type { Metadata } from "next"

import { nyMapConfig } from "@/lib/city-config"
import { loadCityMapPageData } from "@/lib/city-page-data"
import { CityMap } from "@/components/city-map"

export const metadata: Metadata = {
  title: "New York AI Startup Map: Explore AI Native Startups in New York",
  description:
    "Browse AI-native startups across New York on an interactive retro map, with category filters, source-backed locations, and direct company links.",
}

export default async function Page() {
  const { companies } = await loadCityMapPageData("ny")

  return (
    <Suspense fallback={null}>
      <CityMap key="ny" companies={companies} config={nyMapConfig} />
    </Suspense>
  )
}
