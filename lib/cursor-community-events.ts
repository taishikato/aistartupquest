import cursorCommunityEvents from "@/lib/data/cursor-community-events.json"

export type CursorCommunityCity = {
  name: string
  lat: number
  lon: number
}

export type CursorCommunityEvent = {
  id: string
  title: string
  city: string
  date: string
  url: string
  company: string
}

export type CityWithEvents = CursorCommunityCity & {
  events: CursorCommunityEvent[]
}

export function getUpcomingCities(
  // Compute per call so a long-lived server module does not keep a stale UTC day
  // and mismatch the client's fresh evaluation during hydration.
  today: string = new Date().toISOString().slice(0, 10)
): CityWithEvents[] {
  const eventsByCity = new Map<string, CursorCommunityEvent[]>()

  ;(cursorCommunityEvents.events as CursorCommunityEvent[]).forEach((event) => {
    if (event.date < today) {
      return
    }

    const cityEvents = eventsByCity.get(event.city) ?? []
    cityEvents.push(event)
    eventsByCity.set(event.city, cityEvents)
  })

  eventsByCity.forEach((events) => {
    events.sort((a, b) => a.date.localeCompare(b.date))
  })

  return (cursorCommunityEvents.cities as CursorCommunityCity[])
    .map((city) => ({
      ...city,
      events: eventsByCity.get(city.name) ?? [],
    }))
    .filter((city) => city.events.length >= 1)
}
