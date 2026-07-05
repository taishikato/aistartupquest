import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/types/supabase"
import {
  buildCursorMeetupRow,
  mapCursorCity,
  validateCursorEvent,
  type CursorMeetupRow,
} from "@/lib/cursor-events"

const DEFAULT_INPUT = "scripts/data/cursor-events.json"

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    )
    process.exit(1)
  }

  const inputPath = resolve(process.argv[2] ?? DEFAULT_INPUT)
  const raw = JSON.parse(readFileSync(inputPath, "utf8")) as unknown
  if (!Array.isArray(raw)) {
    console.error(`${inputPath} must contain a JSON array`)
    process.exit(1)
  }

  const rows: CursorMeetupRow[] = []
  const skipped: string[] = []

  for (const [index, item] of raw.entries()) {
    const result = validateCursorEvent(item)
    if (!result.ok) {
      skipped.push(`#${index}: ${result.reason}`)
      continue
    }
    const city = mapCursorCity(result.event.city)
    if (!city) {
      skipped.push(
        `#${index} (${result.event.title}): unsupported city "${result.event.city}"`
      )
      continue
    }
    rows.push(buildCursorMeetupRow(result.event, city))
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey)

  if (rows.length > 0) {
    const { error } = await supabase
      .from("meetups")
      .upsert(rows, { onConflict: "source,source_event_id" })
    if (error) {
      console.error(`Upsert failed: ${error.message}`)
      process.exit(1)
    }
  }

  console.log(`Upserted ${rows.length} cursor events.`)
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length}:`)
    for (const reason of skipped) {
      console.log(`  - ${reason}`)
    }
  }
}

main()
