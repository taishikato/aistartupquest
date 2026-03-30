"use client"

import { useEffect, useRef } from "react"
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl"

// Parse ASCII art into [col, row] pixel coordinate arrays
function parseShape(art: string[]): [number, number][] {
  const pixels: [number, number][] = []
  for (let y = 0; y < art.length; y++) {
    for (let x = 0; x < art[y].length; x++) {
      if (art[y][x] === "#") pixels.push([x, y])
    }
  }
  return pixels
}

const SHAPES = [
  // Large cumulus — two bumps on top, wide body
  parseShape([
    "            ######                        ",
    "         ############      ####           ",
    "       ################  ########         ",
    "      ####################################",
    "     ######################################",
    "    ########################################",
    "   ##########################################",
    "  ############################################",
    "  ############################################",
    "   ##########################################",
    "    ########################################",
    "      ####################################",
    "        ################################  ",
    "           ##########################     ",
  ]),
  // Medium bumpy cloud
  parseShape([
    "          ######         ####      ",
    "        ##########     ########    ",
    "      ##################################",
    "     ####################################",
    "    ######################################",
    "   ########################################",
    "   ########################################",
    "    ######################################",
    "      ##################################",
    "        ##############################  ",
    "           ########################     ",
  ]),
  // Small puffy cloud
  parseShape([
    "        ######        ",
    "      ##########      ",
    "    ##############    ",
    "   ################   ",
    "  ##################  ",
    " #################### ",
    "######################",
    "######################",
    " #################### ",
    "  ##################  ",
    "    ##############    ",
    "       ########       ",
  ]),
  // Wide thin cloud
  parseShape([
    "         ######           ######       ",
    "       ##########       ##########     ",
    "     ########################################",
    "    ##########################################",
    "   ############################################",
    "    ##########################################",
    "     ########################################",
    "       ####################################  ",
    "          ##############################     ",
  ]),
]

function buildBoxShadow(
  pixels: [number, number][],
  size: number,
  color: string
) {
  return pixels
    .map(([x, y]) => `${x * size}px ${y * size}px 0 0 ${color}`)
    .join(",")
}

function createCloudElement(shapeIndex: number, size: number, opacity: number) {
  const el = document.createElement("div")
  el.style.pointerEvents = "none"
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.boxShadow = buildBoxShadow(SHAPES[shapeIndex], size, "#fff")
  el.style.opacity = String(opacity)
  return el
}

type CloudConfig = {
  shape: number
  size: number
  lat: number
  lng: number
  speed: number // lng degrees per second (westward drift)
  opacity: number
}

const CLOUD_CONFIGS: CloudConfig[] = [
  {
    shape: 0,
    size: 4,
    lat: 37.815,
    lng: -122.39,
    speed: 0.0012,
    opacity: 0.6,
  },
  {
    shape: 2,
    size: 4,
    lat: 37.795,
    lng: -122.43,
    speed: 0.0008,
    opacity: 0.45,
  },
  {
    shape: 1,
    size: 4,
    lat: 37.808,
    lng: -122.36,
    speed: 0.001,
    opacity: 0.5,
  },
  {
    shape: 3,
    size: 3,
    lat: 37.782,
    lng: -122.45,
    speed: 0.0006,
    opacity: 0.35,
  },
  {
    shape: 2,
    size: 3,
    lat: 37.775,
    lng: -122.41,
    speed: 0.0005,
    opacity: 0.3,
  },
  {
    shape: 0,
    size: 3,
    lat: 37.82,
    lng: -122.44,
    speed: 0.0011,
    opacity: 0.45,
  },
  {
    shape: 1,
    size: 3,
    lat: 37.788,
    lng: -122.38,
    speed: 0.0007,
    opacity: 0.4,
  },
  {
    shape: 3,
    size: 3,
    lat: 37.77,
    lng: -122.42,
    speed: 0.0004,
    opacity: 0.25,
  },
]

type PixelCloudsProps = {
  map: MapLibreMap
}

export function PixelClouds({ map }: PixelCloudsProps) {
  const frameRef = useRef<number>(0)

  useEffect(() => {
    let disposed = false
    const states = CLOUD_CONFIGS.map((config) => {
      const element = createCloudElement(
        config.shape,
        config.size,
        config.opacity
      )
      const marker = new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat([config.lng, config.lat])
        .addTo(map)

      marker.getElement().style.zIndex = "30"
      marker.getElement().style.pointerEvents = "none"

      return { ...config, currentLng: config.lng, marker }
    })

    let lastTime = performance.now()

    function animate(time: number) {
      if (disposed) {
        return
      }

      const dt = (time - lastTime) / 1000
      lastTime = time

      let bounds: ReturnType<MapLibreMap["getBounds"]>

      try {
        bounds = map.getBounds()
      } catch {
        return
      }

      const lngSpan = bounds.getEast() - bounds.getWest()
      const rightLng = bounds.getEast() + lngSpan * 0.3
      const leftLng = bounds.getWest() - lngSpan * 0.3

      for (const state of states) {
        state.currentLng -= state.speed * dt

        // Wrap around when cloud exits left side
        if (state.currentLng < leftLng) {
          state.currentLng = rightLng
        }

        state.marker.setLngLat([state.currentLng, state.lat])
      }

      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      disposed = true
      cancelAnimationFrame(frameRef.current)
      states.forEach((s) => s.marker.remove())
    }
  }, [map])

  return null
}
