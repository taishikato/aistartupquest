import type { Database } from "@/types/supabase"

export const COMPANY_CATEGORIES = [
  "Core Labs",
  "Consumer AI",
  "Devtools",
  "Infra",
  "Agents",
  "Vertical AI",
] as const

export type CompanyCategory = (typeof COMPANY_CATEGORIES)[number]

export const CATEGORY_COLORS: Record<CompanyCategory, string> = {
  "Core Labs": "#d32f2f",
  "Consumer AI": "#00897b",
  Devtools: "#fbc02d",
  Infra: "#7b1fa2",
  Agents: "#1565c0",
  "Vertical AI": "#e65100",
}

export function categoryPillForeground(
  category: CompanyCategory
): "#ffffff" | "#1a1a2e" {
  return category === "Devtools" ? "#1a1a2e" : "#ffffff"
}

export type Company = {
  slug: string
  name: string
  website: string
  shortDescription: string
  category: CompanyCategory
  locationLabel: string
  city: "sf" | "toronto"
  coordinates: [number, number]
  founded: number
  logoUrl?: string
  mapSprite?: "default" | "boss"
  sourceUrl: string
}

export const YC_BOSS_SLUG = "y-combinator" as const

type CompanyRow = Pick<
  Database["public"]["Tables"]["companies"]["Row"],
  | "slug"
  | "name"
  | "website"
  | "short_description"
  | "category"
  | "location_label"
  | "city"
  | "latitude"
  | "longitude"
  | "founded"
  | "logo_url"
  | "map_sprite"
  | "source_url"
>

export function getCompanyMonogram(company: Company) {
  if (company.name === "11x") {
    return "11"
  }

  const parts = company.name
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return company.name.slice(0, 2).toUpperCase()
}

export function getCompanyDomain(company: Company) {
  return new URL(company.website).hostname
}

export function getCompanyLogoUrl(company: Company) {
  if (company.logoUrl) {
    return company.logoUrl
  }

  const domain = getCompanyDomain(company)

  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

export function companyFromRow(row: CompanyRow): Company {
  return {
    slug: row.slug,
    name: row.name,
    website: row.website,
    shortDescription: row.short_description,
    category: row.category as CompanyCategory,
    locationLabel: row.location_label,
    city: row.city as Company["city"],
    coordinates: [row.longitude, row.latitude],
    founded: row.founded,
    logoUrl: row.logo_url ?? undefined,
    mapSprite: row.map_sprite as Company["mapSprite"],
    sourceUrl: row.source_url,
  }
}
