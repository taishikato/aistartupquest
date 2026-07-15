export type EventRow = {
  source: string
  source_event_id: string
  company: string
  title: string
  description: string | null
  city: string
  latitude: number
  longitude: number
  event_timezone: string
  event_date: string
  event_url: string
}

export type CommunityEvent = {
  id: string
  title: string
  city: string
  date: string
  url: string
  company: string
}

export type EventCity = {
  name: string
  lat: number
  lon: number
}

export type CityWithEvents = EventCity & {
  events: CommunityEvent[]
}

type PublishedEventRow = {
  [Key in keyof EventRow]: EventRow[Key] | null
}

function requiredField<
  Key extends Exclude<keyof EventRow, "description">,
>(row: PublishedEventRow, field: Key): EventRow[Key] {
  const value = row[field]
  if (value === null) {
    throw new Error(`published_upcoming_events returned null for ${field}`)
  }

  return value
}

export function normalizePublishedEventRows(
  rows: PublishedEventRow[]
): EventRow[] {
  return rows.map((row) =>
    ({
      source: requiredField(row, "source"),
      source_event_id: requiredField(row, "source_event_id"),
      company: requiredField(row, "company"),
      title: requiredField(row, "title"),
      description: row.description,
      city: requiredField(row, "city"),
      latitude: requiredField(row, "latitude"),
      longitude: requiredField(row, "longitude"),
      event_timezone: requiredField(row, "event_timezone"),
      event_date: requiredField(row, "event_date"),
      event_url: requiredField(row, "event_url"),
    }) satisfies EventRow
  )
}

export function toCommunityEvent(row: EventRow): CommunityEvent {
  return {
    id: row.source_event_id,
    title: row.title,
    city: row.city,
    date: row.event_date,
    url: row.event_url,
    company: row.company,
  }
}

function compareRows(a: EventRow, b: EventRow): number {
  return (
    a.event_date.localeCompare(b.event_date) ||
    a.title.localeCompare(b.title) ||
    a.source_event_id.localeCompare(b.source_event_id)
  )
}

export function groupEventsByCity(rows: EventRow[]): CityWithEvents[] {
  const rowsByCity = new Map<string, EventRow[]>()

  for (const row of rows) {
    const cityRows = rowsByCity.get(row.city) ?? []
    cityRows.push(row)
    rowsByCity.set(row.city, cityRows)
  }

  return [...rowsByCity.entries()]
    .map(([name, cityRows]) => {
      cityRows.sort(compareRows)
      const firstEvent = cityRows[0]

      return {
        name,
        lat: firstEvent.latitude,
        lon: firstEvent.longitude,
        events: cityRows.map(toCommunityEvent),
      }
    })
    .sort(
      (a, b) =>
        a.events[0].date.localeCompare(b.events[0].date) ||
        a.name.localeCompare(b.name)
    )
}
