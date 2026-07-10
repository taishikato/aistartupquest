import { describe, expect, it } from "vitest"

import {
  extractFlightPayload,
  parseCursorCommunityEvents,
  readJsonObject,
} from "@/lib/cursor-events-fetch"

describe("extractFlightPayload", () => {
  it("joins flight chunks and unescapes their contents", () => {
    const html = [
      `<script>self.__next_f.push([1,${JSON.stringify('{"city')}])</script>`,
      `<script>self.__next_f.push([1,${JSON.stringify('":"Tokyo"}')}])</script>`,
    ].join("")

    expect(extractFlightPayload(html)).toBe('{"city":"Tokyo"}')
  })
})

describe("readJsonObject", () => {
  it("handles nested objects and braces inside strings", () => {
    const input = 'prefix {"nested":{"message":"a } and { b"}} suffix'
    const start = input.indexOf("{")

    expect(readJsonObject(input, start)).toBe(
      '{"nested":{"message":"a } and { b"}}'
    )
  })
})

describe("parseCursorCommunityEvents", () => {
  it("extracts complete Luma events with a timezone-local date", () => {
    const flightText = [
      JSON.stringify({
        platform: "luma",
        name: "Cursor Tokyo Meetup",
        start_at: "2026-07-11T23:30:00.000Z",
        timezone: "Asia/Tokyo",
        url: "https://lu.ma/tokyo-cursor-quest",
        geo_address_json: {
          city: "Tokyo",
          address: "1-2-3 Secret Street",
        },
      }),
      JSON.stringify({
        platform: "luma",
        start_at: "2026-07-11T23:30:00.000Z",
        timezone: "Asia/Tokyo",
        url: "https://lu.ma/missing-name",
        geo_address_json: { city: "Tokyo" },
      }),
    ].join("")
    const html = `<script>self.__next_f.push([1,${JSON.stringify(flightText)}])</script>`

    expect(parseCursorCommunityEvents(html)).toEqual([
      {
        id: "tokyo-cursor-quest",
        title: "Cursor Tokyo Meetup",
        city: "Tokyo",
        date: "2026-07-12",
        url: "https://lu.ma/tokyo-cursor-quest",
      },
    ])
  })

  it("returns no events for unrelated HTML", () => {
    expect(
      parseCursorCommunityEvents("<html><body>Nothing here</body></html>")
    ).toEqual([])
  })
})
