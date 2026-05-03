"use client"

import {
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpRight,
  Calendar,
  MapPin,
  User,
} from "lucide-react"

import type { Meetup } from "@/lib/meetup"
import { formatMeetupRangeInTimezone } from "@/lib/meetup-datetime"
import { cn } from "@/lib/utils"

export type SelectedMeetupPanelProps = {
  meetup: Meetup | null
  timeZone: string
  meetupsLoading: boolean
  meetupsError: boolean
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function SelectedMeetupPanel({
  meetup,
  timeZone,
  meetupsLoading,
  meetupsError,
  collapsed,
  onToggleCollapsed,
}: SelectedMeetupPanelProps) {
  return (
    <aside
      className={cn(
        "hidden h-full min-h-0 overflow-hidden border-r-3 border-[#1a1a2e] bg-[#151527] text-[#f0f7e6] lg:flex",
        collapsed ? "w-14 flex-col items-center py-5" : "flex-col"
      )}
    >
      {collapsed ? (
        <div className="flex h-full w-full flex-col items-center gap-3 px-2">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand selected meetup panel"
            className="inline-flex size-10 items-center justify-center border-2 border-[#3a3a5e] bg-[#23233b] text-[#4ecdc4] transition-colors hover:border-[#4ecdc4] hover:bg-[#4ecdc4] hover:text-[#1a1a2e]"
          >
            <ArrowRightToLine className="size-4" />
          </button>
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="font-(family-name:--font-pixel) text-[8px] tracking-[0.24em] text-[#ffe66d] [writing-mode:vertical-rl]">
              NOTICE
            </div>
            <div
              className="flex size-10 items-center justify-center border-2 border-[#5c4033] bg-[#8b6914] text-[9px] font-bold text-[#f4ecd2] shadow-[2px_2px_0_#342414]"
              aria-hidden
            >
              {meetup ? meetup.title.slice(0, 2).toUpperCase() : "..."}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col p-5">
          <div className="flex items-center justify-between border-2 border-[#3a3a5e] bg-[#23233b] px-3 py-2">
            <span className="font-(family-name:--font-pixel) text-[8px] tracking-[0.24em] text-[#ffe66d] uppercase">
              Notice board
            </span>
            <div className="flex items-center gap-2">
              <span className="font-(family-name:--font-pixel) text-[7px] tracking-[0.2em] text-[#4ecdc4] uppercase">
                Meetup
              </span>
              <button
                type="button"
                onClick={onToggleCollapsed}
                aria-label="Collapse selected meetup panel"
                className="inline-flex size-7 items-center justify-center border-2 border-[#3a3a5e] bg-[#1a1a2e] text-[#4ecdc4] transition-colors hover:border-[#4ecdc4] hover:bg-[#4ecdc4] hover:text-[#1a1a2e]"
              >
                <ArrowLeftToLine className="size-3.5" />
              </button>
            </div>
          </div>

          {!meetup ? (
            <div className="mt-4 border-2 border-[#3a3a5e] bg-[#1a1a2e] px-4 py-6">
              <p className="text-sm text-[#f0f7e6]/70">
                {meetupsLoading
                  ? "Loading meetups for this city."
                  : meetupsError
                    ? "Could not load meetups. Please try again in a moment."
                    : "Select a meetup from the list, or add the first one for this city."}
              </p>
            </div>
          ) : (
            <div
              key={meetup.slug}
              className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden border-2 border-[#3a3a5e] bg-[#1a1a2e]"
            >
              <div className="border-b-2 border-[#3a3a5e] bg-[#23233b] px-4 py-3">
                <span className="font-(family-name:--font-pixel) text-[8px] tracking-[0.18em] text-[#4ecdc4] uppercase">
                  Upcoming
                </span>
              </div>

              <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-5 py-6">
                <div>
                  <h2 className="text-[22px] leading-[1.15] font-bold tracking-tight text-[#f0f7e6]">
                    {meetup.title}
                  </h2>
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-[#4ecdc4]">
                    <Calendar className="size-4 shrink-0" />
                    {formatMeetupRangeInTimezone(
                      meetup.startsAt,
                      meetup.endsAt,
                      timeZone
                    )}
                  </p>
                </div>

                <div className="mt-6 space-y-4 border-t-2 border-[#3a3a5e] pt-4">
                  <div className="flex items-start gap-2 text-sm text-[#f0f7e6]/78">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-[#4ecdc4]" />
                    <div>
                      <div className="font-medium text-[#f0f7e6]">
                        {meetup.venueName}
                      </div>
                      <div className="mt-0.5 text-[#f0f7e6]/65">
                        {meetup.locationLabel}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-[#f0f7e6]/78">
                    <User className="mt-0.5 size-4 shrink-0 text-[#4ecdc4]" />
                    <span>{meetup.organizerName}</span>
                  </div>
                  <p className="text-sm leading-6 text-[#f0f7e6]/72">
                    {meetup.description}
                  </p>
                  <a
                    href={meetup.eventUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 border-2 border-[#3a3a5e] bg-[#23233b] px-3 py-2 text-sm text-[#4ecdc4] transition-colors hover:border-[#4ecdc4]"
                  >
                    RSVP / event link
                    <ArrowUpRight className="size-4" />
                  </a>
                  <p className="text-[10px] text-[#f0f7e6]/45">
                    Times shown in {timeZone.replaceAll("_", " ")}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
