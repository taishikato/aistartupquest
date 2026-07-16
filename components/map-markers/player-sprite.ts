const OUTLINE = "#342414"
const TEAL = "#4ecdc4"
const TEAL_DEEP = "#2a9d96"
const CREAM = "#f0f7e6"
const YELLOW = "#ffe66d"
const SKIN = "#f2c39a"
const BOOT = "#5a3d24"

function sd(styles: Partial<CSSStyleDeclaration>) {
  const el = document.createElement("div")
  Object.assign(el.style, styles)
  return el
}

/**
 * Pixel adventurer marker for the signed-in explorer's geolocation.
 * Reads as "you" vs startup robot sprites / YC bosses.
 */
export function createPlayerSprite() {
  const w = 36
  const h = 48

  const wrapper = sd({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    pointerEvents: "none",
  })

  const sprite = sd({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animationName: "marker-float",
    animationDuration: "3.6s",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    willChange: "transform",
  })

  const label = sd({
    background: YELLOW,
    border: `2px solid ${OUTLINE}`,
    color: OUTLINE,
    fontFamily: "var(--font-pixel), monospace",
    fontSize: "9px",
    letterSpacing: "0.04em",
    lineHeight: "1",
    padding: "3px 5px",
    marginBottom: "4px",
    boxShadow: `2px 2px 0 ${OUTLINE}`,
    whiteSpace: "nowrap",
  })
  label.textContent = "YOU"

  const hat = sd({
    width: `${Math.round(w * 0.78)}px`,
    height: "8px",
    background: TEAL,
    border: `2px solid ${OUTLINE}`,
    boxShadow: `2px 2px 0 ${OUTLINE}`,
    marginBottom: "-2px",
    position: "relative",
    zIndex: "2",
  })
  hat.appendChild(
    sd({
      position: "absolute",
      top: "-6px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "8px",
      height: "8px",
      background: YELLOW,
      border: `2px solid ${OUTLINE}`,
    })
  )

  const head = sd({
    width: `${Math.round(w * 0.62)}px`,
    height: `${Math.round(h * 0.28)}px`,
    background: SKIN,
    border: `2px solid ${OUTLINE}`,
    boxShadow: `3px 3px 0 ${OUTLINE}`,
    position: "relative",
    zIndex: "1",
  })

  for (const side of ["left", "right"] as const) {
    head.appendChild(
      sd({
        position: "absolute",
        top: "5px",
        [side]: "4px",
        width: "5px",
        height: "5px",
        background: OUTLINE,
      })
    )
  }

  head.appendChild(
    sd({
      position: "absolute",
      bottom: "3px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "10px",
      height: "3px",
      background: OUTLINE,
    })
  )

  const body = sd({
    width: `${Math.round(w * 0.72)}px`,
    height: `${Math.round(h * 0.34)}px`,
    background: TEAL,
    border: `2px solid ${OUTLINE}`,
    marginTop: "-1px",
    boxShadow: `3px 3px 0 ${OUTLINE}`,
    position: "relative",
  })

  body.appendChild(
    sd({
      position: "absolute",
      inset: "4px 6px auto 6px",
      height: "5px",
      background: CREAM,
      border: `1px solid ${OUTLINE}`,
    })
  )

  body.appendChild(
    sd({
      position: "absolute",
      left: "-6px",
      top: "4px",
      width: "8px",
      height: "14px",
      background: TEAL_DEEP,
      border: `2px solid ${OUTLINE}`,
    })
  )
  body.appendChild(
    sd({
      position: "absolute",
      right: "-6px",
      top: "4px",
      width: "8px",
      height: "14px",
      background: TEAL_DEEP,
      border: `2px solid ${OUTLINE}`,
    })
  )

  const legs = sd({
    display: "flex",
    gap: "6px",
    marginTop: "-1px",
  })
  for (let i = 0; i < 2; i += 1) {
    legs.appendChild(
      sd({
        width: "10px",
        height: "12px",
        background: BOOT,
        border: `2px solid ${OUTLINE}`,
        boxShadow: `2px 2px 0 ${OUTLINE}`,
      })
    )
  }

  sprite.append(label, hat, head, body, legs)
  wrapper.appendChild(sprite)

  wrapper.appendChild(
    sd({
      width: `${Math.round(w * 0.7)}px`,
      height: "6px",
      background: "rgba(52,36,20,0.35)",
      marginTop: "2px",
      boxShadow: "0 0 0 1px rgba(78,205,196,0.25)",
    })
  )

  return wrapper
}
