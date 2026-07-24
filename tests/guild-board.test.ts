import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { CommunityEvent } from "@/lib/events"
import { GuildBoardList } from "@/components/home-events/guild-board"

const event: CommunityEvent = {
  id: "event-1",
  title: "AI Founders Meetup",
  city: "Toronto",
  date: "2026-08-02",
  url: "https://example.com/event-1",
  company: "Community",
}

describe("GuildBoardList", () => {
  it("shows the approved personal comments after the event cards", () => {
    const html = renderToStaticMarkup(
      createElement(GuildBoardList, {
        events: [event],
        upcomingCities: [
          {
            name: "Toronto",
            lat: 43.6532,
            lon: -79.3832,
            events: [event],
          },
        ],
        selectedCity: null,
        onSelectCity: () => undefined,
      })
    )

    expect(html).toContain("Adventurer&#x27;s log")
    expect(html).toContain("this is fun, thanks for making it Taishi!")
    expect(html).toContain("Ben Lang")
    expect(html).toContain("@benln")
    expect(html).toContain('alt="Ben Lang"')
    expect(html).toContain("%2Ftestimonials%2Fbenln.jpg")
    expect(html).toContain(
      'href="https://x.com/benln/status/2079107571131015228" target="_blank" rel="noreferrer"'
    )
    expect(html).toContain(
      "Taishi and I were talking about this a while back, wow awesome to see it"
    )
    expect(html).toContain("Tibor (Tee)")
    expect(html).toContain("@tibor_tee")
    expect(html).toContain('alt="Tibor (Tee)"')
    expect(html).toContain("%2Ftestimonials%2Ftibor_tee.jpg")
    expect(html.match(/width="36" height="36"/g)).toHaveLength(2)
    expect(html).toContain(
      'href="https://x.com/tibor_tee/status/2078920423161679926" target="_blank" rel="noreferrer"'
    )
    expect(html.indexOf("AI Founders Meetup")).toBeLessThan(
      html.indexOf("Adventurer&#x27;s log")
    )
    expect(html).not.toContain("cursor-icon.png")
  })
})
