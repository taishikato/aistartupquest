# Design spike: automated event sync and the second guild

Status: spike deliverable for plan 009. Read-only research; no production code
changed. Every claim about existing code below cites `file:line` against
commit `ab0a47e` (this worktree's baseline, confirmed unchanged by the drift
check before writing this doc).

## 1. Sync architecture decision

Three options, compared on where secrets live, failure visibility, cost, and
how `pnpm genType` / migrations interact:

### (a) Supabase scheduled Edge Function

- **Secrets**: Supabase Vault / project secrets, separate from the app's
  `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` env vars, but the
  function itself runs inside the same project so it can use the service role
  key directly without transiting the network.
- **Failure visibility**: Supabase function logs + `get_logs` (available via
  the Supabase MCP tool used in this session), but no existing alerting path;
  someone has to check the dashboard.
- **Cost**: Edge Functions and `pg_cron` scheduling are on the Supabase free
  tier for low-frequency jobs; no new billing surface expected at this scale.
- **`genType` / migration interaction**: none directly - Edge Functions read
  the same tables the app already reads/writes; a new guild only needs the
  `MeetupSource` migration described in section 2, run once from a normal
  migration workflow.
- **Real cost**: today `supabase/` only contains `migrations/` - there is no
  `supabase/functions/` directory in this repo (confirmed: `find supabase
  -maxdepth 2 -type d` returns only `supabase/migrations`). `fetch-cursor-events.ts`
  (`scripts/fetch-cursor-events.ts:1-42`) and `import-cursor-events.ts`
  (`scripts/import-cursor-events.ts:1-73`) are plain Node/tsx scripts using
  `node:fs`, `node:path`, and `fetch`; Edge Functions run on Deno, so shipping
  this option means porting (not just copy-pasting) both scripts to the Deno
  runtime and wiring a brand-new deploy path - non-trivial first-time setup
  cost for infra that doesn't exist yet.

### (b) GitHub Actions cron running the existing tsx scripts

