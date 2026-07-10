# Plan 002: Add anti-abuse protection to company submission requests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ba0778c..HEAD -- app/actions/company-request.ts components/company-request-panel.tsx supabase/migrations lib/meetup-submit.ts types/supabase.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `ba0778c`, 2026-07-06

## Why this matters

The public "Add your startup" form calls the `submitCompanyRequest` server action, which inserts into `company_submission_requests` using the Supabase **service-role client** with no bot check, no rate limit, and no duplicate detection.
Anyone can script unlimited inserts and fill the review queue with junk.
The sibling flow — meetup submission in `app/actions/meetup-submit.ts` — already has all three protections (Cloudflare Turnstile verification, IP-hash rate limit of 5 per 24h, duplicate-payload cooldown of 15 minutes), so this plan is mostly about mirroring an existing, proven in-repo pattern.
There is also a stale RLS policy that allows `anon` role direct inserts into the table (bypassing the server action entirely) and whose city list (`sf`, `toronto`) has drifted from the product's six cities; since the server action uses the service-role key (which bypasses RLS), that anon policy serves no purpose and should be removed to close the direct-insert surface.

## Current state

- `app/actions/company-request.ts` — the whole action (109 lines). Field validation exists (lines 46-86) but there is no Turnstile, no rate limit, no dedup. Insert happens at lines 88-99:

```ts
// app/actions/company-request.ts:88-99
const supabase = createAdminClient()
const { error } = await supabase.from("company_submission_requests").insert({
  category: payload.category,
  city: payload.city,
  ...
})
```

- `app/actions/meetup-submit.ts` — the exemplar to mirror. Key pieces:
  - `getRequestIp()` at lines 71-78 (reads `x-forwarded-for` / `x-real-ip` via `next/headers`).
  - `verifyTurnstile(token, remoteIp)` at lines 80-109 (POSTs to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `process.env.TURNSTILE_SECRET_KEY`).
  - Constants at lines 40-42: `RATE_WINDOW_MS = 24h`, `RATE_MAX = 5`, `DUPLICATE_WINDOW_MS = 15min`.
  - Duplicate-payload check at lines 239-263 and IP rate limit at lines 265-284, both querying a `meetup_submission_attempts` table, then recording the attempt at lines 286-295.
