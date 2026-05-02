# Meetup Mode Plan

This document defines the implementation plan for adding user-submitted AI meetup listings to the city map app.

The goal is to let users switch between `Startups` and `Meetups`, and to render published meetup entries on the map with a Dragon Quest-style village signboard marker.

## Summary

- Add a `Startups / Meetups` mode switch to the existing city map experience
- Show only upcoming meetups for the currently selected city
- Let users submit meetups through the app
- Publish meetup submissions immediately in v1
- Keep the existing simple, product-like layout and reuse the current multi-panel structure where possible

## Product Decisions

The current agreed defaults are:

1. Meetup submissions are `anonymous and immediately published`
2. Only `upcoming meetups` are shown on the map
3. Meetup details reuse the `existing selected panel layout`
4. Address-to-coordinate conversion uses an `external geocoder`
5. Geocoding runs in the application layer during submission, not in a database trigger for v1

Additional implementation defaults:

1. Use `Google Maps Geocoding API` for v1 geocoding
2. Store the API key in a server-only environment variable such as `GOOGLE_MAPS_GEOCODING_API_KEY`
3. Do not add a geocoder fallback in v1; fail closed if geocoding fails
4. Render meetup dates in the `city-local timezone`, not the viewer timezone
5. Add minimal anti-abuse protection even in v1

## Anti-Abuse And Publishing Guardrails

Because v1 uses anonymous + immediately published submissions, the minimum guardrails must be part of the implementation plan.

Required v1 protections:

1. Add server-side rate limiting for meetup submission
2. Rate limit by IP address or a stable request fingerprint at the application layer
3. Start with a conservative limit such as `5 submissions per 24 hours per IP`
4. Reject repeated identical payloads for a short cooldown window
5. Add `Cloudflare Turnstile` before calling the server action

Shared state requirement:

1. Store rate-limit counters and duplicate-submission cooldown data in a shared store
2. Do not rely on in-memory process state for abuse protection
3. Use a shared backend such as Upstash Redis, Vercel KV, or a small Supabase-backed table

If anti-abuse work is blocked at implementation time, the fallback should be:

1. Change the default inserted `status` to `pending`
2. Expose only `published` records publicly
3. Approve rows manually from Supabase Dashboard

## Data Model

Create a new table: `public.meetups`

Suggested columns:

1. `id bigint generated always as identity primary key`
2. `slug text not null`
3. `city text not null`
4. `title text not null`
5. `description text not null`
6. `venue_name text not null`
7. `location_label text not null`
8. `latitude double precision not null`
9. `longitude double precision not null`
10. `starts_at timestamptz not null`
11. `ends_at timestamptz`
12. `organizer_name text not null`
13. `event_url text not null`
14. `contact_email text`
15. `status text not null default 'published'`
16. `created_at timestamptz not null default timezone('utc', now())`
17. `updated_at timestamptz not null default timezone('utc', now())`

Recommended constraints:

1. `city` must match the current supported city set
2. `status` must be one of `published`, `cancelled`, `hidden`
3. `latitude` and `longitude` must be valid coordinates
4. `title`, `venue_name`, `location_label`, `organizer_name`, and `description` should have length checks
5. `event_url` and `contact_email` should have basic length validation
6. `ends_at` must be greater than `starts_at` when present
7. Server-side validation should reject clearly stale submissions such as `starts_at` far in the past when `ends_at` is null

Recommended indexes:

1. `(city, status, starts_at)`
2. `(city, slug)` unique

Index note:

1. Add additional indexes only after checking the actual meetup queries with `EXPLAIN`
2. Do not keep a redundant `(city, starts_at)` index if `(city, status, starts_at)` already covers the access pattern

Trigger plan:

1. Reuse `public.set_updated_at()`
2. Add a `before update` trigger for `public.meetups`
3. Keep `updated_at` fully database-managed, matching the existing tables

## Security And Access

RLS policy plan:

1. Public `select` is allowed only for rows where `status = 'published'`
2. Public `insert`, `update`, and `delete` are not allowed
3. Writes happen only through the server-side `submitMeetup` action using a privileged server client

This keeps the launch simple, ensures Turnstile and rate limiting cannot be bypassed through direct public inserts, and still allows the app to hide or cancel events later from the dashboard.

## Submission Flow

Add a new server action: `submitMeetup`

Expected payload:

