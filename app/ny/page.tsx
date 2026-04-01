import { Suspense } from "react"
import type { Metadata } from "next"

import { nyMapConfig } from "@/lib/city-config"
import { companyFromRow } from "@/lib/company"
import { createAdminClient } from "@/lib/supabase/admin"
import { CityMap } from "@/components/city-map"

export const metadata: Metadata = {
  title: "New York AI Startup Map: Explore AI Native Startups in New York",
  description:
    "Browse AI-native startups across New York on an interactive retro map, with category filters, source-backed locations, and direct company links.",
}

export default async function Page() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("companies")
    .select(
      "slug, name, website, short_description, category, location_label, city, latitude, longitude, founded, logo_url, map_sprite, source_url"
    )
    .match({ city: "ny" })
    .order("name")

  if (error) throw new Error(`Failed to load companies: ${error.message}`)

  return (
    <Suspense fallback={null}>
      <CityMap
        key="ny"
        companies={(data ?? []).map(companyFromRow)}
        config={nyMapConfig}
      />
    </Suspense>
  )
}
