# Plan 014: Make the cursor.com event fetch resilient to malformed and drifted upstream data

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 16f120d..HEAD -- lib/cursor-events-fetch.ts scripts/fetch-cursor-events.ts tests/cursor-events-fetch.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug + security + dx
- **Planned at**: commit `16f120d`, 2026-07-11

## Why this matters

`scripts/fetch-cursor-events.ts` scrapes `https://cursor.com/community` and parses Luma event objects out of the page's Next.js flight payload via `lib/cursor-events-fetch.ts`.
This feeds the maintainer's weekly event-sync ops and is slated for unattended automation (cron), so it must degrade safely, not crash or silently emit garbage.
Today it has three weaknesses:

1. **One malformed event aborts the whole run.** The date computation runs outside the per-event try/catch, so a single event with an invalid `start_at` or `timezone` throws and discards every event in the batch.
2. **Field-level upstream drift is silent.** The script only fails when it parses zero events. If cursor.com renames `geo_address_json.city`, every event gets `city: ""`, the run "succeeds", and city grouping breaks downstream.
3. **No URL scheme check and no fetch timeout.** `parsed.url` is emitted verbatim (the `https://` invariant lives in `validateCursorEvent`, which only the import script applies), and the fetch can hang forever.

## Current state

Files:

- `lib/cursor-events-fetch.ts` (91 lines) — `extractFlightPayload`, `readJsonObject`, `localDateForTimezone`, `parseCursorCommunityEvents`. Pure functions, no I/O.
- `scripts/fetch-cursor-events.ts` (~35 lines) — fetches the page, calls `parseCursorCommunityEvents`, writes `scripts/data/cursor-events.json`, exits 1 only when 0 events parse.
- `tests/cursor-events-fetch.test.ts` (71 lines) — vitest suite covering the flight-payload extraction, balanced-JSON reader, one happy-path event, one incomplete-event drop, and empty HTML.
- `lib/cursor-events.ts:43-68` — `validateCursorEvent`, the existing validator that enforces non-empty fields, `YYYY-MM-DD` dates, and `https://` URLs. It is applied by `scripts/import-cursor-events.ts:36` (the Supabase import path), NOT by the fetch path.

The bug (weakness 1) — `lib/cursor-events-fetch.ts:70-90`. Note `localDateForTimezone` at line 86 is OUTSIDE the try/catch, which only wraps `JSON.parse`:

```ts
  while ((match = re.exec(payload))) {
    const raw = readJsonObject(payload, match.index)
    if (!raw) continue
    let parsed: LumaEvent
    try {
      parsed = JSON.parse(raw) as LumaEvent
    } catch {
      continue
    }
    if (!parsed.name || !parsed.start_at || !parsed.url) continue
    const slug = parsed.url.split("/").pop()
    if (!slug) continue
    events.push({
      id: slug,
      title: parsed.name,
      city: parsed.geo_address_json?.city ?? "",
      date: localDateForTimezone(parsed.start_at, parsed.timezone ?? "UTC"),
      url: parsed.url,
    })
  }
```

`localDateForTimezone` (`lib/cursor-events-fetch.ts:47-54`) throws a `RangeError` for either an unparseable `start_at` (`.format(new Date("garbage"))` → "Invalid time value") or an invalid IANA `timezone` (the `Intl.DateTimeFormat` constructor throws). Both fields come straight from the external payload with only truthiness checks.

The zero-only failure gate (weakness 2) — `scripts/fetch-cursor-events.ts:19-24`:

```ts
  const events = parseCursorCommunityEvents(await response.text())
  if (events.length === 0) {
    console.error(
      "Parsed 0 events - cursor.com/community structure may have changed."
    )
    process.exit(1)
  }
```

The fetch call (weakness 3) — `scripts/fetch-cursor-events.ts:10-12`, no `signal`:

```ts
  const response = await fetch(SOURCE_URL, {
    headers: { "user-agent": "aistartupquest-event-sync/1.0" },
  })
```

Conventions to match:

- Code style: no semicolons, double quotes, 2-space indent (Prettier config in `package.json`).
- Test style: model new cases after the existing `describe("parseCursorCommunityEvents")` block in `tests/cursor-events-fetch.test.ts:31-71` — build a flight payload with `JSON.stringify`, wrap in a `self.__next_f.push` script tag, assert the returned array.
- The parser deliberately never emits venue/street data (see the comment at `lib/cursor-events-fetch.ts:64`) — keep that invariant; do not add address fields.

## Commands you will need

| Purpose   | Command                                    | Expected on success |
|-----------|--------------------------------------------|---------------------|
| Install   | `corepack pnpm install`                    | exit 0              |
| Typecheck | `corepack pnpm typecheck`                  | exit 0, no errors   |
| Tests     | `corepack pnpm test`                       | all pass (18 existing + new) |
| Lint      | `corepack pnpm lint`                       | exit 0, no warnings |
| Format    | `corepack pnpm format:check`               | exit 0              |

Do NOT run `corepack pnpm fetch:cursor` as a verification step — it hits the live cursor.com and overwrites `scripts/data/cursor-events.json`. All verification is via unit tests.

## Scope

**In scope** (the only files you should modify):

