"use client"

import { Fragment, useId, useState } from "react"
import Image from "next/image"
import { format } from "date-fns"

import { track } from "@/lib/analytics"
import type { CityWithEvents, CommunityEvent, EventCity } from "@/lib/events"
import { cn } from "@/lib/utils"
import {
  AdventurersLogCard,
  adventurersLogComments,
} from "@/components/home-events/adventurers-log"
import { QuestHeraldSignup } from "@/components/quest-herald-signup"

function trackEventRegisterClick(event: CommunityEvent) {
  track("event_register_click", {
    event_id: event.id,
    event_name: event.title,
    city: event.city,
    source_guild: event.company,
    source: "board",
  })
}

function trackBoardCitySelect(event: CommunityEvent) {
  track("event_city_select", {
    city: event.city,
    source: "board_card",
    event_id: event.id,
    event_name: event.title,
    source_guild: event.company,
  })
}

export function GuildBoardHeader({
  eventCount,
  cityCount,
  query,
  onQueryChange,
}: {
  eventCount: number
  cityCount: number
  query: string
  onQueryChange: (value: string) => void
}) {
  const [signupOpen, setSignupOpen] = useState(false)
  const signupId = useId()

  return (
    <header className="shrink-0 border-b-[3px] border-[#1a1a2e] bg-[#ead9ab] p-4">
      <div className="flex items-center gap-3">
        <Image src="/brand-mark.png" alt="" width={38} height={38} priority />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="font-(family-name:--font-pixel) text-[11px] leading-5 text-[#1a1a2e]">
            AI Startup Quest
          </h1>
          <span className="border-2 border-[#1a1a2e] bg-[#4ecdc4] px-1.5 py-0.5 font-(family-name:--font-pixel) text-[8px] leading-3 text-[#1a1a2e] shadow-[2px_2px_0_#1a1a2e]">
            Events
          </span>
        </div>
      </div>
      <p className="mt-3 font-(family-name:--font-pixel) text-[8px] leading-4 text-[#95602f]">
        {eventCount} upcoming events in {cityCount} cities
      </p>
      <p className="mt-1 font-(family-name:--font-pixel) text-[8px] leading-4 text-[#95602f]/80">
        Updated daily at 10 AM ET
      </p>
      <button
        type="button"
        onClick={() => setSignupOpen((open) => !open)}
        className="mt-2 border-2 border-[#1a1a2e] bg-[#fff7dd] px-2 py-1 font-(family-name:--font-pixel) text-[7px] leading-4 text-[#8b6914] shadow-[2px_2px_0_#1a1a2e] hover:bg-[#ffe66d]"
        aria-expanded={signupOpen}
        aria-controls={signupId}
      >
        {signupOpen ? "Close alerts" : "Event alerts"}
      </button>
      {signupOpen ? (
        <div id={signupId} className="mt-3">
          <QuestHeraldSignup
            source="board_header"
            compact
            forceVisible
            onDismiss={() => setSignupOpen(false)}
          />
        </div>
      ) : null}
      <label className="mt-3 block">
        <span className="sr-only">Search events or cities</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search events or cities"
          className="w-full border-2 border-[#1a1a2e] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#1a1a2e]/45 focus:shadow-[3px_3px_0_#4ecdc4]"
        />
      </label>
    </header>
  )
}

export function GuildBoardList({
  events,
  upcomingCities,
  selectedCity,
  onSelectCity,
}: {
  events: CommunityEvent[]
  upcomingCities: CityWithEvents[]
  selectedCity: string | null
  onSelectCity: (city: EventCity) => void
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="grid gap-3">
        {events.map((event, index) => {
          const city = upcomingCities.find((item) => item.name === event.city)
          const active = selectedCity === event.city
          const comment = adventurersLogComments.find(
            (item) => item.insertionAfter === index + 1
          )

          return (
            <Fragment key={event.id}>
              <article
                className={cn(
                  "border-2 border-[#1a1a2e] bg-[#fff7dd] p-3 shadow-[3px_3px_0_#1a1a2e]",
                  active && "bg-[#ffe66d] shadow-[3px_3px_0_#4ecdc4]"
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    trackBoardCitySelect(event)
                    if (city) {
                      onSelectCity(city)
                    }
                  }}
                  className="block w-full text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <time
                      dateTime={event.date}
                      className="font-(family-name:--font-pixel) text-[8px] leading-4 text-[#95602f]"
                    >
                      {format(new Date(`${event.date}T00:00:00`), "MMM d")}
                    </time>
                    <span className="inline-flex items-center gap-1 border-2 border-[#1a1a2e] bg-[#ead9ab] px-1.5 py-0.5 font-(family-name:--font-pixel) text-[8px] leading-3 text-[#95602f]">
                      {event.company === "Cursor" ? (
                        <Image
                          src="/cursor-icon.png"
                          alt=""
                          width={14}
                          height={16}
                          className="h-4 w-3.5"
                        />
                      ) : null}
                      {event.company}
                    </span>
                  </div>
                  <h2 className="mt-1 text-sm leading-5 font-bold text-[#1a1a2e]">
                    {event.title}
                  </h2>
                  <p className="mt-1 text-xs font-bold text-[#95602f]">
                    {event.city}
                  </p>
                </button>
                <a
                  href={event.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackEventRegisterClick(event)}
                  className="mt-3 inline-block border-2 border-[#1a1a2e] bg-[#4ecdc4] px-2 py-1 text-xs font-bold text-[#1a1a2e] shadow-[2px_2px_0_#1a1a2e]"
                >
                  Register ↗
                </a>
              </article>
              {comment ? <AdventurersLogCard comment={comment} /> : null}
            </Fragment>
          )
        })}
        {events.length === 0 ? (
          <p className="border-2 border-[#1a1a2e] bg-[#fff7dd] p-4 text-sm font-bold text-[#1a1a2e] shadow-[3px_3px_0_#1a1a2e]">
            No matching quests found.
          </p>
        ) : null}
        {adventurersLogComments
          .filter((comment) => comment.insertionAfter > events.length)
          .map((comment) => (
            <AdventurersLogCard key={comment.href} comment={comment} />
          ))}
      </div>
    </div>
  )
}
