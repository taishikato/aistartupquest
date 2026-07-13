import type { Company } from "@/lib/company"

type CursorCommunityEvent = {
  id: string
  title: string
  city: string
  date: string
  url: string
  company: string
}

export function selectUpcomingEvents(
  events: CursorCommunityEvent[],
  today = new Date().toISOString().slice(0, 10),
  limit = 20
) {
  return events
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit)
}

export function buildEventItemListJsonLd(events: CursorCommunityEvent[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Event",
        name: event.title,
        startDate: event.date,
        url: event.url,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: event.city,
          },
        },
      },
    })),
  }
}

export function buildOrganizationItemListJsonLd(companies: Company[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: companies.map((company, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Organization",
        name: company.name,
        url: company.website,
        description: company.shortDescription,
      },
    })),
  }
}
