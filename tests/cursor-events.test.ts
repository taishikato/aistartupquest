import { describe, expect, it } from "vitest"

import {
  buildCursorMeetupRow,
  mapCursorCity,
  validateCursorEvent,
} from "@/lib/cursor-events"

const validEvent = {
  id: "luma-abc123",
  title: "Cafe Cursor SF",
  city: "San Francisco",
  date: "2026-08-15",
  url: "https://luma.com/cursor-sf",
  organizer: "Cursor Community",
}

describe("mapCursorCity", () => {
  it("maps supported city names case-insensitively", () => {
    expect(mapCursorCity("San Francisco")).toBe("sf")
    expect(mapCursorCity("NYC")).toBe("ny")
    expect(mapCursorCity("tokyo")).toBe("tokyo")
  })

  it("returns null for unsupported cities", () => {
    expect(mapCursorCity("Lusaka")).toBeNull()
    expect(mapCursorCity("Seoul")).toBeNull()
  })
})

describe("validateCursorEvent", () => {
  it("accepts a valid event", () => {
    expect(validateCursorEvent(validEvent)).toEqual({
      ok: true,
      event: validEvent,
    })
  })

  it("rejects bad dates and urls", () => {
    expect(validateCursorEvent({ ...validEvent, date: "Aug 15" }).ok).toBe(
      false
    )
    expect(validateCursorEvent({ ...validEvent, url: "luma.com/x" }).ok).toBe(
      false
    )
    expect(validateCursorEvent({ ...validEvent, title: "" }).ok).toBe(false)
    expect(validateCursorEvent(null).ok).toBe(false)
  })
})

describe("buildCursorMeetupRow", () => {
  it("builds a city-level published row", () => {
    const row = buildCursorMeetupRow(validEvent, "sf")
    expect(row).toMatchObject({
      city: "sf",
      title: "Cafe Cursor SF",
      venue_name: "San Francisco",
      location_label: "Venue shared after registration",
      longitude: -122.4167,
      latitude: 37.7793,
      event_date: "2026-08-15",
      organizer_name: "Cursor Community",
      event_url: "https://luma.com/cursor-sf",
      status: "published",
      source: "cursor",
      location_precision: "city",
      source_event_id: "luma-abc123",
    })
    expect(row.slug).toMatch(/^cafe-cursor-sf-sf-20260815-[a-f0-9]{8}$/)
    expect(row.payload_hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("is deterministic for the same input", () => {
    expect(buildCursorMeetupRow(validEvent, "sf")).toEqual(
      buildCursorMeetupRow(validEvent, "sf")
    )
  })

  it("uses a city-specific fallback description when the event has none", () => {
    expect(buildCursorMeetupRow(validEvent, "sf").description).toBe(
      "Cursor community event in San Francisco. Venue is shared with registered guests."
    )
  })

  it("passes through a non-empty event description", () => {
    expect(
      buildCursorMeetupRow(
        { ...validEvent, description: "Hands-on session" },
        "sf"
      ).description
    ).toBe("Hands-on session")
  })
})
