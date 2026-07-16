# Supabase Event Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static Cursor event dataset and unused meetup schema with a general Supabase `events` table, a Cursor upsert command, and a Supabase-backed home page.

**Architecture:** Pure modules parse Cursor's flight payload and transform database rows into the map's existing city/event model. A thin Node script fetches Cursor and upserts normalized rows with a service-role client. The Next.js server page reads a safe upcoming-events view and passes serializable data into the existing client map.

**Tech Stack:** Next.js 16, TypeScript 5.9, Supabase/Postgres, `@supabase/supabase-js`, Vitest, pnpm.

## Global Constraints

The home page must have no runtime or fallback dependency on `lib/data/cursor-community-events.json`.
The new event model must support additional companies without a schema enum migration.
Venue names, street addresses, and exact private venue locations must not be stored.
Anonymous and authenticated users may read only safe published event fields.
The service-role key must remain server-only.
Existing map behavior and visual design must remain unchanged.
All conditional class names must continue using `cn` where applicable.
Do not edit `app/globals.css`.

---

### Task 1: Create the general event database schema

**Files:**
- Create: `supabase/migrations/20260715152642_replace_meetups_with_events.sql`
- Modify after remote application: `types/supabase.ts`

**Interfaces:**
- Produces: `public.events`, unique key `(source, source_event_id)`, and `public.published_upcoming_events`.
- Produces safe view columns: `source`, `source_event_id`, `company`, `title`, `description`, `city`, `latitude`, `longitude`, `event_timezone`, `event_date`, `event_url`.

- [ ] **Step 1: Generate the migration file**

Run: `pnpm exec supabase migration new replace_meetups_with_events`
Expected: `supabase/migrations/20260715152642_replace_meetups_with_events.sql` is created.

- [ ] **Step 2: Write the migration**

The migration must drop the old view and tables, create `events`, preserve the existing `set_updated_at()` trigger function, enable RLS, and expose only a security-invoker safe view.

```sql
drop view if exists public.published_upcoming_meetups;
drop table if exists public.meetup_submission_attempts;
drop table if exists public.meetups;

create table public.events (
  id bigint generated always as identity primary key,
  source text not null,
  source_event_id text not null,
  company text not null,
  title text not null,
  description text,
  city text not null,
  latitude double precision not null,
  longitude double precision not null,
  event_timezone text not null,
  event_date date not null,
  event_url text not null,
  status text not null default 'published',
  payload_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint events_source_event_key unique (source, source_event_id),
  constraint events_status_check check (status in ('published', 'cancelled', 'hidden')),
  constraint events_latitude_check check (latitude between -90 and 90),
  constraint events_longitude_check check (longitude between -180 and 180),
  constraint events_source_len check (char_length(btrim(source)) between 1 and 80),
  constraint events_source_event_id_len check (char_length(btrim(source_event_id)) between 1 and 255),
  constraint events_company_len check (char_length(btrim(company)) between 1 and 120),
  constraint events_title_len check (char_length(btrim(title)) between 1 and 200),
  constraint events_city_len check (char_length(btrim(city)) between 1 and 200),
  constraint events_timezone_len check (char_length(btrim(event_timezone)) between 1 and 100),
  constraint events_url_len check (char_length(event_url) between 1 and 2000)
);

create index events_status_event_date_idx on public.events (status, event_date);
create index events_company_event_date_idx on public.events (company, event_date);

create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

alter table public.events enable row level security;

create policy "Published events are publicly readable"
on public.events for select to anon, authenticated
using (status = 'published');

revoke all on public.events from anon, authenticated;
grant select (
  source, source_event_id, company, title, description, city,
  latitude, longitude, event_timezone, event_date, event_url, status
) on public.events to anon, authenticated;

create view public.published_upcoming_events
with (security_invoker = true, security_barrier = true) as
select
  source, source_event_id, company, title, description, city,
  latitude, longitude, event_timezone, event_date, event_url
from public.events
where status = 'published'
  and event_date >= (now() at time zone event_timezone)::date;

revoke all on public.published_upcoming_events from anon, authenticated;
grant select on public.published_upcoming_events to anon, authenticated;
```

- [ ] **Step 3: Apply the migration and regenerate types**

Apply the migration with Supabase MCP, then run `pnpm genType`.
Expected: the remote schema contains `events`, no `meetups`, and generated types contain `events` and `published_upcoming_events`.

- [ ] **Step 4: Verify schema security**

