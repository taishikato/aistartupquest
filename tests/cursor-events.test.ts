import { describe, expect, it } from "vitest"

import {
  buildCursorEventRow,
  parseCursorCommunityEvents,
} from "@/lib/cursor-events"

function communityHtml(events: unknown[]): string {
  const payload = events.map((event) => JSON.stringify(event)).join("")
  return `<script>self.__next_f.push([1,${JSON.stringify(payload)}])</script>`
}

const validEvent = {
  platform: "luma",
  name: "Cursor Toronto",
  start_at: "2026-07-23T02:00:00.000Z",
  timezone: "America/Toronto",
  url: "https://luma.com/cursor-toronto",
  geo_address_json: { city: "Toronto" },
  coordinate: { latitude: 43.6426, longitude: -79.3871 },
  managing_calendars: [
    {
      name: "Cursor Toronto, Canada",
      location: { city: "Toronto" },
      coordinate: { latitude: 43.6532, longitude: -79.3832 },
    },
    {
      name: "Cursor Community",
      location: { city: "San Francisco" },
      coordinate: { latitude: 37.7749, longitude: -122.4194 },
    },
  ],
}

describe("parseCursorCommunityEvents", () => {
  it("extracts a Luma event and prefers its city calendar coordinates", () => {
    expect(parseCursorCommunityEvents(communityHtml([validEvent]))).toEqual([
      {
        sourceEventId: "cursor-toronto",
        title: "Cursor Toronto",
        city: "Toronto",
        eventTimezone: "America/Toronto",
        eventDate: "2026-07-22",
        eventUrl: "https://luma.com/cursor-toronto",
        latitude: 43.6532,
        longitude: -79.3832,
      },
    ])
  })

  it("coarsens an event coordinate when no city calendar coordinate exists", () => {
    const event = { ...validEvent, managing_calendars: [] }

    expect(parseCursorCommunityEvents(communityHtml([event]))[0]).toMatchObject(
      {
        latitude: 43.6,
        longitude: -79.4,
      }
    )
  })

  it.each([
    ["missing city", { ...validEvent, geo_address_json: {} }],
    ["non-HTTPS URL", { ...validEvent, url: "http://luma.com/event" }],
    ["invalid timezone", { ...validEvent, timezone: "Mars/Olympus" }],
    [
      "missing coordinates",
      { ...validEvent, coordinate: null, managing_calendars: [] },
    ],
  ])("skips an event with %s", (_label, event) => {
    expect(parseCursorCommunityEvents(communityHtml([event]))).toEqual([])
  })

  it("skips malformed flight chunks while parsing valid chunks", () => {
    const html = [
      '<script>self.__next_f.push([1,"broken\\u{ZZZZ}"])</script>',
      communityHtml([validEvent]),
    ].join("")

    expect(parseCursorCommunityEvents(html)).toHaveLength(1)
  })
})

describe("buildCursorEventRow", () => {
  it("builds a deterministic general event row", () => {
    const [event] = parseCursorCommunityEvents(communityHtml([validEvent]))

    expect(buildCursorEventRow(event)).toEqual({
      source: "cursor",
      source_event_id: "cursor-toronto",
      company: "Cursor",
      title: "Cursor Toronto",
      description: null,
      city: "Toronto",
      latitude: 43.6532,
      longitude: -79.3832,
      event_timezone: "America/Toronto",
      event_date: "2026-07-22",
      event_url: "https://luma.com/cursor-toronto",
      status: "published",
      payload_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    })
    expect(buildCursorEventRow(event)).toEqual(buildCursorEventRow(event))
  })
})
