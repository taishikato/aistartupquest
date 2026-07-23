import { afterEach, describe, expect, it, vi } from "vitest"

import {
  dismissQuestHerald,
  markQuestHeraldSubscribed,
  readQuestHeraldHidden,
  readQuestHeraldSubscribed,
} from "@/lib/quest-herald-preference"

describe("quest herald preference visibility", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it("keeps the form hidden after dismiss without clearing preference", () => {
    const store = new Map<string, string>()
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value)
        },
        removeItem: (key: string) => {
          store.delete(key)
        },
      },
      dispatchEvent: vi.fn(),
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-22T12:00:00.000Z"))

    dismissQuestHerald()

    expect(readQuestHeraldHidden()).toBe(true)
    expect(readQuestHeraldSubscribed()).toBe(false)
    expect(store.has("quest-herald-signup")).toBe(true)
  })

  it("treats subscribed status separately from dismissed", () => {
    const store = new Map<string, string>()
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value)
        },
        removeItem: (key: string) => {
          store.delete(key)
        },
      },
      dispatchEvent: vi.fn(),
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-22T12:00:00.000Z"))

    markQuestHeraldSubscribed()

    expect(readQuestHeraldHidden()).toBe(true)
    expect(readQuestHeraldSubscribed()).toBe(true)
  })
})
