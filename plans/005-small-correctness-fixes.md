# Plan 005: Small correctness and observability fixes (bundle)

> **Executor instructions**: Follow this plan step by step. Each step is an
> independent fix with its own verification — if one step hits a STOP
> condition, skip it, report it, and continue with the others. When done,
> update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ba0778c..HEAD -- lib/meetup.ts app/actions/meetup-submit.ts components/pixel-clouds.tsx components/events-world-map.tsx tests/meetup.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat the affected step (only) as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `ba0778c`, 2026-07-06
- **Status**: DONE (executed 2026-07-11 on `advisor/005-small-correctness-fixes`, tip `9533c4a`)

## Why this matters

Four small, verified defects that are each too small for their own plan but real:
a deserializer that `as`-casts nullable database view columns into non-null app types (a schema drift away from a runtime crash), a geocoding failure path that swallows the error object so production issues are undiagnosable, a Turnstile verification that discards Cloudflare's `error_codes` (same observability gap), and a cloud animation loop that permanently freezes on one transient MapLibre error.
None changes product behavior; all reduce the odds of a silent 3am failure.

## Current state

**(a) `lib/meetup.ts:84-102` — `meetupFromPublicRow`**:

```ts
export function meetupFromPublicRow(row: PublicMeetupRow): Meetup {
  return {
    slug: row.slug as string,
    city: row.city as CityId,
    title: row.title as string,
    ...
    coordinates: [row.longitude as number, row.latitude as number],
    ...
  }
}
```

`PublicMeetupRow` is `Database["public"]["Views"]["published_upcoming_meetups"]["Row"]` (view columns are all nullable in generated types), so every cast can hide a real null.
Callers: find them with `grep -rn "meetupFromPublicRow" app components lib` (as of `ba0778c`: `lib/city-page-data.ts` and `lib/use-city-meetups.ts`, plus `tests/meetup.test.ts`).

**(b) `app/actions/meetup-submit.ts:299-306` — geocode catch swallows the error**:

```ts
try {
  coords = await geocodeWithGoogle(query)
} catch {
  return {
    status: "error",
    message: "Location lookup is temporarily unavailable. Try again later.",
  }
}
```

**(c) `app/actions/meetup-submit.ts:103-106` — Turnstile response drops error codes**:

```ts
const data = (await res.json()) as { success?: boolean }
if (!data.success) {
  return { ok: false, message: "Bot verification failed. Please try again." }
}
```

Cloudflare's siteverify response includes `"error-codes": string[]` (note the hyphen), which distinguishes token-expired from misconfiguration from replay.

**(d) `components/pixel-clouds.tsx:209-215` — animation loop dies on one bad frame**:

```ts
try {
  bounds = map.getBounds()
} catch {
  return
}
```

`animate` is a `requestAnimationFrame` loop (rescheduled at line 232, `frameRef.current = requestAnimationFrame(animate)`).
If `getBounds()` throws once (mid style-switch), the `return` exits without rescheduling, and the clouds freeze for the rest of the session.

Repo conventions: no semicolons, double quotes; server-side logging is plain `console.error` (no logger dependency exists).

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|------------------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0              |
| Tests     | `pnpm test`      | all pass            |
| Lint      | `pnpm lint`      | exit 0 (1 known warning at `components/events-world-map.tsx:297` allowed until plan 003 lands) |

## Scope

**In scope** (the only files you should modify):
- `lib/meetup.ts`
- `app/actions/meetup-submit.ts`
- `components/pixel-clouds.tsx`
- `tests/meetup.test.ts` (extend)

**Out of scope** (do NOT touch, even though they look related):
- `lib/meetup.ts` `meetupFromRow` (table-row variant) — its row type is non-nullable already.
- `components/events-world-map.tsx` — the `new AbortController().signal` at line 436 was considered and deliberately left: the fetched style is cached for the session and the failure path already falls back to the art style; wiring real cancellation is not worth the complexity. Do not "fix" it in passing.
- The user-facing error message strings — keep them exactly as they are.

