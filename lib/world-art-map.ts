import type { StyleSpecification } from "maplibre-gl"

type WorldCamera = {
  center: [number, number]
  zoom: number
  minZoom: number
}

export const WORLD_ART_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    world: {
      type: "image",
      url: "/map-assets/rpg-world-map.webp",
      coordinates: [
        [-180, 85],
        [180, 85],
        [180, -85],
        [-180, -85],
      ],
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#123a9b",
      },
    },
    {
      id: "world",
      type: "raster",
      source: "world",
      paint: {
        "raster-fade-duration": 0,
        "raster-resampling": "nearest",
      },
    },
  ],
}

export const GLOBE_CAMERA: WorldCamera = {
  center: [-40, 30],
  zoom: 1.75,
  minZoom: 1.2,
}

export const FLAT_CAMERA: WorldCamera = {
  center: [5, 32],
  zoom: 1.45,
  minZoom: 1.35,
}

const MERCATOR_Y_85 = Math.asinh(Math.tan((85 * Math.PI) / 180))

/**
 * The artwork is equirectangular (linear latitude over +-90) but MapLibre
 * drapes image sources linearly in mercator space over +-85, which pushes
 * the drawn continents poleward. Remap a real latitude to the latitude
 * where the artwork draws it so markers land on the art.
 */
export function artLatitude(lat: number): number {
  const mercatorY = MERCATOR_Y_85 * (lat / 90)
  return (Math.atan(Math.sinh(mercatorY)) * 180) / Math.PI
}
