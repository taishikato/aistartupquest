import {
  type ExpressionSpecification,
  type Map as MapLibreMap,
} from "maplibre-gl"

export function setPaintPropertyIfLayerExists(
  map: MapLibreMap,
  layerId: string,
  property: string,
  value: unknown
) {
  if (!map.getLayer(layerId)) {
    return
  }

  map.setPaintProperty(layerId, property, value)
}

export function addVoxelCityLayers(map: MapLibreMap) {
  if (!map.getSource("carto") || map.getLayer("minecraft-buildings")) {
    return
  }

  const rawHeight: ExpressionSpecification = [
    "coalesce",
    ["to-number", ["get", "render_height"]],
    ["to-number", ["get", "height"]],
    12,
  ]
  const snappedHeight: ExpressionSpecification = [
    "max",
    8,
    ["min", 180, ["*", ["round", ["/", rawHeight, 8]], 8]],
  ]

  map.addLayer(
    {
      id: "minecraft-buildings",
      type: "fill-extrusion",
      source: "carto",
      "source-layer": "building",
      minzoom: 11,
      paint: {
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          snappedHeight,
          8,
          "#c9a87c",
          32,
          "#d4b88e",
          72,
          "#dfc8a2",
          140,
          "#ebd8b8",
        ],
        "fill-extrusion-height": snappedHeight,
        "fill-extrusion-base": 0,
        "fill-extrusion-opacity": 0.88,
        "fill-extrusion-vertical-gradient": false,
      },
    },
    "boundary_country_outline"
  )
}

// Apply a blocky voxel-like palette without changing the data layers.
export function applyMinecraftStyle(map: MapLibreMap) {
  setPaintPropertyIfLayerExists(
    map,
    "background",
    "background-color",
    "#a5c76e"
  )

  setPaintPropertyIfLayerExists(map, "landcover", "fill-color", "#7ea64a")
  setPaintPropertyIfLayerExists(map, "landcover", "fill-opacity", 0.96)
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

  setPaintPropertyIfLayerExists(map, "water", "fill-color", "#4b83c2")
  setPaintPropertyIfLayerExists(map, "water_shadow", "fill-color", "#325f97")
  setPaintPropertyIfLayerExists(map, "waterway", "line-color", "#4479b1")
  setPaintPropertyIfLayerExists(map, "waterway", "line-width", 2.4)

  setPaintPropertyIfLayerExists(map, "building", "fill-color", "#c4a87a")
  setPaintPropertyIfLayerExists(map, "building", "fill-opacity", 0.2)
  setPaintPropertyIfLayerExists(map, "building-top", "fill-color", "#e0cca0")
  setPaintPropertyIfLayerExists(map, "building-top", "fill-opacity", 0)

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
  ]
  roadFills.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#8f856a")
  )

  setPaintPropertyIfLayerExists(
    map,
    "road_trunk_fill_noramp",
    "line-color",
    "#a79b76"
  )
  setPaintPropertyIfLayerExists(
    map,
    "road_mot_fill_noramp",
    "line-color",
    "#8a7c5b"
  )

  setPaintPropertyIfLayerExists(map, "road_path", "line-color", "#735d3a")

  setPaintPropertyIfLayerExists(map, "rail", "line-color", "#5a5650")
  setPaintPropertyIfLayerExists(map, "rail_dash", "line-color", "#b1aa94")

  const tunnelCases = [
    "tunnel_service_case",
    "tunnel_minor_case",
    "tunnel_sec_case",
    "tunnel_pri_case",
    "tunnel_trunk_case",
    "tunnel_mot_case",
  ]
  tunnelCases.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#645642")
  )

  const tunnelFills = [
    "tunnel_service_fill",
    "tunnel_minor_fill",
    "tunnel_sec_fill",
    "tunnel_pri_fill",
    "tunnel_trunk_fill",
    "tunnel_mot_fill",
  ]
  tunnelFills.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#887a5d")
  )

  const bridgeCases = [
    "bridge_service_case",
    "bridge_minor_case",
    "bridge_sec_case",
    "bridge_pri_case",
    "bridge_trunk_case",
    "bridge_mot_case",
  ]
  bridgeCases.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#473c2e")
  )

  const bridgeFills = [
    "bridge_service_fill",
    "bridge_minor_fill",
    "bridge_sec_fill",
    "bridge_pri_fill",
    "bridge_trunk_fill",
    "bridge_mot_fill",
  ]
  bridgeFills.forEach((id) =>
    setPaintPropertyIfLayerExists(map, id, "line-color", "#978567")
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
  ]
  placeLabels.forEach((id) => {
    setPaintPropertyIfLayerExists(map, id, "text-color", "#3d2e1f")
    setPaintPropertyIfLayerExists(map, id, "text-halo-color", "#d9cb97")
    setPaintPropertyIfLayerExists(map, id, "text-halo-width", 1.5)
  })

  const cityDots = [
    "place_city_dot_r7",
    "place_city_dot_r4",
    "place_city_dot_r2",
    "place_city_dot_z7",
    "place_capital_dot_z7",
  ]
  cityDots.forEach((id) => {
    setPaintPropertyIfLayerExists(map, id, "text-color", "#2e2418")
    setPaintPropertyIfLayerExists(map, id, "text-halo-color", "#d9cb97")
    setPaintPropertyIfLayerExists(map, id, "text-halo-width", 1.5)
  })

  setPaintPropertyIfLayerExists(map, "place_state", "text-color", "#6b5a46")
  setPaintPropertyIfLayerExists(map, "place_country_1", "text-color", "#4f3f2d")
  setPaintPropertyIfLayerExists(map, "place_country_2", "text-color", "#4f3f2d")

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

  setPaintPropertyIfLayerExists(map, "poi_park", "text-color", "#346a28")
  setPaintPropertyIfLayerExists(map, "poi_stadium", "text-color", "#5a4a3a")

  setPaintPropertyIfLayerExists(map, "aeroway-runway", "line-color", "#8b8371")
  setPaintPropertyIfLayerExists(map, "aeroway-taxiway", "line-color", "#9d927e")
}
