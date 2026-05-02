import { Suspense } from "react"
import type { Metadata } from "next"

import { vancouverMapConfig } from "@/lib/city-config"
import { loadCityMapPageData } from "@/lib/city-page-data"
import { CityMap } from "@/components/city-map"

export const metadata: Metadata = {
  title: "Vancouver AI Startup Map: Explore AI Native Startups in Vancouver",
  description:
    "Browse AI-native startups across Vancouver on an interactive map, with category filters, source-backed locations, and direct company links.",
}

export default async function Page() {
  const { companies } = await loadCityMapPageData("vancouver")

  return (
    <Suspense fallback={null}>
      <CityMap
        key="vancouver"
        companies={companies}
        config={vancouverMapConfig}
      />
    </Suspense>
  )
}
