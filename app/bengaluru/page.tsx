import { Suspense } from "react"
import type { Metadata } from "next"

import { bengaluruMapConfig } from "@/lib/city-config"
import { loadCityMapPageData } from "@/lib/city-page-data"
import { buildPageMetadata } from "@/lib/config"
import { buildOrganizationItemListJsonLd } from "@/lib/structured-data"
import { CityMap } from "@/components/city-map"

export const metadata: Metadata = buildPageMetadata({
  title: "Bengaluru AI Startup Map: Explore AI Native Startups in Bangalore",
  description:
    "Browse AI-native startups across Bengaluru (Bangalore) on an interactive map, with category filters, source-backed locations, and direct company links.",
  path: "/bengaluru",
})

export default async function Page() {
  const { companies } = await loadCityMapPageData("bengaluru")
  const jsonLd = buildOrganizationItemListJsonLd(companies)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <CityMap
          key="bengaluru"
          companies={companies}
          config={bengaluruMapConfig}
        />
      </Suspense>
    </>
  )
}
