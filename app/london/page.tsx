import { Suspense } from "react"
import type { Metadata } from "next"

import { CityMap } from "@/components/city-map"
import { londonMapConfig } from "@/lib/city-config"
import { loadCityMapPageData } from "@/lib/city-page-data"
import { buildPageMetadata } from "@/lib/config"
import { buildOrganizationItemListJsonLd } from "@/lib/structured-data"

export const metadata: Metadata = buildPageMetadata({
  title: "London AI Startup Map: Explore AI Native Startups in London",
  description:
    "Browse AI-native startups across London on an interactive map, with category filters, source-backed locations, and direct company links.",
  path: "/london",
})

export default async function Page() {
  const { companies } = await loadCityMapPageData("london")
  const jsonLd = buildOrganizationItemListJsonLd(companies)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <CityMap key="london" companies={companies} config={londonMapConfig} />
      </Suspense>
    </>
  )
}
