export type UserCoordinates = {
  lng: number
  lat: number
  accuracy: number
}

export type UserLocationStatus =
  | "idle"
  | "requesting"
  | "tracking"
  | "denied"
  | "unavailable"
  | "unsupported"

/** Remembers that the explorer opted in so later visits can resume without a prompt. */
export const USER_LOCATION_OPTED_IN_KEY = "asq:user-location-opted-in"

export function isGeolocationSupported() {
  return typeof navigator !== "undefined" && "geolocation" in navigator
}

export function readUserLocationOptedIn() {
  if (typeof window === "undefined") {
    return false
  }

  try {
    return window.localStorage.getItem(USER_LOCATION_OPTED_IN_KEY) === "1"
  } catch {
    return false
  }
}

export function writeUserLocationOptedIn(optedIn: boolean) {
  if (typeof window === "undefined") {
    return
  }

  try {
    if (optedIn) {
      window.localStorage.setItem(USER_LOCATION_OPTED_IN_KEY, "1")
      return
    }

    window.localStorage.removeItem(USER_LOCATION_OPTED_IN_KEY)
  } catch {
    // Private mode / blocked storage should not break locate.
  }
}

export function toUserCoordinates(
  position: GeolocationPosition
): UserCoordinates {
  return {
    lng: position.coords.longitude,
    lat: position.coords.latitude,
    accuracy: position.coords.accuracy,
  }
}

export function userLocationErrorStatus(
  error: GeolocationPositionError
): Exclude<UserLocationStatus, "idle" | "requesting" | "tracking"> {
  if (error.code === error.PERMISSION_DENIED) {
    return "denied"
  }

  return "unavailable"
}

export function locateButtonLabel(status: UserLocationStatus) {
  switch (status) {
    case "requesting":
      return "Finding your location"
    case "tracking":
      return "Center on your location"
    case "denied":
      return "Location permission denied"
    case "unavailable":
      return "Location unavailable"
    case "unsupported":
      return "Location not supported"
    default:
      return "Show my location"
  }
}
