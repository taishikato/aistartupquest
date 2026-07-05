import { describe, expect, it } from "vitest"

import {
  meetupFromPublicRow,
  meetupVenueDisplay,
  spreadOverlappingMeetups,
  type Meetup,
} from "@/lib/meetup"

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

describe("meetupFromPublicRow", () => {
  it("defaults missing source and location_precision", () => {
    const meetup = meetupFromPublicRow({
      slug: "s",
      city: "sf",
      title: "t",
      description: "d",
      venue_name: "v",
      location_label: "l",
      latitude: 1,
      longitude: 2,
      event_date: "2026-08-01",
      organizer_name: null,
      event_url: "https://example.com",
      status: "published",
      source: null,
      location_precision: null,
    })
    expect(meetup.source).toBe("community")
    expect(meetup.locationPrecision).toBe("exact")
  })
})

describe("meetupVenueDisplay", () => {
  it("shows venue for exact meetups", () => {
    expect(meetupVenueDisplay(makeMeetup())).toEqual({
      primary: "GitHub HQ",
      secondary: "88 Colin P Kelly Jr St",
    })
  })

  it("hides venue for city-level meetups", () => {
    const meetup = makeMeetup({ locationPrecision: "city" })
    expect(meetupVenueDisplay(meetup)).toEqual({
      primary: "San Francisco",
      secondary: "Venue shared after registration",
    })
  })
})

describe("spreadOverlappingMeetups", () => {
  it("keeps distinct coordinates untouched", () => {
    const meetups = [
      makeMeetup(),
      makeMeetup({ slug: "b", coordinates: [-122.4, 37.8] }),
    ]
    expect(spreadOverlappingMeetups(meetups)).toEqual(meetups)
  })

  it("offsets duplicate coordinates deterministically", () => {
    const a = makeMeetup({ slug: "a", coordinates: [-122.4167, 37.7793] })
    const b = makeMeetup({ slug: "b", coordinates: [-122.4167, 37.7793] })
    const [ra, rb] = spreadOverlappingMeetups([a, b])
    expect(ra.coordinates).toEqual(a.coordinates)
    expect(rb.coordinates).not.toEqual(b.coordinates)
    const dx = rb.coordinates[0] - b.coordinates[0]
    const dy = rb.coordinates[1] - b.coordinates[1]
    expect(Math.hypot(dx, dy)).toBeLessThan(0.01)
    expect(spreadOverlappingMeetups([a, b])).toEqual(
      spreadOverlappingMeetups([a, b])
    )
  })
})
