export type CityId = "sf" | "toronto" | "ny" | "london" | "vancouver" | "tokyo"

/** IANA timezone per city (meetup local wall time + display). */
export const CITY_TIMEZONES: Record<CityId, string> = {
  sf: "America/Los_Angeles",
  toronto: "America/Toronto",
  ny: "America/New_York",
  london: "Europe/London",
  vancouver: "America/Vancouver",
  tokyo: "Asia/Tokyo",
}

export type CitySwitchOption = {
  city: CityId
  href: string
  label: string
  ariaLabel: string
}

export type CityMapConfig = {
  city: CityId
  /** IANA timezone for meetup display and submission (city-local, not viewer). */
  timezone: string
  titleLines: [string, string]
  emptyStateTitle: string
  searchPlaceholder: string
  meetupSearchPlaceholder: string
  initialSelectedSlug: string
  mapCenter: [number, number]
  sourceHref: string
  switchOptions: CitySwitchOption[]
}

export const sfMapConfig: CityMapConfig = {
  city: "sf",
  timezone: "America/Los_Angeles",
  titleLines: ["SF AI", "Startup Map"],
  emptyStateTitle: "SF AI Startup Map",
  searchPlaceholder: "OpenAI, agents, voice...",
  meetupSearchPlaceholder: "Meetup title, venue, topic...",
  initialSelectedSlug: "openai",
  mapCenter: [-122.4167, 37.7793],
  sourceHref: "https://github.com/taishikato/aistartupquest",
  switchOptions: [
    {
      city: "toronto",
      href: "/toronto",
      label: "TO",
      ariaLabel: "Open Toronto AI Startup Map",
    },
    {
      city: "ny",
      href: "/ny",
      label: "NY",
      ariaLabel: "Open New York AI Startup Map",
    },
    {
      city: "london",
      href: "/london",
      label: "LDN",
      ariaLabel: "Open London AI Startup Map",
    },
    {
      city: "vancouver",
      href: "/vancouver",
      label: "VAN",
      ariaLabel: "Open Vancouver AI Startup Map",
    },
    {
      city: "tokyo",
      href: "/tokyo",
      label: "TKY",
      ariaLabel: "Open Tokyo AI Startup Map",
    },
  ],
}

export const torontoMapConfig: CityMapConfig = {
  city: "toronto",
  timezone: "America/Toronto",
  titleLines: ["Toronto AI", "Startup Map"],
  emptyStateTitle: "Toronto AI Startup Map",
  searchPlaceholder: "Cohere, agents, health...",
  meetupSearchPlaceholder: "Meetup title, venue, topic...",
  initialSelectedSlug: "cohere",
  mapCenter: [-79.3832, 43.6532],
  sourceHref: "https://github.com/taishikato/aistartupquest",
  switchOptions: [
    {
      city: "sf",
      href: "/sf",
      label: "SF",
      ariaLabel: "Open SF AI Startup Map",
    },
    {
      city: "ny",
      href: "/ny",
      label: "NY",
      ariaLabel: "Open New York AI Startup Map",
    },
    {
      city: "london",
      href: "/london",
      label: "LDN",
      ariaLabel: "Open London AI Startup Map",
    },
    {
      city: "vancouver",
      href: "/vancouver",
      label: "VAN",
      ariaLabel: "Open Vancouver AI Startup Map",
    },
    {
      city: "tokyo",
      href: "/tokyo",
      label: "TKY",
      ariaLabel: "Open Tokyo AI Startup Map",
    },
  ],
}

export const nyMapConfig: CityMapConfig = {
  city: "ny",
  timezone: "America/New_York",
  titleLines: ["NY AI", "Startup Map"],
  emptyStateTitle: "New York AI Startup Map",
  searchPlaceholder: "Runway, agents, fintech...",
  meetupSearchPlaceholder: "Meetup title, venue, topic...",
  initialSelectedSlug: "runway",
  mapCenter: [-74.006, 40.7128],
  sourceHref: "https://github.com/taishikato/aistartupquest",
  switchOptions: [
    {
      city: "sf",
      href: "/sf",
      label: "SF",
      ariaLabel: "Open SF AI Startup Map",
    },
    {
      city: "toronto",
      href: "/toronto",
      label: "TO",
      ariaLabel: "Open Toronto AI Startup Map",
    },
    {
      city: "london",
      href: "/london",
      label: "LDN",
      ariaLabel: "Open London AI Startup Map",
    },
    {
      city: "vancouver",
      href: "/vancouver",
      label: "VAN",
      ariaLabel: "Open Vancouver AI Startup Map",
    },
    {
      city: "tokyo",
      href: "/tokyo",
      label: "TKY",
      ariaLabel: "Open Tokyo AI Startup Map",
    },
  ],
}

