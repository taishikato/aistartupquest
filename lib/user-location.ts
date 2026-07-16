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
