import type { CityWithEvents, CommunityEvent } from "@/lib/events"

export function flattenUpcomingEvents(
  cities: CityWithEvents[]
): CommunityEvent[] {
  return cities
    .flatMap((city) => city.events)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function filterEventsByQuery(
  events: CommunityEvent[],
  query: string
): CommunityEvent[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  if (!normalizedQuery) {
    return events
  }

  return events.filter(
    (event) =>
      event.title.toLocaleLowerCase().includes(normalizedQuery) ||
      event.city.toLocaleLowerCase().includes(normalizedQuery)
  )
}

export function filterCitiesByEvents(
  cities: CityWithEvents[],
  events: CommunityEvent[]
): CityWithEvents[] {
  const eventIds = new Set(events.map((event) => event.id))

  return cities
    .map((city) => ({
      ...city,
      events: city.events.filter((event) => eventIds.has(event.id)),
    }))
    .filter((city) => city.events.length > 0)
}