export const londonMapConfig: CityMapConfig = {
  city: "london",
  timezone: "Europe/London",
  titleLines: ["London AI", "Startup Map"],
  emptyStateTitle: "London AI Startup Map",
  searchPlaceholder: "PolyAI, legal, agents...",
  meetupSearchPlaceholder: "Meetup title, venue, topic...",
  initialSelectedSlug: "polyai",
  mapCenter: [-0.1278, 51.5074],
  sourceHref: "https://github.com/taishikato/aistartupquest",
  switchOptions: [
    {
      city: "sf",
      href: "/sf",
      label: "SF",
      ariaLabel: "Open SF AI Startup Map",
    },
    {
      city: "toronto",
      href: "/toronto",
      label: "TO",
      ariaLabel: "Open Toronto AI Startup Map",
    },
    {
      city: "ny",
      href: "/ny",
      label: "NY",
      ariaLabel: "Open New York AI Startup Map",
    },
    {
      city: "vancouver",
      href: "/vancouver",
      label: "VAN",
      ariaLabel: "Open Vancouver AI Startup Map",
    },
    {
      city: "tokyo",
      href: "/tokyo",
      label: "TKY",
      ariaLabel: "Open Tokyo AI Startup Map",
    },
  ],
}

export const vancouverMapConfig: CityMapConfig = {
  city: "vancouver",
  timezone: "America/Vancouver",
  titleLines: ["Vancouver AI", "Startup Map"],
  emptyStateTitle: "Vancouver AI Startup Map",
  searchPlaceholder: "robotics, mining, waste...",
  meetupSearchPlaceholder: "Meetup title, venue, topic...",
  initialSelectedSlug: "sanctuary-ai",
  mapCenter: [-123.1207, 49.2827],
  sourceHref: "https://github.com/taishikato/aistartupquest",
  switchOptions: [
    {
      city: "sf",
      href: "/sf",
      label: "SF",
      ariaLabel: "Open SF AI Startup Map",
    },
    {
      city: "toronto",
      href: "/toronto",
      label: "TO",
      ariaLabel: "Open Toronto AI Startup Map",
    },
    {
      city: "ny",
      href: "/ny",
      label: "NY",
      ariaLabel: "Open New York AI Startup Map",
    },
    {
      city: "london",
      href: "/london",
      label: "LDN",
      ariaLabel: "Open London AI Startup Map",
    },
    {
      city: "tokyo",
      href: "/tokyo",
      label: "TKY",
      ariaLabel: "Open Tokyo AI Startup Map",
    },
  ],
}

export const tokyoMapConfig: CityMapConfig = {
  city: "tokyo",
  timezone: "Asia/Tokyo",
  titleLines: ["Tokyo AI", "Startup Map"],
  emptyStateTitle: "Tokyo AI Startup Map",
  searchPlaceholder: "Sakana, legal, healthcare...",
  meetupSearchPlaceholder: "Meetup title, venue, topic...",
  initialSelectedSlug: "sakana-ai",
  mapCenter: [139.767, 35.6804],
  sourceHref: "https://github.com/taishikato/aistartupquest",
  switchOptions: [
    {
      city: "sf",
      href: "/sf",
      label: "SF",
      ariaLabel: "Open SF AI Startup Map",
    },
    {
      city: "toronto",
      href: "/toronto",
      label: "TO",
      ariaLabel: "Open Toronto AI Startup Map",
    },
    {
      city: "ny",
      href: "/ny",
      label: "NY",
      ariaLabel: "Open New York AI Startup Map",
    },
    {
      city: "london",
      href: "/london",
      label: "LDN",
      ariaLabel: "Open London AI Startup Map",
    },
    {
      city: "vancouver",
      href: "/vancouver",
      label: "VAN",
      ariaLabel: "Open Vancouver AI Startup Map",
    },
  ],
}
