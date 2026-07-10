type WorldCamera = {
  center: [number, number]
  zoom: number
  minZoom: number
}

export const GLOBE_CAMERA: WorldCamera = {
  center: [-40, 30],
  zoom: 1.75,
  minZoom: 1.2,
}
