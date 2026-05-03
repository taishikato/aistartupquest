import type { CityId } from "@/lib/city-config"
import { companyFromRow } from "@/lib/company"
import { createAdminClient } from "@/lib/supabase/admin"

export async function loadCityMapPageData(city: CityId) {
  const supabase = createAdminClient()

  const companiesResult = await supabase
    .from("companies")
    .select(
      "slug, name, website, short_description, category, location_label, city, latitude, longitude, founded, logo_url, map_sprite, source_url"
    )
    .match({ city })
    .order("name")

  if (companiesResult.error) {
    throw new Error(
      `Failed to load companies: ${companiesResult.error.message}`
    )
  }

  const companies = (companiesResult.data ?? []).map(companyFromRow)

  return { companies }
}
