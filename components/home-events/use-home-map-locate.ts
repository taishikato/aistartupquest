"use client"

import { useCallback, useEffect, useRef, type RefObject } from "react"
import type { Map as MapLibreMap } from "maplibre-gl"

import { track } from "@/lib/analytics"
import type { HomeMapView } from "@/lib/home-map-url"
import type { UserCoordinates } from "@/lib/user-location"
import { useUserLocation } from "@/hooks/use-user-location"
import { useUserLocationMarker } from "@/components/map-markers/use-user-location-marker"

// Home world maxZoom is 5.5; zoom in enough to read the player sprite.
const USER_LOCATION_ZOOM = 4.6

type UseHomeMapLocateParams = {
  mapReady: MapLibreMap | null
  mapRef: RefObject<MapLibreMap | null>
  view: HomeMapView
  stopIdleRotation: () => void
  rotationStoppedByUserRef: RefObject<boolean>
}

export function useHomeMapLocate({
  mapReady,
  mapRef,
  view,
  stopIdleRotation,
  rotationStoppedByUserRef,
}: UseHomeMapLocateParams) {
  const pendingFlyToUserRef = useRef(false)
  const {
    status: userLocationStatus,
    coordinates: userCoordinates,
    requestLocation,
  } = useUserLocation()

  useUserLocationMarker({
    mapReady,
    coordinates: userCoordinates,
  })

  const flyToUser = useCallback(
    (coordinates: UserCoordinates) => {
      const map = mapRef.current
      if (!map) {
        return
      }

      rotationStoppedByUserRef.current = true
      stopIdleRotation()
      map.flyTo({
        center: [coordinates.lng, coordinates.lat],
        zoom: Math.max(map.getZoom(), USER_LOCATION_ZOOM),
        duration: 900,
        essential: true,
      })
    },
    [mapRef, rotationStoppedByUserRef, stopIdleRotation]
  )

  useEffect(() => {
    if (!userCoordinates || !pendingFlyToUserRef.current) {
      return
    }

    pendingFlyToUserRef.current = false
    flyToUser(userCoordinates)
  }, [flyToUser, userCoordinates])

  const handleLocateUser = useCallback(() => {
    if (userLocationStatus === "unsupported") {
      return
    }

    track("user_locate_click", {
      surface: "home_map",
      view,
      status: userLocationStatus,
    })

    // Zoom only happens from this control - never from auto-resume on visit.
    if (userCoordinates && userLocationStatus === "tracking") {
      flyToUser(userCoordinates)
      return
    }

    pendingFlyToUserRef.current = true
    if (userLocationStatus !== "requesting") {
      requestLocation()
    }
  }, [flyToUser, requestLocation, userCoordinates, userLocationStatus, view])

  return {
    userLocationStatus,
    handleLocateUser,
  }
}
