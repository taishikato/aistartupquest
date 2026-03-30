import { companyFromRow } from "@/lib/company"
import { createClient } from "@/lib/supabase/server"
import { SfAiMap } from "@/components/sf-ai-map"

export default async function Page() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("companies")
    .select(
      "slug, name, website, short_description, category, location_label, city, latitude, longitude, founded, logo_url, map_sprite, source_url"
    )
    .match({ city: "sf" })
    .order("name")

  if (error) throw new Error(`Failed to load companies: ${error.message}`)

  return <SfAiMap companies={(data ?? []).map(companyFromRow)} />
}
