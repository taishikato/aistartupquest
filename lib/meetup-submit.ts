import { createHash } from "node:crypto"

import type { CityId } from "@/lib/city-config"

const CITY_GEO_LABELS: Record<CityId, string> = {
  sf: "San Francisco",
  toronto: "Toronto",
  ny: "New York",
  london: "London",
  vancouver: "Vancouver",
  tokyo: "Tokyo",
}

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
  startsAt: string
  endsAt: string | null
  organizerName: string
  eventUrl: string
  xAccount: string
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
  startsAtIso: string
) {
  const day = startsAtIso.slice(0, 10).replaceAll("-", "")
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
  return `${base || "meetup"}-${city}-${day}`
}
