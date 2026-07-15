import { createClient } from "@supabase/supabase-js"

import { prepareCursorEventSync } from "@/lib/cursor-event-sync"
import type { Database } from "@/types/supabase"

const SOURCE_URL = "https://cursor.com/community"
const BATCH_SIZE = 250

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    )
  }

  const response = await fetch(SOURCE_URL, {
    headers: { "user-agent": "aistartupquest-event-sync/2.0" },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`)
  }

  const prepared = prepareCursorEventSync(await response.text())
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })

  for (let offset = 0; offset < prepared.rows.length; offset += BATCH_SIZE) {
    const batch = prepared.rows.slice(offset, offset + BATCH_SIZE)
    const { error } = await supabase
      .from("events")
      .upsert(batch, { onConflict: "source,source_event_id" })

    if (error) {
      throw new Error(`Supabase upsert failed: ${error.message}`)
    }
  }

  console.log(
    [
      `Fetched ${prepared.candidateCount} Cursor event candidates.`,
      `Accepted ${prepared.acceptedCount}.`,
      `Skipped ${prepared.skippedCount}.`,
      `Upserted ${prepared.rows.length} unique events.`,
    ].join(" ")
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
