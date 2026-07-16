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

export function isGeolocationSupported() {
  return typeof navigator !== "undefined" && "geolocation" in navigator
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