- `lib/cursor-events-fetch.ts`
- `scripts/fetch-cursor-events.ts`
- `tests/cursor-events-fetch.test.ts`

**Out of scope** (do NOT touch, even though they look related):

- `lib/cursor-events.ts` and `scripts/import-cursor-events.ts` — the import/validation path already works; plan 009's spike owns any pipeline redesign.
- `lib/data/cursor-community-events.json` and `components/home-events-map.tsx` — the top-page dataset is hand-curated and owned by plans 015/016.
- `scripts/data/cursor-events.json` — data artifact; never regenerate it in this plan.

## Git workflow

- Branch: `advisor/014-harden-cursor-event-fetch`
- Conventional commits in English, e.g. `fix: skip malformed events instead of aborting cursor fetch`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Skip malformed events instead of aborting the parse

In `lib/cursor-events-fetch.ts`, `parseCursorCommunityEvents`: compute the date inside a per-event guard so a throwing `localDateForTimezone` skips that event only. Target shape:

```ts
    if (!parsed.name || !parsed.start_at || !parsed.url) continue
    const slug = parsed.url.split("/").pop()
    if (!slug) continue
    let date: string
    try {
      date = localDateForTimezone(parsed.start_at, parsed.timezone ?? "UTC")
    } catch {
      continue
    }
    events.push({ id: slug, title: parsed.name, city: ..., date, url: parsed.url })
```

**Verify**: `corepack pnpm test` → existing tests still pass.

### Step 2: Reject non-https URLs in the parser

In the same function, before pushing the event, skip any `parsed.url` that does not start with `https://` (mirror the invariant in `lib/cursor-events.ts:56`). This is defense-in-depth: event URLs eventually render as `<a href>` in `components/home-events-map.tsx:581,719`, and the fetch path currently has no scheme check.

**Verify**: `corepack pnpm test` → passes (Step 4 adds the covering test).

### Step 3: Add a fetch timeout and a degraded-output gate to the script

In `scripts/fetch-cursor-events.ts`:

1. Add `signal: AbortSignal.timeout(30_000)` to the `fetch` options.
2. After parsing, compute `missingCity = events.filter((e) => e.city === "").length`. Always log a summary line like `Parsed ${events.length} events (${missingCity} missing city).` Exit 1 with an explanatory `console.error` when `events.length > 0 && missingCity / events.length > 0.5` — that ratio signals the city field moved upstream while events still parse.
3. Keep the existing zero-events exit-1 gate unchanged.

**Verify**: `corepack pnpm typecheck` → exit 0.

### Step 4: Extend the test suite

Add to `tests/cursor-events-fetch.test.ts`, in the existing `describe("parseCursorCommunityEvents")` block (same payload-building style as the current happy-path test at lines 32-64):

1. An event with `start_at: "not-a-date"` alongside one valid event → only the valid event returned.
2. An event with `timezone: "Not/AZone"` alongside one valid event → only the valid event returned.
3. An event with `url: "javascript:alert(1)"` alongside one valid event → only the valid event returned. (Write the test string exactly as data in the assertion; it never executes.)
4. An event missing `geo_address_json` → returned with `city: ""` (documents the fallback Step 3's gate relies on).
5. An event missing `timezone` → returned, with the date computed in UTC (assert the exact expected `YYYY-MM-DD`).
6. A payload with two valid events → both returned in order (the current suite never asserts more than one survivor).

**Verify**: `corepack pnpm test` → all pass, including 6 new cases. `corepack pnpm lint` → exit 0. `corepack pnpm format:check` → exit 0.

## Test plan

Covered by Step 4 — six new unit cases in `tests/cursor-events-fetch.test.ts`, modeled on the existing `parseCursorCommunityEvents` tests.
The script-level gate (Step 3) is intentionally not unit-tested (it is a thin CLI wrapper doing I/O); its logic beyond the fetch call is three lines and reviewed by eye.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `corepack pnpm typecheck` exits 0
- [ ] `corepack pnpm test` exits 0 with 6 new `parseCursorCommunityEvents` cases
- [ ] `grep -n "AbortSignal.timeout" scripts/fetch-cursor-events.ts` → 1 match
- [ ] `grep -n "missing city" scripts/fetch-cursor-events.ts` → at least 1 match
- [ ] `grep -n 'startsWith("https://")' lib/cursor-events-fetch.ts` → 1 match
- [ ] `git status` shows only the three in-scope files modified (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts in "Current state" don't match the live code (drift since `16f120d`).
- You find yourself wanting to change `CursorEventInput` or `validateCursorEvent` — that shape is shared with the Supabase import path and is out of scope.
- `corepack pnpm test` fails twice on a case after a reasonable fix attempt.

## Maintenance notes

- When plan 009's sync-automation design lands, this script's exit codes become the cron failure signal — keep exit 1 meaning "do not commit this output".
- If cursor.com changes the flight-payload marker (`{"platform":"luma"`), the zero-events gate catches it; the 50% missing-city gate catches partial drift. A reviewer should check the threshold isn't weakened.
- The parser's "no venue/address data" invariant (comment at `lib/cursor-events-fetch.ts:64`) is a product commitment to the event source — flag any diff that adds address fields.
