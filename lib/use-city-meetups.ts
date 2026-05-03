"use client"

import { useQuery } from "@tanstack/react-query"

import type { CityId } from "@/lib/city-config"
import { filterAndSortUpcomingMeetups, meetupFromPublicRow } from "@/lib/meetup"
import { createClient } from "@/lib/supabase/client"

const PUBLIC_MEETUP_COLUMNS =
  "slug, city, title, description, venue_name, location_label, latitude, longitude, starts_at, ends_at, organizer_name, event_url, status"

export function useCityMeetups(city: CityId, enabled: boolean) {
  return useQuery({
    queryKey: ["meetups", city],
    enabled,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("published_upcoming_meetups")
        .select(PUBLIC_MEETUP_COLUMNS)
        .match({ city, status: "published" })
        .order("starts_at", { ascending: true })
        .order("title", { ascending: true })

      if (error) {
        throw error
      }

      return filterAndSortUpcomingMeetups((data ?? []).map(meetupFromPublicRow))
    },
  })
}
