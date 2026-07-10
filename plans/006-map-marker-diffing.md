# Plan 006: Stop rebuilding every map marker on each selection change

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ba0778c..HEAD -- components/map-shell.tsx`
> If the file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/003-verification-baseline.md (CI gate; no map tests exist, so lint/typecheck/build + manual verification are the net)
- **Category**: perf
- **Planned at**: commit `ba0778c`, 2026-07-06

## Why this matters

In `components/map-shell.tsx`, clicking any marker (or changing selection in the sidebar) triggers an effect that rebuilds the DOM sprite of EVERY marker on the map via `replaceChildren`, and inside that loop does a linear `companies.find(...)` per marker — O(N²) work and full DOM churn for a one-marker visual change.
A second effect destroys and recreates all markers whenever the list or mode changes.
With ~60+ companies per city plus meetups, every selection click does hundreds of element creations for what should be two sprite swaps (deselect old, select new).
The fix is contained: diff by slug, only touch markers whose active state changed.

## Current state

All in `components/map-shell.tsx` (1383 lines):

- `markersRef` is already keyed by slug: `const markersRef = useRef<Map<string, Marker>>(new Map())` (line 915).
- **Effect A (rebuild-all, lines 1005-1153)**: clears all markers (`markersRef.current.forEach((marker) => marker.remove()); markersRef.current.clear()` at 1017-1018), then for `mode === "startups"` recreates a `<button>` + `createMarkerSprite(company, active, dense)` per company (1022-1040), computes a sorted slug signature to decide bounds refits (1042-1079), and does the same for meetups with `createMeetupSignboardMarker` (1082-1140). Dependency array (1144-1153): `[companies, denseMeetups, denseStartups, mapReady, mode, onSelectCompany, onSelectMeetup, spreadMeetups]`.
- **Effect B (restyle-all on selection, lines 1155-1191)**:

```ts
useEffect(() => {
  if (mode === "startups") {
    const dense = denseStartups
    markersRef.current.forEach((marker, slug) => {
      const button = marker.getElement() as HTMLButtonElement
      const active = slug === selectedCompany.slug
      const company = companies.find((item) => item.slug === slug)
      button.style.zIndex = active ? "10" : "1"
      if (company) {
        button.replaceChildren(createMarkerSprite(company, active, dense))
      }
    })
  } else {
    ... same shape for meetups with selectedMeetup?.slug ...
  }
}, [companies, denseMeetups, denseStartups, mode, selectedCompany, selectedMeetup, spreadMeetups])
```

- Sprite factories `createMarkerSprite`, `createBossSpriteMarker`, `createMeetupSignboardMarker` live earlier in the same file (roughly lines 353-720); they take `(item, active, dense)` and return a DOM node. You do NOT need to modify them.
- Repo conventions: no semicolons, double quotes, `cn` helper for conditional classNames (not needed here — markers are imperative DOM).

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|------------------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0              |
| Lint      | `pnpm lint --max-warnings 0` | exit 0 (after plan 003) |
| Tests     | `pnpm test`      | all pass            |
| Build     | `pnpm build`     | exit 0 (needs `.env.local`) |
| Dev       | `pnpm dev`       | serves on localhost for manual verification |

## Scope

**In scope** (the only file you should modify):
- `components/map-shell.tsx`

**Out of scope** (do NOT touch, even though they look related):
- The sprite factory functions' internals (lines ~353-720) — visual output must be byte-identical.
- `components/events-world-map.tsx`, `components/city-map.tsx` — different components, different plans.
- Splitting the file into hooks — that is plan 007; keep this diff minimal so 007 can move the improved logic wholesale.
- The bounds-refit signature logic (lines 1042-1079 and its meetup twin) — keep behavior identical.

## Git workflow

- Branch: `advisor/006-map-marker-diffing`
- Conventional commits in English (e.g. `perf: update only changed markers on selection change`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Track the previously active slug

Add a ref near `markersRef` (line 915): `const prevActiveSlugRef = useRef<string | null>(null)`.

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Make Effect B touch only the two affected markers

Rewrite Effect B (lines 1155-1191) so it:

1. Computes `activeSlug = mode === "startups" ? selectedCompany.slug : (selectedMeetup?.slug ?? null)`.
2. Builds a lookup `Map` once per run instead of `Array.find` per marker: `new Map(companies.map((c) => [c.slug, c]))` (or `spreadMeetups` in meetup mode).
3. Restyles only `prevActiveSlugRef.current` and `activeSlug` (skip identical slugs; handle a previous slug whose marker no longer exists in `markersRef`).
4. Sets `prevActiveSlugRef.current = activeSlug` at the end.

The per-marker work stays what it is today: set `button.style.zIndex` and `replaceChildren(createXxx(item, active, dense))`.
Important interaction: Effect A rebuilds ALL markers using `selectedSlugRef.current` for the active flag (line 1023/1083), so after a list/mode rebuild every marker is already correct — but `prevActiveSlugRef` may then be stale.
Set `prevActiveSlugRef.current = selectedSlugRef.current` at the end of Effect A (next to `hasRenderedMarkersRef.current = true`, line 1142) so the two effects stay consistent.

One subtlety to preserve: today Effect B also re-renders all markers when `dense*` flags or the lists change (its dep array includes them), but Effect A ALSO fully rebuilds on list/mode changes with the correct sprites.
Check what changes `denseStartups`/`denseMeetups` (grep their definition — if they are derived from the same lists that trigger Effect A, the all-marker restyle in Effect B is redundant and the two-marker version is sufficient).
If `dense*` can change WITHOUT Effect A re-running, keep a full restyle pass for that case only (compare against a `prevDenseRef`).

**Verify**: `pnpm typecheck` → exit 0; `pnpm lint` → exit 0.

### Step 3: Manual behavior check

Run `pnpm dev`, open the SF page, and verify in the browser:

1. Click marker X → X grows/highlights, previously selected marker shrinks. No other marker flickers (watch the DOM in devtools Elements panel — only two `<button>` subtrees mutate).
2. Switch Startups/Meetups mode → markers swap sets correctly, selected marker in the new mode is highlighted.
3. Search/filter in the sidebar → marker set updates, selection highlight survives where applicable.
4. Select via sidebar card (not map click) → same behavior.

**Verify**: all four scenarios behave identically to `main` (run `git stash` / branch switch to compare if unsure).

## Test plan

There are no existing component tests for map-shell (maplibre-gl requires a WebGL DOM; unit-testing it is out of scope for this plan).
The gate is: typecheck, lint, build, plus the manual scenario checklist in Step 3.
Record the Step 3 results (pass/fail per scenario) in your final report.

## Done criteria

Machine-checkable where possible. ALL must hold:

- [ ] `grep -n "companies.find" components/map-shell.tsx` returns no match inside Effect B (Map lookup instead)
- [ ] Effect B no longer iterates `markersRef.current.forEach` unconditionally on selection change (code review of the diff)
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` exit 0; `pnpm build` exits 0
- [ ] Manual checklist in Step 3: 4/4 pass, reported
- [ ] `git status` shows only `components/map-shell.tsx` modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The live Effect A/B code does not match the excerpts above (plan 007 may have landed first — in that case this plan's line numbers are void; report so the advisor can re-target).
- `denseStartups`/`denseMeetups` semantics are unclear after reading their definitions — ask rather than guess; a wrong dense flag silently changes marker artwork.
- Any Step 3 scenario shows a visual difference from `main` that you cannot attribute to your diff.

## Maintenance notes

- Plan 007 (decomposition) will move this logic into a `useMapMarkers` hook — it must carry the diffing behavior, `prevActiveSlugRef`, and the Effect A/B consistency rule with it.
- If marker sets ever become large enough to matter (500+), the next lever is replacing per-marker DOM with a maplibre symbol layer; that is a redesign, not an optimization of this code.
