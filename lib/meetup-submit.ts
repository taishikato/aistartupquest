import { createHash } from "node:crypto"

import { CITY_GEO_LABELS, type CityId } from "@/lib/city-config"

export function buildMeetupGeocodeQuery(
  venueName: string,
  locationLabel: string,
  city: CityId
) {
  return `${venueName}, ${locationLabel}, ${CITY_GEO_LABELS[city]}`
}

export function hashMeetupPayload(parts: {
  city: string
  title: string
  description: string
  venueName: string
  locationLabel: string
  eventDate: string
  organizerName: string | null
  eventUrl: string
  xAccount: string
}) {
  const payload = JSON.stringify(parts)
  return createHash("sha256").update(payload).digest("hex")
}

export function hashCompanyRequestPayload(parts: {
  city: string
  companyName: string
  category: string
  founded: string
  locationLabel: string
  shortDescription: string
  website: string
}) {
  const payload = JSON.stringify(parts)
  return createHash("sha256").update(payload).digest("hex")
}

export function hashClientIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex")
}

export function slugifyMeetupBase(
  title: string,
  city: CityId,
  eventDate: string
) {
  const day = eventDate.replaceAll("-", "")
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
  return `${base || "meetup"}-${city}-${day}`
}
