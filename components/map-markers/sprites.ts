import {
  CATEGORY_COLORS,
  getCompanyLogoUrl,
  getCompanyMonogram,
  type Company,
} from "@/lib/company"

const STARTUP_ROBOT_MONSTER_SRC = "/map-assets/startup-robot-monster.png"

// Helper to create a styled div
function sd(styles: Partial<CSSStyleDeclaration>) {
  const el = document.createElement("div")
  Object.assign(el.style, styles)
  return el
}

function getMarkerFloatTiming(slug: string) {
  let hash = 0
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) % 10000
  }

  return {
    duration: `${3.9 + (hash % 7) * 0.16}s`,
    delay: `${((hash >> 1) % 9) * -0.35}s`,
  }
}

function createFloatingMarkerFrame(company: Company) {
  return createFloatingMarkerFrameFromSlug(company.slug)
}

function createFloatingMarkerFrameFromSlug(slug: string) {
  const { duration, delay } = getMarkerFloatTiming(slug)

  return sd({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animationName: "marker-float",
    animationDuration: duration,
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    animationDelay: delay,
    willChange: "transform",
  })
}

function appendCompanyLogo(
  parent: HTMLElement,
  company: Company,
  active: boolean,
  dense: boolean,
  logoSz: number
) {
  const img = document.createElement("img")
  img.src = getCompanyLogoUrl(company)
  img.alt = company.name
  Object.assign(img.style, {
    width: `${logoSz}px`,
    height: `${logoSz}px`,
    objectFit: "contain",
  })
  const monogram = getCompanyMonogram(company)
  img.addEventListener("error", () => {
    img.replaceWith(createFallback(monogram, active, dense))
  })
  parent.appendChild(img)
}

// Logo badge: category-colored frame + light inner pad so logos stay readable.
function makeLogoBadge(
  company: Company,
  active: boolean,
  dense: boolean,
  categoryColor: string
) {
  const OL = "#342414"
  const sz = dense ? (active ? 34 : 28) : active ? 42 : 34
  // border-box: inner pad = sz - borders - padding
  const innerSz = Math.max(18, sz - 6)
  const rawLogoSz = dense ? (active ? 27 : 22) : active ? 34 : 27
  const logoSz = Math.min(rawLogoSz, Math.max(14, innerSz - 3))
  const badge = sd({
    width: `${sz}px`,
    height: `${sz}px`,
    border: `1px solid ${OL}`,
    background: categoryColor,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1px",
    boxSizing: "border-box",
    boxShadow: active
      ? `0 0 0 1px rgba(255,242,199,0.75), 2px 2px 0 ${OL}`
      : `2px 2px 0 rgba(52,36,20,0.9)`,
    marginBottom: dense ? "-2px" : "-3px",
    position: "relative",
    zIndex: "7",
  })
  const inner = sd({
    width: `${innerSz}px`,
    height: `${innerSz}px`,
    background: "#fffefc",
    border: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  })
  appendCompanyLogo(inner, company, active, dense, logoSz)
  badge.appendChild(inner)
  return badge
}

