import type { Database } from "@/types/supabase"
import type { CityId } from "@/lib/city-config"

export type MeetupStatus = "published" | "cancelled" | "hidden"

export type DiscoveryMode = "startups" | "meetups"

export type Meetup = {
  slug: string
  city: CityId
  title: string
  description: string
  venueName: string
  locationLabel: string
  coordinates: [number, number]
  startsAt: string
  endsAt: string | null
  organizerName: string
  eventUrl: string
  contactEmail: string | null
  status: MeetupStatus
}

type MeetupRow = Pick<
  Database["public"]["Tables"]["meetups"]["Row"],
  | "slug"
  | "city"
  | "title"
  | "description"
  | "venue_name"
  | "location_label"
  | "latitude"
  | "longitude"
  | "starts_at"
  | "ends_at"
  | "organizer_name"
  | "event_url"
  | "contact_email"
  | "status"
>

type PublicMeetupRow =
  Database["public"]["Views"]["published_upcoming_meetups"]["Row"]

export function meetupFromRow(row: MeetupRow): Meetup {
  return {
    slug: row.slug,
    city: row.city as CityId,
    title: row.title,
    description: row.description,
    venueName: row.venue_name,
    locationLabel: row.location_label,
    coordinates: [row.longitude, row.latitude],
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    organizerName: row.organizer_name,
    eventUrl: row.event_url,
    contactEmail: row.contact_email,
    status: row.status as MeetupStatus,
  }
}

export function meetupFromPublicRow(row: PublicMeetupRow): Meetup {
  return {
    slug: row.slug as string,
    city: row.city as CityId,
    title: row.title as string,
    description: row.description as string,
    venueName: row.venue_name as string,
    locationLabel: row.location_label as string,
    coordinates: [row.longitude as number, row.latitude as number],
    startsAt: row.starts_at as string,
    endsAt: row.ends_at,
    organizerName: row.organizer_name as string,
    eventUrl: row.event_url as string,
    contactEmail: null,
    status: row.status as MeetupStatus,
  }
}

/** Matches the "upcoming" rule from MEETUP_MODE_PLAN (client-side filter on fetched rows). */
export function isMeetupUpcoming(
  meetup: Meetup,
  nowMs: number = Date.now()
): boolean {
  if (meetup.status !== "published") {
    return false
  }

  if (meetup.endsAt) {
    return new Date(meetup.endsAt).getTime() >= nowMs
  }

  const graceMs = 2 * 60 * 60 * 1000
  return new Date(meetup.startsAt).getTime() >= nowMs - graceMs
}

export function filterAndSortUpcomingMeetups(meetups: Meetup[]): Meetup[] {
  return [...meetups]
    .filter((m) => isMeetupUpcoming(m))
    .sort((a, b) => {
      const t = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      if (t !== 0) {
        return t
      }
      return a.title.localeCompare(b.title)
    })
}
