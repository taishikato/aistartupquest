"use client"

import { useQuery } from "@tanstack/react-query"

import type { CityId } from "@/lib/city-config"
import {
  filterAndSortUpcomingMeetups,
  meetupFromPublicRow,
  type Meetup,
} from "@/lib/meetup"
import { createClient } from "@/lib/supabase/client"

const PUBLIC_MEETUP_COLUMNS =
  "slug, city, title, description, venue_name, location_label, latitude, longitude, event_date, organizer_name, event_url, status, source, location_precision"

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
        .order("event_date", { ascending: true })
        .order("title", { ascending: true })

      if (error) {
        throw error
      }

      return filterAndSortUpcomingMeetups(
        (data ?? [])
          .map(meetupFromPublicRow)
          .filter((m): m is Meetup => m !== null)
      )
    },
  })
}
