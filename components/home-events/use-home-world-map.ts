import { useEffect, useRef, useState, type RefObject } from "react"
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl"

import { FLAT_CAMERA } from "@/components/home-events/cameras"
import {
  createCityMarker,
  createEventCityMarker,
  setEventMarkerActive,
  type EventMarkerEntry,
} from "@/components/home-events/markers"
import type {
  CityWithEvents,
  CursorCommunityCity,
} from "@/lib/cursor-community-events"
import { logNonAbortError } from "@/lib/is-abort-error"
import {
  applyRpgAtlasPaint,
  loadWorldAtlasStyle,
} from "@/lib/world-atlas-style"
import { WORLD_STAGE_CITIES } from "@/lib/world-stage-cities"

type UseHomeWorldMapArgs = {
  containerRef: RefObject<HTMLDivElement | null>
  mapRef: RefObject<MapLibreMap | null>
  filteredCities: CityWithEvents[]
  selectedCity: string | null
  selectCity: (city: CursorCommunityCity) => void
  stopIdleRotation: () => void
  rotationStoppedByUserRef: RefObject<boolean>
}

export function useHomeWorldMap({
  containerRef,
  mapRef,
  filteredCities,
  selectedCity,
  selectCity,
  stopIdleRotation,
  rotationStoppedByUserRef,
}: UseHomeWorldMapArgs) {
  const eventMarkersRef = useRef<Map<string, EventMarkerEntry>>(new Map())
  const cityMarkersRef = useRef<Marker[]>([])
  const previousSelectedCityRef = useRef<string | null>(null)
  const [mapReady, setMapReady] = useState<MapLibreMap | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return
    }

    const controller = new AbortController()
    let disposed = false
    let sidebarPaddingCleanup: (() => void) | null = null
    const canvasListeners: Array<{
      type: keyof HTMLElementEventMap
      listener: EventListener
    }> = []
    const eventMarkers = eventMarkersRef.current

    const stopRotationPermanently = () => {
      rotationStoppedByUserRef.current = true
      stopIdleRotation()
    }

    loadWorldAtlasStyle(controller.signal)
      .then((style) => {
        if (disposed || !containerRef.current || mapRef.current) {
          return
        }

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: {
            ...style,
            projection: { type: "mercator" },
          },
          center: FLAT_CAMERA.center,
          zoom: FLAT_CAMERA.zoom,
          minZoom: FLAT_CAMERA.minZoom,
          maxZoom: 5.5,
          minPitch: 0,
          maxPitch: 0,
          attributionControl: false,
          renderWorldCopies: true,
          dragRotate: false,
          touchPitch: false,
        })

        mapRef.current = map

        // Keep camera center in the visible area beside the fixed sidebar.
        const sidebarMediaQuery = window.matchMedia("(min-width: 768px)")
        const syncSidebarPadding = () => {
          map.setPadding({
            left: sidebarMediaQuery.matches ? 380 : 0,
            top: 0,
            right: 0,
            bottom: 0,
          })
        }
        syncSidebarPadding()
        sidebarMediaQuery.addEventListener("change", syncSidebarPadding)
        sidebarPaddingCleanup = () => {
          sidebarMediaQuery.removeEventListener("change", syncSidebarPadding)
        }

        const canvas = map.getCanvas()
        ;(["pointerdown", "wheel", "touchstart"] as const).forEach((type) => {
          canvas.addEventListener(type, stopRotationPermanently, { once: true })
          canvasListeners.push({ type, listener: stopRotationPermanently })
        })

        map.once("load", () => {
          if (disposed) {
            return
          }

          applyRpgAtlasPaint(map)
          map.resize()
          setMapReady(map)
        })

        map.on("error", (error) => {
          console.error(error)
        })
      })
      .catch(logNonAbortError)

    return () => {
      disposed = true
      controller.abort()
      stopIdleRotation()
      sidebarPaddingCleanup?.()
      canvasListeners.forEach(({ type, listener }) => {
        mapRef.current?.getCanvas().removeEventListener(type, listener)
      })
      eventMarkers.forEach((entry) => entry.marker.remove())
      cityMarkersRef.current.forEach((marker) => marker.remove())
      eventMarkers.clear()
      cityMarkersRef.current = []
      mapRef.current?.remove()
      mapRef.current = null
      setMapReady(null)
    }
  }, [containerRef, mapRef, rotationStoppedByUserRef, stopIdleRotation])

  useEffect(() => {
    if (!mapReady) {
      return
    }

    cityMarkersRef.current.forEach((marker) => marker.remove())
    cityMarkersRef.current = WORLD_STAGE_CITIES.map((city) =>
      new maplibregl.Marker({
        element: createCityMarker(city),
        anchor: "bottom",
        opacityWhenCovered: "0",
      })
        .setLngLat([city.lon, city.lat])
        .addTo(mapReady)
    )

    return () => {
      cityMarkersRef.current.forEach((marker) => marker.remove())
      cityMarkersRef.current = []
    }
  }, [mapReady])

  useEffect(() => {
    if (!mapReady) {
      return
    }

    const markers = eventMarkersRef.current
    const nextNames = new Set(filteredCities.map((city) => city.name))

    markers.forEach((entry, name) => {
      if (!nextNames.has(name)) {
        entry.marker.remove()
        markers.delete(name)
      }
    })

    filteredCities.forEach((city) => {
      const existing = markers.get(city.name)

      if (existing) {
        existing.eventCount.value = city.events.length
        existing.count.textContent = String(city.events.length)
        return
      }

      const eventCount = { value: city.events.length }
      const { root, count } = createEventCityMarker({
        city,
        active: city.name === selectedCity,
        onSelectCity: selectCity,
        eventCount,
      })

      const marker = new maplibregl.Marker({
        element: root,
        anchor: "bottom",
        opacityWhenCovered: "0",
      })
        .setLngLat([city.lon, city.lat])
        .addTo(mapReady)

      markers.set(city.name, { marker, root, count, eventCount })
    })

    // Full marker teardown lives in the map-init effect so search/selection
    // churn can keep DOM identity for surviving cities.
  }, [filteredCities, mapReady, selectCity, selectedCity])

  useEffect(() => {
    if (!mapReady) {
      return
    }

    const markers = eventMarkersRef.current
    const previous = previousSelectedCityRef.current

    if (previous && previous !== selectedCity) {
      const entry = markers.get(previous)
      if (entry) {
        setEventMarkerActive(entry.root, false)
      }
    }

    if (selectedCity) {
      const entry = markers.get(selectedCity)
      if (entry) {
        setEventMarkerActive(entry.root, true)
      }
    }

    previousSelectedCityRef.current = selectedCity
  }, [selectedCity, mapReady])

  return mapReady
}
