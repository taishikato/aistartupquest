import { useEffect, useRef, useState, type RefObject } from "react"
import type { Map as MapLibreMap } from "maplibre-gl"
import type { ReadonlyURLSearchParams } from "next/navigation"

import { applyHomeMapView } from "@/components/home-events/apply-home-map-view"
import type { CityWithEvents, EventCity } from "@/lib/events"
import {
  buildHomeMapQuery,
  parseHomeMapCity,
  parseHomeMapView,
  type HomeMapView,
} from "@/lib/home-map-url"

type UseHomeMapUrlSyncArgs = {
  mapReady: MapLibreMap | null
  mapRef: RefObject<MapLibreMap | null>
  viewRef: RefObject<HomeMapView>
  pathname: string
  searchParams: ReadonlyURLSearchParams
  selectedCity: string | null
  view: HomeMapView
  upcomingCities: CityWithEvents[]
  setView: (view: HomeMapView) => void
  selectCity: (city: EventCity) => void
  startIdleRotation: () => void
  stopIdleRotation: () => void
}

export function useHomeMapUrlSync({
  mapReady,
  mapRef,
  viewRef,
  pathname,
  searchParams,
  selectedCity,
  view,
  upcomingCities,
  setView,
  selectCity,
  startIdleRotation,
  stopIdleRotation,
}: UseHomeMapUrlSyncArgs) {
  const urlHydratedRef = useRef(false)
  const [hasHydratedUrl, setHasHydratedUrl] = useState(false)

  useEffect(() => {
    if (!mapReady || urlHydratedRef.current) {
      return
    }

    urlHydratedRef.current = true

    const urlView = parseHomeMapView(searchParams.get("view"))
    if (urlView === "globe") {
      // Map always boots mercator; force projection even when React state is already globe.
      const map = mapRef.current
      if (map) {
        stopIdleRotation()
        viewRef.current = "globe"
        setView("globe")
        // Do NOT easeTo default globe camera when a city will flyTo next.
        applyHomeMapView(map, "globe", { easeToDefaultCamera: false })
        startIdleRotation()
      }
    }

    const cityName = parseHomeMapCity(searchParams.get("city"), upcomingCities)
    if (cityName) {
      const matched = upcomingCities.find((city) => city.name === cityName)
      if (matched) {
        selectCity(matched)
      }
    }

    // Mark after applying URL selection so the write effect cannot strip
    // ?city= before selectedCity state catches up. This setState is the gate
    // that re-runs the URL writer on the post-hydration render.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional hydration barrier
    setHasHydratedUrl(true)
  }, [
    mapReady,
    mapRef,
    searchParams,
    selectCity,
    setView,
    startIdleRotation,
    stopIdleRotation,
    upcomingCities,
    viewRef,
  ])

  useEffect(() => {
    if (!hasHydratedUrl) {
      return
    }

    const nextQuery = buildHomeMapQuery({
      selectedCity,
      view,
      currentSearch: searchParams.toString(),
    })
    const currentQuery = searchParams.toString()

    if (nextQuery === currentQuery) {
      return
    }

    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname
    window.history.replaceState(null, "", nextUrl)
  }, [hasHydratedUrl, pathname, searchParams, selectedCity, view])
}
