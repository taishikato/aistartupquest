# Plan 018: Design spike — company detail pages (the SEO route the data model is already shaped for)

> **Executor instructions**: This is a DESIGN SPIKE, not a build plan.
> The deliverable is a written design document; no production code changes.
> If anything in the "STOP conditions" section occurs, stop and report.
> When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d1a8440..HEAD -- lib/company.ts lib/city-page-data.ts components/selected-company-panel.tsx components/city-map.tsx app/sf/page.tsx app/sitemap.ts`
> On drift, re-read the changed files before writing the design.

## Status

- **Priority**: P2
- **Effort**: M (spike; the build it specifies is estimated inside the deliverable)
- **Risk**: LOW (doc only)
- **Depends on**: none strictly; if plan 017 (SEO groundwork) has landed, design against its `buildPageMetadata` helper and `app/sitemap.ts`
- **Category**: direction
- **Planned at**: commit `d1a8440`, 2026-07-11

## Why this matters

The maintainer's strategy names company pages, alongside city pages, as the baseline SEO inflow channel, and the "listing loop" — startups coming to get listed and then sharing their listing — as a core traffic source.
Every ingredient for company pages already exists EXCEPT the route: each company has a unique `slug`, a server data loader, a fully designed detail view, and even a working `?c=<slug>` deep link — but that detail view is trapped as client-only panel state with no crawlable URL and no per-company OpenGraph card to share.
This spike decides the URL scheme, canonicalization, rendering approach, and metadata story so a later build plan can execute without design churn.

## Current state (evidence for the spike to build on)

- **No company routes exist.** `find app -name 'page.tsx'` → `/` + six city pages + `/events` (redirect) + `/map-libre` (experiment, plan 011).
- **The data model is page-ready.** `lib/company.ts:30-43` — `Company` type: `slug`, `name`, `website`, `shortDescription`, `category`, `locationLabel`, `city`, `coordinates`, `founded`, `logoUrl?`, `mapSprite?`, `sourceUrl`. Loaded server-side by `loadCityMapPageData(city)` in `lib/city-page-data.ts` from the Supabase `companies` table.
- **The detail view is designed.** `components/selected-company-panel.tsx` renders name, category pill, description, location, founded year, source link, and website CTA for a selected company — this is the content a company page would show; the spike decides whether to reuse its markup or define a page-specific layout.
- **Deep links already exist.** `components/city-map.tsx:70-78` resolves `?c=<slug>` from `useSearchParams` into the selected company, and `syncSelectionToUrl` (`city-map.tsx:255-294`) writes selection back via `history.replaceState`. Any company page design must decide the canonical relationship between `/sf?c=cursor`-style links and the new route.
- **Metadata infrastructure**: root metadata in `app/layout.tsx:15-37` (`metadataBase` from `NEXT_PUBLIC_SITE_URL`); if plan 017 landed there is a `buildPageMetadata` helper in `lib/config.ts` and an `app/sitemap.ts` with a `ROUTES` list to extend.
- **Brand rules** (from `AGENTS.md`): startups are sprites/bosses on the map — game metaphor for atmosphere only; action words plain (the page CTA is "Visit website", not "Enter the dungeon"). Dark pixel-RPG theme, hard borders, no rounded corners, no gradients.
- **Scale facts** (verify at spike time): count companies per city and total (read-only Supabase query via the existing loader in a scratch script, or count rows in the seed source `lib/yc-sf-companies.ts` for a floor) — the total drives the static-generation strategy.

## Deliverable

Write `docs/design/company-pages.md` containing:

1. **URL scheme decision** — compare at least: (a) `/company/[slug]` (global namespace; city in content), (b) `/[city]/c/[slug]` or `/sf/company/[slug]` (city-scoped; matches how users browse), (c) promoting the existing `?c=` query into a crawlable route via `generateMetadata` on the city page (rejected-by-default: query params force dynamic rendering and don't give per-company URLs — argue it honestly anyway). Recommend ONE, with slug-collision handling across cities stated explicitly (slugs are unique per table today — verify and cite).
2. **Canonicalization** — what `<link rel="canonical">` the company page carries, what happens to `/sf?c=<slug>` links (keep working as map deep links; do they get `rel=canonical` pointing at the company page? city pages are client-rendered maps — state the mechanism honestly), and how the map's "share this company" affordance (if any) should point at the new route.
3. **Rendering & data strategy** — server component fetching one company by slug (new `lib/` loader beside `loadCityMapPageData`); `generateStaticParams` + revalidation interval vs. fully dynamic; what happens for an unknown slug (404 via `notFound()`); whether `selected-company-panel.tsx` markup is reused (extract shared pieces) or the page gets its own layout with a "view on the map" link back to `/<city>?c=<slug>`.
4. **Metadata & structured data** — per-company title/description/OG (via plan 017's `buildPageMetadata` if present), `Organization` JSON-LD, and sitemap integration (dynamic entries appended to `app/sitemap.ts` — note it must become async and query Supabase, or read a build-time export; decide).
5. **Listing-loop hooks** — the smallest affordances that make startups share their page: a copy-link/share control, and where the page invites "add your startup" (the existing company-request flow at `components/company-request-panel.tsx`). No new social features — just wiring what exists.
6. **Build estimate & plan list** — S/M/L per piece and the follow-up plan(s) you would write (likely one build plan; state its scope boundary against plan 017).
7. **Open questions for the maintainer** — anything requiring product judgment (e.g. should companies opt in/out of a public page; does the page show the map sprite art).

## Scope

**In scope**: `docs/design/company-pages.md` (create `docs/design/` if absent); read-only exploration anywhere in the repo; read-only row counts against Supabase via existing loaders if convenient.

**Out of scope**: ANY change to `app/`, `lib/`, `components/`, `scripts/`, `package.json`, Supabase schema; adding dependencies; committing scratch scripts.

## Git workflow

- Branch: `advisor/018-spike-company-pages`
- Single commit: `docs: design spike for company detail pages`
- Do NOT push or open a PR unless the operator instructed it.

## Done criteria

- [ ] `docs/design/company-pages.md` exists and covers all 7 deliverable sections
- [ ] Every claim about current code cites a `file:line`
- [ ] ONE recommended URL scheme and ONE rendering strategy are stated (not a menu)
- [ ] The slug-uniqueness claim is verified against the actual data/schema and cited
- [ ] No files outside `docs/design/` changed (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- Company slugs turn out NOT to be globally unique (collisions across cities) — record the collision cases in the doc and present scheme options to the maintainer instead of recommending one.
- The design starts requiring product decisions with no repo grounding (pricing, claiming/verification flows for companies) — list them as open questions, do not design them.

## Maintenance notes

- This doc plus plan 017's helpers become the input for the build plan; keep it decision-oriented.
- Interacts with plan 019 (top-page deep links) only at the share-affordance level; neither blocks the other.
- The strategy doc's Phase 3 (guilds/sponsored layers) may later want company pages to carry guild affiliations — note the extension point, do not design it.
