"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  isGeolocationSupported,
  toUserCoordinates,
  userLocationErrorStatus,
  type UserCoordinates,
  type UserLocationStatus,
} from "@/lib/user-location"

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 15_000,
  timeout: 12_000,
}

type UseUserLocationResult = {
  status: UserLocationStatus
  coordinates: UserCoordinates | null
  requestLocation: () => void
  clearLocation: () => void
}

export function useUserLocation(): UseUserLocationResult {
  const [status, setStatus] = useState<UserLocationStatus>(() =>
    isGeolocationSupported() ? "idle" : "unsupported"
  )
  const [coordinates, setCoordinates] = useState<UserCoordinates | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const clearWatch = useCallback(() => {
    if (watchIdRef.current === null || !isGeolocationSupported()) {
      return
    }

    navigator.geolocation.clearWatch(watchIdRef.current)
    watchIdRef.current = null
  }, [])

  const clearLocation = useCallback(() => {
    clearWatch()
    setCoordinates(null)
    setStatus(isGeolocationSupported() ? "idle" : "unsupported")
  }, [clearWatch])

  const requestLocation = useCallback(() => {
    if (!isGeolocationSupported()) {
      setStatus("unsupported")
      return
    }

    clearWatch()
    setStatus("requesting")

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCoordinates(toUserCoordinates(position))
        setStatus("tracking")
      },
      (error) => {
        clearWatch()
        setCoordinates(null)
        setStatus(userLocationErrorStatus(error))
      },
      GEO_OPTIONS
    )
  }, [clearWatch])

  useEffect(() => {
    return () => {
      clearWatch()
    }
  }, [clearWatch])

  return {
    status,
    coordinates,
    requestLocation,
    clearLocation,
  }
}
