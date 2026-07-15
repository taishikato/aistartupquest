import { format } from "date-fns"

import type { CommunityEvent } from "@/lib/events"

export function SelectedCityPanel({
  selectedCity,
  events,
  onClose,
}: {
  selectedCity: string
  events: CommunityEvent[]
  onClose: () => void
}) {
  return (
    <section className="pointer-events-none absolute right-4 bottom-12 z-30 hidden max-w-[min(360px,calc(100vw-32px))] md:right-auto md:bottom-6 md:left-[calc(min(380px,calc(100vw-24px))+1.5rem)] md:block">
      <div className="pointer-events-auto max-h-[40vh] overflow-y-auto border-2 border-[#1a1a2e] bg-white p-4 shadow-[4px_4px_0_#1a1a2e]">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-(family-name:--font-pixel) text-[13px] leading-5 text-[#1a1a2e]">
            {selectedCity}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center border-2 border-[#1a1a2e] bg-white font-(family-name:--font-pixel) text-[10px] text-[#1a1a2e] shadow-[2px_2px_0_#1a1a2e]"
            aria-label="Close selected city"
          >
            X
          </button>
        </div>
        <div className="mt-3 grid gap-3">
          {events.map((event) => (
            <article
              key={event.id}
              className="grid gap-2 border-2 border-[#1a1a2e] bg-[#fff7dd] p-3"
            >
              <time
                dateTime={event.date}
                className="font-(family-name:--font-pixel) text-[9px] leading-4 text-[#95602f]"
              >
                {format(new Date(`${event.date}T00:00:00`), "MMM d")}
              </time>
              <h3 className="text-sm leading-5 font-bold text-[#1a1a2e]">
                {event.title}
              </h3>
              <a
                href={event.url}
                target="_blank"
                rel="noreferrer"
                className="justify-self-start border-2 border-[#1a1a2e] bg-[#4ecdc4] px-2 py-1 text-xs font-bold text-[#1a1a2e] shadow-[2px_2px_0_#1a1a2e]"
              >
                Register ↗
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
