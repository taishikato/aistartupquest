import { Suspense } from "react"
import type { Metadata } from "next"

import { CityMap } from "@/components/city-map"
import { vancouverMapConfig } from "@/lib/city-config"
import { loadCityMapPageData } from "@/lib/city-page-data"
import { buildPageMetadata } from "@/lib/config"
import { buildOrganizationItemListJsonLd } from "@/lib/structured-data"

export const metadata: Metadata = buildPageMetadata({
  title: "Vancouver AI Startup Map: Explore AI Native Startups in Vancouver",
  description:
    "Browse AI-native startups across Vancouver on an interactive map, with category filters, source-backed locations, and direct company links.",
  path: "/vancouver",
})

export default async function Page() {
  const { companies } = await loadCityMapPageData("vancouver")
  const jsonLd = buildOrganizationItemListJsonLd(companies)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <CityMap
          key="vancouver"
          companies={companies}
          config={vancouverMapConfig}
        />
      </Suspense>
    </>
  )
}
