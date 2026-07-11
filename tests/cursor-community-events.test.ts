import { describe, expect, it } from "vitest"

import { getUpcomingCities } from "@/lib/cursor-community-events"
import cursorCommunityEvents from "@/lib/data/cursor-community-events.json"

const totalEventCount = cursorCommunityEvents.events.length
const maxDate = [...cursorCommunityEvents.events].sort((a, b) =>
  b.date.localeCompare(a.date)
)[0].date

describe("getUpcomingCities", () => {
  it("includes every event when today is before all dates", () => {
    const result = getUpcomingCities("2020-01-01")
    const totalAcrossCities = result.reduce(
      (sum, city) => sum + city.events.length,
      0
    )
    expect(totalAcrossCities).toBe(totalEventCount)
  })

  it("returns events date-ascending within each city", () => {
    const result = getUpcomingCities("2020-01-01")
    for (const city of result) {
      for (let i = 1; i < city.events.length; i++) {
        expect(city.events[i].date >= city.events[i - 1].date).toBe(true)
      }
    }
  })

  it("returns empty array when today is after all dates", () => {
    expect(getUpcomingCities("2099-01-01")).toEqual([])
  })

  it("includes an event whose date equals today (boundary: b455cd1 regression class)", () => {
    const result = getUpcomingCities(maxDate)
    const allEvents = result.flatMap((city) => city.events)
    const onBoundary = allEvents.filter((e) => e.date === maxDate)
    expect(onBoundary.length).toBeGreaterThan(0)
  })

  it("omits cities with zero upcoming events", () => {
    const result = getUpcomingCities("2099-01-01")
    expect(result.every((city) => city.events.length >= 1)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it("calling with no argument returns the same shape as passing the real UTC date", () => {
    const explicitToday = new Date().toISOString().slice(0, 10)
    expect(getUpcomingCities()).toEqual(getUpcomingCities(explicitToday))
  })
})