- **Secrets**: GitHub Actions encrypted repo secrets
  (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`); the same class of
  secret the app already needs, just in a different vault.
- **Failure visibility**: a failed Actions run shows up in the repo's Actions
  tab exactly like `.github/workflows/ci.yml:1-24` does today (which already
  runs `pnpm lint`, `pnpm typecheck`, `pnpm test` on every push/PR); GitHub
  can also email/notify on workflow failure with zero extra setup, and this
  is a pattern already proven in this repo.
- **Cost**: free on GitHub Free/Team minutes for a daily or twice-daily job
  (a fetch + import run takes seconds, not the multi-minute CI job budget).
- **`genType` / migration interaction**: zero - the workflow calls
  `pnpm fetch:cursor` then `pnpm import:cursor` exactly as documented in
  `package.json` (`"fetch:cursor": "pnpm dlx tsx scripts/fetch-cursor-events.ts"`,
  `"import:cursor": "pnpm dlx tsx scripts/import-cursor-events.ts"`), no code
  changes needed to run this today.
- **Real cost**: none of substance - the scripts already run standalone via
  `tsx` and don't depend on the Next.js runtime.

### (c) Vercel cron hitting a Next.js route handler

- **Secrets**: Vercel project env vars (same names, different vault again).
- **Failure visibility**: Vercel's cron logs / function logs; less
  battle-tested in this repo than GitHub Actions, and cron-triggered route
  handlers don't show up in the same place as build failures.
- **Cost**: depends on the Vercel plan's cron job limits and function
  duration limits (a combined fetch + import call is small, but the code
  would have to be restructured as a request handler with a request-scoped
  timeout instead of a script that can run as long as it needs).
- **`genType` / migration interaction**: none additional, same as (b).
- **Real cost / applicability**: **there is no `vercel.json` in this repo**
  (confirmed: `ls vercel.json` -> no such file), so it is not established that
  this app is even deployed on Vercel. Building this option means both
  confirming the hosting platform and porting `scripts/fetch-cursor-events.ts`
  and `scripts/import-cursor-events.ts` logic into an `app/api/.../route.ts`
  handler, duplicating logic that already lives in reusable, testable
  functions (`lib/cursor-events.ts`, `lib/cursor-events-fetch.ts`).

### Recommendation: (b), GitHub Actions cron

It reuses the already-working, already-tested scripts unchanged, needs no new
infra (Edge Functions directory, Deno port, or confirmed Vercel hosting), and
reuses a CI pattern (`.github/workflows/ci.yml`) this repo already trusts for
visibility. Add a new workflow, e.g. `.github/workflows/sync-events.yml`, on a
`schedule:` cron trigger, running `pnpm install --frozen-lockfile` then
`pnpm fetch:cursor && pnpm import:cursor` with the two Supabase secrets injected
as `env:`.

## 2. Guild abstraction

Brand term: **guild adapter**. Code identifier: `EventSourceAdapter` (plain,
no game vocabulary in code per repo convention).

The current single-guild pipeline is, end to end:

1. **Fetch** - `scripts/fetch-cursor-events.ts:9-39` fetches
   `https://cursor.com/community` (line 6) and calls
   `parseCursorCommunityEvents` (`lib/cursor-events-fetch.ts:65-98`), which
   extracts Next.js flight-payload JSON (`extractFlightPayload`,
   `lib/cursor-events-fetch.ts:4-16`) and picks out Luma-platform event
   objects (`readJsonObject`, `lib/cursor-events-fetch.ts:19-45`), writing
   `CursorEventInput[]` (`lib/cursor-events.ts:10-18`) to
   `scripts/data/cursor-events.json`.
2. **Normalize** - the fetch step already outputs the `CursorEventInput`
   shape (`{ id, title, city, date, url, organizer?, description? }`).
3. **Validate** - `validateCursorEvent` (`lib/cursor-events.ts:43-68`) checks
   required fields, date format, and an `https://` URL.
4. **Map + build row** - `mapCursorCity` (`lib/cursor-events.ts:33-35`) maps
   the source's free-text city name through `CITY_ALIASES`
   (`lib/cursor-events.ts:20-31`) to a `CityId`; `buildCursorMeetupRow`
   (`lib/cursor-events.ts:89-131`) turns a validated event into a
   `CursorMeetupRow` (`lib/cursor-events.ts:70-87`), hard-coding
   `source: "cursor"` (line 83, 126) and `location_precision: "city"`
   (line 84, 127).
5. **Upsert** - `scripts/import-cursor-events.ts:53-61` upserts rows with
   `onConflict: "source,source_event_id"`, matching the unique index added in
   `supabase/migrations/20260704120000_add_meetup_source_and_location_precision.sql:12-13`.

The minimal interface a new guild must implement, in plain code terms:

```ts
type EventSourceAdapter = {
  source: MeetupSource // new union member, see below
  fetchRaw(): Promise<unknown> // hits the guild's own source
  normalize(raw: unknown): GuildEventInput[] // -> { id, title, city, date, url, organizer?, description? }
}
```

`GuildEventInput` is exactly today's `CursorEventInput`
(`lib/cursor-events.ts:10-18`) renamed and generalized; `validateCursorEvent`
and `buildCursorMeetupRow` should become `validateGuildEvent` and
`buildGuildMeetupRow(event, city, source)` (parameterized by `source` instead
of hard-coding `"cursor"`) so a second guild does not require copy-pasting
`lib/cursor-events.ts` into a near-duplicate file. `mapCursorCity` /
`CITY_ALIASES` stay per-guild, since each source has its own free-text city
vocabulary.

**How `MeetupSource` grows**: two places, both required, in this order:

1. Code: add the new member to the union at `lib/meetup.ts:8`
   (`export type MeetupSource = "community" | "cursor"`).
2. Database: `source` is constrained by `meetups_source_check` in
   `supabase/migrations/20260704120000_add_meetup_source_and_location_precision.sql:7-8`
   (`check (source in ('community', 'cursor'))`). Postgres `check`
   constraints can't be widened in place - a new migration must `drop
   constraint meetups_source_check` and re-`add constraint` with the new
   value included, then `pnpm genType` must be re-run and the regenerated
   `types/supabase.ts` committed, per this repo's standing rule.

The `(source, source_event_id)` unique index
(`...20260704120000...sql:12-13`) already namespaces IDs per source, so two
guilds reusing the same numeric/slug ID scheme from different platforms
cannot collide - no change needed there.

## 3. Second guild candidate

Three candidates researched (web search + a throwaway `curl` check, both
discarded, not committed):

### Candidate A - "AI Hustle: Events for SF AI founders" (`lu.ma/AIHUSTLE`)

- **Fetchable public source**: Luma's own **iCal subscription** feature.
  Per Luma's help documentation (`https://help.luma.com/p/ical-syncing`,
  fetched during this spike): any calendar page has an "Add iCal
  Subscription" action; "This feed includes all published events on that
  calendar," and the feed is explicitly designed to be fetched periodically
  by external software (a calendar app), not a one-time export. This is a
  documented, sanctioned integration point, distinct from Luma's API, which
  is where the scraping ban lives (see licensing note below).
