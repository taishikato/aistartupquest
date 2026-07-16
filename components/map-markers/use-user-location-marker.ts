"use client"

import { useEffect, useRef } from "react"
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl"

import type { UserCoordinates } from "@/lib/user-location"
import { createPlayerSprite } from "@/components/map-markers/player-sprite"

type UseUserLocationMarkerParams = {
  mapReady: MapLibreMap | null
  coordinates: UserCoordinates | null
}

export function useUserLocationMarker({
  mapReady,
  coordinates,
}: UseUserLocationMarkerParams) {
  const markerRef = useRef<Marker | null>(null)

  useEffect(() => {
    return () => {
      markerRef.current?.remove()
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapReady

    if (!map || !coordinates) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }

    const lngLat: [number, number] = [coordinates.lng, coordinates.lat]

    if (!markerRef.current) {
      const element = document.createElement("div")
      element.setAttribute("aria-label", "Your location")
      element.style.zIndex = "20"
      element.appendChild(createPlayerSprite())

      markerRef.current = new maplibregl.Marker({
        element,
        anchor: "bottom",
      })
        .setLngLat(lngLat)
        .addTo(map)
      return
    }

    markerRef.current.setLngLat(lngLat)
  }, [coordinates, mapReady])
}
