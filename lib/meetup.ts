import type { Database } from "@/types/supabase"
import { CITY_GEO_LABELS, CITY_TIMEZONES, type CityId } from "@/lib/city-config"

export type MeetupStatus = "published" | "cancelled" | "hidden"

export type DiscoveryMode = "startups" | "meetups"

export type MeetupSource = "community" | "cursor"

export type MeetupLocationPrecision = "exact" | "city"

export type Meetup = {
  slug: string
  city: CityId
  title: string
  description: string
  venueName: string
  locationLabel: string
  coordinates: [number, number]
  eventDate: string
  organizerName: string | null
  eventUrl: string
  contactEmail: string | null
  status: MeetupStatus
  source: MeetupSource
  locationPrecision: MeetupLocationPrecision
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
  | "event_date"
  | "organizer_name"
  | "event_url"
  | "contact_email"
  | "status"
  | "source"
  | "location_precision"
>

type PublicMeetupRow =
  Database["public"]["Views"]["published_upcoming_meetups"]["Row"]

function localDateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const valueFor = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? ""

  return `${valueFor("year")}-${valueFor("month")}-${valueFor("day")}`
}

export function meetupFromRow(row: MeetupRow): Meetup {
  return {
    slug: row.slug,
    city: row.city as CityId,
    title: row.title,
    description: row.description,
    venueName: row.venue_name,
    locationLabel: row.location_label,
    coordinates: [row.longitude, row.latitude],
    eventDate: row.event_date,
    organizerName: row.organizer_name,
    eventUrl: row.event_url,
    contactEmail: row.contact_email,
    status: row.status as MeetupStatus,
    source: (row.source ?? "community") as MeetupSource,
    locationPrecision: (row.location_precision ??
      "exact") as MeetupLocationPrecision,
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
    eventDate: row.event_date as string,
    organizerName: row.organizer_name,
    eventUrl: row.event_url as string,
    contactEmail: null,
    status: row.status as MeetupStatus,
    source: (row.source ?? "community") as MeetupSource,
    locationPrecision: (row.location_precision ??
      "exact") as MeetupLocationPrecision,
  }
}

export function isMeetupUpcoming(
  meetup: Meetup,
  nowMs: number = Date.now()
): boolean {
  if (meetup.status !== "published") {
    return false
  }

  return (
    meetup.eventDate >=
    localDateKey(new Date(nowMs), CITY_TIMEZONES[meetup.city])
  )
}

export function filterAndSortUpcomingMeetups(meetups: Meetup[]): Meetup[] {
  return [...meetups]
    .filter((m) => isMeetupUpcoming(m))
    .sort((a, b) => {
      const dateOrder = a.eventDate.localeCompare(b.eventDate)
      if (dateOrder !== 0) {
        return dateOrder
      }
      return a.title.localeCompare(b.title)
    })
}

export function meetupVenueDisplay(meetup: Meetup): {
  primary: string
  secondary: string
} {
  if (meetup.locationPrecision === "city") {
    return {
      primary: CITY_GEO_LABELS[meetup.city],
      secondary: "Venue shared after registration",
    }
  }
  return { primary: meetup.venueName, secondary: meetup.locationLabel }
}

const SPREAD_RADIUS = 0.004

export function spreadOverlappingMeetups(meetups: Meetup[]): Meetup[] {
  const seen = new Map<string, number>()
  return meetups.map((meetup) => {
    const key = meetup.coordinates.map((c) => c.toFixed(5)).join(",")
    const index = seen.get(key) ?? 0
    seen.set(key, index + 1)
    if (index === 0) {
      return meetup
    }
    const angle = ((index - 1) * Math.PI) / 3
    return {
      ...meetup,
      coordinates: [
        meetup.coordinates[0] + SPREAD_RADIUS * Math.cos(angle),
        meetup.coordinates[1] + SPREAD_RADIUS * Math.sin(angle),
      ],
    }
  })
}
