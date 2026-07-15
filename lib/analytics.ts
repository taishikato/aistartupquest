import { sendGAEvent } from "@next/third-parties/google"
import posthog from "posthog-js"

type AnalyticsProps = Record<
  string,
  string | number | boolean | null | undefined
>

function sanitizeProps(props?: AnalyticsProps) {
  return Object.fromEntries(
    Object.entries(props ?? {}).filter(([, value]) => value !== undefined)
  ) as Record<string, string | number | boolean | null>
}

/**
 * Thin analytics wrapper so call sites stay tool-agnostic.
 * Sends to PostHog when configured, and mirrors to GA4 when GA is configured.
 * Do not call identify() from product flows; keep traffic anonymous.
 */
export function track(event: string, props?: AnalyticsProps) {
  if (typeof window === "undefined") {
    return
  }

  const properties = sanitizeProps(props)

  if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
    posthog.capture(event, properties)
  }

  if (process.env.NEXT_PUBLIC_GA_ID) {
    sendGAEvent("event", event, properties)
  }
}
