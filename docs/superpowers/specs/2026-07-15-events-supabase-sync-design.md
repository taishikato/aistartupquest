# Supabase-backed event sync design

## Goal

Make Supabase the only runtime source of truth for events shown on the home page.
Replace the unused meetup-specific schema with a general event model that can support Cursor now and other companies later.
Provide one reliable command that fetches the current Cursor community events and upserts them into Supabase.

## Current problem

The home page imports `lib/data/cursor-community-events.json` at build time.
The `meetups` table contains only six Cursor records and is not read by the home page.
The table also restricts `city` to the six startup-map cities, while the home page displays events worldwide.
The old Cursor importer was deleted because it populated this disconnected and overly narrow table.
As a result, there is no supported path from an upstream Cursor event update to the home page.

## Decisions

### Single runtime source

The home page, event map, sidebar counts, filtering, and event JSON-LD will all use rows fetched from Supabase.
The static Cursor event JSON file will be deleted and will not remain as a fallback.
Database failures must be visible during development and operation instead of silently serving stale bundled data.

### Remove the meetup model

A new migration will drop `published_upcoming_meetups`, `meetups`, and the unused `meetup_submission_attempts` table.
Historical migration files will remain unchanged so existing databases retain an accurate migration history.
The generated Supabase TypeScript types will be refreshed after the migration is applied.

### General event schema

The new public `events` table will contain the following fields:

- `id`: Internal identity primary key.
- `source`: Stable integration identifier such as `cursor`.
- `source_event_id`: Stable identifier from the source.
- `company`: Display name such as `Cursor`.
- `title`: Public event title.
- `description`: Optional public event description.
- `city`: Public display city.
- `latitude` and `longitude`: City-level map position.
- `event_timezone`: IANA timezone supplied by the source.
- `event_date`: Calendar date in the event timezone.
- `event_url`: Public registration URL.
- `status`: `published`, `cancelled`, or `hidden`.
- `payload_hash`: Hash of normalized source fields for auditing and idempotence.
- `created_at` and `updated_at`: UTC audit timestamps.

The unique key will be `(source, source_event_id)` so every integration can upsert independently without coupling its identifiers to another company.
Source and company will remain text fields rather than database enums so adding another company does not require changing a restrictive enum.
Latitude, longitude, title length, URL length, status, and required-field checks will be enforced in PostgreSQL.

### Public access and security

RLS will be enabled on `events`.
Anonymous and authenticated clients may select only published rows and only the columns required by the home page.
Insert, update, and delete access will remain unavailable to anonymous and authenticated roles.
An invoker-security `published_upcoming_events` view will expose the safe column set and filter each row against the current calendar date in its own `event_timezone`.
The sync script will use `SUPABASE_SERVICE_ROLE_KEY` only in the server-side command process.
The service-role key will never be imported by client code or exposed through a `NEXT_PUBLIC_` variable.

### Location privacy

The sync must not store venue names, street addresses, or exact private venue locations.
It will prefer the city-level coordinate attached to the event's local Cursor calendar.
When only an event coordinate exists, it will be reduced to a coarse city-level position before storage.
The home page will continue to describe the venue as shared after registration.

## Cursor synchronization

The repository will expose `pnpm sync:cursor-events`.
The command will:

1. Fetch `https://cursor.com/community` with a timeout and an explicit user agent.
2. Extract Luma event objects from the Next.js flight payload.
3. Normalize the source ID, title, city, timezone, local date, URL, company, and city-level coordinates.
4. Reject malformed events and non-HTTPS URLs.
5. Abort without writing if zero events are parsed or if source-shape quality gates indicate upstream drift.
6. Upsert validated rows using the `(source, source_event_id)` conflict key.
7. Print fetched, accepted, skipped, inserted-or-updated, and failure counts.

The first version will not delete or hide rows missing from one fetch.
This avoids turning a partial upstream response into destructive reconciliation.
Past events naturally disappear from the home page query because it selects only current and future event dates.
Cancellation reconciliation can be added later when the upstream source exposes a reliable cancellation signal.

The parser and normalization logic will live in importable library modules so they can be tested without network or database access.
The executable script will remain a thin orchestration layer.

## Home-page data flow

`app/page.tsx` will query `published_upcoming_events` on the server.
The query will order rows by date and title.
A pure transformer will group rows by city, assign each city its map position, and produce the existing `CityWithEvents` shape.
`HomeEventsMap` will receive that data as a prop instead of importing a static dataset.
The same server-fetched rows will feed the structured event data so visible content and metadata cannot drift.

The existing client-side map, filtering, city selection, and URL synchronization behavior will remain unchanged.
Only their data injection boundary will change.

## Error handling

The sync will fail with a non-zero exit code for network errors, timeouts, an empty parse, excessive invalid records, or a Supabase upsert error.
It will not write a partial local snapshot that can be mistaken for the source of truth.
The home-page server query will throw on Supabase errors rather than falling back to deleted static data.
An empty successful query will render the existing empty state with zero events.

## Testing and verification

Tests will cover flight-payload extraction, malformed chunks, timezone-local dates, city-level coordinate selection, input validation, database-row normalization, and grouping Supabase rows for the map.
The new tests will be written and observed failing before their production implementations are added.
Existing home-event filtering and map tests will continue to run against injected fixtures.

Verification will include `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
The migration will be applied through Supabase, generated types will be refreshed, and Supabase security and performance advisors will be checked.
Finally, `pnpm sync:cursor-events` will be executed against the configured project and a read query will confirm that the new rows are available to the home-page access path.

## Out of scope

This change will not schedule automatic recurring synchronization.
It will not add another event provider yet.
It will not expose venue addresses or add event submission UI.
It will not change the visual design of the home map or sidebar.
