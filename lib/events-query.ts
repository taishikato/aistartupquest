import { normalizePublishedEventRows, type EventRow } from "@/lib/events"
import { createClient } from "@/lib/supabase/server"

export async function getUpcomingEvents(): Promise<EventRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("published_upcoming_events")
    .select("*")
    .order("event_date")
    .order("title")

  if (error) {
    throw new Error(`Failed to load upcoming events: ${error.message}`)
  }

  return normalizePublishedEventRows(data)
}
