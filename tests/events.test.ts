import { describe, expect, it } from "vitest"

import {
  groupEventsByCity,
  normalizePublishedEventRows,
  type EventRow,
} from "@/lib/events"

function row(overrides: Partial<EventRow> = {}): EventRow {
  return {
    source: "cursor",
    source_event_id: "event-1",
    company: "Cursor",
    title: "Cursor Toronto",
    description: null,
    city: "Toronto",
    latitude: 43.6532,
    longitude: -79.3832,
    event_timezone: "America/Toronto",
    event_date: "2026-08-02",
    event_url: "https://luma.com/event-1",
    ...overrides,
  }
}

describe("groupEventsByCity", () => {
  it("groups events and sorts each city's events by date then title", () => {
    const cities = groupEventsByCity([
      row({ source_event_id: "later", title: "Beta", event_date: "2026-08-02" }),
      row({ source_event_id: "alpha", title: "Alpha", event_date: "2026-08-01" }),
      row({ source_event_id: "zeta", title: "Zeta", event_date: "2026-08-01" }),
    ])

    expect(cities).toHaveLength(1)
    expect(cities[0].events.map((event) => event.id)).toEqual([
      "alpha",
      "zeta",
      "later",
    ])
  })

  it("uses the first sorted event's coordinates for the city marker", () => {
    const cities = groupEventsByCity([
      row({ latitude: 40, longitude: -70, event_date: "2026-08-02" }),
      row({
        source_event_id: "earlier",
        latitude: 43.7,
        longitude: -79.4,
        event_date: "2026-08-01",
      }),
    ])

    expect(cities[0]).toMatchObject({
      name: "Toronto",
      lat: 43.7,
      lon: -79.4,
    })
  })

  it("sorts cities by their first event date then city name", () => {
    const cities = groupEventsByCity([
      row({ city: "Toronto", event_date: "2026-08-02" }),
      row({
        source_event_id: "london",
        city: "London",
        event_date: "2026-08-01",
      }),
      row({
        source_event_id: "berlin",
        city: "Berlin",
        event_date: "2026-08-01",
      }),
    ])

    expect(cities.map((city) => city.name)).toEqual([
      "Berlin",
      "London",
      "Toronto",
    ])
  })

  it("maps database fields to the UI event contract", () => {
    const event = groupEventsByCity([row()])[0].events[0]

    expect(event).toEqual({
      id: "event-1",
      title: "Cursor Toronto",
      city: "Toronto",
      date: "2026-08-02",
      url: "https://luma.com/event-1",
      company: "Cursor",
    })
  })
})

describe("normalizePublishedEventRows", () => {
  it("accepts complete rows returned by the upcoming-events view", () => {
    expect(normalizePublishedEventRows([row()])).toEqual([row()])
  })

  it("rejects an unexpected null from the generated view type", () => {
    expect(() =>
      normalizePublishedEventRows([{ ...row(), title: null }])
    ).toThrow("published_upcoming_events returned null for title")
  })
})
