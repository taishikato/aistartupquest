# Design spike: submission lifecycle (moderation, edit, withdrawal)

Status: spike / not yet approved for implementation.
Written against commit `13a807b` (HEAD of this worktree), reconciled to plan 010's baseline `ab0a47e`.
Drift check `git diff --stat ab0a47e..HEAD -- app/actions supabase/migrations lib/meetup.ts` is empty, so the "Current state" citations below match the live code.

## Why this exists

Both public submission flows are one-way streets today.
Meetups publish instantly and cannot be corrected or withdrawn by the submitter.
Company requests land in a queue that nothing reads or promotes.
This document evaluates the smallest lifecycle that closes both gaps without adding user accounts, and recommends one option per decision rather than presenting a menu.

## Current state (evidence)

- `app/actions/meetup-submit.ts:335-336` inserts every meetup with `status: "published"` immediately; there is no draft or pending state for meetups.
- `app/actions/meetup-submit.ts:24` and `:335` show the X handle is collected as `xAccount` and stored into the `contact_email` column (`contact_email: xAccount || null`), not a real email.
- `lib/meetup.ts:96` (`meetupFromPublicRow`) hard-codes `contactEmail: null` on every public read, so nothing today ever surfaces that value back to a browser.
- `lib/meetup.ts:4` already types `MeetupStatus` as `"published" | "cancelled" | "hidden"`.
- `supabase/migrations/20260407120000_create_meetups.sql:26-28` matches that with a DB check constraint (`status in ('published', 'cancelled', 'hidden')`), so withdrawal has a home already: no schema change needed, only new code that sets `status: "cancelled"`.
- `supabase/migrations/20260704120000_add_meetup_source_and_location_precision.sql:15-44` is the current `published_upcoming_meetups` view: it filters `status = 'published'` and `event_date >= (city-local today)`. Flipping to `cancelled` or `hidden` removes a meetup from public view with no delete required.
- `app/actions/company-request.ts:229-239` inserts into `company_submission_requests` with an implicit `status: 'pending'` (column default, per `supabase/migrations/20260330162000_create_company_submission_requests.sql:8`). Nothing in the repo reads that table or writes to `companies` from it — confirmed by searching `app/`, `components/`, and `lib/` for `admin|moderat|approve|reject`, which only matches the submission actions themselves and `lib/supabase/admin.ts` (the service-role client helper, not a moderation surface).
- `types/supabase.ts:95-142` (`company_submission_requests` Row) has: `category`, `city`, `company_name`, `contact_email`, `created_at`, `founded`, `id`, `location_label`, `notes`, `short_description`, `status`, `updated_at`, `website`. It has no `latitude`/`longitude` and no `slug`.
- `types/supabase.ts:17-73` (`companies` Row) needs: `category`, `city`, `founded`, `latitude`, `longitude`, `location_label`, `logo_url` (nullable), `map_sprite` (defaults `'default'`), `name`, `short_description`, `slug` (unique), `source_url` (**not null, no default** — `supabase/migrations/20260330112000_create_companies.sql:24`), `website`.
- There is no root `middleware.ts` and `lib/supabase/` only contains `admin.ts`, `client.ts`, `server.ts` (verified by directory listing) — no session/auth helper exists anywhere in the app. Plan 004 removed the last remnant (`lib/supabase/middleware.ts`).
- `scripts/import-cursor-events.ts` + `scripts/fetch-cursor-events.ts` is the existing CLI-script pattern: a Node script instantiates `createClient<Database>(url, serviceRoleKey)` directly (not through `createAdminClient`, but the same credential) and `upsert`s rows with `onConflict: "source,source_event_id"`. It runs from a developer's or CI's machine, not from the deployed app, and needs no new schema or admin route. This is a viable template for both the review-flow CLI option and the pre-existing "guild sync bypasses review" behavior it already exercises for cursor-sourced meetups.
- Product rule (`AGENTS.md`): "Meetup submissions use the `submitMeetup` server action and are published immediately." This is a decided rule, not an oversight — any change to it must be flagged explicitly, not slipped in as a side effect of adding edit/withdraw support.
- Product rule (`AGENTS.md`): the meetup form stays short (city, title, optional description, date only, address, link, optional X account) and the game metaphor stays atmosphere-only in UI copy. Any moderation or self-service UI copy must stay plain and product-like per the same rule.

