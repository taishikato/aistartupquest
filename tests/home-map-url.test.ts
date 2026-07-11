import { describe, expect, it } from "vitest"

import {
  buildHomeMapQuery,
  parseHomeMapCity,
  parseHomeMapView,
} from "@/lib/home-map-url"

const cities = [
  { name: "San Francisco" },
  { name: "London" },
]

describe("parseHomeMapView", () => {
  it("returns globe only when param is exactly globe", () => {
    expect(parseHomeMapView("globe")).toBe("globe")
  })

  it("returns mercator for absent, empty, or unknown values", () => {
    expect(parseHomeMapView(null)).toBe("mercator")
    expect(parseHomeMapView("")).toBe("mercator")
    expect(parseHomeMapView("mercator")).toBe("mercator")
    expect(parseHomeMapView("GLOBE")).toBe("mercator")
  })
})

describe("parseHomeMapCity", () => {
  it("returns the matching city name when present", () => {
    expect(parseHomeMapCity("San Francisco", cities)).toBe("San Francisco")
  })

  it("returns null for absent, empty, unknown, or case-mismatched names", () => {
    expect(parseHomeMapCity(null, cities)).toBeNull()
    expect(parseHomeMapCity("", cities)).toBeNull()
    expect(parseHomeMapCity("Nowhereville", cities)).toBeNull()
    expect(parseHomeMapCity("san francisco", cities)).toBeNull()
  })
})

describe("buildHomeMapQuery", () => {
  it("returns empty string at defaults", () => {
    expect(
      buildHomeMapQuery({
        selectedCity: null,
        view: "mercator",
        currentSearch: "",
      })
    ).toBe("")
  })

  it("sets city and view=globe when both are non-default", () => {
    expect(
      buildHomeMapQuery({
        selectedCity: "San Francisco",
        view: "globe",
        currentSearch: "",
      })
    ).toBe("city=San+Francisco&view=globe")
  })

  it("omits view when mercator and omits city when null", () => {
    expect(
      buildHomeMapQuery({
        selectedCity: "London",
        view: "mercator",
        currentSearch: "",
      })
    ).toBe("city=London")
  })

  it("preserves unrelated existing params", () => {
    expect(
      buildHomeMapQuery({
        selectedCity: "London",
        view: "globe",
        currentSearch: "utm=1",
      })
    ).toBe("utm=1&city=London&view=globe")
  })

  it("clears city and view params when returning to defaults", () => {
    expect(
      buildHomeMapQuery({
        selectedCity: null,
        view: "mercator",
        currentSearch: "city=London&view=globe",
      })
    ).toBe("")
  })
})
