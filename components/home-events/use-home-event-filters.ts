"use client"

import { useEffect, useMemo, useState } from "react"

import { track } from "@/lib/analytics"
import type { CityWithEvents } from "@/lib/events"
import {
  filterCitiesByEvents,
  filterEventsByQuery,
  flattenUpcomingEvents,
} from "@/components/home-events/filter-events"

export function useHomeEventFilters(upcomingCities: CityWithEvents[]) {
  const [query, setQuery] = useState("")

  const allEvents = useMemo(
    () => flattenUpcomingEvents(upcomingCities),
    [upcomingCities]
  )
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filteredEvents = useMemo(
    () => filterEventsByQuery(allEvents, query),
    [allEvents, query]
  )
  const filteredCities = useMemo(
    () => filterCitiesByEvents(upcomingCities, filteredEvents),
    [filteredEvents, upcomingCities]
  )

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      track("event_search", {
        query: normalizedQuery,
        result_count: filteredEvents.length,
      })
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [normalizedQuery, filteredEvents.length])

  return {
    query,
    setQuery,
    allEvents,
    filteredEvents,
    filteredCities,
  }
}
