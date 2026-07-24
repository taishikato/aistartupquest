import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { CommunityEvent } from "@/lib/events"
import { GuildBoardList } from "@/components/home-events/guild-board"

function createEvents(count: number): CommunityEvent[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `event-${index + 1}`,
    title: `Quest ${index + 1}`,
    city: "Toronto",
    date: "2026-08-02",
    url: `https://example.com/event-${index + 1}`,
    company: "Community",
  }))
}

function renderGuildBoard(events: CommunityEvent[]) {
  return renderToStaticMarkup(
    createElement(GuildBoardList, {
      events,
      upcomingCities: [
        {
          name: "Toronto",
          lat: 43.6532,
          lon: -79.3832,
          events,
        },
      ],
      selectedCity: null,
      onSelectCity: () => undefined,
    })
  )
}

describe("GuildBoardList", () => {
  it("inserts Ben after the second event and Tibor after the ninth event", () => {
    const html = renderGuildBoard(createEvents(12))

    expect(html.indexOf("Quest 2")).toBeLessThan(
      html.indexOf("this is fun, thanks for making it Taishi!")
    )
    expect(
      html.indexOf("this is fun, thanks for making it Taishi!")
    ).toBeLessThan(html.indexOf("Quest 3"))
    expect(html.indexOf("Quest 9")).toBeLessThan(
      html.indexOf(
        "Taishi and I were talking about this a while back, wow awesome to see it"
      )
    )
    expect(
      html.indexOf(
        "Taishi and I were talking about this a while back, wow awesome to see it"
      )
    ).toBeLessThan(html.indexOf("Quest 10"))
  })

  it("appends testimonials whose insertion points exceed the event count", () => {
    const html = renderGuildBoard(createEvents(5))

    expect(html.indexOf("Quest 2")).toBeLessThan(
      html.indexOf("this is fun, thanks for making it Taishi!")
    )
    expect(
      html.indexOf("this is fun, thanks for making it Taishi!")
    ).toBeLessThan(html.indexOf("Quest 3"))
    expect(html.indexOf("Quest 5")).toBeLessThan(
      html.indexOf(
        "Taishi and I were talking about this a while back, wow awesome to see it"
      )
    )
  })

  it("places fallback testimonials after the empty state for an empty filtered list", () => {
    const html = renderGuildBoard([])

    expect(html.indexOf("No matching quests found.")).toBeLessThan(
      html.indexOf("this is fun, thanks for making it Taishi!")
    )
    expect(
      html.indexOf("this is fun, thanks for making it Taishi!")
    ).toBeLessThan(
      html.indexOf(
        "Taishi and I were talking about this a while back, wow awesome to see it"
      )
    )
  })

  it("renders each testimonial as a labeled card without a bottom section", () => {
    const html = renderGuildBoard(createEvents(12))

    expect(html.match(/Adventurer&#x27;s log/g)).toHaveLength(2)
    expect(html).not.toContain('<section aria-label="Adventurer&#x27;s log"')
    expect(html).toContain("Ben Lang")
    expect(html).toContain("@benln")
    expect(html).toContain('alt="Ben Lang"')
    expect(html).toContain("%2Ftestimonials%2Fbenln.jpg")
    expect(html).toContain(
      'href="https://x.com/benln/status/2079107571131015228" target="_blank" rel="noreferrer"'
    )
    expect(html).toContain("Tibor (Tee)")
    expect(html).toContain("@tibor_tee")
    expect(html).toContain('alt="Tibor (Tee)"')
    expect(html).toContain("%2Ftestimonials%2Ftibor_tee.jpg")
    expect(html.match(/width="36" height="36"/g)).toHaveLength(2)
    expect(html).toContain(
      'href="https://x.com/tibor_tee/status/2078920423161679926" target="_blank" rel="noreferrer"'
    )
    expect(html).not.toContain("cursor-icon.png")
  })
})
