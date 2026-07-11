import { writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { parseCursorCommunityEvents } from "@/lib/cursor-events-fetch"

const SOURCE_URL = "https://cursor.com/community"
const OUTPUT_PATH = "scripts/data/cursor-events.json"

async function main() {
  const response = await fetch(SOURCE_URL, {
    headers: { "user-agent": "aistartupquest-event-sync/1.0" },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    console.error(`Fetch failed: ${response.status} ${response.statusText}`)
    process.exit(1)
  }

  const events = parseCursorCommunityEvents(await response.text())
  if (events.length === 0) {
    console.error(
      "Parsed 0 events - cursor.com/community structure may have changed."
    )
    process.exit(1)
  }

  const missingCity = events.filter((e) => e.city === "").length
  console.log(`Parsed ${events.length} events (${missingCity} missing city).`)
  if (missingCity / events.length > 0.5) {
    console.error(
      "More than half of events are missing city - geo_address_json.city may have moved upstream."
    )
    process.exit(1)
  }

  const outputPath = resolve(process.argv[2] ?? OUTPUT_PATH)
  writeFileSync(outputPath, `${JSON.stringify(events, null, 2)}\n`)
  console.log(`Wrote ${events.length} events to ${outputPath}.`)
}

main()