1. `city`
2. `title`
3. `description`
4. `venueName`
5. `locationLabel`
6. `startsAt`
7. `endsAt`
8. `organizerName`
9. `eventUrl`
10. `contactEmail`

Submission flow:

1. Validate the payload on the server
2. Verify the bot-protection token before continuing
3. Enforce rate limiting before continuing
4. Build the geocoding query from `venueName + locationLabel + city`
5. Call the Google Maps Geocoding API using that geocoding query
6. If geocoding succeeds, save the meetup with computed coordinates through the server-side privileged client
7. If geocoding fails, do not insert the row and return a user-facing error
8. Generate `slug` on the server from title + city + date, with collision handling

For v1, geocoding should run inside the application server path used by the server action. That is simpler and more predictable than using a DB trigger or async database-side HTTP call.

Database-side HTTP triggers may be revisited later, but they are not part of the initial implementation.

Operational note:

1. Keep the Google API key server-only
2. Set usage limits and API restrictions at the provider level before launch

## Upcoming Filter Definition

For meetup mode, `upcoming` should be defined precisely so both the query and UI stay consistent.

Use this rule:

1. Show rows where `status = 'published'`
2. Show rows where `ends_at >= now()` when `ends_at` is present
3. Otherwise show rows where `starts_at >= now() - interval '2 hours'`

This keeps currently running events visible for a short grace period even when `ends_at` is missing.

Default ordering:

1. Primary sort: `starts_at asc`
2. Secondary sort: `title asc`

## Timezone Handling

Meetup storage stays in `timestamptz`, but the UI should render times in the meetup city's local timezone.

Implementation rule:

1. Add `timezone` to `CityMapConfig`
2. Format meetup timestamps using that city timezone everywhere in the UI
3. Do not format meetup dates in the viewer's browser timezone

Suggested mapping:

1. `sf` -> `America/Los_Angeles`
2. `toronto` -> `America/Toronto`
3. `ny` -> `America/New_York`
4. `london` -> `Europe/London`
5. `vancouver` -> `America/Vancouver`
6. `tokyo` -> `Asia/Tokyo`

## App Integration

Update the city pages so they fetch both `companies` and `meetups` for the selected city, then pass both datasets into `CityMap`.

To avoid repeating the same data-fetch changes across the root SF page plus the six city pages, create a shared server helper for city page data loading and reuse it from each route.

Add a new mode type:

1. `startups`
2. `meetups`

URL shape:

1. `?mode=startups|meetups`
2. `?c=<company-slug>` for startup selection
3. `?m=<meetup-slug>` for meetup selection

Behavior:

1. Startup mode keeps the current company search and category filter behavior
2. Meetup mode replaces that with meetup-specific search and time-ordered results
3. Selected detail content changes based on the current mode
4. Initial map framing should still show the city-wide dataset rather than jumping to one item on first load

Initial map framing priority:

1. On first page load, keep the current city-wide framing behavior
2. Do not immediately zoom to a single meetup on first load
3. After the active dataset has been loaded, fit the map to the visible active dataset only if that still preserves a city-level overview
4. Selection-driven fly-to behavior should happen only after the initial framing phase

## State Management Plan

`components/city-map.tsx` is the main state hub and should remain the place where mode, selection, filtering, and URL synchronization are coordinated.

Required changes:

1. Add `mode` state derived from `?mode=`
2. Add meetup selection state derived from `?m=`
3. Keep startup selection derived from `?c=`
4. Update URL sync helpers so switching mode removes stale selection params from the inactive mode
5. Default to `startups` when `?mode` is missing or invalid
6. Reset the search string when the user switches between `startups` and `meetups`
7. Keep search state shared at the top level, but apply different filtering logic depending on mode
8. Build separate derived collections for `filteredCompanies`, `filteredMeetups`, `mapCompanies`, and `mapMeetups`

City-to-city navigation rule:

1. Preserve the current `mode` when switching cities from the map controls
2. Drop stale `c` and `m` params during city navigation
3. Let each destination city resolve its own default selected item for the active mode

## UI Changes

### Discovery Panel

Add a flat mode switch near the top of the existing sidebar:

1. `Startups`
2. `Meetups`

Meetup mode should:

1. Show upcoming meetups sorted by `starts_at`
2. Use meetup-specific list cards instead of company cards
3. Remove the startup category filter

Implementation direction:

1. Keep `DiscoveryPanel` as the outer shared shell
2. Introduce mode-aware props instead of creating a second top-level sidebar component
3. Split the list item rendering into focused subcomponents such as `CompanyListSection` and `MeetupListSection`
4. Add a dedicated `MeetupCard` rather than overloading `CompanyCard`

