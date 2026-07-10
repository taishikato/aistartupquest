# Plan 011: Design spike — resolve the world-map experiments (4 selectors, /map-libre page)

> **Executor instructions**: This is a DESIGN SPIKE with a small cleanup
> option at the end. The primary deliverable is a decision document; the
> optional Step is a deletion the maintainer pre-approves by selecting it.
> If anything in the "STOP conditions" section occurs, stop and report.
> When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ba0778c..HEAD -- app/map-libre app/page.tsx app/events components/world-globe-select.tsx components/world-map-select.tsx components/map-libre-world-select.tsx components/events-world-map.tsx`
> On drift, re-read the changed files before writing the decision doc.

## Status

- **Priority**: P3
- **Effort**: S-M
- **Risk**: LOW (doc) / MED (if the deletion step is executed)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `ba0778c`, 2026-07-06

## Why this matters

The repo carries four world-map selector components and an unlisted comparison page, which together confuse every audit, refactor, and new contributor:

- `components/world-globe-select.tsx` (478 lines) — the LIVE landing page globe (`app/page.tsx` imports it).
- `components/world-map-select.tsx` (280 lines) — the flat fallback, rendered when WebGL fails (`world-globe-select.tsx:401-402`: `if (shouldUseFallback) return <WorldMapSelect />`). Live, but only on fallback.
- `components/map-libre-world-select.tsx` (245 lines) — used ONLY by `app/map-libre/page.tsx`, a page whose own metadata says "Compare the RPG world map with a MapLibre-powered world map city selector". Not linked from any navigation (verify: `grep -rn '"/map-libre"' app components` — only the page itself).
- `components/events-world-map.tsx` (697 lines) — the LIVE `/events` world map (globe + flat, ART/ATLAS styles). Recent git history (last ~15 commits, `957d57c`..`ba0778c`) is almost entirely this component — it is the active experiment that appears to have WON the comparison.

The comparison the `/map-libre` page exists for looks concluded: the events map went maplibre-with-art-style and shipped.
Keeping the losing branch of an experiment as an unlisted route costs maintenance (it was audited for bugs today, again) without informing any future decision.

## Current state (facts for the decision)

- `app/map-libre/page.tsx` (13 lines) — full contents render `<MapLibreWorldSelect />` with compare-page metadata.
- `/events` is likewise not linked from the main navigation at `ba0778c` (verify: `grep -rn '"/events"' app components` and check `components/discovery-panel.tsx` / the landing page for links) — decide its exposure too.
- `lib/world-art-map.ts`, `lib/world-atlas-style.ts`, `lib/world-stage-cities.ts` — style/data deps of the events map; `lib/data/cursor-community-events.json` feeds it.
- The duplication pattern across all four components: map bootstrap + marker creation + fallback handling, each hand-rolled (see also plan 007's out-of-scope note deferring consolidation to this spike).

## Deliverable

Write `docs/design/world-map-consolidation.md` containing:

1. **Inventory table** — the four components + two pages: route, purpose, live/experimental, lines, unique capabilities (globe rotation, ART/ATLAS toggle, WebGL fallback, meetup counts...).
2. **Decision per artifact** — keep / delete / merge, with one-line justification each. The default hypothesis to confirm or refute: delete `/map-libre` + `map-libre-world-select.tsx` (experiment concluded), keep the rest.
3. **Exposure decision** — should `/events` be linked from the landing globe or sidebar; if yes, where (one sentence, honoring the guild/quest brand language from `CLAUDE.md`).
4. **Consolidation sketch** — IF two or more survivors share enough (marker creation, fallback), sketch the shared hook/module and estimate effort; if the sharing is superficial, say "not worth it" explicitly (a valid verdict).
5. **Open questions for the maintainer.**

### Optional Step (execute ONLY if the doc's own conclusion is "delete" and no STOP condition fired)

Delete `app/map-libre/page.tsx` and `components/map-libre-world-select.tsx`.

**Pre-check**: `grep -rn "map-libre-world-select\|MapLibreWorldSelect" app components lib --include='*.ts*'` → only the two files being deleted.

**Verify**: `pnpm typecheck` → exit 0; `pnpm build` → exit 0; `curl -s -o /dev/null -w "%{http_code}" localhost:3000/map-libre` against `pnpm dev` → 404.

## Scope

**In scope**: `docs/design/world-map-consolidation.md` (create); optionally delete `app/map-libre/page.tsx` + `components/map-libre-world-select.tsx`.

**Out of scope**: modifying the surviving components (consolidation is a FUTURE plan the doc proposes); `components/world-map-select.tsx` (live fallback — never delete here); any navigation/link changes (the doc recommends, a follow-up implements).

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
- Evidence that the comparison is NOT concluded (e.g. recent commits still touching `map-libre-world-select.tsx` after `ba0778c`) — doc only, no deletion.

## Maintenance notes

- If deletion lands, plan 007's future consolidation work has one fewer variant to unify.
- The decision doc should be linked from `AGENTS.md`'s Implementation Notes if the maintainer wants agents to stop re-discovering this history (propose it in the doc; do not edit `AGENTS.md` here).
