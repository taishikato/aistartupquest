import { describe, expect, it } from "vitest"

import {
  filterAndSortUpcomingMeetups,
  isMeetupUpcoming,
  type Meetup,
} from "@/lib/meetup"
import type { CityId } from "@/lib/city-config"

function makeMeetup(overrides: Partial<Meetup> = {}): Meetup {
  return {
    slug: "test-meetup-sf-20260801",
    city: "sf",
    title: "Test Meetup",
    description: "A test meetup",
    venueName: "GitHub HQ",
    locationLabel: "88 Colin P Kelly Jr St",
    coordinates: [-122.3934, 37.7822],
    eventDate: "2026-08-01",
    organizerName: null,
    eventUrl: "https://luma.com/test",
    contactEmail: null,
    status: "published",
    source: "community",
    locationPrecision: "exact",
    ...overrides,
  }
}

const ALL_CITIES: CityId[] = [
  "sf",
  "toronto",
  "ny",
  "london",
  "vancouver",
  "tokyo",
]

describe("isMeetupUpcoming timezone edges", () => {
  it("treats the same UTC instant differently across city timezones", () => {
    // 2026-08-01T20:00:00Z is already 2026-08-02 in Tokyo (UTC+9),
    // but still 2026-08-01 afternoon in SF (PDT, UTC-7).
    const nowMs = Date.UTC(2026, 7, 1, 20, 0, 0)

    expect(
      isMeetupUpcoming(makeMeetup({ city: "tokyo", eventDate: "2026-08-01" }), nowMs)
    ).toBe(false)
    expect(
      isMeetupUpcoming(makeMeetup({ city: "sf", eventDate: "2026-08-01" }), nowMs)
    ).toBe(true)
  })

  it("keeps same-day events upcoming at 23:59 local time", () => {
    // 2026-08-01 23:59 in America/Los_Angeles (PDT, UTC-7) = 2026-08-02T06:59:00Z
    const nowMs = Date.UTC(2026, 7, 2, 6, 59, 0)

    expect(
      isMeetupUpcoming(makeMeetup({ city: "sf", eventDate: "2026-08-01" }), nowMs)
    ).toBe(true)
  })

  it("treats a year-boundary future event as upcoming in every city", () => {
    const nowMs = Date.UTC(2026, 11, 31, 12, 0, 0)

    for (const city of ALL_CITIES) {
      expect(
        isMeetupUpcoming(
          makeMeetup({ city, eventDate: "2027-01-01", slug: `edge-${city}` }),
          nowMs
        )
      ).toBe(true)
    }
  })

  it("never treats cancelled or hidden meetups as upcoming", () => {
    const nowMs = Date.UTC(2026, 0, 1, 0, 0, 0)
    const futureDate = "2099-06-15"

    expect(
      isMeetupUpcoming(
        makeMeetup({ status: "cancelled", eventDate: futureDate }),
        nowMs
      )
    ).toBe(false)
    expect(
      isMeetupUpcoming(
        makeMeetup({ status: "hidden", eventDate: futureDate }),
        nowMs
      )
    ).toBe(false)
  })
})

describe("filterAndSortUpcomingMeetups", () => {
  it("sorts by date ascending and drops past events", () => {
    // filterAndSortUpcomingMeetups has no nowMs injection point, so use
    // far-future dates for "today"/"tomorrow" that stay stable against the
    // real clock, plus a clearly past "yesterday".
    const yesterday = makeMeetup({
      slug: "yesterday",
      title: "Yesterday",
      eventDate: "2020-01-01",
    })
    const today = makeMeetup({
      slug: "today",
      title: "Today",
      eventDate: "2099-06-15",
    })
    const tomorrow = makeMeetup({
      slug: "tomorrow",
      title: "Tomorrow",
      eventDate: "2099-06-16",
    })

    const result = filterAndSortUpcomingMeetups([tomorrow, yesterday, today])

    expect(result.map((m) => m.slug)).toEqual(["today", "tomorrow"])
  })
})
