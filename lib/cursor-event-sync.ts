import {
  buildCursorEventRow,
  parseCursorCommunityEventsWithStats,
  type CursorEventRow,
} from "@/lib/cursor-events"

const MAX_INVALID_RATIO = 0.25

export type PreparedCursorEventSync = {
  candidateCount: number
  acceptedCount: number
  skippedCount: number
  rows: CursorEventRow[]
}

export function prepareCursorEventSync(
  html: string
): PreparedCursorEventSync {
  const { candidateCount, events } =
    parseCursorCommunityEventsWithStats(html)

  if (candidateCount === 0) {
    throw new Error("Parsed 0 Cursor event candidates")
  }

  const skippedCount = candidateCount - events.length
  const invalidRatio = skippedCount / candidateCount
  if (invalidRatio > MAX_INVALID_RATIO) {
    throw new Error(
      `${(invalidRatio * 100).toFixed(1)}% of Cursor event candidates were invalid`
    )
  }

  const rowsBySourceId = new Map<string, CursorEventRow>()
  for (const event of events) {
    const row = buildCursorEventRow(event)
    rowsBySourceId.set(row.source_event_id, row)
  }

  return {
    candidateCount,
    acceptedCount: events.length,
    skippedCount,
    rows: [...rowsBySourceId.values()],
  }
}
