"use client"

import { Calendar, MapPin } from "lucide-react"

import { meetupVenueDisplay, type Meetup } from "@/lib/meetup"
import { formatMeetupDate } from "@/lib/meetup-datetime"
import { cn } from "@/lib/utils"

type MeetupCardProps = {
  meetup: Meetup
  active?: boolean
  compact?: boolean
  onSelect?: (slug: string) => void
}

export function MeetupCard({
  meetup,
  active = false,
  compact = false,
  onSelect,
}: MeetupCardProps) {
  const when = formatMeetupDate(meetup.eventDate)
  const venue = meetupVenueDisplay(meetup)

  const body = (
    <article
      className={cn(
        "border-2 p-3 transition-all",
        compact ? "p-3" : "p-4",
        active
          ? "border-[#f0f7e6] bg-[#2a2a4e] shadow-[3px_3px_0px_#f0f7e6]/20"
          : "border-[#3a3a5e] bg-[#1a1a2e] hover:border-[#f0f7e6]/40"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center border-2 border-[#5c4033] bg-[#8b6914] text-[10px] font-bold text-[#f4ecd2] shadow-[2px_2px_0_#342414]"
          aria-hidden
        >
          MTG
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-[#f0f7e6]">{meetup.title}</h3>
            {meetup.source === "cursor" ? (
              <span className="shrink-0 border border-[#3a3a5e] bg-[#23233b] px-1.5 py-0.5 font-(family-name:--font-pixel) text-[7px] tracking-[0.16em] text-[#4ecdc4] uppercase">
                Cursor
              </span>
            ) : null}
          </div>
          <div className="mt-1.5 flex flex-col gap-1 text-[10px] text-[#f0f7e6]/55">
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3 shrink-0 text-[#4ecdc4]" />
              {when}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3 shrink-0 text-[#4ecdc4]" />
              {venue.primary}
            </span>
          </div>
        </div>
      </div>
    </article>
  )

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(meetup.slug)}
        className="block w-full text-left"
      >
        {body}
      </button>
    )
  }

  return body
}
