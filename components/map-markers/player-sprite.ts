const OUTLINE = "#342414"
const TEAL = "#4ecdc4"
const TEAL_DEEP = "#2a9d96"
const YELLOW = "#ffe66d"

// Larger than quest pins (~42px), smaller than city signs (~70px).
const PLAYER_SPRITE_HEIGHT = 48
const PLAYER_SPRITE_WIDTH = 32
// Lift the adventurer so the body clears wooden city-sign bottoms.
const CHARACTER_BOTTOM_OFFSET = 28

/**
 * Beacon + floating adventurer for the explorer's geolocation.
 * The pulse ring sits on the exact lng/lat; the character floats above it.
 */
export function createPlayerSprite() {
  const wrapper = document.createElement("div")
  wrapper.className = "player-location-marker"
  wrapper.style.display = "flex"
  wrapper.style.flexDirection = "column"
  wrapper.style.alignItems = "center"
  wrapper.style.pointerEvents = "none"
  wrapper.style.transformOrigin = "50% 100%"
  wrapper.style.position = "relative"

  const characterStack = document.createElement("div")
  characterStack.className = "player-location-marker__character"
  characterStack.style.display = "flex"
  characterStack.style.flexDirection = "column"
  characterStack.style.alignItems = "center"
  characterStack.style.marginBottom = `${CHARACTER_BOTTOM_OFFSET}px`
  characterStack.style.animationName = "marker-float"
  characterStack.style.animationDuration = "3.6s"
  characterStack.style.animationTimingFunction = "ease-in-out"
  characterStack.style.animationIterationCount = "infinite"
  characterStack.style.willChange = "transform"
  characterStack.style.filter = `drop-shadow(2px 2px 0 ${OUTLINE})`

  const label = document.createElement("span")
  label.className = "player-location-marker__you"
  label.textContent = "YOU"
  label.style.background = YELLOW
  label.style.border = `2px solid ${OUTLINE}`
  label.style.color = OUTLINE
  label.style.fontFamily = "var(--font-pixel), monospace"
  label.style.fontSize = "8px"
  label.style.letterSpacing = "0.04em"
  label.style.lineHeight = "1"
  label.style.padding = "2px 4px"
  label.style.marginBottom = "3px"
  label.style.boxShadow = `2px 2px 0 ${OUTLINE}`
  label.style.whiteSpace = "nowrap"

  const image = document.createElement("img")
  image.src = "/map-assets/player-marker.png"
  image.alt = ""
  image.draggable = false
  image.style.display = "block"
  image.style.width = `${PLAYER_SPRITE_WIDTH}px`
  image.style.height = `${PLAYER_SPRITE_HEIGHT}px`
  image.style.objectFit = "contain"
  image.style.imageRendering = "pixelated"

  characterStack.append(label, image)

  const beacon = document.createElement("div")
  beacon.className = "player-location-marker__beacon"
  beacon.style.position = "relative"
  beacon.style.width = "16px"
  beacon.style.height = "16px"
  beacon.style.display = "flex"
  beacon.style.alignItems = "center"
  beacon.style.justifyContent = "center"

  // Hollow expanding ring - no fill so quest pins stay readable underneath.
  const pulse = document.createElement("span")
  pulse.className = "player-location-marker__pulse"
  pulse.setAttribute("aria-hidden", "true")

  const ring = document.createElement("span")
  ring.className = "player-location-marker__ring"
  ring.setAttribute("aria-hidden", "true")
  ring.style.width = "12px"
  ring.style.height = "12px"
  ring.style.borderRadius = "50%"
  ring.style.boxSizing = "border-box"
  ring.style.background = "transparent"
  ring.style.border = `2px solid ${TEAL}`
  ring.style.boxShadow = `0 0 0 2px ${OUTLINE}`
  ring.style.position = "relative"
  ring.style.zIndex = "1"

  const core = document.createElement("span")
  core.className = "player-location-marker__core"
  core.setAttribute("aria-hidden", "true")
  core.style.width = "4px"
  core.style.height = "4px"
  core.style.borderRadius = "50%"
  core.style.background = TEAL
  core.style.border = `1px solid ${OUTLINE}`
  core.style.boxShadow = `1px 1px 0 ${TEAL_DEEP}`
  core.style.position = "absolute"
  core.style.zIndex = "2"

  beacon.append(pulse, ring, core)
  wrapper.append(characterStack, beacon)

  return wrapper
}