function createSpriteMarker(company: Company, active: boolean, dense: boolean) {
  const accent = CATEGORY_COLORS[company.category]
  const OL = "#342414"
  const monsterSize = dense ? (active ? 46 : 38) : active ? 58 : 48
  const badge = makeLogoBadge(company, active, dense, accent)

  const wrapper = sd({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  })
  const sprite = createFloatingMarkerFrame(company)

  const stage = sd({
    width: `${monsterSize}px`,
    height: `${monsterSize}px`,
    position: "relative",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    filter: active
      ? `drop-shadow(0 0 4px ${accent}) drop-shadow(3px 3px 0 ${OL})`
      : `drop-shadow(3px 3px 0 ${OL})`,
  })

  const monster = document.createElement("img")
  monster.src = STARTUP_ROBOT_MONSTER_SRC
  monster.alt = ""
  monster.draggable = false
  Object.assign(monster.style, {
    width: `${monsterSize}px`,
    height: `${monsterSize}px`,
    imageRendering: "pixelated",
    objectFit: "contain",
    pointerEvents: "none",
    userSelect: "none",
  })

  stage.appendChild(monster)
  sprite.appendChild(badge)
  sprite.appendChild(stage)

  sprite.appendChild(
    sd({
      width: `${Math.round(monsterSize * 0.48)}px`,
      height: dense ? "5px" : "6px",
      background: accent,
      border: `2px solid ${OL}`,
      marginTop: dense ? "-2px" : "-3px",
      boxShadow: `2px 2px 0 ${OL}`,
      position: "relative",
      zIndex: "4",
    })
  )

  wrapper.appendChild(sprite)

  wrapper.appendChild(
    sd({
      width: `${Math.round(monsterSize * 0.68)}px`,
      height: dense ? "5px" : "6px",
      background: "rgba(52,36,20,0.35)",
      marginTop: "1px",
      boxShadow: "0 0 0 1px rgba(52,36,20,0.15)",
    })
  )

  return wrapper
}