Use Supabase MCP to query constraints, grants, RLS state, and the view definition.
Run both Supabase security and performance advisors and fix new findings introduced by this migration.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations types/supabase.ts
git commit -m 'feat: add general events schema'
```

### Task 2: Parse and normalize Cursor events

**Files:**
- Create: `lib/cursor-events.ts`
- Create: `tests/cursor-events.test.ts`

**Interfaces:**
- Produces: `parseCursorCommunityEvents(html: string): CursorEventInput[]`.
- Produces: `buildCursorEventRow(event: CursorEventInput): CursorEventRow`.
- `CursorEventInput` includes `sourceEventId`, `title`, `city`, `eventTimezone`, `eventDate`, `eventUrl`, `latitude`, and `longitude`.

- [ ] **Step 1: Write failing parser tests**

Use a compact fixture containing escaped `self.__next_f.push` data and assert:

```ts
expect(parseCursorCommunityEvents(html)).toEqual([
  {
    sourceEventId: 'cursor-toronto',
    title: 'Cursor Toronto',
    city: 'Toronto',
    eventTimezone: 'America/Toronto',
    eventDate: '2026-07-22',
    eventUrl: 'https://luma.com/cursor-toronto',
    latitude: 43.6532,
    longitude: -79.3832,
  },
])
```

Also test malformed chunks, invalid HTTPS URLs, invalid timezone values, missing city, missing coordinates, and venue-coordinate coarsening when no city-calendar coordinate exists.

- [ ] **Step 2: Run the tests and verify RED**

Run: `pnpm test tests/cursor-events.test.ts`
Expected: FAIL because `@/lib/cursor-events` does not exist.

- [ ] **Step 3: Implement the minimal parser**

Implement balanced-object parsing of the flight payload.
Parse `geo_address_json.city`, `timezone`, `start_at`, `url`, `coordinate`, and `managing_calendars`.
Choose a non-global managing calendar coordinate whose location city matches the event city.
When unavailable, coarsen the event coordinate to one decimal place.
Never copy address, venue name, or full-address fields into the normalized result.

- [ ] **Step 4: Add row-normalization tests and verify RED**

Assert that `buildCursorEventRow()` returns:

```ts
{
  source: 'cursor',
  source_event_id: 'cursor-toronto',
  company: 'Cursor',
  title: 'Cursor Toronto',
  description: null,
  city: 'Toronto',
  latitude: 43.6532,
  longitude: -79.3832,
  event_timezone: 'America/Toronto',
  event_date: '2026-07-22',
  event_url: 'https://luma.com/cursor-toronto',
  status: 'published',
  payload_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
}
```

Run the focused test and confirm it fails because the builder is missing.

- [ ] **Step 5: Implement row normalization and verify GREEN**

Use `node:crypto` SHA-256 over stable normalized source fields.
Run: `pnpm test tests/cursor-events.test.ts`
Expected: all Cursor parser and normalization tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/cursor-events.ts tests/cursor-events.test.ts
git commit -m 'feat: parse Cursor community events'
```

### Task 3: Add the Cursor-to-Supabase sync command

**Files:**
- Create: `scripts/sync-cursor-events.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `parseCursorCommunityEvents()` and `buildCursorEventRow()` from Task 2.
- Produces: package script `sync:cursor-events`.

- [ ] **Step 1: Add the package command**

```json
"sync:cursor-events": "pnpm dlx tsx scripts/sync-cursor-events.ts"
```

- [ ] **Step 2: Implement thin orchestration**

The script must validate `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, fetch with a 30-second timeout, abort on zero parsed events, abort when more than 25 percent of extracted candidates are invalid, and upsert in batches of 250:

```ts
await supabase
  .from('events')
  .upsert(batch, { onConflict: 'source,source_event_id' })
```

It must print a deterministic summary and set `process.exitCode = 1` on failure.

- [ ] **Step 3: Verify locally without mutating Supabase**

Run: `pnpm typecheck`
Expected: exit 0 and no type errors in the script.

- [ ] **Step 4: Commit**

```bash
git add package.json scripts/sync-cursor-events.ts
git commit -m 'feat: add Cursor event sync command'
```

### Task 4: Transform Supabase rows for the home map

**Files:**
- Create: `lib/events.ts`
- Create: `tests/events.test.ts`
- Modify imports in: `components/home-events/*.ts`, `components/home-events/*.tsx`, `components/home-events-map.tsx`

**Interfaces:**
- Produces: `EventRow`, `CommunityEvent`, `EventCity`, and `CityWithEvents`.
- Produces: `groupEventsByCity(rows: EventRow[]): CityWithEvents[]`.

- [ ] **Step 1: Write failing grouping tests**

Assert that two rows in one city produce one city marker, events sort by date then title, coordinates come from the first sorted event, and different cities sort by their first event date then city name.

- [ ] **Step 2: Run the tests and verify RED**

Run: `pnpm test tests/events.test.ts`
Expected: FAIL because `@/lib/events` does not exist.

- [ ] **Step 3: Implement the pure transformer**

