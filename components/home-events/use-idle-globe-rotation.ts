import { useCallback, useRef, type RefObject } from "react"
import type { Map as MapLibreMap } from "maplibre-gl"

import { IDLE_ROTATION_DEGREES_PER_FRAME } from "@/components/home-events/cameras"
import type { HomeMapView } from "@/lib/home-map-url"

export function useIdleGlobeRotation(
  mapRef: RefObject<MapLibreMap | null>,
  viewRef: RefObject<HomeMapView>
) {
  const rotationFrameRef = useRef<number | null>(null)
  const rotationStoppedByUserRef = useRef(false)

  const stopIdleRotation = useCallback(() => {
    if (rotationFrameRef.current !== null) {
      window.cancelAnimationFrame(rotationFrameRef.current)
      rotationFrameRef.current = null
    }
  }, [])

  const startIdleRotation = useCallback(() => {
    stopIdleRotation()

    if (rotationStoppedByUserRef.current || viewRef.current !== "globe") {
      return
    }

    rotationFrameRef.current = window.requestAnimationFrame(function rotate() {
      const rotatingMap = mapRef.current

      if (
        !rotatingMap ||
        viewRef.current !== "globe" ||
        rotationStoppedByUserRef.current
      ) {
        rotationFrameRef.current = null
        return
      }

      const center = rotatingMap.getCenter()
      rotatingMap.jumpTo({
        center: [center.lng + IDLE_ROTATION_DEGREES_PER_FRAME, center.lat],
      })
      rotationFrameRef.current = window.requestAnimationFrame(rotate)
    })
  }, [mapRef, stopIdleRotation, viewRef])

  return {
    startIdleRotation,
    stopIdleRotation,
    rotationStoppedByUserRef,
  }
}
