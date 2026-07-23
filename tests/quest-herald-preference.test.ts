import { afterEach, describe, expect, it, vi } from "vitest"

import { reopenQuestHerald } from "@/lib/quest-herald-preference"

describe("reopenQuestHerald", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("clears the stored preference and notifies subscribers", () => {
    const removeItem = vi.fn()
    const dispatchEvent = vi.fn()
    vi.stubGlobal("window", {
      localStorage: { removeItem },
      dispatchEvent,
    })

    reopenQuestHerald()

    expect(removeItem).toHaveBeenCalledWith("quest-herald-signup")
    expect(dispatchEvent).toHaveBeenCalledTimes(1)

    const event = dispatchEvent.mock.calls[0]?.[0] as CustomEvent<{
      key: string
    }>
    expect(event.type).toBe("quest-herald-signup-storage")
    expect(event.detail).toEqual({ key: "quest-herald-signup" })
  })

  it("is a no-op on the server", () => {
    expect(() => reopenQuestHerald()).not.toThrow()
  })
})
