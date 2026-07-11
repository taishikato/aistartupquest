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

  it("skips an event with an invalid start_at and keeps a valid sibling", () => {
    const flightText = [
      JSON.stringify({
        platform: "luma",
        name: "Bad Date Meetup",
        start_at: "not-a-date",
        timezone: "Asia/Tokyo",
        url: "https://lu.ma/bad-date",
        geo_address_json: { city: "Tokyo" },
      }),
      JSON.stringify({
        platform: "luma",
        name: "Cursor Tokyo Meetup",
        start_at: "2026-07-11T23:30:00.000Z",
        timezone: "Asia/Tokyo",
        url: "https://lu.ma/tokyo-cursor-quest",
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

  it("skips an event with an invalid timezone and keeps a valid sibling", () => {
    const flightText = [
      JSON.stringify({
        platform: "luma",
        name: "Bad Zone Meetup",
        start_at: "2026-07-11T23:30:00.000Z",
        timezone: "Not/AZone",
        url: "https://lu.ma/bad-zone",
        geo_address_json: { city: "Tokyo" },
      }),
      JSON.stringify({
        platform: "luma",
        name: "Cursor Tokyo Meetup",
        start_at: "2026-07-11T23:30:00.000Z",
        timezone: "Asia/Tokyo",
        url: "https://lu.ma/tokyo-cursor-quest",
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

  it("skips a non-https url and keeps a valid sibling", () => {
    const flightText = [
      JSON.stringify({
        platform: "luma",
        name: "XSS Meetup",
        start_at: "2026-07-11T23:30:00.000Z",
        timezone: "Asia/Tokyo",
        url: "javascript:alert(1)",
        geo_address_json: { city: "Tokyo" },
      }),
      JSON.stringify({
        platform: "luma",
        name: "Cursor Tokyo Meetup",
        start_at: "2026-07-11T23:30:00.000Z",
        timezone: "Asia/Tokyo",
        url: "https://lu.ma/tokyo-cursor-quest",
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

  it("returns city as empty string when geo_address_json is missing", () => {
    const flightText = JSON.stringify({
      platform: "luma",
      name: "No City Meetup",
      start_at: "2026-07-11T23:30:00.000Z",
      timezone: "Asia/Tokyo",
      url: "https://lu.ma/no-city",
    })
    const html = `<script>self.__next_f.push([1,${JSON.stringify(flightText)}])</script>`

    expect(parseCursorCommunityEvents(html)).toEqual([
      {
        id: "no-city",
        title: "No City Meetup",
        city: "",
        date: "2026-07-12",
        url: "https://lu.ma/no-city",
      },
    ])
  })

  it("defaults missing timezone to UTC", () => {
    const flightText = JSON.stringify({
      platform: "luma",
      name: "UTC Meetup",
      start_at: "2026-07-11T23:30:00.000Z",
      url: "https://lu.ma/utc-meetup",
      geo_address_json: { city: "London" },
    })
    const html = `<script>self.__next_f.push([1,${JSON.stringify(flightText)}])</script>`

    expect(parseCursorCommunityEvents(html)).toEqual([
      {
        id: "utc-meetup",
        title: "UTC Meetup",
        city: "London",
        date: "2026-07-11",
        url: "https://lu.ma/utc-meetup",
      },
    ])
  })

  it("returns multiple valid events in order", () => {
    const flightText = [
      JSON.stringify({
        platform: "luma",
        name: "Cursor Tokyo Meetup",
        start_at: "2026-07-11T23:30:00.000Z",
        timezone: "Asia/Tokyo",
        url: "https://lu.ma/tokyo-cursor-quest",
        geo_address_json: { city: "Tokyo" },
      }),
      JSON.stringify({
        platform: "luma",
        name: "Cursor SF Meetup",
        start_at: "2026-07-15T18:00:00.000Z",
        timezone: "America/Los_Angeles",
        url: "https://lu.ma/sf-cursor-quest",
        geo_address_json: { city: "San Francisco" },
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
      {
        id: "sf-cursor-quest",
        title: "Cursor SF Meetup",
        city: "San Francisco",
        date: "2026-07-15",
        url: "https://lu.ma/sf-cursor-quest",
      },
    ])
  })
})