- **Fields -> schema mapping**: an ICS `VEVENT` has `SUMMARY` (-> `title`),
  `DTSTART`/`DTEND` (-> `date`, after timezone conversion analogous to
  `localDateForTimezone`, `lib/cursor-events-fetch.ts:47-54`), `URL` (->
  `url`), `UID` (-> `id`), and optionally `DESCRIPTION` (-> `description`).
  Because this is a single-city calendar, `city` does not need to be parsed
  out of the payload the way `parseCursorCommunityEvents` does today
  (`lib/cursor-events-fetch.ts:92`); it can be hard-coded to `"sf"` in the
  adapter, the same way a single-source adapter's `normalize()` can bake in
  constants.
- **Licensing/ToS**: Luma's **API Terms of Use** (`lumalabs.ai/legal/api-terms-of-use`,
  fetched during this spike) explicitly prohibit "access[ing] the APIs
  through any automated means, scripts, bots, scrapers, or other tools other
  than those expressly authorized by Luma's Documentation and through Luma's
  documented API methods and endpoints," and separately prohibit scraping
  "beyond the Output generated in direct response to authorized API
  requests." Those terms are scoped to API access (`public-api.luma.com`),
  which requires a paid Luma Plus subscription and is not what this
  candidate uses. The iCal subscription is a *different*, unauthenticated,
  explicitly documented feature aimed at exactly this use case (automated
  periodic fetch). This is a reasonable, defensible reading, but not a
  certainty - flagged as an open question in section 7 for anyone who wants
  a harder legal opinion before shipping it.

### Candidate B - AI Tinkerers (multi-city AI builder community)

Excellent brand/content fit - 245-city global network with chapters in
several of this product's six supported cities (SF, Toronto, Tokyo confirmed
via web search during this spike; NY/London/Vancouver presence likely but not
individually confirmed). Rejected as the primary pick because:

- Their own chapter sites (e.g. `sf.aitinkerers.org`) are behind a Cloudflare
  **Managed Challenge**: a `curl` fetch during this spike returned only a
  "Just a moment..." challenge page (no event data), confirming a plain
  server-side `fetch()` - the same technique `scripts/fetch-cursor-events.ts`
  uses - would not work against these pages.
  (Discarded temp file; not committed.)
- Their Luma presence is inconsistent across chapters: some chapters' events
  appear as one entry inside a broader, multi-organizer city calendar (e.g.
  "Voice AI | AI Tinkerers Waterloo" is one event on the general-purpose
  "Waterloo - Events Calendar," not a dedicated AI-Tinkerers-only feed),
  which would require per-event filtering/curation logic well beyond
  `parseCursorCommunityEvents`'s single-source assumption, and no single
  clean per-chapter Luma calendar was found to subscribe to via iCal in the
  time available for this spike.

Kept as a follow-up research candidate (see section 6), not the recommendation.

### Candidate C - Meetup.com GraphQL API (city AI/ML groups)

