# Plan 017: Lay the SEO groundwork — sitemap, robots, per-city OpenGraph, and structured data

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d1a8440..HEAD -- app/layout.tsx lib/config.ts app/sf/page.tsx app/toronto/page.tsx app/ny/page.tsx app/london/page.tsx app/vancouver/page.tsx app/tokyo/page.tsx app/page.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (metadata and static generation only; no runtime behavior change)
- **Depends on**: none (plan 018's company-page spike EXTENDS this later; do not wait for it)
- **Category**: direction (SEO)
- **Planned at**: commit `d1a8440`, 2026-07-11
- **Execute attempt**: 2026-07-11 — STOPPED before dispatch. `NEXT_PUBLIC_SITE_URL` not present in `.env.local` (key count 0). Set the production site origin, then re-run `/improve execute 017`.

## Why this matters

The maintainer's stated Phase 2 priority is SEO on city pages as a baseline new-visitor inflow channel, and shareable links are the product's viral loop.
Today the repo has no `sitemap.ts`, no `robots.ts`, and zero JSON-LD structured data.
All six city pages set only `title`/`description`, so every share renders the root layout's generic OpenGraph card — which is itself mis-branded: `siteName: "SF AI Startup Map"` on a six-city platform, with an SF-centric default description.
Someone started this work and stopped: `public/ogp-sf-ai-startup-map.png` exists but is referenced nowhere.

## Current state

Files:

- `app/layout.tsx` (85 lines) — root metadata. Lines 15-37:

```ts
export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: pageTitle,
  description: pageDescription,
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    url: siteUrl,
    siteName: "SF AI Startup Map",
    images: [ogImage],
  },
  twitter: { ... same shape ... },
  icons: { icon: [{ url: "/brand-mark.png", type: "image/png" }], apple: "/brand-mark.png" },
}
```

- `lib/config.ts` (13 lines, full contents):

```ts
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

export const pageTitle = "AI Startup Map: Explore AI Native Startups"

export const pageDescription =
  "Browse AI-native startups across San Francisco on an interactive retro quest map, with pixel-art visuals, category filters, and direct company links."

export const ogImage = {
  url: "/ogp-ai-startup-map.png",
  width: 1367,
  height: 768,
  alt: "AI Startup Quest pixel-art key visual",
} as const
```

- Six city pages, identical structure. `app/sf/page.tsx:8-12`:

```ts
export const metadata: Metadata = {
  title: "SF AI Startup Map: Explore AI Native Startups in San Francisco",
  description:
    "Browse AI-native startups across San Francisco on an interactive retro map, with category filters, source-backed locations, and direct company links.",
}
```

No `openGraph` block on any city page (`grep -c "openGraph" app/*/page.tsx` → all 0). Because Next.js does NOT deep-merge a child `openGraph` with the parent's, each page must supply a complete `openGraph` object (or use a shared helper) — partial objects drop the images.

- `app/page.tsx` (13 lines) — top page; has `title`/`description` only; renders `<HomeEventsMap />`. The events dataset it uses is `lib/data/cursor-community-events.json` (shape: `{ cities: [{name, lat, lon, ...}], events: [{id, title, city, date, url, company}] }`), imported statically — so the top page CAN render `Event` JSON-LD server-side without new data fetching.
- City routes: `/`, `/sf`, `/toronto`, `/ny`, `/london`, `/vancouver`, `/tokyo`. Also `/events` (permanent redirect to `/`) and `/map-libre` (unresolved experiment, plan 011) — NEITHER goes in the sitemap.
- City page data: `loadCityMapPageData("<city>")` server-loads companies (each has `slug`, `name`, `website`, `shortDescription`, `category` — see `lib/company.ts:30-43`), so city pages CAN render company `ItemList` JSON-LD server-side. Meetups load client-side (react-query) and are NOT available for server-side JSON-LD on city pages — do not try.
- `public/ogp-sf-ai-startup-map.png` — unreferenced SF-specific OG image (same pixel-art family as the wired `ogp-ai-startup-map.png`, 1367x768; verify dimensions with `sips -g pixelWidth -g pixelHeight public/ogp-sf-ai-startup-map.png` before declaring them).
- Env: `NEXT_PUBLIC_SITE_URL` — pre-check the KEY exists: `grep -c "NEXT_PUBLIC_SITE_URL" .env.local` → ≥1. NEVER print the value or any other line of `.env.local`.

Conventions to match:

- No semicolons, double quotes, 2-space indent (Prettier config in `package.json`).
- Brand language (from `AGENTS.md`): pixel-RPG metaphor for atmosphere only; metadata copy stays plain and product-like. Product name going forward: "AI Startup Quest" (matches `app/page.tsx:6` and the top-page header).
- City display names and copy: reuse each city page's existing `title`/`description` wording as the OG title/description — do not rewrite marketing copy.

## Commands you will need

| Purpose   | Command                      | Expected on success |
|-----------|------------------------------|---------------------|
| Typecheck | `corepack pnpm typecheck`    | exit 0              |
| Tests     | `corepack pnpm test`         | all pass            |
| Lint      | `corepack pnpm lint`         | exit 0, no warnings |
| Build     | `corepack pnpm build`        | exit 0; route list shows `/sitemap.xml`, `/robots.txt` |
| Dev       | `corepack pnpm dev`          | serves on localhost (JSON-LD inspection) |

## Scope

**In scope** (the only files you should modify/create):

- `app/layout.tsx` (siteName fix only)
- `lib/config.ts` (neutral description + shared metadata helper)
- `app/sf/page.tsx`, `app/toronto/page.tsx`, `app/ny/page.tsx`, `app/london/page.tsx`, `app/vancouver/page.tsx`, `app/tokyo/page.tsx` (metadata + ItemList JSON-LD)
- `app/page.tsx` (openGraph + Event JSON-LD)
- `app/sitemap.ts`, `app/robots.ts` (create)

**Out of scope** (do NOT touch, even though they look related):

- `components/home-events-map.tsx`, `components/city-map.tsx` — client components; plans 015/016/019 own them. JSON-LD goes in the server page files.
- `app/map-libre/page.tsx` and `/events` — excluded surfaces; no metadata work there.
- Company detail pages / per-company OG — plan 018's spike decides that; do not invent routes.
- `app/globals.css` — never (repo rule).
- No new dependencies (no `schema-dts` etc.; plain object literals serialized with `JSON.stringify`).

## Git workflow

- Branch: `advisor/017-seo-groundwork`
- Conventional commits in English, e.g. `feat: add sitemap, robots, and per-city OpenGraph metadata`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Neutralize the root branding

- `app/layout.tsx:24`: `siteName: "SF AI Startup Map"` → `siteName: "AI Startup Quest"`.
- `lib/config.ts`: change `pageDescription` from the SF-only sentence to a six-city one, e.g. `"Explore AI events and AI-native startups across San Francisco, Toronto, New York, London, Vancouver, and Tokyo on an interactive pixel-art quest map."` Keep `pageTitle` as is (it is intentionally generic).

**Verify**: `grep -n "SF AI Startup Map" app/layout.tsx` → no matches; `corepack pnpm typecheck` → exit 0.

### Step 2: Add a shared page-metadata helper and per-city OpenGraph

In `lib/config.ts`, add:

```ts
export function buildPageMetadata({
  title,
  description,
  path,
  image = ogImage,
}: {
  title: string
  description: string
  path: string
  image?: typeof ogImage
}) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: "website",
      url: path,
      siteName: "AI Startup Quest",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  } satisfies Metadata
}
```

(Import `type { Metadata } from "next"`; relative `path`/image URLs resolve against `metadataBase`.)

Then in each of the six city pages and `app/page.tsx`, replace the bare `export const metadata` object with `export const metadata: Metadata = buildPageMetadata({ title: <existing title>, description: <existing description>, path: "/<city>" })` — preserving each page's existing title/description strings verbatim. For `app/sf/page.tsx`, pass `image: sfOgImage` where `sfOgImage` is a new const in `lib/config.ts` pointing at `/ogp-sf-ai-startup-map.png` with its measured dimensions (Step 0 of this step: run the `sips` command from Current state). For `app/page.tsx`, `path: "/"`.

**Verify**: `grep -c "buildPageMetadata" app/sf/page.tsx app/toronto/page.tsx app/ny/page.tsx app/london/page.tsx app/vancouver/page.tsx app/tokyo/page.tsx app/page.tsx` → 7 files each ≥1; `grep -rn "ogp-sf-ai-startup-map" lib` → 1 match; `corepack pnpm typecheck` → exit 0.

### Step 3: Add `app/sitemap.ts` and `app/robots.ts`

`app/sitemap.ts` — static list, absolute URLs from `siteUrl`:

```ts
import type { MetadataRoute } from "next"

import { siteUrl } from "@/lib/config"

const ROUTES = ["/", "/sf", "/toronto", "/ny", "/london", "/vancouver", "/tokyo"]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl ?? ""
  return ROUTES.map((route) => ({
    url: `${base}${route}`,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8,
  }))
}
```

`app/robots.ts` — allow all, point at the sitemap (`rules: { userAgent: "*", allow: "/" }`, `sitemap: `${siteUrl}/sitemap.xml``). Do not disallow `/map-libre` (its fate is plan 011's; it is simply not listed).

**Verify**: `corepack pnpm build` → exit 0 and the route summary includes `/sitemap.xml` and `/robots.txt`; then `corepack pnpm dev` + `curl -s localhost:3000/sitemap.xml | grep -c "<url>"` → 7.

### Step 4: JSON-LD

1. **Top page (`app/page.tsx`)**: import the events JSON (`import cursorCommunityEvents from "@/lib/data/cursor-community-events.json"`) and render one `<script type="application/ld+json">` in the page component with an `ItemList` of `Event` objects (cap at the 20 soonest upcoming by `date` to keep the payload sane): `{"@type": "Event", name, startDate: date, url, eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", location: {"@type": "Place", address: {"@type": "PostalAddress", addressLocality: city}}}`. City-level location ONLY — venue/street data is hidden by product design; never add finer address fields. Serialize with `JSON.stringify`; render via `dangerouslySetInnerHTML` on the script tag (the standard Next.js JSON-LD pattern; the data is a build-time repo file, not user input).
2. **City pages**: in each page component (which already awaits `loadCityMapPageData`), render an `ItemList` of `Organization` objects from `companies`: `{"@type": "Organization", name, url: website, description: shortDescription}`. Extract a tiny shared helper if you like (e.g. `lib/structured-data.ts` — if you create it, add it to the in-scope list in your report), but plain inline literals per page are also acceptable; prefer whichever stays under ~15 lines per page.

**Verify**: `corepack pnpm dev` then `curl -s localhost:3000 | grep -o 'application/ld+json' | wc -l` → ≥1 and `curl -s localhost:3000/sf | grep -o 'application/ld+json' | wc -l` → ≥1; validate one payload by eye: `curl -s localhost:3000 | grep -o '<script type="application/ld+json">.*</script>' | head -c 500` shows well-formed JSON starting with `{"@context":"https://schema.org"`.

## Test plan

No unit tests — this is metadata and static output; the repo has no page-level test infrastructure (plan 003 owns that posture).
The regression net is `typecheck` + `build` + the curl checks above.
Sanity-check that no page's `<title>` changed: `curl -s localhost:3000/sf | grep -o "<title>[^<]*"` matches the pre-change title string.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm build` all exit 0
- [ ] `curl -s localhost:3000/sitemap.xml | grep -c "<url>"` → 7; `curl -s localhost:3000/robots.txt | grep -c Sitemap` → 1
- [ ] All 7 pages emit `og:title` + `og:image` (`curl -s localhost:3000/tokyo | grep -c 'property="og:image"'` → ≥1, spot-check 2 more cities)
- [ ] `grep -rn '"SF AI Startup Map"' app lib` → no matches
- [ ] JSON-LD present on `/` (Event ItemList) and all six city pages (Organization ItemList)
- [ ] No files outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `grep -c "NEXT_PUBLIC_SITE_URL" .env.local` → 0 (sitemap/robots would emit relative or empty origins; the maintainer must set the production URL first). Remember: never print `.env.local` contents.
- The "Current state" excerpts don't match the live code.
- You are tempted to add per-meetup Event JSON-LD to CITY pages — meetups are client-fetched there; that needs a data-loading change that belongs to a future plan.
- Any step seems to require a new dependency.

## Maintenance notes

- Plan 018 (company-page spike) will extend `app/sitemap.ts` with per-company URLs and add `Organization` pages; keep `ROUTES` easy to append to.
- When plan 011 resolves `/map-libre` and plan 009 lands new surfaces, revisit the sitemap list.
- The Event JSON-LD reads the same hand-maintained JSON as the top page; if plan 015's slimming lands (past events pruned), the "20 soonest" cap simply reads fresher data — no interaction.
- Reviewer focus: that each page's `openGraph` object is complete (images included) — Next.js replaces, not merges, the parent object.
