import { sendGAEvent } from "@next/third-parties/google"
import posthog from "posthog-js"

export type AnalyticsProps = Record<
  string,
  string | number | boolean | null | undefined
>

/**
 * Thin analytics wrapper so call sites stay tool-agnostic.
 * Sends to PostHog when configured, and mirrors to GA4 when GA is configured.
 * Do not call identify() from product flows; keep traffic anonymous.
 */
export function track(event: string, props?: AnalyticsProps) {
  const properties = Object.fromEntries(
    Object.entries(props ?? {}).filter(([, value]) => value !== undefined)
  ) as Record<string, string | number | boolean | null>

  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  ) {
    posthog.capture(event, properties)
  }

  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_GA_ID) {
    sendGAEvent("event", event, properties)
  }
}
