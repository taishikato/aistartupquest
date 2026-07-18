import type { Map as MapLibreMap } from "maplibre-gl"

import { FLAT_CAMERA, GLOBE_CAMERA } from "@/components/home-events/cameras"
import type { HomeMapView } from "@/lib/home-map-url"

type ApplyHomeMapViewOptions = {
  /** How to move to the view's default camera. Skip when a city flyTo follows. */
  defaultCamera?: "ease" | "jump" | false
}

export function applyHomeMapView(
  map: MapLibreMap,
  view: HomeMapView,
  { defaultCamera = false }: ApplyHomeMapViewOptions = {}
) {
  const camera = view === "globe" ? GLOBE_CAMERA : FLAT_CAMERA

  map.setProjection({ type: view })
  map.setRenderWorldCopies(view === "mercator")
  map.dragRotate.disable()
  map.setMinZoom(camera.minZoom)

  if (defaultCamera === "ease") {
    map.easeTo({
      center: camera.center,
      zoom: camera.zoom,
      duration: 700,
    })
    return
  }

  if (defaultCamera === "jump") {
    map.jumpTo({
      center: camera.center,
      zoom: camera.zoom,
    })
  }
}
