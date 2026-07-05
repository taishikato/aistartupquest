import { createHash } from "node:crypto"

import {
  CITY_GEO_LABELS,
  CITY_MAP_CENTERS,
  type CityId,
} from "@/lib/city-config"
import { slugifyMeetupBase } from "@/lib/meetup-submit"

export type CursorEventInput = {
  id: string
  title: string
  city: string
  date: string
  url: string
  organizer?: string
  description?: string
}

const CITY_ALIASES: Record<string, CityId> = {
  "san francisco": "sf",
  sf: "sf",
  toronto: "toronto",
  "new york": "ny",
  "new york city": "ny",
  nyc: "ny",
  ny: "ny",
  london: "london",
  vancouver: "vancouver",
  tokyo: "tokyo",
}

export function mapCursorCity(raw: string): CityId | null {
  return CITY_ALIASES[raw.trim().toLowerCase()] ?? null
}

type ValidationResult =
  | { ok: true; event: CursorEventInput }
  | { ok: false; reason: string }

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function validateCursorEvent(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, reason: "event is not an object" }
  }
  const candidate = input as Record<string, unknown>
  for (const field of ["id", "title", "city", "date", "url"] as const) {
    if (typeof candidate[field] !== "string" || candidate[field] === "") {
      return { ok: false, reason: `missing or empty field: ${field}` }
    }
  }
  if (!DATE_PATTERN.test(candidate.date as string)) {
    return { ok: false, reason: `date must be YYYY-MM-DD: ${candidate.date}` }
  }
  if (!(candidate.url as string).startsWith("https://")) {
    return { ok: false, reason: `url must be https: ${candidate.url}` }
  }
  for (const field of ["organizer", "description"] as const) {
    if (candidate[field] !== undefined && typeof candidate[field] !== "string") {
      return { ok: false, reason: `field must be a string: ${field}` }
    }
  }
  return { ok: true, event: candidate as CursorEventInput }
}

export type CursorMeetupRow = {
  slug: string
  city: CityId
  title: string
  description: string
  venue_name: string
  location_label: string
  latitude: number
  longitude: number
  event_date: string
  organizer_name: string | null
  event_url: string
  status: "published"
  source: "cursor"
  location_precision: "city"
  source_event_id: string
  payload_hash: string
}

export function buildCursorMeetupRow(
  event: CursorEventInput,
  city: CityId
): CursorMeetupRow {
  const [longitude, latitude] = CITY_MAP_CENTERS[city]
  const idHash = createHash("sha256").update(event.id).digest("hex").slice(0, 8)
  const payloadHash = createHash("sha256")
    .update(
      JSON.stringify({
        id: event.id,
        title: event.title,
        city,
        date: event.date,
        url: event.url,
        organizer: event.organizer ?? null,
        description: event.description ?? "",
      })
    )
    .digest("hex")

  return {
    slug: `${slugifyMeetupBase(event.title, city, event.date)}-${idHash}`,
    city,
    title: event.title,
    description: event.description ?? "",
    venue_name: CITY_GEO_LABELS[city],
    location_label: "Venue shared after registration",
    latitude,
    longitude,
    event_date: event.date,
    organizer_name: event.organizer ?? null,
    event_url: event.url,
    status: "published",
    source: "cursor",
    location_precision: "city",
    source_event_id: event.id,
    payload_hash: payloadHash,
  }
}
