"use client"

import type { CityWithEvents, CommunityEvent, EventCity } from "@/lib/events"
import { cn } from "@/lib/utils"
import {
  GuildBoardHeader,
  GuildBoardList,
} from "@/components/home-events/guild-board"
import { QuestHeraldSignup } from "@/components/quest-herald-signup"

type HomeMapGuildShellProps = {
  upcomingCities: CityWithEvents[]
  allEventCount: number
  filteredEvents: CommunityEvent[]
  query: string
  onQueryChange: (query: string) => void
  selectedCity: string | null
  onSelectCity: (city: EventCity) => void
  boardOpen: boolean
  onToggleBoard: () => void
}

export function HomeMapGuildShell({
  upcomingCities,
  allEventCount,
  filteredEvents,
  query,
  onQueryChange,
  selectedCity,
  onSelectCity,
  boardOpen,
  onToggleBoard,
}: HomeMapGuildShellProps) {
  return (
    <>
      <aside
        className={cn(
          "absolute top-0 bottom-0 left-0 z-30 hidden w-[min(380px,calc(100vw-24px))] flex-col border-r-[3px] border-[#1a1a2e] bg-[#23233b] shadow-[4px_0_0_#1a1a2e] md:flex"
        )}
      >
        <GuildBoardHeader
          eventCount={allEventCount}
          cityCount={upcomingCities.length}
          query={query}
          onQueryChange={onQueryChange}
        />
        <GuildBoardList
          events={filteredEvents}
          upcomingCities={upcomingCities}
          selectedCity={selectedCity}
          onSelectCity={onSelectCity}
        />
      </aside>

      {!boardOpen ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 z-30 flex justify-center px-3 md:hidden">
          <QuestHeraldSignup source="home_map_footer_mobile" />
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 md:hidden">
        <div className="pointer-events-auto flex justify-center p-3">
          <button
            type="button"
            onClick={onToggleBoard}
            className="border-2 border-[#1a1a2e] bg-[#ead9ab] px-4 py-2 font-(family-name:--font-pixel) text-[9px] leading-4 text-[#1a1a2e] shadow-[3px_3px_0_#1a1a2e]"
            aria-expanded={boardOpen}
          >
            {boardOpen ? "Close board" : "Guild board"}
          </button>
        </div>
        {boardOpen ? (
          <div className="pointer-events-auto flex max-h-[55vh] flex-col border-t-[3px] border-[#1a1a2e] bg-[#23233b] shadow-[0_-4px_0_#1a1a2e]">
            <GuildBoardHeader
              eventCount={allEventCount}
              cityCount={upcomingCities.length}
              query={query}
              onQueryChange={onQueryChange}
            />
            <GuildBoardList
              events={filteredEvents}
              upcomingCities={upcomingCities}
              selectedCity={selectedCity}
              onSelectCity={onSelectCity}
            />
          </div>
        ) : null}
      </div>

      {!selectedCity ? (
        <div className="pointer-events-none absolute bottom-6 left-[calc(min(380px,calc(100vw-24px))+1rem)] z-30 hidden md:block">
          <QuestHeraldSignup source="home_map_footer" />
        </div>
      ) : null}
    </>
  )
}
