import { Suspense } from "react"
import type { Metadata } from "next"

import { torontoMapConfig } from "@/lib/city-config"
import { loadCityMapPageData } from "@/lib/city-page-data"
import { buildPageMetadata } from "@/lib/config"
import { CityMap } from "@/components/city-map"

export const metadata: Metadata = buildPageMetadata({
  title: "Toronto AI Startup Map: Explore AI Native Startups in Toronto",
  description:
    "Browse AI-native startups across Toronto on an interactive retro map, with category filters, source-backed locations, and direct company links.",
  path: "/toronto",
})

export default async function Page() {
  const { companies } = await loadCityMapPageData("toronto")

  return (
    <Suspense fallback={null}>
      <CityMap key="toronto" companies={companies} config={torontoMapConfig} />
    </Suspense>
  )
}
