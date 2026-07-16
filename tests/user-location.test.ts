import { describe, expect, it } from "vitest"

import {
  locateButtonLabel,
  toUserCoordinates,
  userLocationErrorStatus,
} from "@/lib/user-location"

function makePosition(
  coords: Partial<GeolocationCoordinates> = {}
): GeolocationPosition {
  const resolved = {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 12,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    ...coords,
  }

  return {
    coords: {
      ...resolved,
      toJSON: () => resolved,
    },
    timestamp: Date.now(),
    toJSON: () => ({
      coords: resolved,
      timestamp: Date.now(),
    }),
  }
}

function makeError(code: number): GeolocationPositionError {
  return {
    code,
    message: "mock",
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  }
}

describe("toUserCoordinates", () => {
  it("maps geolocation coords to lng/lat", () => {
    expect(toUserCoordinates(makePosition())).toEqual({
      lng: -122.4194,
      lat: 37.7749,
      accuracy: 12,
    })
  })
})

describe("userLocationErrorStatus", () => {
  it("returns denied for permission errors", () => {
    expect(userLocationErrorStatus(makeError(1))).toBe("denied")
  })

  it("returns unavailable for other errors", () => {
    expect(userLocationErrorStatus(makeError(2))).toBe("unavailable")
    expect(userLocationErrorStatus(makeError(3))).toBe("unavailable")
  })
})

describe("locateButtonLabel", () => {
  it("returns action copy for idle and tracking states", () => {
    expect(locateButtonLabel("idle")).toBe("Show my location")
    expect(locateButtonLabel("tracking")).toBe("Center on your location")
  })
})
