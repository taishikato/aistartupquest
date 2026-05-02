import { Suspense } from "react"

import { sfMapConfig } from "@/lib/city-config"
import { loadCityMapPageData } from "@/lib/city-page-data"
import { CityMap } from "@/components/city-map"

export default async function Page() {
  const { companies } = await loadCityMapPageData("sf")

  return (
    <Suspense fallback={null}>
      <CityMap key="sf" companies={companies} config={sfMapConfig} />
    </Suspense>
  )
}