### A gap the audit surfaced (not fixed here)

`supabase/migrations/20260330162000_create_company_submission_requests.sql:11-13` constrains the `city` column to `city in ('sf', 'toronto')` at the database level, and no later migration widens it (confirmed by searching all of `supabase/migrations/` for `city_check`; the only other hit for this table is the same create-table constraint).
`app/actions/company-request.ts:32-39`'s `VALID_CITIES` set already allows all six cities.
If a company request from `ny`, `london`, `vancouver`, or `tokyo` is ever submitted, the insert should fail on the CHECK constraint rather than the app-level validation, because the constraint was never widened alongside the companies table's own `companies_city_check` (which was widened four times: `20260330154940`, `20260331110000`, `20260331120000`, `20260406143000`).
This is orthogonal to the lifecycle design but blocks the review flow for non-SF/Toronto cities today, so it is called out as an open question at the end of this document rather than silently working around it.

## 1. Submitter self-service without accounts

Three options, evaluated against the constraint that there is no auth anywhere in the app (see Current state).

**(a) Signed edit-link token (capability URL).**
On successful submission, compute an HMAC over `slug + secret` (same `node:crypto` dependency already used for `hashMeetupPayload` in `lib/meetup-submit.ts:13-26`, no new package) and show/return an edit URL like `/meetups/<slug>/edit?token=<hmac>` once, on the success screen.
The server action verifies the token before allowing any mutation.
No email required, works for the X-account-only submitter, and needs no new column beyond optionally persisting the token (or keeping it stateless and re-derivable from `slug + secret + a version nonce` so it can be invalidated).
Abuse angle: whoever holds the URL can edit or cancel the meetup, forever, with no expiry unless one is designed in.
Mitigate with (1) a short expiry window (e.g. 30 days, matching how long a meetup submission is useful), (2) rate limiting edits the same way submissions are rate limited today (reuse the `*_submission_attempts` table pattern), and (3) treating leaked tokens as low-severity, because the blast radius is "one meetup can be vandalized," not account takeover.

**(b) Email verification code using `contact_email`.**
The `contact_email` column already exists on `meetups`, but today it is only ever populated with an X handle, never a real email (`meetup-submit.ts:335`, `lib/meetup.ts:96`).
Reusing it as a verification channel would require: adding a real "your email" field to the submission form (contradicts the "form stays short" rule in `AGENTS.md` unless it replaces the X-account field, which serves a different purpose), sending email (no email provider is wired into this codebase today — greenfield infra work), and a code-entry UI.
This is strictly more effort and more product-rule friction than (a) for the same outcome.

**(c) No self-service, report-a-problem mailto only.**
Zero code.
Every correction becomes maintainer toil via Supabase Studio, which is the status quo this spike exists to improve.
Rejected as a permanent answer, but it is the correct interim state while (a) is built, and remains the fallback if (a) is deprioritized.

**Recommendation: (a), signed edit-link token.**
It needs no new external service, no new required form field, and reuses a hashing pattern the codebase already has.
The abuse surface (URL leakage) is bounded and matches the low stakes of a meetup listing.

## 2. Meetup lifecycle rules

- **Editable fields**: title, description, venue name, address (`locationLabel`), event date, organizer name, event URL, X account — i.e. every field the submitter originally controls.
  City is deliberately **not** editable after publish; treat a city change as "withdraw and resubmit," because city selects the map viewport and timezone (`CITY_TIMEZONES` in `lib/city-config.ts`) and changing it is closer to creating a new listing than editing one.
- **Re-geocoding**: any edit to venue name or address must re-run `geocodeWithGoogle` (`meetup-submit.ts:111-133`) exactly as the initial submission does, because the pin's `latitude`/`longitude` are derived from those two fields via `buildMeetupGeocodeQuery` (`lib/meetup-submit.ts:5-11`).
  An edit that only touches title/description/date/organizer/URL/X-account should skip geocoding.
