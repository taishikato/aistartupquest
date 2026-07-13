import { Suspense } from "react"
import type { Metadata } from "next"

import { CityMap } from "@/components/city-map"
import { nyMapConfig } from "@/lib/city-config"
import { loadCityMapPageData } from "@/lib/city-page-data"
import { buildPageMetadata } from "@/lib/config"
import { buildOrganizationItemListJsonLd } from "@/lib/structured-data"

export const metadata: Metadata = buildPageMetadata({
  title: "New York AI Startup Map: Explore AI Native Startups in New York",
  description:
    "Browse AI-native startups across New York on an interactive retro map, with category filters, source-backed locations, and direct company links.",
  path: "/ny",
})

export default async function Page() {
  const { companies } = await loadCityMapPageData("ny")
  const jsonLd = buildOrganizationItemListJsonLd(companies)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <CityMap key="ny" companies={companies} config={nyMapConfig} />
      </Suspense>
    </>
  )
}
