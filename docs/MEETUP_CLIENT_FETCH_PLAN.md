# Meetup Client-Side Fetch Plan

## Summary

Move meetup data loading for `?mode=meetups` from server-side fetching to
client-side fetching with TanStack Query and the Supabase browser client.
Keep company data loading server-side.

## Key Changes

- Add `@tanstack/react-query`.
- Add `components/query-provider.tsx` as a `"use client"` component. Create the
  `QueryClient` once with `useState(() => new QueryClient())` and wrap children
  with `QueryClientProvider`.
- Wrap the existing app children in `app/layout.tsx` inside `QueryProvider`,
  keeping the current `ThemeProvider` and light-only behavior.
- Change `lib/city-page-data.ts` to load only `companies` and return
  `{ companies }`.
- Update all city pages to pass only `companies` and `config` into `CityMap`:
  `app/page.tsx`, `app/toronto/page.tsx`, `app/ny/page.tsx`,
  `app/london/page.tsx`, `app/vancouver/page.tsx`, and `app/tokyo/page.tsx`.
- Remove `meetups` from `CityMapProps`.
- Move meetup loading into a client-side TanStack Query hook used by `CityMap`.

## Public Data Boundary

- Add Supabase migration
  `supabase/migrations/20260501100000_create_public_upcoming_meetups_view.sql`
  before moving reads to the browser.
- Revoke direct public reads from `public.meetups`:
  `revoke select on public.meetups from anon, authenticated`.
- Drop the old base-table public read policy:
  `drop policy if exists "Published meetups are publicly readable" on public.meetups`.
- Create `public.published_upcoming_meetups` as the only public browser read
  surface for meetup listings.
- Define it as a normal, non-materialized Postgres view with
  `security_barrier = true`.
- Visitors are not logged in, so they read meetups through Supabase's `anon`
  role. The `anon` role must have `select` on the public view, not on the base
  table.
- The view must expose only these columns: `slug`, `city`, `title`,
  `description`, `venue_name`, `location_label`, `latitude`, `longitude`,
  `starts_at`, `ends_at`, `organizer_name`, `event_url`, and `status`.
- Do not expose `id`, `contact_email`, `payload_hash`, `created_at`, or
  `updated_at` to anon/authenticated clients.
- The view must enforce both `status = 'published'` and the existing upcoming
  rule at the database layer, so past published meetups are not returned to the
  browser:
  `ends_at >= now()` when `ends_at` is present, otherwise
  `starts_at >= now() - interval '2 hours'`.
- Grant `select` to anon/authenticated on `public.published_upcoming_meetups`
  only, not on `public.meetups`.
- Do not materialize the view. It should be a normal Postgres view over
  `public.meetups`, so newly inserted published upcoming meetups appear through
  the view immediately on the next client query without a separate sync job.
- Regenerate `types/supabase.ts` after the migration so the new view appears
  under `Database["public"]["Views"]`.
- Keep meetup submissions on the existing server action with the service role.
  Do not move inserts, updates, deletes, rate limiting, Turnstile verification,
  or geocoding to the client.

## Meetup Query Behavior

- Create `lib/use-city-meetups.ts` as a client-only hook file and export
  `useCityMeetups(city, enabled)`.
- Use the query key `["meetups", city]`. Use the same key for invalidation.
- Enable the query only when `mode === "meetups"` so startup mode does not fetch
  meetups on initial load.
- Use `lib/supabase/client.ts` for the Supabase browser client.
- Query `public.published_upcoming_meetups`, not `public.meetups`.
- Select the exact public columns listed in `Public Data Boundary`.
- Use `.match({ city, status: "published" })`; `status` remains in the query as
  a source-of-concern mirror of the view predicate, not as the security boundary.
- Order by `starts_at` ascending, then `title` ascending.
- Add a public-row mapper if needed so client-loaded meetups do not require
  `contact_email`; the `Meetup` model may keep `contactEmail: null` for public
  rows.
- Keep `filterAndSortUpcomingMeetups` as a UI consistency guard, but do not rely
  on it as the security boundary.
- Do not add missing-table or broad fallback behavior. Surface query errors in
  the meetup UI.

## UI Behavior

- In `CityMap`, replace the `meetups` prop with query data:
  `const allMeetups = meetupsQuery.data ?? []`.
- Keep existing meetup filtering, selection, URL sync, sidebar, selected panel,
  and map marker logic.
- While meetup data is loading or fetching for the first time, do not treat
  missing meetup data as an invalid selection. Preserve the current `m` query
  param and do not let `syncSelectionToUrl()` delete it until the query has
  settled.
- Pass explicit meetup query state from `CityMap` into `DiscoveryPanel`, for
  example `meetupsLoading` and `meetupsError`.
- While meetup data is loading, show a minimal loading state in the meetup list
  area, keep the board count from presenting `0 upcoming meetups`, and avoid
  showing the empty state early.
- On query error, show a short meetup-specific error state in the list area and
  render no meetup markers. Do not render raw Supabase `error.message` in the
  UI.
- Preserve `?mode=meetups&m=<slug>` behavior: after data loads, the existing
  selection resolver should select the matching meetup.
- After a successful meetup submission, invalidate the meetup query so the new
  published meetup can appear without a full page reload.
- Implement submission refresh in `MeetupRequestPanel` with `useQueryClient()`.
  After `submitMeetup()` succeeds, call
  `invalidateQueries({ queryKey: ["meetups", submittedCity] })`.
- If the submitted city is different from the currently viewed city, only that
  submitted city's query is invalidated; the current city view does not change.
- On mobile, the selected meetup area should show a loading message while the
  query is loading, a generic error message on query error, and `Nothing
selected` only after the query has settled with no selected meetup.

## Test Plan

- Run `pnpm typecheck`.
- Run `pnpm lint`.
- Run `pnpm build`. The existing `metadataBase` warning is acceptable and is
  unrelated to this change.
- Automated tests are not added unless a test runner is introduced separately;
  this repo currently relies on typecheck, lint, build, and manual verification.
- In browser devtools Network, manually verify normal startup pages do not make
  a Supabase meetup request on first load.
- In browser devtools Network, manually verify `/?mode=meetups` fetches meetups
  from the public read surface client-side and displays the list and markers.
- Manually verify the network response does not include `contact_email`,
  `payload_hash`, `id`, `created_at`, or `updated_at`.
- Manually verify past published meetups are not returned in the network
  response.
- Manually verify `/?mode=meetups&m=<slug>` restores selection after loading.
- Manually verify switching modes keeps search reset and URL sync behavior.
- Manually verify successful meetup submission refreshes meetup data.

## Assumptions

- Only meetup data moves to client-side fetching. Company data stays server-side
  because public company reads are restricted.
- `types/supabase.ts` already includes the required `meetups` row type.
- A small database migration is required to create the safe public meetup read
  surface and remove direct public table reads.
- `types/supabase.ts` must be regenerated after that migration so the new view
  is available to the typed Supabase client.
- Existing `meetups_city_status_starts_at_idx` supports the city/status/start
  query shape. Do not add another index unless implementation verification shows
  the view query needs it.
- `app/globals.css` should not be edited for this change.
