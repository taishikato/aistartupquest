# Event company tag on top-page guild board

## Goal

Show a company tag on each event card in the top-page sidebar.
This prepares the UI for non-Cursor company events later.
Current events remain Cursor-only.

## Decisions

- Data: each event carries a required `company: string` field.
- Placement: company tag sits on the same row as the date, to the right.
- Style: small framed parchment label matching the guild board (option C).
- Scope: top-page static JSON + `GuildBoardList` only.
- Out of scope: Supabase `meetups`, city-map `MeetupCard`, fetch/import scripts.

## Current architecture

The top page (`app/page.tsx`) renders `HomeEventsMap`.
The sidebar list is `GuildBoardList` in `components/home-events-map.tsx`.
Events come from `lib/data/cursor-community-events.json`, not Supabase.
City maps use Supabase `meetups.source` and already show a Cursor badge in `MeetupCard`.
`scripts/fetch-cursor-events.ts` and `scripts/import-cursor-events.ts` feed the city-map pipeline only.

## Data model

Extend the client event type:

```ts
type CursorCommunityEvent = {
  id: string
  title: string
  city: string
  date: string
  url: string
  company: string
}
```

Backfill every event in `lib/data/cursor-community-events.json` with `"company": "Cursor"`.
`company` is a display name, not a slug or enum.
Future non-Cursor events add their own company string the same way.

No schema migration.
No script changes unless a later sync path starts writing the top-page JSON.

## UI

In `GuildBoardList` event cards:

1. Change the date row to a horizontal flex container.
2. Keep `<time>` on the left.
3. Add a company tag on the right showing `event.company`.
4. Tag styling:
   - hard 2px border `#1a1a2e`
   - parchment background (`#ead9ab` or equivalent existing board tone)
   - text `#95602f` or `#1a1a2e`
   - pixel font, small uppercase-friendly label
   - no rounded corners, no blur, no soft shadows
5. Keep title, city, and Register link unchanged.

## Non-goals

- Do not migrate the top page to Supabase in this change.
- Do not add a `company` column to `meetups`.
- Do not change fetch/import scripts for this prep.
- Do not remove "Cursor" from event titles (title cleanup is separate).

## Success criteria

- Every upcoming event card on the top-page sidebar shows a company tag next to the date.
- All current events display `Cursor`.
- Adding a future event with `"company": "OtherCo"` shows that label without further UI work.
- City maps, scripts, and Supabase remain unchanged.

## Testing

- Visual check on the top page sidebar: date and company share one row.
- Confirm search filtering still works (company field is display-only).
- Typecheck after updating the event type and JSON shape.
