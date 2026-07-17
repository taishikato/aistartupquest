"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  isGeolocationSupported,
  readUserLocationOptedIn,
  toUserCoordinates,
  userLocationErrorStatus,
  writeUserLocationOptedIn,
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
}

export function useUserLocation(): UseUserLocationResult {
  // Always start as idle so SSR HTML matches the first client render.
  // Geolocation support / resume is resolved after mount.
  const [status, setStatus] = useState<UserLocationStatus>("idle")
  const [coordinates, setCoordinates] = useState<UserCoordinates | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const supportedRef = useRef(false)

  const clearWatch = useCallback(() => {
    if (watchIdRef.current === null || !supportedRef.current) {
      return
    }

    navigator.geolocation.clearWatch(watchIdRef.current)
    watchIdRef.current = null
  }, [])

  const requestLocation = useCallback(() => {
    if (!supportedRef.current || !isGeolocationSupported()) {
      setStatus("unsupported")
      return
    }

    clearWatch()
    setStatus("requesting")

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        writeUserLocationOptedIn(true)
        setCoordinates(toUserCoordinates(position))
        setStatus("tracking")
      },
      (error) => {
        clearWatch()
        setCoordinates(null)
        const nextStatus = userLocationErrorStatus(error)
        if (nextStatus === "denied") {
          writeUserLocationOptedIn(false)
        }
        setStatus(nextStatus)
      },
      GEO_OPTIONS
    )
  }, [clearWatch])

  useEffect(() => {
    const supported = isGeolocationSupported()
    supportedRef.current = supported

    let cancelled = false
    let permissionStatus: PermissionStatus | null = null

    const resumeIfGranted = () => {
      if (cancelled) {
        return
      }

      requestLocation()
    }

    // Defer status updates out of the effect body for react-hooks/set-state-in-effect.
    void Promise.resolve().then(async () => {
      if (cancelled) {
        return
      }

      if (!supported) {
        setStatus("unsupported")
        return
      }

      try {
        if (navigator.permissions?.query) {
          permissionStatus = await navigator.permissions.query({
            name: "geolocation",
          })

          if (cancelled) {
            return
          }

          if (permissionStatus.state === "granted") {
            resumeIfGranted()
          } else if (
            permissionStatus.state === "prompt" &&
            readUserLocationOptedIn()
          ) {
            // Some browsers keep Permissions at "prompt" even after a prior
            // grant; the opt-in flag lets us resume without a locate click.
            resumeIfGranted()
          }

          permissionStatus.onchange = () => {
            if (cancelled || !permissionStatus) {
              return
            }

            if (permissionStatus.state === "granted") {
              resumeIfGranted()
              return
            }

            if (permissionStatus.state === "denied") {
              writeUserLocationOptedIn(false)
              clearWatch()
              setCoordinates(null)
              setStatus("denied")
            }
          }
          return
        }
      } catch {
        // Permissions API missing or blocked - fall through to storage hint.
      }

      if (!cancelled && readUserLocationOptedIn()) {
        resumeIfGranted()
      }
    })

    return () => {
      cancelled = true
      if (permissionStatus) {
        permissionStatus.onchange = null
      }
      clearWatch()
    }
  }, [clearWatch, requestLocation])

  return {
    status,
    coordinates,
    requestLocation,
  }
}