Officially sanctioned and well documented (`meetup.com/graphql/`), but
registering an OAuth consumer requires an **active Meetup Pro subscription**
(confirmed via `help.meetup.com`: "Only members with an active Meetup Pro
subscription will be able to create new OAuth consumers"), which is a real
recurring cost and an approval gate ("having a Pro subscription does not
guarantee approval"). Rejected for this spike as higher-cost/higher-friction
than a free candidate; worth reconsidering if the product later needs a
guild with events this product doesn't already have another path to.

(Eventbrite was also checked and rejected outright: its Terms of Service
have an explicit "Scraping...is Prohibited" clause, and Eventbrite shut down
its public Event Search API in 2019 - the sanctioned API can only fetch
events by an already-known event/venue/organization ID, not discover new
ones, which defeats the point of automated sync.)

### Recommendation: Candidate A, "AI Hustle" via Luma iCal subscription

It is free, unauthenticated, uses a feature Luma explicitly built for
automated periodic fetching, maps cleanly onto the existing
`CursorEventInput`-shaped pipeline with no new city-parsing logic, and is
narrowly scoped to San Francisco - one of this product's six supported
cities - so it validates the multi-guild pattern without also solving the
harder "which of 245 cities matter" problem that Candidate B would raise.

## 4. Staleness handling

`buildCursorMeetupRow` computes and stores `payload_hash`
(`lib/cursor-events.ts:99-111`, assigned at line 129) on every row, but a
repo-wide search during this spike found no code that ever reads that column
back for comparison - it is currently write-only. `scripts/import-cursor-events.ts:53-61`
only **upserts** rows present in the current input file; it never looks at
what is already in the table. If an event disappears from the source (the
organizer cancels it, deletes it, or the source's page structure changes and
`fetch-cursor-events.ts` silently stops surfacing it), its row keeps
`status: "published"` (the default from `buildCursorMeetupRow:125`) forever
and keeps appearing in `published_upcoming_meetups`
(`supabase/migrations/20260704120000_add_meetup_source_and_location_precision.sql:15-44`)
since that view only filters on `status = 'published'` and `event_date`, not
on freshness.

**Proposed rule**: on each guild's sync run, after computing the fresh set of
`source_event_id`s for that `source`, also `SELECT slug, source_event_id FROM
meetups WHERE source = :source AND status = 'published' AND event_date >=
today`, diff against the fresh set, and `UPDATE ... SET status = 'cancelled'`
for any row whose `source_event_id` is missing from the fresh fetch. This
reuses the existing `status` enum (`meetups_status_check`,
`supabase/migrations/20260407120000_create_meetups.sql:26-28`, already
includes `'cancelled'`) - a soft-delete, not a hard delete, preserving an
audit trail and matching how `status` is already used elsewhere in this
schema. `payload_hash` remains useful as an orthogonal, cheaper "did the
content of this still-present event change" check (to decide whether an
upsert needs to touch `updated_at`), but does not by itself solve the
disappearance case, since a payload hash for a *missing* row is never
computed.

## 5. The top-page dataset question

`components/home-events-map.tsx:8` imports `lib/data/cursor-community-events.json`
directly and `getUpcomingCities()` (`components/home-events-map.tsx:49-75`)
filters/sorts purely from that static JSON - it never queries Supabase.
`app/page.tsx:3,12` mounts `HomeEventsMap` as the entire `/` route, and
`app/events/page.tsx:1-4` permanently redirects `/events` to `/`, so this is
one product surface, not two, with two disconnected data pipelines behind it.

Evidence the two pipelines have already diverged:

- The static JSON's `cities` array carries `lat`/`lon` **and** `artLon`/`artLat`
  per city (`lib/data/cursor-community-events.json:4-11`, covering ~245
  cities like Lusaka, Kigali, Dublin - far beyond this product's six
  supported cities), while the DB-backed pipeline only has six cities, each
  hard-constrained by `meetups_city_check`
  (`supabase/migrations/20260407120000_create_meetups.sql:23-25`, `city in
  ('sf', 'toronto', 'ny', 'london', 'vancouver', 'tokyo')`) and a matching
  fixed `CITY_MAP_CENTERS` (`lib/city-config.ts:24-31`).
- Every event in the static JSON carries a `company` field
  (`components/home-events-map.tsx:34`, rendered with a Cursor icon at
  `components/home-events-map.tsx:699-709`) that neither `CursorEventInput`
  (`lib/cursor-events.ts:10-18`) nor `parseCursorCommunityEvents`
  (`lib/cursor-events-fetch.ts:65-98`, which only ever emits
  `{ id, title, city, date, url }`, confirmed by the returned object shape at
  lines 89-95) can produce - so the automated fetch pipeline literally cannot
  regenerate this file today, confirming the plan's premise that this
  dataset is separately hand-maintained.

Two real options:

- **(A) Keep it static.** Simplest short-term, but perpetuates exactly the
  silent-staleness failure mode this whole spike exists to address, and
  doubles onboarding cost for every future guild: a new guild needs both a
  `meetups` row (for whichever of the six city maps it applies to) *and* a
  hand-edited JSON entry (for the world view), with no shared source of
  truth and no automated check that the two stay consistent.
- **(B) Query Supabase for the world view too.** Closes the gap, but is a
  real schema/UI change, out of this spike's scope: `meetups_city_check`
  would need to either become a free-text city column plus a separate
  city-metadata table (breaking the tight `CityId` union used throughout
  `lib/city-config.ts`), or the world view would need a parallel,
  unconstrained query path that coexists with the six-city-constrained one.
  The `company` display field would also need to be dropped or derived from
  `source` (e.g. `source === "cursor"` implies the Cursor icon) rather than
  stored per-event.

This spike does not implement either option. Recommendation: treat (B) as
the target once a second guild adapter proves the multi-source write path
works end to end (this spike's Candidate A), then decide in a dedicated
follow-up plan how much of the 245-city breadth to keep vs. collapse to the
six supported cities - see the open question in section 7.

## 6. Implementation estimate

| Piece | Size | Notes |
| --- | --- | --- |
| GitHub Actions cron for `fetch:cursor` + `import:cursor` | S | No code changes; new workflow file + two repo secrets. |
| Guild adapter refactor (`EventSourceAdapter`, generalize `lib/cursor-events.ts`) | M | Rename/parameterize `validateCursorEvent` -> `validateGuildEvent`, `buildCursorMeetupRow` -> `buildGuildMeetupRow(event, city, source)`; update existing tests. |
| Second guild adapter (AI Hustle, Luma iCal) | M | ICS parsing, single-city normalize, new migration for `MeetupSource` + `meetups_source_check`, `pnpm genType`, new tests mirroring `tests/cursor-events.test.ts` / `tests/cursor-events-fetch.test.ts`. |
| Staleness reconciliation (diff-and-cancel) | M | New SELECT-before-upsert step in the shared import path; tests for the diff logic. |
| Top-page dataset unification (section 5, option B) | L | Schema change, `CityId`/`meetups_city_check` redesign or parallel path, UI changes to drop/derive `company`. Blocked on a maintainer product decision (how much global breadth to keep). |

Follow-up plans this spike recommends writing, in dependency order:

1. **GitHub Actions cron for event sync** (S) - ships automation with zero
   application code changes.
2. **Guild adapter interface + refactor cursor source** (M) - prerequisite
   for any second guild without duplicating `lib/cursor-events.ts`.
3. **Second guild: AI Hustle Luma calendar adapter** (M) - first real use of
   the adapter interface; proves the multi-source write path.
4. **Meetup staleness reconciliation** (M) - can land independently of 2/3,
   but is more valuable once there are two guilds whose events can silently
   disappear.
5. **Unify top-page world events with Supabase `meetups`** (L) - blocked on
   the maintainer's answer to the open question in section 7 about
   world-map breadth; do not start until that's decided.

## 7. Open questions for the maintainer

- **Which second guild is the actual product choice?** Candidate A (AI
  Hustle) is the technically cleanest, lowest-risk pick from this spike, but
  Candidate B (AI Tinkerers) is arguably the better brand/content fit
  despite its fetch-reliability problems - this is a product judgment call,
  not something groundable in the repo alone.
- **Cross-source duplicate handling**: if a guild's imported event and a
  community-submitted meetup describe the same real-world event (same
  city/date/venue), should one suppress the other, or is showing both
  acceptable? No dedup logic exists across sources today (the unique index
  is scoped to `(source, source_event_id)`, not to venue/date/title).
- **Retention of cancelled events**: after the staleness rule in section 4
  marks a row `status = 'cancelled'`, should it be deleted after some
  retention window, or kept indefinitely?
- **World-map breadth**: if the top-page dataset moves to Supabase (section
  5, option B), should it collapse to the six supported cities, or keep the
  current ~245-city global breadth? This changes the size of the schema
  change substantially.
- **Immediate publish vs. moderation**: this doc assumes guild imports
  continue publishing immediately, matching current `cursor` behavior
  (`buildCursorMeetupRow` hard-codes `status: "published"`,
  `lib/cursor-events.ts:125`). Per this plan's maintenance note, revisit
  after plan 010 (moderation) - a moderation queue changes whether a second
  guild's imports can publish immediately at all.
- **Secrets provisioning**: who sets up the GitHub Actions repo secrets
  (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) for the
  recommended cron workflow? This requires repo admin access this spike
  does not have.
- **Legal certainty on the Luma iCal reading**: section 3's reasoning that
  the iCal subscription feed is outside the scope of Luma's API scraping ban
  is this spike's best-effort reading of Luma's published terms, not a legal
  opinion. Flagging for anyone who wants to confirm before shipping
  Candidate A.
