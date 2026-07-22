import posthog from "posthog-js"

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN

/**
 * Owner toggle: visit once with ?asq_analytics=off to stop PostHog capturing
 * in this browser. Use ?asq_analytics=on to opt back in.
 * Preference is persisted by posthog-js in localStorage.
 */
function consumeAnalyticsPreference(): "off" | "on" | null {
  if (typeof window === "undefined") {
    return null
  }

  const url = new URL(window.location.href)
  const preference = url.searchParams.get("asq_analytics")

  if (preference !== "off" && preference !== "on") {
    return null
  }

  url.searchParams.delete("asq_analytics")
  window.history.replaceState({}, "", url.toString())
  return preference
}

const analyticsPreference = consumeAnalyticsPreference()

if (token) {
  posthog.init(token, {
    // Route SDK traffic through the Next.js reverse proxy (see next.config.mjs).
    api_host: "/asq-relay",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    // Keep anonymous traffic lightweight; do not create person profiles until identify.
    person_profiles: "identified_only",
    debug: process.env.NODE_ENV === "development",
    // Avoid capturing the opt-out landing pageview before loaded runs.
    opt_out_capturing_by_default: analyticsPreference === "off",
    loaded: (ph) => {
      if (analyticsPreference === "off") {
        ph.opt_out_capturing()
      } else if (analyticsPreference === "on") {
        ph.opt_in_capturing()
      }
    },
  })
}