// YC / landmark: YC brand orange + cream trim — reads as "boss" vs neutral robots.
function makeBossLogoBadge(
  company: Company,
  active: boolean,
  dense: boolean,
  brandOrange: string,
  trimCream: string
) {
  const OL = "#342414"
  const sz = dense ? (active ? 30 : 24) : active ? 36 : 30
  const innerSz = Math.max(10, sz - 10)
  const rawLogoSz = dense ? (active ? 22 : 16) : active ? 26 : 20
  const logoSz = Math.min(rawLogoSz, Math.max(8, innerSz - 2))
  const badge = sd({
    width: `${sz}px`,
    height: `${sz}px`,
    border: `3px solid ${trimCream}`,
    background: brandOrange,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px",
    boxSizing: "border-box",
    boxShadow: active
      ? `0 0 0 2px rgba(255,248,240,0.95), 0 0 0 4px rgba(242,101,34,0.5), 3px 3px 0 ${OL}`
      : `3px 3px 0 ${OL}`,
    marginBottom: "2px",
    position: "relative",
    zIndex: "6",
  })
  const inner = sd({
    width: `${innerSz}px`,
    height: `${innerSz}px`,
    background: "#fff8f0",
    border: `2px solid ${OL}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  })
  appendCompanyLogo(inner, company, active, dense, logoSz)
  badge.appendChild(inner)
  return badge
}

function createBossSpriteMarker(
  company: Company,
  active: boolean,
  dense: boolean
) {
  // Y Combinator–style orange (high saturation, readable on the map).
  const orange = "#f26522"
  const orangeDeep = "#d94d12"
  const orangeMid = "#ea5a1a"
  const orangeLight = "#ff8f4d"
  const trimCream = "#fff8f0"
  const OL = "#342414"
  const eyeWhite = "#fffef8"
  const w = dense ? (active ? 36 : 30) : active ? 44 : 36
  const h = dense ? (active ? 46 : 38) : active ? 54 : 44
  const bw = active ? 3 : 2

  const wrapper = sd({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    filter: active ? "none" : "brightness(0.97)",
  })
  const sprite = createFloatingMarkerFrame(company)

  sprite.appendChild(
    makeBossLogoBadge(company, active, dense, orange, trimCream)
  )

  sprite.appendChild(
    sd({
      width: `${Math.round(w * 0.92)}px`,
      height: "6px",
      background: orangeDeep,
      border: `2px solid ${OL}`,
      marginTop: "-1px",
      marginBottom: "3px",
      boxShadow: `2px 2px 0 ${OL}, 0 0 8px rgba(242,101,34,0.55)`,
      position: "relative",
      zIndex: "5",
    })
  )

  const horns = sd({
    display: "flex",
    flexDirection: "row",
    gap: `${Math.round(w * 0.22)}px`,
    marginBottom: "-4px",
    position: "relative",
    zIndex: "3",
  })
  for (let i = 0; i < 2; i++) {
    horns.appendChild(
      sd({
        width: "0",
        height: "0",
        borderLeft: `${Math.round(w * 0.12)}px solid transparent`,
        borderRight: `${Math.round(w * 0.12)}px solid transparent`,
        borderBottom: `${Math.round(h * 0.14)}px solid ${orangeLight}`,
        filter: "drop-shadow(2px 2px 0 #342414)",
      })
    )
  }
  sprite.appendChild(horns)

  const head = sd({
    width: `${w}px`,
    height: `${Math.round(h * 0.52)}px`,
    background: orange,
    border: `${bw}px solid ${OL}`,
    boxShadow: active
      ? `5px 5px 0 ${OL}, 0 0 12px rgba(242,101,34,0.65)`
      : `5px 5px 0 ${OL}`,
    position: "relative",
  })

  const eSz = Math.max(6, Math.round(w * 0.2))
  for (const side of ["left", "right"] as const) {
    head.appendChild(
      sd({
        position: "absolute",
        top: `${Math.round(h * 0.07)}px`,
        [side]: `${Math.round(w * 0.1)}px`,
        width: `${eSz}px`,
        height: `${eSz}px`,
        background: eyeWhite,
        border: `2px solid ${OL}`,
        boxShadow: "inset -1px -1px 0 rgba(0,0,0,0.12)",
      })
    )
  }

  head.appendChild(
    sd({
      position: "absolute",
      bottom: `${Math.round(h * 0.07)}px`,
      left: "50%",
      transform: "translateX(-50%)",
      width: `${Math.round(w * 0.52)}px`,
      height: `${Math.max(4, Math.round(h * 0.06))}px`,
      background: OL,
      borderTop: `2px solid ${orangeDeep}`,
    })
  )
  sprite.appendChild(head)

  const shoulders = sd({
    display: "flex",
    flexDirection: "row",
    gap: `${Math.round(w * 0.08)}px`,
    marginTop: "-3px",
  })
  for (let i = 0; i < 2; i++) {
    shoulders.appendChild(
      sd({
        width: `${Math.round(w * 0.42)}px`,
        height: `${Math.round(h * 0.12)}px`,
        background: orangeMid,
        border: `2px solid ${OL}`,
        boxShadow: `2px 2px 0 ${OL}`,
      })
    )
  }
  sprite.appendChild(shoulders)

  sprite.appendChild(
    sd({
      width: `${Math.round(w * 0.72)}px`,
      height: `${Math.round(h * 0.28)}px`,
      background: orangeDeep,
      border: `${bw}px solid ${OL}`,
      marginTop: "-2px",
      boxShadow: `inset 0 -6px 0 rgba(180,60,10,0.35)`,
    })
  )

  const feet = sd({
    display: "flex",
    gap: `${Math.round(w * 0.18)}px`,
    marginTop: "-1px",
  })
  for (let i = 0; i < 2; i++) {
    feet.appendChild(
      sd({
        width: `${Math.round(w * 0.3)}px`,
        height: `${Math.round(h * 0.11)}px`,
        background: orangeDeep,
        border: `2px solid ${OL}`,
      })
    )
  }
  sprite.appendChild(feet)

  wrapper.appendChild(sprite)

  wrapper.appendChild(
    sd({
      width: `${Math.round(w * 0.95)}px`,
      height: "8px",
      background: "rgba(52,36,20,0.35)",
      marginTop: "3px",
      boxShadow: "0 0 0 1px rgba(242,101,34,0.25)",
    })
  )

  return wrapper
}

export function createMarkerSprite(company: Company, active: boolean, dense: boolean) {
  if (company.mapSprite === "boss") {
    return createBossSpriteMarker(company, active, dense)
  }

  return createSpriteMarker(company, active, dense)
}

function createFallback(monogram: string, active: boolean, dense: boolean) {
  const el = document.createElement("span")
  el.textContent = monogram
  el.style.fontSize = dense
    ? active
      ? "13px"
      : "11px"
    : active
      ? "16px"
      : "13px"
  el.style.fontWeight = "700"
  el.style.lineHeight = "1"
  el.style.color = "#342414"
  return el
}

