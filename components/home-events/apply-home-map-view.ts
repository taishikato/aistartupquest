import type { Map as MapLibreMap } from "maplibre-gl"

import { FLAT_CAMERA, GLOBE_CAMERA } from "@/components/home-events/cameras"
import type { HomeMapView } from "@/lib/home-map-url"

export function applyHomeMapView(
  map: MapLibreMap,
  view: HomeMapView,
  { easeToDefaultCamera }: { easeToDefaultCamera: boolean }
) {
  const camera = view === "globe" ? GLOBE_CAMERA : FLAT_CAMERA

  map.setProjection({ type: view })
  map.setRenderWorldCopies(view === "mercator")
  map.dragRotate.disable()
  map.setMinZoom(camera.minZoom)

  if (easeToDefaultCamera) {
    map.easeTo({
      center: camera.center,
      zoom: camera.zoom,
      duration: 700,
    })
  }
}
