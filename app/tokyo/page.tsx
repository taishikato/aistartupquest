import { Suspense } from "react"
import type { Metadata } from "next"

import { tokyoMapConfig } from "@/lib/city-config"
import { loadCityMapPageData } from "@/lib/city-page-data"
import { buildPageMetadata } from "@/lib/config"
import { CityMap } from "@/components/city-map"

export const metadata: Metadata = buildPageMetadata({
  title: "Tokyo AI Startup Map: Explore AI Native Startups in Tokyo",
  description:
    "Browse AI-native startups across Tokyo on an interactive map, with category filters, source-backed locations, and direct company links.",
  path: "/tokyo",
})

export default async function Page() {
  const { companies } = await loadCityMapPageData("tokyo")

  return (
    <Suspense fallback={null}>
      <CityMap key="tokyo" companies={companies} config={tokyoMapConfig} />
    </Suspense>
  )
}
