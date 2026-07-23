import { afterEach, describe, expect, it, vi } from "vitest"

import {
  dismissQuestHerald,
  markQuestHeraldSubscribed,
  readQuestHeraldHidden,
  readQuestHeraldStatus,
  readQuestHeraldSubscribed,
  shouldHideQuestHeraldSignup,
} from "@/lib/quest-herald-preference"

function stubLocalStorageWindow() {
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
  return store
}

describe("quest herald preference visibility", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it("keeps the form hidden after dismiss without clearing preference", () => {
    const store = stubLocalStorageWindow()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-22T12:00:00.000Z"))

    dismissQuestHerald()

    expect(readQuestHeraldStatus()).toBe("dismissed")
    expect(readQuestHeraldHidden()).toBe(true)
    expect(readQuestHeraldSubscribed()).toBe(false)
    expect(store.has("quest-herald-signup")).toBe(true)
  })

  it("treats subscribed status separately from dismissed", () => {
    stubLocalStorageWindow()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-22T12:00:00.000Z"))

    markQuestHeraldSubscribed()

    expect(readQuestHeraldStatus()).toBe("subscribed")
    expect(readQuestHeraldHidden()).toBe(true)
    expect(readQuestHeraldSubscribed()).toBe(true)
  })
})

describe("shouldHideQuestHeraldSignup", () => {
  it("hides dismissed and subscribed forms by default", () => {
    expect(shouldHideQuestHeraldSignup("visible")).toBe(false)
    expect(shouldHideQuestHeraldSignup("dismissed")).toBe(true)
    expect(shouldHideQuestHeraldSignup("subscribed")).toBe(true)
  })

  it("lets forceVisible reopen dismissed forms without clearing preference", () => {
    expect(
      shouldHideQuestHeraldSignup("dismissed", { forceVisible: true })
    ).toBe(false)
    expect(
      shouldHideQuestHeraldSignup("subscribed", { forceVisible: true })
    ).toBe(true)
  })

  it("keeps the success state visible while celebrating", () => {
    expect(
      shouldHideQuestHeraldSignup("subscribed", {
        forceVisible: true,
        succeeded: true,
      })
    ).toBe(false)
  })
})