This keeps the sidebar layout consistent while avoiding a large union-typed monolith inside one list card component.

Meetup empty state must be explicit:

1. If the selected city has no upcoming meetups, show an empty state in the sidebar
2. The empty state should invite the user to submit the first meetup for that city
3. The map should stay centered on the city rather than collapsing to a single point

### Selected Panel

Reuse the existing center panel structure.

Meetup detail content should include:

1. Title
2. Date and time
3. Venue
4. Organizer
5. Description
6. RSVP / event link

Implementation direction:

1. Keep the selected-panel column as a shared layout slot
2. Add a dedicated `SelectedMeetupPanel` component
3. Let `CityMap` switch between `SelectedCompanyPanel` and `SelectedMeetupPanel` by mode
4. Do not overload `SelectedCompanyPanel` with meetup-specific unions

### Map Markers

Add a separate meetup marker renderer in `components/map-shell.tsx`.

Design direction:

1. Wooden signboard silhouette
2. Strong outline and pixel-like chunkiness
3. Clear selected state
4. Distinct from startup robot markers

The marker should feel like a village notice board within the existing Dragon Quest-like world.

Implementation direction:

1. Extend `MapShell` to support both startup items and meetup items
2. Do not keep startup and meetup markers mounted at the same time
3. Pass the currently active dataset into the marker rendering loop
4. Add a dedicated meetup marker sprite builder instead of trying to restyle the company sprite

### Submission Panel

Add a meetup submission panel that appears from the map area, similar in structure to the current company request panel.

In v1:

1. Show `Add company` in startup mode
2. Show `Add meetup` in meetup mode

Required fields should include:

1. Title
2. Description
3. Date and time
4. Venue name
5. Address
6. Organizer
7. Event link

## Fetching Strategy

There are currently multiple city `page.tsx` files with repeated query structure.

Implementation direction:

1. Create a shared city page data loader in `lib` or `app` server utilities
2. Keep `companies` in server page data loading with the admin client
3. Fetch `meetups` client-side through the public
   `published_upcoming_meetups` view with TanStack Query
4. Continue using `.match({ city: ... })` for Supabase filters

See `docs/MEETUP_CLIENT_FETCH_PLAN.md` for the current meetup client-fetch
implementation plan and security boundary.

## Types And Helpers

Add shared meetup types and mapping helpers similar to the company flow.

Suggested additions:

1. `Meetup`
2. `MeetupStatus`
3. `DiscoveryMode`
4. Row-to-model mapper for `meetups`
5. `City timezone` support on `CityMapConfig`

`types/supabase.ts` should be regenerated after the migration is added.

## Testing

### Database

1. Migration creates the table, constraints, indexes, trigger, and RLS policies correctly
2. Published rows are readable by public clients
3. Direct public inserts are rejected by RLS
4. Public updates and deletes are blocked
5. Server-side privileged inserts succeed through `submitMeetup`

### Server Action

1. Valid meetup submission inserts successfully
2. Invalid dates, invalid URL, and invalid lengths are rejected
3. Geocoder failure returns an error and does not insert
4. Slug collisions are handled safely
5. Rate-limited requests are rejected
6. Bot-verification failures are rejected

### UI

1. Mode switching updates the list, map markers, and selected panel together
2. `?mode=meetups&m=...` restores meetup selection on load
3. Only upcoming meetups are shown in meetup mode
4. The page does not scroll; only internal panels scroll
5. Cities with zero upcoming meetups show a clear empty state and submit CTA
6. Meetup times render in the city-local timezone

### Map

1. Meetup markers render as signboards
2. Selected meetup marker is visually distinct
3. Meetup mode only refits to the meetup dataset after the initial city-level framing phase
4. Startup markers do not remain visible in meetup mode

## Assumptions

1. v1 does not include meetup editing
2. v1 does not include meetup deletion by end users
3. v1 does not include moderation UI
4. Status changes such as `cancelled` and `hidden` are managed through Supabase Dashboard for now
5. `app/globals.css` should remain untouched unless the scope changes explicitly
6. If Google geocoding cost or key setup becomes a blocker, the immediate fallback is not a DB trigger; it is switching the publish flow to `pending`
7. A city-bounds sanity check for geocoding results is a good v2 hardening step, but not required for v1 launch
