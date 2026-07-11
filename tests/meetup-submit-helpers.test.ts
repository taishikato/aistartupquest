import { describe, expect, it } from "vitest"

import {
  buildMeetupGeocodeQuery,
  hashClientIp,
  hashMeetupPayload,
  slugifyMeetupBase,
} from "@/lib/meetup-submit"

describe("slugifyMeetupBase", () => {
  it("lowercases, strips unsafe characters, and appends city/date", () => {
    expect(slugifyMeetupBase("Hello World!!! AI Meetup", "sf", "2026-08-01")).toBe(
      "hello-world-ai-meetup-sf-20260801"
    )
  })

  it("is deterministic for the same inputs", () => {
    const a = slugifyMeetupBase("Weekly Builders Night", "tokyo", "2026-09-15")
    const b = slugifyMeetupBase("Weekly Builders Night", "tokyo", "2026-09-15")
    expect(a).toBe(b)
    expect(a).toBe("weekly-builders-night-tokyo-20260915")
  })
})

describe("hashMeetupPayload", () => {
  const base = {
    city: "sf",
    title: "Test Meetup",
    description: "A test meetup",
    venueName: "GitHub HQ",
    locationLabel: "88 Colin P Kelly Jr St",
    eventDate: "2026-08-01",
    organizerName: null as string | null,
    eventUrl: "https://luma.com/test",
    xAccount: "",
  }

  it("returns the same hash for identical payloads", () => {
    expect(hashMeetupPayload(base)).toBe(hashMeetupPayload({ ...base }))
  })

  it("returns a different hash when one field changes", () => {
    const changed = { ...base, title: "Different Title" }
    expect(hashMeetupPayload(base)).not.toBe(hashMeetupPayload(changed))
  })
})

describe("hashClientIp", () => {
  it("is deterministic and differs across IPs", () => {
    const a = hashClientIp("203.0.113.10")
    const b = hashClientIp("203.0.113.10")
    const c = hashClientIp("198.51.100.20")

    expect(a).toBe(b)
    expect(a).not.toBe(c)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
  })
})

describe("buildMeetupGeocodeQuery", () => {
  it("joins venue, address, and city geo label", () => {
    expect(
      buildMeetupGeocodeQuery("GitHub HQ", "88 Colin P Kelly Jr St", "sf")
    ).toBe("GitHub HQ, 88 Colin P Kelly Jr St, San Francisco")
  })
})
