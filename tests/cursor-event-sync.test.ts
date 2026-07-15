import { describe, expect, it } from "vitest"

import { prepareCursorEventSync } from "@/lib/cursor-event-sync"

function communityHtml(events: unknown[]): string {
  const payload = events.map((event) => JSON.stringify(event)).join("")
  return `<script>self.__next_f.push([1,${JSON.stringify(payload)}])</script>`
}

function event(id: string) {
  return {
    platform: "luma",
    name: `Cursor ${id}`,
    start_at: "2026-08-01T18:00:00.000Z",
    timezone: "UTC",
    url: `https://luma.com/${id}`,
    geo_address_json: { city: "Toronto" },
    coordinate: { latitude: 43.65, longitude: -79.38 },
    managing_calendars: [],
  }
}

describe("prepareCursorEventSync", () => {
  it("accepts a batch with exactly 25 percent invalid candidates", () => {
    const invalid = { ...event("invalid"), geo_address_json: {} }
    const result = prepareCursorEventSync(
      communityHtml([event("one"), event("two"), event("three"), invalid])
    )

    expect(result).toMatchObject({
      candidateCount: 4,
      acceptedCount: 3,
      skippedCount: 1,
    })
    expect(result.rows).toHaveLength(3)
  })

  it("rejects an empty upstream payload", () => {
    expect(() => prepareCursorEventSync("<html />")).toThrow(
      "Parsed 0 Cursor event candidates"
    )
  })

  it("rejects a batch when more than 25 percent is invalid", () => {
    const invalid = { ...event("invalid"), geo_address_json: {} }

    expect(() =>
      prepareCursorEventSync(
        communityHtml([event("valid"), invalid, invalid, invalid])
      )
    ).toThrow("75.0% of Cursor event candidates were invalid")
  })

  it("deduplicates repeated source event IDs", () => {
    const result = prepareCursorEventSync(
      communityHtml([event("same"), event("same")])
    )

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].source_event_id).toBe("same")
  })
})
