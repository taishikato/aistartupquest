# Plan 010: Design spike — submission lifecycle (moderation, edit, withdrawal)

> **Executor instructions**: This is a DESIGN SPIKE, not a build plan.
> The deliverable is a written design document — no production code changes,
> no schema migrations. If anything in the "STOP conditions" section occurs,
> stop and report. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ba0778c..HEAD -- app/actions supabase/migrations lib/meetup.ts`
> On drift, re-read the changed files before writing the design.

## Status

- **Priority**: P3
- **Effort**: M (spike; implementation estimated in the deliverable)
- **Risk**: LOW (no production changes)
- **Depends on**: none (plan 002 DONE — write this spike against post-002 company-request code)
- **Category**: direction
- **Planned at**: commit `ba0778c`, 2026-07-06
- **Status**: DONE — executed 2026-07-11; commit `bc93afc`; merged to main as `6c3adbb`

## Why this matters

Both public submission flows are one-way streets:

- Meetups publish instantly (`status: "published"` on insert in `app/actions/meetup-submit.ts`) — by design per `CLAUDE.md` — but there is NO way for a submitter to fix a typo, change a date, or withdraw an event. The only correction path is the maintainer editing rows in Supabase Studio.
- Company submissions go into `company_submission_requests` (a review queue by construction: `status = 'pending'`), but there is no approval surface — nothing in the codebase reads that table or promotes a request into the `companies` table. The queue is write-only.

As submission volume grows, both gaps become maintainer toil and user frustration.
The design question is what the minimal lifecycle looks like WITHOUT accounts (the app has no auth today — no root middleware, no session handling anywhere).

## Current state (evidence for the spike to build on)

- `app/actions/meetup-submit.ts` (364 lines) — validates, Turnstile-checks, rate-limits, geocodes, then inserts with `status: "published"` and a generated slug. Collects NO submitter identity except optional `contactEmail`-like fields? — verify: the payload has `organizerName`, `eventUrl`, `xAccount`; check whether `contact_email` is collected for meetups (the `Meetup` type has `contactEmail: string | null` and `meetupFromPublicRow` hard-codes it to `null` for public reads — the column exists and is hidden from the public view).
- `app/actions/company-request.ts` — inserts `status`-less payload into `company_submission_requests` with optional `contact_email`; RLS migration `20260330162000_*.sql` shows the table has a `status` column defaulting to pending with no select policy (verify in the migration file).
- `meetups.status` supports `"published" | "cancelled" | "hidden"` (`lib/meetup.ts:4`) — the state machine already exists in the type; nothing sets `cancelled`/`hidden` from the app.
- The public read path filters via the `published_upcoming_meetups` view (migration `20260501100000_*.sql`), so hiding = flipping status; no delete needed.
- No auth: `lib/supabase/middleware.ts` is dead code (plan 004 deletes it); no session, no user table.
- Product rules that constrain the design (`CLAUDE.md`): submissions publish immediately (decided); the form stays short; game metaphor is atmosphere only — moderation UI wording stays plain.

## Deliverable

Write `docs/design/submission-lifecycle.md` (create the directory if plan 009 has not) containing:

1. **Submitter self-service without accounts** — evaluate at least: (a) signed edit-link tokens emailed/shown once after submission (capability URL, e.g. HMAC over slug + secret), (b) email-verification-code flow using the existing `contact_email` column, (c) no self-service, report-a-problem mailto only. Cover abuse angles (token leakage = anyone can edit; rate limits). Recommend one with justification.
2. **Meetup lifecycle rules** — which fields are editable after publish (date? city? — a city change moves the pin and re-geocodes), when an edit re-triggers geocoding, and whether edits re-enter any cooldown. Withdrawal maps to `status: "cancelled"` (state already exists — cite `lib/meetup.ts:4`).
3. **Company request review flow** — the minimal approve/reject path. Evaluate: (a) keep using Supabase Studio but document a runbook (zero code), (b) a private admin page behind a shared-secret env var, (c) a CLI script like the cursor importer (`scripts/`). Specify what "approve" does mechanically: which `company_submission_requests` fields map to which `companies` columns (enumerate them from `types/supabase.ts` — the requests table lacks coordinates, so approval needs a geocode step like meetup submission has).
4. **Notification touchpoint** — does the submitter learn their company was approved? (email? nothing?) — one paragraph, honest about effort.
5. **Implementation estimate** — S/M/L per piece; the follow-up plan list you would write; explicit statement of what NOT to build yet.
6. **Open questions for the maintainer.**

## Scope

**In scope**: `docs/design/submission-lifecycle.md` (create), read-only exploration of the repo and Supabase migrations.

**Out of scope**: ANY change to `app/`, `lib/`, `supabase/`, `package.json`; building any admin UI; adding auth.

## Git workflow

- Branch: `advisor/010-spike-submission-lifecycle`
- Single commit: `docs: design spike for submission lifecycle and moderation`
- Do NOT push or open a PR unless the operator instructed it.

## Done criteria

- [ ] `docs/design/submission-lifecycle.md` exists and covers all 6 deliverable sections
- [ ] Every claim about current code cites a `file:line` or migration file
- [ ] One recommended option per decision (self-service, review flow), not a menu
- [ ] The design honors the standing rule that meetups publish immediately (it may propose changing the rule, but must flag that as a product-rule change, not slip it in)
- [ ] No files outside `docs/design/` changed (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The design cannot avoid introducing full user accounts — that is a product pivot; present the fork in the doc and stop short of recommending infrastructure.
- You find an existing moderation surface the audit missed (an admin route, a Studio workflow doc) — re-scope around it.

## Maintenance notes

- Plan 002 (anti-abuse) and this spike touch the same action files; whichever implementation plan follows this spike should be written against the post-002 code.
- If plan 009's guild sync lands with instant-publish imports, the moderation design must state whether guild events bypass any future review (they should — the source is trusted; say so explicitly).
