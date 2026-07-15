"use client"

import {
  useEffect,
  useRef,
  type MutableRefObject,
} from "react"
import maplibregl, {
  type Map as MapLibreMap,
  type Marker,
} from "maplibre-gl"

import { createMarkerSprite } from "@/components/map-markers/sprites"
import { track } from "@/lib/analytics"
import { type Company } from "@/lib/company"

// Keep in sync with MAP_PITCH / MAP_BEARING in map-shell.tsx (camera effect).
const MAP_PITCH = 54
const MAP_BEARING = -24

function shouldSkipBoundsRefit(
  skipFirstBoundsRefitRef: MutableRefObject<boolean>,
  skipNextBoundsRefitRef: MutableRefObject<boolean>
) {
  const skip = skipFirstBoundsRefitRef.current || skipNextBoundsRefitRef.current

  skipFirstBoundsRefitRef.current = false
  skipNextBoundsRefitRef.current = false

  return skip
}

type UseMapMarkersParams = {
  mapReady: MapLibreMap | null
  companies: Company[]
  denseStartups: boolean
  selectedCompany: Company
  onSelectCompany: (slug: string) => void
}

export function useMapMarkers({
  mapReady,
  companies,
  denseStartups,
  selectedCompany,
  onSelectCompany,
}: UseMapMarkersParams) {
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const prevActiveSlugRef = useRef<string | null>(null)
  const mapMarkersSignatureRef = useRef("")
  const selectedSlugRef = useRef(selectedCompany.slug)
  const skipNextBoundsRefitRef = useRef(false)
  const skipFirstBoundsRefitRef = useRef(true)

  useEffect(() => {
    const markers = markersRef.current
    return () => {
      markers.forEach((marker) => marker.remove())
      markers.clear()
    }
  }, [])

  useEffect(() => {
    selectedSlugRef.current = selectedCompany.slug
  }, [selectedCompany.slug])

  useEffect(() => {
    const map = mapReady
    if (!map) {
      return
    }

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    const dense = denseStartups
    companies.forEach((company) => {
      const active = company.slug === selectedSlugRef.current
      const element = document.createElement("button")
      element.type = "button"
      element.setAttribute("aria-label", company.name)
      element.style.cursor = "pointer"
      element.style.padding = "0"
      element.style.outline = "none"
      element.style.background = "none"
      element.style.border = "none"
      element.appendChild(createMarkerSprite(company, active, dense))
      element.addEventListener("click", () => {
        track("company_marker_click", {
          company_slug: company.slug,
          company_name: company.name,
          city: company.city,
        })
        onSelectCompany(company.slug)
      })

      const marker = new maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat(company.coordinates)
        .addTo(map)

      markersRef.current.set(company.slug, marker)
    })

    const markerSetSignature = [...companies]
      .map((c) => c.slug)
      .sort()
      .join("|")
    const shouldRefit =
      markerSetSignature !== mapMarkersSignatureRef.current &&
      companies.length > 0
    mapMarkersSignatureRef.current = markerSetSignature

    if (shouldRefit) {
      if (
        !shouldSkipBoundsRefit(skipFirstBoundsRefitRef, skipNextBoundsRefitRef)
      ) {
        const bounds = new maplibregl.LngLatBounds()
        companies.forEach((c) => bounds.extend(c.coordinates))

        if (companies.length === 1) {
          map.jumpTo({
            center: companies[0].coordinates,
            zoom: 12.5,
            pitch: MAP_PITCH,
            bearing: MAP_BEARING,
          })
        } else {
          map.fitBounds(bounds, {
            padding: 56,
            maxZoom: 12.35,
            duration: 0,
          })
          map.setPitch(MAP_PITCH)
          map.setBearing(MAP_BEARING)
        }
      }
    }

    prevActiveSlugRef.current = selectedSlugRef.current || null
  }, [companies, denseStartups, mapReady, onSelectCompany])

  useEffect(() => {
    const activeSlug = selectedCompany.slug
    const prevSlug = prevActiveSlugRef.current

    if (prevSlug === activeSlug) {
      return
    }

    const dense = denseStartups
    const companyBySlug = new Map(companies.map((c) => [c.slug, c]))

    for (const slug of [prevSlug, activeSlug]) {
      if (!slug) {
        continue
      }

      const marker = markersRef.current.get(slug)
      if (!marker) {
        continue
      }

      const button = marker.getElement() as HTMLButtonElement
      const active = slug === activeSlug
      const company = companyBySlug.get(slug)

      button.style.zIndex = active ? "10" : "1"
      if (company) {
        button.replaceChildren(createMarkerSprite(company, active, dense))
      }
    }

    prevActiveSlugRef.current = activeSlug
  }, [companies, denseStartups, selectedCompany])
}
