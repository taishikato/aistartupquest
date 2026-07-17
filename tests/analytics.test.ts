import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { capture, sendGAEvent } = vi.hoisted(() => ({
  capture: vi.fn(),
  sendGAEvent: vi.fn(),
}))

vi.mock("posthog-js", () => ({
  default: { capture },
}))

vi.mock("@next/third-parties/google", () => ({
  sendGAEvent,
}))

import { track } from "@/lib/analytics"

describe("track", () => {
  beforeEach(() => {
    capture.mockClear()
    sendGAEvent.mockClear()
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test")
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "")
    vi.stubGlobal("window", {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("forwards event name and props to posthog.capture", () => {
    track("map_view_toggle", { view: "globe" })

    expect(capture).toHaveBeenCalledTimes(1)
    expect(capture).toHaveBeenCalledWith("map_view_toggle", { view: "globe" })
  })

  it("drops undefined props before sending", () => {
    track("event_city_select", {
      city: "Tokyo",
      source: "map_marker",
      event_count: undefined,
    })

    expect(capture).toHaveBeenCalledWith("event_city_select", {
      city: "Tokyo",
      source: "map_marker",
    })
  })

  it("mirrors events to GA4 when GA is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST")

    track("event_search", { query: "tokyo", result_count: 3 })

    expect(capture).toHaveBeenCalledTimes(1)
    expect(sendGAEvent).toHaveBeenCalledTimes(1)
    expect(sendGAEvent).toHaveBeenCalledWith("event", "event_search", {
      query: "tokyo",
      result_count: 3,
    })
  })

  it("does nothing on the server (no window)", () => {
    vi.unstubAllGlobals()

    track("event_search", { query: "tokyo", result_count: 0 })

    expect(capture).not.toHaveBeenCalled()
    expect(sendGAEvent).not.toHaveBeenCalled()
  })

  it("skips PostHog when the project token is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "")

    track("event_search", { query: "tokyo", result_count: 0 })

    expect(capture).not.toHaveBeenCalled()
  })
})
