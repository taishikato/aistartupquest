import { Suspense } from "react"
import type { Metadata } from "next"

import { CityMap } from "@/components/city-map"
import { sfMapConfig } from "@/lib/city-config"
import { loadCityMapPageData } from "@/lib/city-page-data"
import { buildPageMetadata, sfOgImage } from "@/lib/config"
import { buildOrganizationItemListJsonLd } from "@/lib/structured-data"

export const metadata: Metadata = buildPageMetadata({
  title: "SF AI Startup Map: Explore AI Native Startups in San Francisco",
  description:
    "Browse AI-native startups across San Francisco on an interactive retro map, with category filters, source-backed locations, and direct company links.",
  path: "/sf",
  image: sfOgImage,
})

export default async function Page() {
  const { companies } = await loadCityMapPageData("sf")
  const jsonLd = buildOrganizationItemListJsonLd(companies)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <CityMap key="sf" companies={companies} config={sfMapConfig} />
      </Suspense>
    </>
  )
}
