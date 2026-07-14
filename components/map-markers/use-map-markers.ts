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

import {
  createMarkerSprite,
  createMeetupSignboardMarker,
} from "@/components/map-markers/sprites"
import { type Company } from "@/lib/company"
import {
  type DiscoveryMode,
  type Meetup,
} from "@/lib/meetup"

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
  mode: DiscoveryMode
  companies: Company[]
  spreadMeetups: Meetup[]
  denseStartups: boolean
  denseMeetups: boolean
  selectedCompany: Company
  selectedMeetup: Meetup | null
  onSelectCompany: (slug: string) => void
  onSelectMeetup: (slug: string) => void
}

export function useMapMarkers({
  mapReady,
  mode,
  companies,
  spreadMeetups,
  denseStartups,
  denseMeetups,
  selectedCompany,
  selectedMeetup,
  onSelectCompany,
  onSelectMeetup,
}: UseMapMarkersParams) {
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const prevActiveSlugRef = useRef<string | null>(null)
  const hasRenderedMarkersRef = useRef(false)
  const mapMarkersSignatureRef = useRef("")
  const prevModeRef = useRef(mode)
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
    selectedSlugRef.current =
      mode === "startups" ? selectedCompany.slug : (selectedMeetup?.slug ?? "")
  }, [mode, selectedCompany.slug, selectedMeetup?.slug])

  useEffect(() => {
    const map = mapReady
    if (!map) {
      return
    }

    const isModeSwitch =
      hasRenderedMarkersRef.current && prevModeRef.current !== mode
    if (isModeSwitch) {
      skipNextBoundsRefitRef.current = true
    }

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    if (mode === "startups") {
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
        element.addEventListener("click", () => onSelectCompany(company.slug))

        const marker = new maplibregl.Marker({ element, anchor: "bottom" })
          .setLngLat(company.coordinates)
          .addTo(map)

        markersRef.current.set(company.slug, marker)
      })

      const markerSetSignature = [...companies]
        .map((c) => c.slug)
        .sort()
        .join("|")
      const modeMarkerSetSignature = `startups:${markerSetSignature}`
      const shouldRefit =
        modeMarkerSetSignature !== mapMarkersSignatureRef.current &&
        companies.length > 0
      mapMarkersSignatureRef.current = modeMarkerSetSignature

      if (shouldRefit) {
        if (
          !shouldSkipBoundsRefit(
            skipFirstBoundsRefitRef,
            skipNextBoundsRefitRef
          )
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
    } else {
      const dense = denseMeetups
      spreadMeetups.forEach((meetup) => {
        const active = meetup.slug === selectedSlugRef.current
        const element = document.createElement("button")
        element.type = "button"
        element.setAttribute("aria-label", meetup.title)
        element.style.cursor = "pointer"
        element.style.padding = "0"
        element.style.outline = "none"
        element.style.background = "none"
        element.style.border = "none"
        element.appendChild(createMeetupSignboardMarker(meetup, active, dense))
        element.addEventListener("click", () => onSelectMeetup(meetup.slug))

        const marker = new maplibregl.Marker({ element, anchor: "bottom" })
          .setLngLat(meetup.coordinates)
          .addTo(map)

        markersRef.current.set(meetup.slug, marker)
      })

      const markerSetSignature = [...spreadMeetups]
        .map((m) => m.slug)
        .sort()
        .join("|")
      const modeMarkerSetSignature = `meetups:${markerSetSignature}`
      const shouldRefit =
        modeMarkerSetSignature !== mapMarkersSignatureRef.current &&
        spreadMeetups.length > 0
      mapMarkersSignatureRef.current = modeMarkerSetSignature

      if (shouldRefit) {
        if (
          !shouldSkipBoundsRefit(
            skipFirstBoundsRefitRef,
            skipNextBoundsRefitRef
          )
        ) {
          const bounds = new maplibregl.LngLatBounds()
          spreadMeetups.forEach((m) => bounds.extend(m.coordinates))

          if (spreadMeetups.length === 1) {
            map.jumpTo({
              center: spreadMeetups[0].coordinates,
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
    }

    hasRenderedMarkersRef.current = true
    prevActiveSlugRef.current = selectedSlugRef.current || null
    prevModeRef.current = mode
  }, [
    companies,
    denseMeetups,
    denseStartups,
    mapReady,
    mode,
    onSelectCompany,
    onSelectMeetup,
    spreadMeetups,
  ])

  useEffect(() => {
    const activeSlug =
      mode === "startups" ? selectedCompany.slug : (selectedMeetup?.slug ?? null)
    const prevSlug = prevActiveSlugRef.current

    if (prevSlug === activeSlug) {
      return
    }

    if (mode === "startups") {
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
    } else {
      const dense = denseMeetups
      const meetupBySlug = new Map(spreadMeetups.map((m) => [m.slug, m]))

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
        const meetup = meetupBySlug.get(slug)

        button.style.zIndex = active ? "10" : "1"
        if (meetup) {
          button.replaceChildren(
            createMeetupSignboardMarker(meetup, active, dense)
          )
        }
      }
    }

    prevActiveSlugRef.current = activeSlug
  }, [
    companies,
    denseMeetups,
    denseStartups,
    mode,
    selectedCompany,
    selectedMeetup,
    spreadMeetups,
  ])
}
