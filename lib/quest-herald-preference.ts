const STORAGE_KEY = "quest-herald-signup"
const STORAGE_EVENT = "quest-herald-signup-storage"

const DISMISS_MS = 14 * 24 * 60 * 60 * 1000
const SUBSCRIBED_MS = 365 * 24 * 60 * 60 * 1000

type QuestHeraldPreference = {
  status: "dismissed" | "subscribed"
  until: number
}

function parsePreference(raw: string | null): QuestHeraldPreference | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<QuestHeraldPreference>
    if (
      (parsed.status === "dismissed" || parsed.status === "subscribed") &&
      typeof parsed.until === "number"
    ) {
      return { status: parsed.status, until: parsed.until }
    }
  } catch {
    // Ignore malformed localStorage values.
  }

  return null
}

export function readQuestHeraldHidden(): boolean {
  if (typeof window === "undefined") {
    return true
  }

  const preference = parsePreference(window.localStorage.getItem(STORAGE_KEY))
  if (!preference) {
    return false
  }

  if (Date.now() >= preference.until) {
    window.localStorage.removeItem(STORAGE_KEY)
    return false
  }

  return true
}

function writePreference(preference: QuestHeraldPreference) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preference))
  window.dispatchEvent(
    new CustomEvent(STORAGE_EVENT, { detail: { key: STORAGE_KEY } })
  )
}

export function dismissQuestHerald() {
  writePreference({
    status: "dismissed",
    until: Date.now() + DISMISS_MS,
  })
}

export function markQuestHeraldSubscribed() {
  writePreference({
    status: "subscribed",
    until: Date.now() + SUBSCRIBED_MS,
  })
}

export function subscribeToQuestHeraldPreference(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onStoreChange()
    }
  }

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<{ key?: string }>
    if (customEvent.detail?.key === STORAGE_KEY) {
      onStoreChange()
    }
  }

  window.addEventListener("storage", handleStorage)
  window.addEventListener(STORAGE_EVENT, handleCustomEvent as EventListener)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(
      STORAGE_EVENT,
      handleCustomEvent as EventListener
    )
  }
}
