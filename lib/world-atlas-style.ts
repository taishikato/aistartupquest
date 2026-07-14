import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl"

import { setPaintPropertyIfLayerExists } from "@/lib/map-paint"

export const WORLD_ATLAS_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"

export async function loadWorldAtlasStyle(
  signal: AbortSignal
): Promise<StyleSpecification> {
  const response = await fetch(WORLD_ATLAS_STYLE_URL, { signal })

  if (!response.ok) {
    throw new Error(`Failed to load map style: ${response.status}`)
  }

  return (await response.json()) as StyleSpecification
}

export function applyRpgAtlasPaint(map: MapLibreMap) {
  map.getStyle().layers.forEach((layer) => {
    if (layer.type === "symbol") {
      map.setLayoutProperty(layer.id, "visibility", "none")
    }
  })

  setPaintPropertyIfLayerExists(map, "background", "background-opacity", 0)

  if (!map.getSource("rpg-land-base")) {
    map.addSource("rpg-land-base", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-180, -85],
              [180, -85],
              [180, 85],
              [-180, 85],
              [-180, -85],
            ],
          ],
        },
      },
    })
  }

  if (!map.getLayer("rpg-land-base-fill")) {
    const firstLayerId = map.getStyle().layers[0]?.id
    map.addLayer(
      {
        id: "rpg-land-base-fill",
        type: "fill",
        source: "rpg-land-base",
        paint: { "fill-color": "#9cc465" },
      },
      map.getLayer("landcover")
        ? "landcover"
        : map.getLayer("rpg-urban-fill")
          ? "rpg-urban-fill"
          : firstLayerId
    )
  }

  setPaintPropertyIfLayerExists(map, "water", "fill-color", "#3f78c8")
  setPaintPropertyIfLayerExists(map, "water_shadow", "fill-color", "#2c5aa8")
  setPaintPropertyIfLayerExists(map, "waterway", "line-color", "#4479b1")
  setPaintPropertyIfLayerExists(map, "waterway", "line-width", 2.4)

  setPaintPropertyIfLayerExists(map, "landcover", "fill-color", [
    "match",
    ["get", "class"],
    "wood",
    "#55923c",
    "grass",
    "#8fbf52",
    "#79a943",
  ])
  setPaintPropertyIfLayerExists(map, "landcover", "fill-opacity", 0.96)

  if (!map.getSource("rpg-urban-areas")) {
    map.addSource("rpg-urban-areas", {
      type: "geojson",
      data: "/map-data/ne-urban-areas.json",
    })
  }

  if (!map.getLayer("rpg-urban-fill")) {
    map.addLayer(
      {
        id: "rpg-urban-fill",
        type: "fill",
        source: "rpg-urban-areas",
        paint: { "fill-color": "#d8bd8a", "fill-opacity": 0.9 },
      },
      map.getLayer("water_shadow")
        ? "water_shadow"
        : map.getLayer("water")
          ? "water"
          : undefined
    )
  }

  ;["park_national_park", "park_nature_reserve"].forEach((id) => {
    setPaintPropertyIfLayerExists(map, id, "fill-color", "#5f9235")
    setPaintPropertyIfLayerExists(map, id, "fill-opacity", 0.92)
  })

  setPaintPropertyIfLayerExists(
    map,
    "landuse_residential",
    "fill-color",
    "#ddd2ac"
  )
  setPaintPropertyIfLayerExists(map, "landuse", "fill-color", "#d6c99a")
  setPaintPropertyIfLayerExists(map, "landuse", "fill-opacity", 0.88)

  const roadCases = [
    "road_service_case",
    "road_minor_case",
    "road_pri_case_ramp",
    "road_trunk_case_ramp",
    "road_mot_case_ramp",
    "road_sec_case_noramp",
    "road_pri_case_noramp",
    "road_trunk_case_noramp",
    "road_mot_case_noramp",
    "tunnel_service_case",
    "tunnel_minor_case",
    "tunnel_sec_case",
    "tunnel_pri_case",
    "tunnel_trunk_case",
    "tunnel_mot_case",
    "bridge_service_case",
    "bridge_minor_case",
    "bridge_sec_case",
    "bridge_pri_case",
    "bridge_trunk_case",
    "bridge_mot_case",
  ]
  roadCases.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#3f3427")
  )

  const roadFills = [
    "road_service_fill",
    "road_minor_fill",
    "road_pri_fill_ramp",
    "road_trunk_fill_ramp",
    "road_mot_fill_ramp",
    "road_sec_fill_noramp",
    "road_pri_fill_noramp",
    "road_trunk_fill_noramp",
    "road_mot_fill_noramp",
    "tunnel_service_fill",
    "tunnel_minor_fill",
    "tunnel_sec_fill",
    "tunnel_pri_fill",
    "tunnel_trunk_fill",
    "tunnel_mot_fill",
    "bridge_service_fill",
    "bridge_minor_fill",
    "bridge_sec_fill",
    "bridge_pri_fill",
    "bridge_trunk_fill",
    "bridge_mot_fill",
  ]
  roadFills.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#958868")
  )

  setPaintPropertyIfLayerExists(map, "road_path", "line-color", "#735d3a")
  setPaintPropertyIfLayerExists(map, "rail", "line-color", "#5a5650")
  setPaintPropertyIfLayerExists(map, "rail_dash", "line-color", "#b1aa94")

  setPaintPropertyIfLayerExists(
    map,
    "boundary_country_outline",
    "line-color",
    "#f3e2a5"
  )
  setPaintPropertyIfLayerExists(
    map,
    "boundary_country_outline",
    "line-opacity",
    0.78
  )
  setPaintPropertyIfLayerExists(map, "boundary_county", "line-color", "#8d6c49")
  setPaintPropertyIfLayerExists(map, "boundary_state", "line-color", "#725536")

  const placeLabels = [
    "place_hamlet",
    "place_suburbs",
    "place_villages",
    "place_town",
    "place_city_r6",
    "place_city_r5",
    "place_state",
    "place_country_1",
    "place_country_2",
  ]
  placeLabels.forEach((id) => {
    setPaintPropertyIfLayerExists(map, id, "text-color", "#3d2e1f")
    setPaintPropertyIfLayerExists(map, id, "text-halo-color", "#d9cb97")
    setPaintPropertyIfLayerExists(map, id, "text-halo-width", 1.5)
  })

  const waterLabels = [
    "watername_ocean",
    "watername_sea",
    "watername_lake",
    "watername_lake_line",
    "waterway_label",
  ]
  waterLabels.forEach((id) => {
    setPaintPropertyIfLayerExists(map, id, "text-color", "#244e82")
    setPaintPropertyIfLayerExists(map, id, "text-halo-color", "#78a7db")
    setPaintPropertyIfLayerExists(map, id, "text-halo-width", 1)
  })
}
