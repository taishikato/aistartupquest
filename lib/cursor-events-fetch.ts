import type { CursorEventInput } from "@/lib/cursor-events"

/** Joins all self.__next_f flight chunks embedded in the page HTML. */
export function extractFlightPayload(html: string): string {
  const chunks: string[] = []
  const re = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    try {
      chunks.push(JSON.parse(`"${match[1]}"`) as string)
    } catch {
      // skip malformed chunk
    }
  }
  return chunks.join("")
}

/** Reads one balanced JSON object literal starting at `start` (must be "{"). */
export function readJsonObject(str: string, start: number): string | null {
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < str.length; i++) {
    const char = str[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
    } else if (char === '"') {
      inString = true
    } else if (char === "{") {
      depth++
    } else if (char === "}") {
      depth--
      if (depth === 0) {
        return str.slice(start, i + 1)
      }
    }
  }
  return null
}

export function localDateForTimezone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso))
}

type LumaEvent = {
  name?: string
  start_at?: string
  timezone?: string
  url?: string
  geo_address_json?: { city?: string }
}

/** Extracts Luma event objects from cursor.com/community HTML as import inputs. Never emits venue or street address data - city only, by design. */
export function parseCursorCommunityEvents(html: string): CursorEventInput[] {
  const payload = extractFlightPayload(html)
  const events: CursorEventInput[] = []
  const re = /\{"platform":"luma"/g
  let match: RegExpExecArray | null
  while ((match = re.exec(payload))) {
    const raw = readJsonObject(payload, match.index)
    if (!raw) continue
    let parsed: LumaEvent
    try {
      parsed = JSON.parse(raw) as LumaEvent
    } catch {
      continue
    }
    if (!parsed.name || !parsed.start_at || !parsed.url) continue
    const slug = parsed.url.split("/").pop()
    if (!slug) continue
    events.push({
      id: slug,
      title: parsed.name,
      city: parsed.geo_address_json?.city ?? "",
      date: localDateForTimezone(parsed.start_at, parsed.timezone ?? "UTC"),
      url: parsed.url,
    })
  }
  return events
}