Map database snake-case fields to the existing UI fields:

```ts
{
  id: row.source_event_id,
  title: row.title,
  city: row.city,
  date: row.event_date,
  url: row.event_url,
  company: row.company,
}
```

Group by `city`, retain `latitude` and `longitude` as `lat` and `lon`, and sort deterministically.

- [ ] **Step 4: Replace component type imports**

Update all home-event components to import the equivalent types from `@/lib/events`.
Change `HomeEventsMap` to accept `upcomingCities: CityWithEvents[]` and remove the internal `getUpcomingCities()` call.

- [ ] **Step 5: Verify GREEN**

Run: `pnpm test tests/events.test.ts tests/home-map-url.test.ts`
Expected: both selected test files pass.

- [ ] **Step 6: Commit**

```bash
git add lib/events.ts tests/events.test.ts components/home-events components/home-events-map.tsx
git commit -m 'refactor: inject home event data'
```

### Task 5: Read events from Supabase on the home page

**Files:**
- Create: `lib/events-query.ts`
- Modify: `app/page.tsx`
- Modify: `tests/structured-data.test.ts`

**Interfaces:**
- Produces: `getUpcomingEvents(): Promise<EventRow[]>`.
- Consumes: `groupEventsByCity()` from Task 4.
- Passes: `<HomeEventsMap upcomingCities={upcomingCities} />`.

- [ ] **Step 1: Implement the server query**

Use `createClient()` from `lib/supabase/server.ts` and query:

```ts
const { data, error } = await supabase
  .from('published_upcoming_events')
  .select('*')
  .order('event_date')
  .order('title')
```

Throw an error containing the Supabase message when the query fails.

- [ ] **Step 2: Convert the page to a server-fed map**

Make `Page` async, fetch rows once, derive `upcomingCities`, derive structured-data inputs from the same rows, and pass the cities prop into `HomeEventsMap`.

- [ ] **Step 3: Verify page integration**

Run: `pnpm typecheck`
Expected: exit 0 with typed Supabase view rows and serializable client props.

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx lib/events-query.ts tests/structured-data.test.ts
git commit -m 'feat: load home events from Supabase'
```

### Task 6: Remove the static event source

**Files:**
- Delete: `lib/data/cursor-community-events.json`
- Delete: `lib/cursor-community-events.ts`
- Delete or replace: `tests/cursor-community-events.test.ts`
- Modify: `AGENTS.md`

**Interfaces:**
- Removes all imports and documentation references to the static JSON source.

- [ ] **Step 1: Prove no runtime imports remain**

Run: `rg -n 'cursor-community-events|cursorCommunityEvents' app components lib tests AGENTS.md`
Expected: only files scheduled for deletion and outdated documentation remain.

- [ ] **Step 2: Delete static-data files and update documentation**

Remove the JSON module and its data-specific test.
Update `AGENTS.md` to state that home events come from Supabase `events` and are refreshed with `pnpm sync:cursor-events`.

- [ ] **Step 3: Verify no references remain**

Run: `rg -n 'cursor-community-events|cursorCommunityEvents' app components lib tests AGENTS.md`
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add -A lib/data lib tests AGENTS.md
git commit -m 'refactor: remove static Cursor event data'
```

### Task 7: Sync production data and verify end to end

**Files:**
- No intended source changes unless verification exposes a defect.

**Interfaces:**
- Consumes: migration, sync command, server query, and map injection from Tasks 1-6.

- [ ] **Step 1: Run full local verification**

Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` independently.
Expected: every command exits 0 with no failures or warnings requiring code changes.

- [ ] **Step 2: Execute the real sync**

Run: `pnpm run _with-env pnpm sync:cursor-events`
Expected: the script fetches a non-zero event count and reports a successful upsert.

- [ ] **Step 3: Verify database results**

Use Supabase MCP to confirm:

```sql
select company, count(*), min(event_date), max(event_date)
from public.events
group by company;

select count(*) from public.published_upcoming_events;
```

Expected: Cursor has a non-zero count and the upcoming view returns the rows needed by the home page.

- [ ] **Step 4: Verify the running home page**

Reload `http://localhost:3000/` and confirm the sidebar count, event cards, city markers, search, and JSON-LD are populated from Supabase.
Temporarily comparing the displayed count with the upcoming-view count is allowed, but no static-data fallback may be reintroduced.

- [ ] **Step 5: Run final advisors and inspect the diff**

Run Supabase security and performance advisors, `git diff --check`, and `git status --short`.
Fix all new actionable findings and unrelated lint, test, or flakiness failures encountered during the work.

- [ ] **Step 6: Commit final verification fixes if needed**

```bash
git add -A
git commit -m 'fix: complete event sync verification'
```
