import posthog from "posthog-js"

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

if (token) {
  posthog.init(token, {
    api_host: host || "https://us.i.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    // Keep anonymous traffic lightweight; do not create person profiles until identify.
    person_profiles: "identified_only",
    debug: process.env.NODE_ENV === "development",
  })
}
