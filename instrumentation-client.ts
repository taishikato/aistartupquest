import posthog from "posthog-js"

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN

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
  })
}