## Git workflow

- Branch: `advisor/005-small-correctness-fixes`
- One commit per step; conventional commits in English (e.g. `fix: validate nullable view rows in meetupFromPublicRow`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Validate rows in `meetupFromPublicRow`

Change the signature to `meetupFromPublicRow(row: PublicMeetupRow): Meetup | null`.
At the top, check every field currently force-cast: `slug`, `city`, `title`, `description`, `venue_name`, `location_label`, `longitude`, `latitude`, `event_date`, `event_url`, `status`.
If any is `null`/`undefined`, `console.error("published_upcoming_meetups row missing required field", { slug: row.slug })` and return `null`.
After the guard, the casts become unnecessary for most fields — remove the `as` casts that TypeScript no longer needs (keep the enum-narrowing casts `as CityId`, `as MeetupStatus`, `as MeetupSource`, `as MeetupLocationPrecision`).
Update both callers (found via the grep in Current state) to filter nulls, e.g. `.map(meetupFromPublicRow).filter((m): m is Meetup => m !== null)`.
Update the existing test in `tests/meetup.test.ts:30-51` for the new nullable return (it passes a fully populated row, so just assert non-null before the existing expectations).

**Verify**: `pnpm typecheck` → exit 0; `pnpm test` → all pass including a NEW test: a row with `title: null` returns `null`.

### Step 2: Log the geocoding failure

In the catch at `app/actions/meetup-submit.ts:301`, capture the error and log it with context before returning the same message:

```ts
} catch (error) {
  console.error("geocodeWithGoogle failed", { query, error })
  return { ... unchanged ... }
}
```

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Capture Turnstile error codes

Extend the response type at `app/actions/meetup-submit.ts:103` to `{ success?: boolean; "error-codes"?: string[] }` and log the codes on failure: `console.error("turnstile verification failed", data["error-codes"])`.
The returned user message stays unchanged.

**Verify**: `pnpm typecheck` → exit 0.

### Step 4: Keep the cloud loop alive through transient errors

In `components/pixel-clouds.tsx`, change the catch (lines 213-215) so the frame is rescheduled before returning:

```ts
} catch {
  frameRef.current = requestAnimationFrame(animate)
  return
}
```

The `disposed` check at the top of `animate` (line 202) still guarantees the loop stops on unmount, and the cleanup's `cancelAnimationFrame(frameRef.current)` (line 239) now always sees the latest frame id.

**Verify**: `pnpm typecheck` → exit 0; `pnpm lint` → exit 0.

## Test plan

- Extend `tests/meetup.test.ts` (`meetupFromPublicRow` describe block): one new case — any required field `null` → returns `null`; existing case updated for the nullable return.
- Steps 2-4 are logging/loop changes with no pure surface; the typecheck plus existing suite is the gate.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c " as string" lib/meetup.ts` returns 0
- [ ] `grep -n "error-codes" app/actions/meetup-submit.ts` matches
- [ ] `grep -n "geocodeWithGoogle failed" app/actions/meetup-submit.ts` matches
- [ ] `grep -n "requestAnimationFrame(animate)" components/pixel-clouds.tsx` shows 3 occurrences (catch, loop tail, kickoff)
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm lint` all exit 0 (modulo the known events-world-map warning)
- [ ] `git status` shows only in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Callers of `meetupFromPublicRow` other than `lib/city-page-data.ts`, `lib/use-city-meetups.ts`, and the test file exist (grep first) — list them and stop; the null-filtering decision may not fit them.
- The generated view row type in `types/supabase.ts` is NOT nullable for these columns (then Step 1 is unnecessary — report and skip).
- Any user-visible message string needs to change to make a step work.

## Maintenance notes

- If the `published_upcoming_meetups` view gains columns, `meetupFromPublicRow`'s guard list must grow with it — the `pnpm genType` + typecheck cycle will surface this.
- The logging added here is plain `console.error`; if the project later adopts structured logging or Sentry, these three sites are the first candidates.