- **Cooldown re-entry**: edits should NOT re-enter the 24-hour rate limit or 15-minute duplicate cooldown that gates new submissions (`RATE_WINDOW_MS`, `RATE_MAX`, `DUPLICATE_WINDOW_MS` in `meetup-submit.ts:40-42`) — that limiter exists to slow down spam creation of new rows, and an edit-token holder has already proven ownership of an existing row.
  Instead, apply a much cheaper limiter to edits themselves (e.g. max N edits per token per hour) purely to blunt a leaked-token griefer, reusing the same attempts-table pattern.
- **Withdrawal** maps to `status: "cancelled"` — the state already exists in the type (`lib/meetup.ts:4`) and the DB check constraint (`20260407120000_create_meetups.sql:26-28`), and the public view already excludes non-`published` rows (`20260704120000_...sql:33-34`), so no schema change and no new "delete" affordance are needed. The edit-link action sets this status instead of performing a real delete, preserving history for the maintainer.
- **Product-rule flag**: none of the above changes the "publish immediately" rule — publishing itself is untouched; this only adds a correction path after the fact. If the maintainer later wants moderation to gate the *initial* publish (queue-then-approve, like company requests), that is a distinct, larger product change and must be raised as its own decision, not bundled into this edit/withdraw feature.

## 3. Company request review flow

Three options for the approve/reject surface itself.

**(a) Supabase Studio + a documented runbook.**
Zero code.
The maintainer opens the `company_submission_requests` table in Studio, reviews a row, and either deletes it (reject) or manually inserts the corresponding row into `companies` after looking up coordinates by hand, then updates `status`.
Fully manual, error-prone for the lat/lng step, but ships today with only a markdown runbook.

**(b) A private admin page behind a shared-secret env var.**
A `/admin/company-requests` route gated by comparing a header or query param against `process.env.ADMIN_SHARED_SECRET`, listing `pending` rows with approve/reject buttons.
This is real product surface area (new route, new server actions, new env var, a first "who can mutate data" boundary in an app that has never had one) for a workflow that today has roughly the same volume as the CLI script's cursor-event batches.

**(c) A CLI script, following the `scripts/import-cursor-events.ts` pattern.**
A script reads `pending` rows via the service-role key (same credential pattern as `createAdminClient`, or a direct `createClient` like `scripts/import-cursor-events.ts:51`), geocodes each one, prints a preview, and on confirmation inserts into `companies` and flips `status` to `approved`/`rejected`.
No new route, no new auth boundary, runs from the maintainer's machine exactly like the existing cursor-event import already does.

**Recommendation: (c), CLI script.**
It mirrors a pattern already proven in this codebase (`scripts/import-cursor-events.ts`), needs no new admin auth boundary in an app that has intentionally never had one, and matches the current volume of company requests.
(a) is the correct zero-effort placeholder until (c) is written; (b) is over-scoped for current volume and should only be revisited if request volume or the need for non-technical reviewers grows.

**What "approve" does mechanically** (field mapping, enumerated from `types/supabase.ts`):

