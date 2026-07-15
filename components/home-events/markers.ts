import type { Marker } from "maplibre-gl"

import type { CityWithEvents } from "@/lib/cursor-community-events"
import type { WorldStageCity } from "@/lib/world-stage-cities"

export type EventMarkerEntry = {
  marker: Marker
  root: HTMLButtonElement
  count: HTMLSpanElement
}

export function createEventCityMarker({
  city,
  active,
  onSelectCity,
}: {
  city: CityWithEvents
  active: boolean
  onSelectCity: (city: CityWithEvents) => void
}): { root: HTMLButtonElement; count: HTMLSpanElement } {
  const button = document.createElement("button")
  button.type = "button"
  button.className = active
    ? "quest-event-marker is-active"
    : "quest-event-marker"
  button.setAttribute("aria-label", `Show Cursor events in ${city.name}`)
  button.style.display = "block"
  button.style.width = "42px"
  button.style.height = "42px"
  button.style.padding = "0"
  button.style.border = "0"
  button.style.background = "transparent"
  button.style.cursor = "pointer"
  button.style.transformOrigin = "50% 100%"
  button.style.zIndex = active ? "20" : "1"

  // Bounce animates this wrapper so it does not fight the active scale transform.
  const body = document.createElement("span")
  body.className = "quest-event-marker__body"
  body.style.display = "block"
  body.style.position = "relative"
  body.style.width = "42px"
  body.style.height = "42px"
  body.style.pointerEvents = "none"

  const image = document.createElement("img")
  image.src = "/map-assets/quest-marker.png"
  image.alt = ""
  image.draggable = false
  image.style.display = "block"
  image.style.width = "42px"
  image.style.height = "42px"

  const count = document.createElement("span")
  count.textContent = String(city.events.length)
  count.style.position = "absolute"
  // Parchment sits in the middle ~50% of the art, slightly below vertical center.
  count.style.top = "56%"
  count.style.left = "50%"
  count.style.transform = "translate(-50%, -50%)"
  count.style.color = "#5a3d1e"
  count.style.fontFamily = "var(--font-pixel)"
  count.style.fontSize = "10px"
  count.style.lineHeight = "1"
  count.style.pointerEvents = "none"

  body.append(image, count)
  button.append(body)
  button.addEventListener("click", () => onSelectCity(city))

  return { root: button, count }
}

export function setEventMarkerActive(root: HTMLButtonElement, active: boolean) {
  root.classList.toggle("is-active", active)
  root.style.zIndex = active ? "20" : "1"
}

export function createCityMarker(city: WorldStageCity) {
  const anchor = document.createElement("a")
  anchor.href = city.href
  anchor.setAttribute("aria-label", `Open ${city.name} AI Startup Map`)
  anchor.style.display = "block"
  anchor.style.width = "70px"
  anchor.style.height = "70px"
  anchor.style.transformOrigin = "50% 70%"
  anchor.style.filter = "drop-shadow(0 5px 8px rgba(0, 0, 0, 0.35))"

  const markerBody = document.createElement("span")
  markerBody.style.position = "absolute"
  markerBody.style.inset = "0"

  const image = document.createElement("img")
  image.src = "/map-assets/city-sign-marker.png"
  image.alt = ""
  image.draggable = false
  image.style.position = "absolute"
  image.style.inset = "0"
  image.style.width = "70px"
  image.style.height = "68px"
  image.style.objectFit = "contain"

  const label = document.createElement("span")
  label.textContent = city.code
  label.style.position = "absolute"
  label.style.top = "22px"
  label.style.left = "50%"
  label.style.transform = "translateX(-50%)"
  label.style.width = city.code.length > 2 ? "46px" : "38px"
  label.style.height = "14px"
  label.style.display = "grid"
  label.style.placeItems = "center"
  label.style.background = "rgba(60, 31, 18, 0.54)"
  label.style.border = "1px solid rgba(26, 26, 46, 0.85)"
  label.style.color = "#fff4ce"
  label.style.fontFamily = "var(--font-pixel)"
  label.style.fontSize = "9px"
  label.style.lineHeight = "1"
  label.style.textShadow = "1px 1px 0 #1a1a2e"

  markerBody.append(image, label)
  anchor.append(markerBody)
  return anchor
}
