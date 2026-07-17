import { sendGAEvent } from "@next/third-parties/google"
import posthog from "posthog-js"

type CompanyProps = {
  company_slug: string
  company_name: string
  city: string
}

export type AnalyticsEvents = {
  city_page_view: { city: string }
  event_search: { query: string; result_count: number }
  map_view_toggle: { view: "mercator" | "globe" }
  user_locate_click: { surface: string; view: string; status: string }
  event_city_select: {
    city: string
    source: "map_marker" | "board_card"
    event_count?: number
    event_id?: string
    event_name?: string
    source_guild?: string
  }
  event_register_click: {
    event_id: string
    event_name: string
    city: string
    source_guild: string
    source: "board" | "city_panel"
  }
  company_marker_click: CompanyProps
  company_card_click: CompanyProps
  company_site_click: CompanyProps & {
    source: "card" | "card_compact" | "selected_panel"
  }
  quest_herald_dismiss: { source: string }
  quest_herald_subscribe: { source: string }
  quest_herald_subscribe_error: { source: string }
}

type AnalyticsPropValue = string | number | boolean | null | undefined

function sanitizeProps(props: Record<string, AnalyticsPropValue>) {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined)
  ) as Record<string, string | number | boolean | null>
}

/**
 * Thin analytics wrapper so call sites stay tool-agnostic.
 * Sends to PostHog when configured, and mirrors to GA4 when GA is configured.
 * Do not call identify() from product flows; keep traffic anonymous.
 */
export function track<Name extends keyof AnalyticsEvents>(
  event: Name,
  props: AnalyticsEvents[Name]
) {
  if (typeof window === "undefined") {
    return
  }

  const properties = sanitizeProps(props as Record<string, AnalyticsPropValue>)

  if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
    posthog.capture(event, properties)
  }

  if (process.env.NEXT_PUBLIC_GA_ID) {
    sendGAEvent("event", event, properties)
  }
}