| `company_submission_requests` column | maps to `companies` column | notes |
| --- | --- | --- |
| `company_name` | `name` | direct |
| `category` | `category` | direct, same enum |
| `city` | `city` | direct (see the city-check gap noted above) |
| `location_label` | `location_label` | direct |
| `short_description` | `short_description` | direct |
| `founded` | `founded` | direct |
| `website` | `website` | direct; `companies.website` is `not null` but the request's `website` is nullable — reject or require a website before approving if null |
| — | `latitude`, `longitude` | **not present on the request row**; must be geocoded from `location_label` at approval time, the same way `meetup-submit.ts` geocodes `locationLabel` today |
| — | `slug` | **not present on the request row**; must be generated (no existing company-slug helper was found in `lib/`; `lib/meetup-submit.ts:45-57`'s `slugifyMeetupBase` is the closest template) and checked for uniqueness against `companies.slug` |
| — | `source_url` | **not present on the request row and `not null` with no default** (`20260330112000_create_companies.sql:24`); the CLI script must supply a value — the submitted `website` is the most defensible default, but this is a judgment call the maintainer should confirm |
| `contact_email` | (not stored on `companies`) | used only for the optional notification in section 4, then discarded |
| `notes` | (not stored on `companies`) | reviewer-only context, discarded after the decision |
| — | `logo_url`, `map_sprite` | both optional/defaulted on `companies`; leave unset (`logo_url` null falls back to a favicon per `lib/company.ts:85-93`, `map_sprite` defaults to `'default'`) |

Rejection is simpler: flip `status` to `'rejected'` (already a valid value per the check constraint in `20260330162000_...sql:26-28`) and leave the row in place for the audit trail; no `companies` write happens.

## 4. Notification touchpoint

Honest answer: today, nothing tells the submitter their company was approved.
`contact_email` is optional and often absent (`app/actions/company-request.ts:233`: `contact_email: contactEmail || null`), and this codebase has no email-sending integration at all — adding one (provider account, API key, template, deliverability configuration) is infrastructure work disproportionate to a "did my request get approved" notice.
The pragmatic default for the first version of the review flow is **no notification**: the submitter can check whether their company appears on the map, and the CLI script's terminal output is the maintainer's own record.
If a notification is wanted later, the cheapest version is a courtesy email sent only when `contact_email` is present, using whatever transactional-email provider the maintainer already has for other purposes; that is a separate follow-up, not part of this spike's recommended scope.

## 5. Implementation estimate

Sizing follows the plan-file convention (S/M/L), assuming each row becomes its own implementation plan.

| Piece | Size | Notes |
| --- | --- | --- |
| Meetup edit-link tokens (generate + verify) | S | one HMAC helper, reused hashing pattern |
| Meetup edit form + server action (reuses submit-form validation) | M | new route/page, new server action, selective re-geocoding logic |
| Meetup withdrawal (`status: "cancelled"`) via the same token | S | one server action, no schema change |
| Edit-rate limiting (new attempts table or reuse pattern) | S | mirrors existing `*_submission_attempts` tables |
| Company request CLI script (list, geocode, approve/reject) | M | mirrors `scripts/import-cursor-events.ts`; needs a slug helper and a geocode call |
| Company-request city-check constraint fix (the gap noted above) | S | one migration, independent of everything else in this doc |
| Notification-on-approval (deferred) | M-L | blocked on choosing/wiring an email provider; not recommended for this pass |

**Explicit non-goals for the next implementation plan(s):**

- No user accounts, sessions, or login of any kind.
- No admin web UI (option (b) in section 3) unless volume or reviewer needs change.
- No change to the "meetups publish immediately" rule — this spike only adds correction/withdrawal, not pre-publish moderation.
- No notification system in the first pass (section 4).
- No retroactive fix for meetups already published before edit-tokens exist (they simply have no token; that's an acceptable gap for a first version).

## 6. Open questions for the maintainer

1. Should the company-request city-check constraint gap (section "A gap the audit surfaced") be fixed as a standalone plan before or alongside the review-flow CLI script? It blocks approving any non-SF/Toronto request today.
2. For the edit-link token: what expiry window is acceptable — 30 days, 90 days, or indefinite? This is a pure product-risk call, not a technical one.
3. For company approval's `source_url`: is defaulting it to the submitted `website` acceptable, or should the CLI script prompt the reviewer for a distinct source (e.g. a YC/press page) the way the original seed data used it?
4. Does the maintainer want edit/withdraw for company requests too (a submitter fixing their own pending request before review), or is that out of scope because the review turnaround is expected to be fast enough that it does not matter?
5. Confirming the maintenance note from plan 010: if plan 009's guild sync (`scripts/import-cursor-events.ts`) lands with more sources, do all guild-sourced imports keep bypassing review, on the basis that the source is trusted? This document assumes yes, matching how the cursor-events importer already behaves, but it should be stated as an explicit decision rather than an implicit one.
