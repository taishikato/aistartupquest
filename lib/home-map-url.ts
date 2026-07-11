export type HomeMapView = "mercator" | "globe"

export function parseHomeMapView(value: string | null): HomeMapView {
  return value === "globe" ? "globe" : "mercator"
}

export function parseHomeMapCity(
  value: string | null,
  cities: ReadonlyArray<{ name: string }>
): string | null {
  if (!value) {
    return null
  }

  return cities.some((city) => city.name === value) ? value : null
}

export function buildHomeMapQuery({
  selectedCity,
  view,
  currentSearch,
}: {
  selectedCity: string | null
  view: HomeMapView
  currentSearch: string
}): string {
  const params = new URLSearchParams(currentSearch)

  if (selectedCity) {
    params.set("city", selectedCity)
  } else {
    params.delete("city")
  }

  if (view === "globe") {
    params.set("view", "globe")
  } else {
    params.delete("view")
  }

  return params.toString()
}
