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
 * The artwork is equirectangular (linear latitude over +-90) but in the
 * mercator projection MapLibre drapes image sources linearly in mercator
 * space over +-85, which pushes the drawn continents poleward. Remap a
 * real latitude to the latitude where the artwork draws it so markers
 * land on the art.
 */
export function artLatitude(lat: number): number {
  const mercatorY = MERCATOR_Y_85 * (lat / 90)
  return (Math.atan(Math.sinh(mercatorY)) * 180) / Math.PI
}

/**
 * On the globe projection the image is draped near-linearly in latitude,
 * so only the +-90 -> +-85 squeeze of the artwork needs compensating.
 */
export function artLatitudeOnGlobe(lat: number): number {
  return (lat * 85) / 90
}

/**
 * The artwork's geography is stylized: continents are drawn shifted and
 * stretched (Japan ~10deg west, the Americas ~18deg southwest, ...), so no
 * projection formula alone lands pins on the drawn continents. These
 * quadratic coefficients were least-squares fitted against 20 hand-measured
 * anchor points on the artwork (real lon/lat -> the equirectangular
 * position where the art actually draws that place). Residuals are within
 * about +-4deg - country-level accuracy, which is what the art view needs.
 */
const ART_LON_COEF = [-8.4561, 191.7002, -3.169, -8.0904, -10.9434, -8.0749]
const ART_LAT_COEF = [-16.796, 6.3003, 99.376, -7.0741, 11.1632, 21.2834]

function evalArtFit(coef: number[], lon: number, lat: number): number {
  const x = lon / 180
  const y = lat / 90
  return (
    coef[0] +
    coef[1] * x +
    coef[2] * y +
    coef[3] * x * x +
    coef[4] * x * y +
    coef[5] * y * y
  )
}

/**
 * Map a real-world position to the equirectangular position where the
 * artwork draws it. Feed the returned latitude through artLatitude()
 * (mercator drape) or artLatitudeOnGlobe() (globe drape) before use.
 */
export function artPosition(lon: number, lat: number): [number, number] {
  return [
    evalArtFit(ART_LON_COEF, lon, lat),
    evalArtFit(ART_LAT_COEF, lon, lat),
  ]
}
