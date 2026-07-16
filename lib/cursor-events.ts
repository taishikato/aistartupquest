import { createHash } from "node:crypto"

import type { Database } from "@/types/supabase"

export type CursorEventInput = {
  sourceEventId: string
  title: string
  city: string
  eventTimezone: string
  eventDate: string
  eventUrl: string
  latitude: number
  longitude: number
}

export type CursorEventRow =
  Database["public"]["Tables"]["events"]["Insert"]

type Coordinate = {
  latitude?: unknown
  longitude?: unknown
}

type ManagingCalendar = {
  name?: unknown
  location?: { city?: unknown }
  coordinate?: Coordinate
}

type LumaEvent = {
  platform?: unknown
  name?: unknown
  start_at?: unknown
  timezone?: unknown
  url?: unknown
  geo_address_json?: { city?: unknown }
  coordinate?: Coordinate | null
  managing_calendars?: ManagingCalendar[]
}

export function extractFlightPayload(html: string): string {
  const chunks: string[] = []
  const chunkPattern = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g
  let match: RegExpExecArray | null

  while ((match = chunkPattern.exec(html))) {
    try {
      chunks.push(JSON.parse(`"${match[1]}"`) as string)
    } catch {
      // A malformed chunk must not prevent later valid chunks from parsing.
    }
  }

  return chunks.join("")
}

function readJsonObject(value: string, start: number): string | null {
  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < value.length; index++) {
    const character = value[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (character === "\\") {
        escaped = true
      } else if (character === '"') {
        inString = false
      }
      continue
    }

    if (character === '"') {
      inString = true
    } else if (character === "{") {
      depth++
    } else if (character === "}") {
      depth--
      if (depth === 0) {
        return value.slice(start, index + 1)
      }
    }
  }

  return null
}

function localDateForTimezone(isoDate: string, timeZone: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid event date")
  }

  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${values.year}-${values.month}-${values.day}`
}

function asCoordinate(value: Coordinate | null | undefined) {
  const latitude = value?.latitude
  const longitude = value?.longitude

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null
  }

  return { latitude, longitude }
}

function normalizeCity(value: string): string {
  return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase()
}

function cityCoordinate(event: LumaEvent, city: string) {
  const normalizedCity = normalizeCity(city)
  const calendar = event.managing_calendars?.find((candidate) => {
    if (
      typeof candidate.name !== "string" ||
      candidate.name === "Cursor Community" ||
      typeof candidate.location?.city !== "string"
    ) {
      return false
    }

    return normalizeCity(candidate.location.city) === normalizedCity
  })
  const calendarCoordinate = asCoordinate(calendar?.coordinate)

  if (calendarCoordinate) {
    return calendarCoordinate
  }

  const eventCoordinate = asCoordinate(event.coordinate)
  if (!eventCoordinate) {
    return null
  }

  return {
    latitude: Number(eventCoordinate.latitude.toFixed(1)),
    longitude: Number(eventCoordinate.longitude.toFixed(1)),
  }
}

function parseLumaEvent(value: LumaEvent): CursorEventInput | null {
  if (
    value.platform !== "luma" ||
    typeof value.name !== "string" ||
    value.name.trim() === "" ||
    typeof value.start_at !== "string" ||
    typeof value.timezone !== "string" ||
    typeof value.url !== "string" ||
    !value.url.startsWith("https://") ||
    typeof value.geo_address_json?.city !== "string" ||
    value.geo_address_json.city.trim() === ""
  ) {
    return null
  }

  let eventUrl: URL
  let eventDate: string
  try {
    eventUrl = new URL(value.url)
    eventDate = localDateForTimezone(value.start_at, value.timezone)
  } catch {
    return null
  }

  const sourceEventId = eventUrl.pathname.split("/").filter(Boolean).at(-1)
  const city = value.geo_address_json.city.trim()
  const coordinate = cityCoordinate(value, city)
  if (!sourceEventId || !coordinate) {
    return null
  }

  return {
    sourceEventId,
    title: value.name.trim(),
    city,
    eventTimezone: value.timezone,
    eventDate,
    eventUrl: eventUrl.toString(),
    ...coordinate,
  }
}

export type CursorEventParseResult = {
  candidateCount: number
  events: CursorEventInput[]
}

export function parseCursorCommunityEventsWithStats(
  html: string
): CursorEventParseResult {
  const payload = extractFlightPayload(html)
  const events: CursorEventInput[] = []
  const eventPattern = /\{"platform":"luma"/g
  let match: RegExpExecArray | null
  let candidateCount = 0

  while ((match = eventPattern.exec(payload))) {
    candidateCount++
    const rawEvent = readJsonObject(payload, match.index)
    if (!rawEvent) {
      continue
    }

    try {
      const event = parseLumaEvent(JSON.parse(rawEvent) as LumaEvent)
      if (event) {
        events.push(event)
      }
    } catch {
      // Ignore an individual malformed object and continue parsing the payload.
    }
  }

  return { candidateCount, events }
}

export function parseCursorCommunityEvents(html: string): CursorEventInput[] {
  return parseCursorCommunityEventsWithStats(html).events
}

export function buildCursorEventRow(
  event: CursorEventInput
): CursorEventRow {
  const normalized = {
    source: "cursor",
    source_event_id: event.sourceEventId,
    company: "Cursor",
    title: event.title,
    description: null,
    city: event.city,
    latitude: event.latitude,
    longitude: event.longitude,
    event_timezone: event.eventTimezone,
    event_date: event.eventDate,
    event_url: event.eventUrl,
    status: "published",
  } as const

  return {
    ...normalized,
    payload_hash: createHash("sha256")
      .update(JSON.stringify(normalized))
      .digest("hex"),
  }
}
