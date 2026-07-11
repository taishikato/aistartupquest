# Plan 011: Design spike — resolve the world-map experiments (4 selectors, /map-libre page)

> **Executor instructions**: This is a DESIGN SPIKE with a small cleanup
> option at the end. The primary deliverable is a decision document; the
> optional Step is a deletion the maintainer pre-approves by selecting it.
> If anything in the "STOP conditions" section occurs, stop and report.
> When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ab0a47e..HEAD -- app/map-libre app/page.tsx app/events components/map-libre-world-select.tsx components/home-events-map.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.
> On drift, re-read the changed files before writing the decision doc.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (doc) / MED (if the deletion step is executed)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `ba0778c`, 2026-07-06
- **Reconciled at**: commit `ab0a47e`, 2026-07-11 (narrowed to `/map-libre` only)
- **Status**: DONE at `37e60c2` (executed 2026-07-11; decision doc + deletion)

> **Premise update (2026-07-11, commit `16f120d`, refreshed `ab0a47e`)**: the maintainer resolved most of this spike's question directly.
> Three of the four components were DELETED: `world-globe-select.tsx`, `world-map-select.tsx`, and `events-world-map.tsx` are gone, replaced by `components/home-events-map.tsx` (the events-first top page; `/events` permanent-redirects to `/`).
> What remains undecided is only `app/map-libre/page.tsx` + `components/map-libre-world-select.tsx` (still present, still unlinked).
> New evidence strengthening the delete verdict: `map-libre-world-select.tsx` (245 lines) duplicates `home-events-map.tsx` near-verbatim in its city-sign marker factory and map bootstrap — as long as it lives, every restyle of the city-sign marker must be made twice.
> Execution guidance: the doc shrinks to (a) the `/map-libre` keep/delete verdict — hypothesis unchanged: delete, (b) if KEPT, a shared marker-factory/bootstrap extraction sketch with `home-events-map.tsx`, and (c) the consolidation question relative to `map-shell.tsx`/`city-map.tsx` (plans 006/007).
> Section 3 (exposure of `/events`) is answered: `/` is the events map.

## Why this matters

The repo still carries one concluded comparison experiment as an unlisted route:

- `components/map-libre-world-select.tsx` (245 lines) — used ONLY by `app/map-libre/page.tsx`, a page whose own metadata says "Compare the RPG world map with a MapLibre-powered world map city selector". Not linked from any navigation (verify: `rg -n '"/map-libre"' app components` — only the page itself).
- The live product surface is `components/home-events-map.tsx` on `/` (events-first atlas). The comparison the `/map-libre` page exists for looks concluded.

Keeping the losing branch of an experiment as an unlisted route costs maintenance without informing any future decision.

## Current state (facts for the decision)

Verified at commit `ab0a47e`:

- `app/map-libre/page.tsx` (13 lines) — full contents render `<MapLibreWorldSelect />` with compare-page metadata.
- Deleted (do not resurrect): `world-globe-select.tsx`, `world-map-select.tsx`, `events-world-map.tsx`.
- `/events` permanent-redirects to `/`; exposure decision is settled.
- `lib/world-art-map.ts`, `lib/world-atlas-style.ts`, `lib/world-stage-cities.ts` — style/data deps shared with the top-page map; `lib/data/cursor-community-events.json` feeds `home-events-map.tsx`.
- Duplication: city-sign marker factory and map bootstrap are hand-rolled in both `map-libre-world-select.tsx` and `home-events-map.tsx` (see also plans 006/007/016).

## Deliverable

Write `docs/design/world-map-consolidation.md` containing:

1. **Inventory table** — survivors only: `home-events-map.tsx` (live `/`), `map-libre-world-select.tsx` + `/map-libre` (experiment), plus pointers to `map-shell.tsx`/`city-map.tsx` for the consolidation question. Do not invent rows for deleted components.
2. **Decision per artifact** — keep / delete / merge for `/map-libre` + `map-libre-world-select.tsx`, with one-line justification. Default hypothesis: delete.
3. **Exposure decision** — already answered (`/` is the events map); one sentence confirming that in the doc.
4. **Consolidation sketch** — IF `/map-libre` is KEPT, sketch a shared marker-factory/bootstrap module with `home-events-map.tsx` and estimate effort; if deleted, say whether extracting shared pieces from `home-events-map.tsx` vs `map-shell.tsx` is worth a follow-up (or "not worth it").
5. **Open questions for the maintainer.**

### Optional Step (execute ONLY if the doc's own conclusion is "delete" and no STOP condition fired)

Delete `app/map-libre/page.tsx` and `components/map-libre-world-select.tsx`.

**Pre-check**: `rg -n "map-libre-world-select|MapLibreWorldSelect" app components lib --glob '*.ts*'` → only the two files being deleted.

**Verify**: `pnpm typecheck` → exit 0; `pnpm build` → exit 0; `curl -s -o /dev/null -w "%{http_code}" localhost:3000/map-libre` against `pnpm dev` → 404.

## Scope

**In scope**: `docs/design/world-map-consolidation.md` (create); optionally delete `app/map-libre/page.tsx` + `components/map-libre-world-select.tsx`.

**Out of scope**: modifying `home-events-map.tsx` / `map-shell.tsx` / `city-map.tsx` (consolidation is a FUTURE plan the doc proposes); recreating deleted world-map components; any navigation/link changes (the doc recommends, a follow-up implements).

## Git workflow

- Branch: `advisor/011-map-experiment-consolidation`
- Commits: `docs: decide fate of world map experiments` and, if executed, `chore: remove concluded map-libre comparison page`
- Do NOT push or open a PR unless the operator instructed it.

## Done criteria

- [ ] `docs/design/world-map-consolidation.md` exists with all 5 sections and a clear keep/delete/merge verdict per artifact
- [ ] If deletion executed: `ls app/map-libre 2>&1` → no such directory; `pnpm typecheck` and `pnpm build` exit 0
- [ ] No files outside scope changed (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- Analytics or an external link (`grep -rn "map-libre" ..` beyond the two files, README, or the maintainer's marketing posts if discoverable in the repo) shows the page has real traffic or inbound links — keep it, note it in the doc.
- Evidence that the comparison is NOT concluded (e.g. recent commits still touching `map-libre-world-select.tsx` after `ab0a47e`) — doc only, no deletion.

## Maintenance notes

- If deletion lands, plan 007's future consolidation work has one fewer variant to unify.
- The decision doc should be linked from `AGENTS.md`'s Implementation Notes if the maintainer wants agents to stop re-discovering this history (propose it in the doc; do not edit `AGENTS.md` here).