- `lib/meetup-submit.ts` — exports `hashClientIp` and `hashMeetupPayload` (SHA-256 helpers). Reuse `hashClientIp`; add a company payload hash helper alongside `hashMeetupPayload`.
- `supabase/migrations/20260407120000_create_meetups.sql:69-80` — creates `meetup_submission_attempts` with `ip_hash`, `payload_hash`, `created_at` and two indexes `(ip_hash, created_at desc)` and `(payload_hash, created_at desc)`. Mirror this table shape.
- `supabase/migrations/20260330180000_add_city_selection_and_location_to_company_submission_requests.sql` — recreates the policy `"Anyone can create company submission requests"` for `insert to anon, authenticated` with `city in ('sf', 'toronto')` plus field checks. This is the stale anon-insert policy to drop.
- `components/company-request-panel.tsx` (373 lines) — the client form. It has NO Turnstile widget today.
- `components/meetup-request-panel.tsx` — the exemplar for wiring Turnstile in a form: imports `TurnstileWidget, type TurnstileWidgetHandle` from `@/components/turnstile-widget` (lines 11-13), holds `turnstileToken` state (line 50) and a `turnstileRef` (line 56), resets both after submit (lines 66-67), and blocks submit when the token is missing (line 113). Match this wiring exactly.
- `components/turnstile-widget.tsx` — reusable widget, reads `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. No changes needed.
- Repo conventions: no semicolons, double quotes (Prettier enforced); conditional classNames via `cn` from `lib/utils.ts`; Supabase client queries prefer `.match()` over `.eq()` (per `CLAUDE.md`) — note the meetup action uses `.eq()`; for new code follow `CLAUDE.md` and use `.match()` where it expresses equality on columns, and `.gte()` for ranges.
- After schema changes, regenerate types: `pnpm genType` (requires `.env` / project env; `CLAUDE.md` calls this `nr genType` — same script) and commit `types/supabase.ts`.

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|------------------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0              |
| Tests     | `pnpm test`      | all pass            |
| Lint      | `pnpm lint`      | exit 0 (1 known warning at `components/events-world-map.tsx:297` allowed) |
| Gen types | `pnpm genType`   | rewrites `types/supabase.ts`, exit 0 |
| Apply migration | `supabase db push` (or the Supabase MCP `apply_migration` tool if available) | migration applied |

## Scope

**In scope** (the only files you should modify/create):
- `supabase/migrations/<new timestamp>_company_submission_attempts_and_policy.sql` (create)
- `app/actions/company-request.ts`
- `components/company-request-panel.tsx`
- `lib/meetup-submit.ts` (add a `hashCompanyRequestPayload` helper next to `hashMeetupPayload`)
- `types/supabase.ts` (regenerated only, never hand-edited)
- `tests/company-request.test.ts` (create — see Test plan)

**Out of scope** (do NOT touch, even though they look related):
- `app/actions/meetup-submit.ts` — it already works; do not "unify" the two actions in this plan.
- `components/turnstile-widget.tsx` — reused as-is.
- Moderation/approval UI for the requests table — that is direction plan 010.
- Extracting shared rate-limit helpers into a new module — tempting, but keep the diff reviewable; a follow-up can DRY it once both flows are stable.

## Git workflow

- Branch: `advisor/002-harden-company-submission`
- Commit per step, conventional commits in English (e.g. `feat: add turnstile and rate limiting to company requests`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Migration — attempts table and policy cleanup

Create a new migration file (timestamp later than `20260704120000`) that:

1. Creates `public.company_submission_attempts` mirroring `meetup_submission_attempts` (see `supabase/migrations/20260407120000_create_meetups.sql:69-80`): `id uuid pk default gen_random_uuid()`, `ip_hash text not null`, `payload_hash text not null`, `created_at timestamptz not null default now()`, plus the two indexes on `(ip_hash, created_at desc)` and `(payload_hash, created_at desc)`. Enable RLS and add NO policies (service-role only, same posture as the meetup attempts table — check how that table's RLS is set up in the same migration and mirror it).
2. Drops the stale anon insert policy: `drop policy if exists "Anyone can create company submission requests" on public.company_submission_requests;` — inserts now go exclusively through the server action's service-role client.

Apply it with `supabase db push` (or the Supabase MCP `apply_migration` tool).

**Verify**: `pnpm genType` → exit 0, and `grep -n "company_submission_attempts" types/supabase.ts` → at least one match.

### Step 2: Payload hash helper

In `lib/meetup-submit.ts`, add `hashCompanyRequestPayload(payload: {...}): string` next to `hashMeetupPayload`, hashing the normalized company request fields (city, companyName, category, founded, locationLabel, shortDescription, website) the same way `hashMeetupPayload` does.

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Server action hardening

In `app/actions/company-request.ts`:

1. Add `turnstileToken: string` to `CompanyRequestPayload`.
2. After the existing field validation and before the insert, replicate the meetup action's sequence (see `app/actions/meetup-submit.ts:214-295`): resolve IP → `hashClientIp` → `verifyTurnstile` → duplicate-payload check (15 min window) → IP rate limit (5 per 24h) → record the attempt row in `company_submission_attempts` → then insert the request.
3. Copy `getRequestIp` and `verifyTurnstile` into this file (duplication is accepted for this plan; see out-of-scope note).
4. Log unexpected errors with `console.error` before returning generic messages.

Error messages should mirror the meetup action's tone ("Too many submissions from this network. Try again tomorrow.").

**Verify**: `pnpm typecheck` → exit 0; `pnpm lint` → exit 0.

### Step 4: Wire Turnstile into the form

In `components/company-request-panel.tsx`, mirror `components/meetup-request-panel.tsx`: render `TurnstileWidget` near the submit button, hold `turnstileToken` state and a `TurnstileWidgetHandle` ref, pass the token in the action payload, disable/deny submit without a token, and reset the widget after a submit attempt.
Keep the pixel-RPG styling conventions of the surrounding form (hard borders, no rounded corners) — copy the wrapper markup used in the meetup panel.

**Verify**: `pnpm typecheck` → exit 0; `pnpm build` → exit 0 (skip build with a note if `.env.local` is unavailable).

### Step 5: Tests

Write `tests/company-request.test.ts` per the Test plan below.

**Verify**: `pnpm test` → all pass, including the new file.

## Test plan

- New file `tests/company-request.test.ts`, modeled structurally on `tests/meetup.test.ts` (plain vitest, `describe`/`it`, helper factory function).
- Cover the pure pieces:
  - `hashCompanyRequestPayload` returns identical hashes for identical payloads and different hashes when any field differs.
  - Validation boundaries of `submitCompanyRequest` you can reach without network: invalid city rejected, short description length limits (19 chars rejected, 20 accepted), founded-year range, missing turnstile token rejected.
- For the action-level tests, mock `next/headers` and the Supabase admin client with `vi.mock`; if mocking the action's module graph proves brittle, keep only the pure-helper tests and note the gap in your report — do not ship flaky tests.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] Migration file exists and was applied; `grep -n "company_submission_attempts" types/supabase.ts` matches
- [ ] `grep -n "drop policy" supabase/migrations/*company_submission*` matches the stale policy drop
- [ ] `grep -n "turnstileToken" app/actions/company-request.ts` matches
- [ ] `grep -n "TurnstileWidget" components/company-request-panel.tsx` matches
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm lint` all exit 0
- [ ] `git status` shows only in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- You have no way to apply the migration (no Supabase CLI auth and no MCP tool) — write the migration file, skip the apply + genType steps, and report.
- `types/supabase.ts` regeneration produces unrelated diffs beyond the new table (schema drift on the remote project).
- The Turnstile env vars (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`) appear to be missing from the deployment — the meetup flow would already be broken in that case; report instead of guessing.
- The live `company-request.ts` no longer matches the excerpt above.

## Maintenance notes

- After this lands, `submitCompanyRequest` and `submitMeetup` share ~80 duplicated lines (IP, Turnstile, rate-limit). A follow-up refactor can extract `lib/submission-guard.ts`; it was deliberately deferred to keep this security fix reviewable.
- Reviewer should scrutinize: the migration's RLS posture on the new attempts table (no anon access), and that dropping the anon insert policy does not break any client-side insert path (grep for `from("company_submission_requests")` outside the server action — as of `ba0778c` there are none).
- The attempts table grows unboundedly; a periodic cleanup (delete rows older than 30 days) is a nice-to-have for later.
