# Design spike: company detail pages

Status: **URL scheme undecided** (slug uniqueness STOP path).
Date: 2026-07-11.
Branch context: `advisor/018-spike-company-pages`.
Soft dependency: plan 017 (SEO groundwork) has **not** landed — there is no `buildPageMetadata` in `lib/config.ts` and no `app/sitemap.ts` yet.
Live Supabase was unavailable in this worktree (no `.env.local`).
Scale facts and collision checks below come from schema/migrations + seed SQL, not a live row count.

## Why this exists

City pages already load companies server-side and show a rich selected-company panel, but that panel is client-only state behind `?c=<slug>`.
There is no crawlable per-company URL and no per-company OpenGraph card.
This spike locks the design so a later build plan can ship without re-deciding URL shape, canonical rules, rendering, or metadata.

---

## 1. URL scheme options (no single recommendation)

### STOP finding: slugs are NOT globally unique

The original plan text assumed global uniqueness.
That assumption is false in both schema and seed data.

**Schema evidence**

`supabase/migrations/20260330132000_companies_city_slug_unique.sql:1-7` drops the old global unique constraint and replaces it with a composite one:

```sql
-- Allow the same company slug in different cities (e.g. Modal in SF and NY).
alter table public.companies
drop constraint if exists companies_slug_key;

alter table public.companies
add constraint companies_city_slug_key unique (city, slug);
```

The original create migration had `unique (slug)` at `supabase/migrations/20260330112000_create_companies.sql:27`.
That was intentionally removed so the same brand can appear in multiple cities.

**Verified collision in seed data**

| slug | city | file:line |
|------|------|-----------|
| `cohere` | `sf` | `supabase/migrations/20260330133000_seed_companies.sql:243` |
| `cohere` | `toronto` | `supabase/migrations/20260330151000_seed_toronto_companies.sql:18` |

Both rows are named "Cohere" with website `https://cohere.com`, different `location_label` / coordinates / city.
No later migration deletes or renames either row.

**Modal note (migration comment vs seed reality)**

The constraint migration comment cites "Modal in SF and NY" as the motivating example (`20260330132000_companies_city_slug_unique.sql:1`).
In current seed/upsert data, `modal` appears only for `sf`:

- `supabase/migrations/20260330133000_seed_companies.sql:618`
- `supabase/migrations/20260330203000_update_modal_sf_office.sql:18`

There is no NY (or other-city) `modal` seed row today.
The schema still allows that collision; Cohere is the concrete existing one.

**Implication:** any URL that keys only on `slug` is ambiguous for at least `cohere`, and will become ambiguous for any future multi-city listing.
A global `/company/[slug]` route cannot safely resolve without city context or a product rule for collisions.
Because of this STOP finding, this section presents options and leaves the final pick to the maintainer.

### Option (a) — `/company/[slug]` (global namespace)

- **Shape:** `/company/cursor`, `/company/cohere`.
- **Pros:** Short share URLs; city is secondary in the brand story ("the company page," then "also on the SF map").
- **Cons / blockers with current data:**
  - Ambiguous for `cohere` (SF vs Toronto).
  - Loader would need a non-unique `.match({ slug })` and then invent disambiguation (pick one city, 404, or redirect to a chooser page).
  - Does not match how users browse today (city maps first).
- **Collision handling if chosen:** must be specified by the maintainer (examples: prefer HQ city; require city query; forbid multi-city same slug going forward and migrate Cohere).
  None of those are grounded as product policy in the repo today — do not invent one in the build plan.

### Option (b) — city-scoped path (recommended shape family; pick exact pattern later)

Two concrete spellings:

1. `/[city]/c/[slug]` — e.g. `/sf/c/cursor`, `/toronto/c/cohere`
2. `/[city]/company/[slug]` — e.g. `/sf/company/cursor`

- **Pros:**
  - Matches DB uniqueness: `(city, slug)` (`companies_city_slug_key`).
  - Matches browsing: users land on city maps (`app/sf/page.tsx` etc.).
  - Map deep link `/sf?c=cursor` and page `/sf/c/cursor` (or `/sf/company/cursor`) share the same identity pair.
  - `generateStaticParams` can emit `{ city, slug }` pairs safely.
- **Cons:**
  - Longer URLs than (a).
  - Same brand with offices in two cities gets two pages (Cohere SF vs Cohere Toronto) — usually desirable for local SEO, but needs a product call on whether those should cross-link.
- **Between the two spellings:** `/c/` is shorter and echoes the existing `?c=` param; `/company/` is more self-describing for humans and sitemaps.
  Maintainer pick; either works with the same loader.

### Option (c) — promote `?c=` on the city page (rejected by default, argued honestly)

Today city pages already resolve selection from the query:

- Read: `components/city-map.tsx:70-78` (`searchParams.get("c")` → `resolveSelectedSlug`)
- Write: `components/city-map.tsx:255-294` (`syncSelectionToUrl` sets `c` via `history.replaceState`)

Could we add `generateMetadata` on `app/sf/page.tsx` that reads `searchParams.c` and emits per-company title/OG?

- **Honest upsides:** zero new routes; reuses the existing deep-link contract; map and "page" stay one surface.
- **Why reject by default for SEO:**
  - Query-param variants are weak crawl targets; Google treats them inconsistently vs path URLs.
  - Next.js App Router metadata that depends on `searchParams` pushes the route toward dynamic rendering; static city shells become harder.
  - Sharing `/sf?c=cursor` still looks like "the SF map with something selected," not a first-class company listing.
  - Collisions are scoped by city path already for `?c=`, but that does not give a stable public company URL identity separate from map state.

Keep `?c=` as the **map deep link / in-app selection sync**.
Do not treat it as the canonical public company page.

### Maintainer decision required

Pick one of:

1. City-scoped path (b1 or b2) — fits the data model with no collision policy invention.
2. Global path (a) — only after a written collision policy for multi-city slugs (at least Cohere).
3. Query-only (c) — only if SEO/share goals are deferred.

This spike does **not** recommend a single scheme while uniqueness remains composite.

---

## 2. Canonicalization

Recommendations below are scheme-agnostic where possible; call out scheme-specific bits.

### Company page canonical

Whatever path is chosen, the company page should set `alternates.canonical` to **itself** (absolute URL via `metadataBase`).

- Today root metadata uses `metadataBase: siteUrl ? new URL(siteUrl) : undefined` at `app/layout.tsx:15` with `siteUrl` from `NEXT_PUBLIC_SITE_URL` (`lib/config.ts:1`).
- Plan 017 proposes `buildPageMetadata({ ..., path })` that sets `alternates: { canonical: path }` (see `plans/017-seo-groundwork.md` Step 2).
  Company pages should use that helper once 017 lands; until then, mirror the same shape locally or land 017 first.

### What happens to `/<city>?c=<slug>`

**Keep them working as map deep links.** They already drive selection (`city-map.tsx:70-78`, `255-294`).
Do not break in-app selection sync.

**Canonical from the city page toward the company page?**

City pages are server shells that render a client map (`app/sf/page.tsx:14-21` → `<CityMap />`).
They export static `metadata` today (`app/sf/page.tsx:8-12`) with title/description only — no `alternates.canonical`, no per-`?c=` awareness.

Honest mechanism options:

| Approach | Feasible? | Notes |
|----------|-----------|-------|
| City page `generateMetadata(searchParams)` emitting canonical → company URL when `c` is present | Technically yes | Forces dynamic metadata; couples city SEO to company routes; still leaves the map URL as the shared link unless UI changes. |
| Client-injected `<link rel="canonical">` from the map when a company is selected | No / bad | Client-only tags are not reliable for crawlers; Next metadata should stay server-side. |
| Leave city metadata as the city page; company page is the only company canonical | Yes (recommended) | `/sf?c=cursor` remains a UX deep link, not the SEO identity. Share UI points at the company route. |

**Recommendation:** do not try to rewrite the city page's canonical based on `?c=`.
City canonical stays `/sf` (or whatever 017 sets).
Company canonical stays the new company route.
Map deep links keep working; they are not the share target.

### Share affordance on the map

There is **no** dedicated "share this company" control today.
Selection is only synced into the URL bar (`syncSelectionToUrl`).
When company pages ship:

- Add a small copy-link control on the selected-company panel (and/or company page) that copies the **company page URL**, not `/sf?c=...`.
- Optionally, when a company is selected, the browser URL can remain `?c=` for map state; the share button is the listing-loop surface.
- Plan 019 (home map deep links) interacts only at this share-affordance level; neither blocks the other.

---

## 3. Rendering & data strategy (one recommendation)

### Recommended strategy (works for any city-scoped scheme; required if uniqueness stays `(city, slug)`)

**Server Component page** that loads one company with a city-scoped loader:

```ts
// proposed beside loadCityMapPageData in lib/city-page-data.ts (or lib/company.ts)
loadCompanyByCityAndSlug(city: CityId, slug: string): Promise<Company | null>
```

Implementation shape (design only):

- Reuse `createAdminClient()` + `companyFromRow` as in `lib/city-page-data.ts:5-24` and `lib/company.ts:95-109`.
- Query: `.from("companies").select(<same columns>).match({ city, slug }).maybeSingle()`.
- Prefer `.match()` over chained `.eq()` (project convention).

**Static generation:**

- `generateStaticParams` returns `{ city, slug }[]` (or nested params matching the chosen path).
- Scale from seeds is ~156 rows (see Scale facts) — fine for full SSG at build time.
- Add `export const revalidate = …` (e.g. 3600 or daily) so new listings appear without a full redeploy; exact interval is a maintainer preference (open question).

**Unknown slug / city mismatch:** call `notFound()`.

**If the maintainer picks global `/company/[slug]` instead:** the loader cannot be city-scoped alone.
You would need `loadCompaniesBySlug(slug)` and a collision policy — do not ship that without the Section 1 decision.

### UI: panel reuse vs dedicated page layout

`components/selected-company-panel.tsx` is a `"use client"` sidebar (`:1`, `:23-27`) with collapse chrome, "Encounter" framing, animated sprite stage, and map-adjacent layout (`lg:flex` aside).
It is the content reference, not a drop-in page.

**Recommendation:**

- Give the company route its **own** server-friendly page layout (readable article/hero, not the collapsible map aside).
- Extract shared presentational pieces already factored in `components/company-identity.tsx` (`CompanyCategoryTag`, `CompanyLogoBadge`) — used by the panel at `selected-company-panel.tsx:15`, `:79`, `:121`.
- Optionally extract a small shared "company facts" block (description, location, founded, source) later if duplication hurts; do not force the whole panel into the page.
- Include a plain CTA: **View on the map** → `/<city>?c=<slug>` (preserves existing deep link).
- Primary external CTA stays product-plain: visit the company website (panel uses `aria-label={`Visit ${company.name}`}` at `selected-company-panel.tsx:98-106` — page copy should say "Visit website", not game vocabulary).

Boss/map-sprite art (`mapSprite === "boss"` at `selected-company-panel.tsx:80-84`, `:113-114`) is optional on the page — see open questions.

---

## 4. Metadata & structured data

### Soft dependency on plan 017

Verified absent in this worktree:

- `app/sitemap.ts` — does not exist.
- `buildPageMetadata` — not in `lib/config.ts` (file is only `siteUrl` / `pageTitle` / `pageDescription` / `ogImage` at `lib/config.ts:1-13`).

Plan 017 designs `buildPageMetadata` and a static `ROUTES` sitemap (`plans/017-seo-groundwork.md` Steps 2–3).
**Build order:** land 017 first (or include its helpers in the company-pages build plan as a prerequisite slice).
Design company metadata against the planned helper, not against inventing a second metadata API.

### Per-company metadata

For each company page:

- `title`: e.g. `{name} · AI Startup Quest` (or `{name} in {City} · …` if city-scoped).
- `description`: `company.shortDescription` (from `Company` at `lib/company.ts:30-43`), truncated if needed for length.
- `openGraph` / `twitter`: via `buildPageMetadata` once available; until then same fields as root `app/layout.tsx:14-36`.
- Default image: shared `ogImage` (`lib/config.ts:7-13`) unless/until per-company OG images exist (out of scope for v1).

### JSON-LD

Emit `Organization` (or `LocalBusiness` only if address quality justifies it — `locationLabel` is a free-text label, not a structured address).

Minimum fields grounded in `Company`:

- `@type`: `Organization`
- `name`, `url` (website), `description` (shortDescription)
- `logo` when `logoUrl` / derived favicon exists (`getCompanyLogoUrl` at `lib/company.ts:85-93`)
- `address` as plain `description`-level text from `locationLabel` if included at all

Do not invent founding-location schema beyond what the row stores.

### Sitemap integration

Plan 017's initial `app/sitemap.ts` is a **static** `ROUTES` list of city paths.
Company pages need entries for every `(city, slug)` (or every slug if global — blocked by collisions).

**Decision for the build plan:** make `sitemap` **async** and query Supabase for company paths at request/build time (same admin client pattern as `loadCityMapPageData`).

- Append company URLs to the city `ROUTES` entries.
- With ~156 seed rows, a single select of `city, slug` is cheap.
- Alternative (build-time JSON export) adds a pipeline and is unnecessary at this scale.
- `changeFrequency`: `weekly` for company URLs is enough; city pages stay as 017 defines.

If 017 ships a sync static sitemap first, the company-pages build plan owns the async + Supabase extension.

---

## 5. Listing-loop hooks

Smallest wiring; no new social products.

1. **Copy link / share on the company page**
   - Button that copies the canonical company URL to the clipboard.
   - Label: "Copy link" / "Share" (plain product language).
   - This is the share surface startups will tweet; map `?c=` stays for map state.

2. **Same control on the map selected panel (optional but high leverage)**
   - `SelectedCompanyPanel` has no share control today.
   - Adding copy-company-page-link there closes the loop for users who discover on the map.

3. **Invite "add your startup"**
   - Existing flow: `CompanyRequestPanel` (`components/company-request-panel.tsx:37`) with CTA **"Add company"** (`:167-169`), mounted from `components/map-shell.tsx:1243`.
   - On the company page: a footer/aside link or button that routes users to the relevant city map (or opens the same request flow if extracted).
   - Do not build a second submission form; link/reuse the existing panel/action (`submitCompanyRequest` at `company-request-panel.tsx:14`).

4. **No new:** comments, claiming, verification badges, social login, or guild affiliation UI (Phase 3 extension point only — see Maintenance).

---

## 6. Build estimate & follow-up plans

| Piece | Size | Notes |
|-------|------|-------|
| URL route + `generateStaticParams` + `notFound` | S–M | M if global scheme needs collision UX |
| `loadCompanyByCityAndSlug` (or collision-aware variant) | S | Beside `lib/city-page-data.ts` |
| Company page layout + map deep-link CTA | M | New layout; extract identity bits only |
| Metadata via `buildPageMetadata` + Organization JSON-LD | S | Depends on 017 helper |
| Async sitemap company entries | S | Extends 017 `app/sitemap.ts` |
| Copy-link on page (+ optional panel) | S | Clipboard only |
| Link into existing Add company flow | S | No new form |

**Overall build:** **M**.

### Follow-up plan to write

One build plan, e.g. **plan 020: ship company detail pages**, with scope boundary:

- **Depends on / after plan 017:** reuse `buildPageMetadata`, extend `app/sitemap.ts` and `app/robots.ts` assumptions; do not re-implement root OG neutralization.
- **Does not include:** plan 019 home deep-link work except copying the company URL from share controls.
- **Blocked on:** maintainer URL-scheme decision from Section 1 of this doc.
- **Out of scope for that build:** claiming/verification, opt-in flags, per-company OG image generation, guild affiliations.

---

## 7. Open questions for the maintainer

1. **URL scheme:** (a) global, (b1) `/[city]/c/[slug]`, (b2) `/[city]/company/[slug]`, or (c) query-only? (Section 1)
2. **Multi-city same brand:** should Cohere SF and Cohere Toronto be two pages with cross-links, or is one canonical "brand" page desired later?
3. **Public by default?** Is every `companies` row automatically a public page, or do we need an opt-in/out column? (No such column exists today in `types/supabase.ts` companies Row.)
4. **Map sprite / boss art on the page?** Show the encounter-stage visual from `selected-company-panel.tsx`, or keep the page calmer for SEO readability?
5. **Revalidate interval** for SSG company pages (hourly vs daily vs on-demand only)?
6. **NY listings:** seed migrations allow `ny` as a city (`20260330154940_allow_ny_in_companies_city.sql`) but no NY company seed file was found; confirm live NY row count before promising sitemap coverage.
7. **Share from map:** is copy-link on the selected panel required in v1, or page-only?

---

## Scale facts (seed-estimated; not live Supabase)

No `.env.local` in this worktree; counts parsed from seed/upsert migrations:

| city | approx companies in seeds |
|------|---------------------------|
| sf | 60 |
| toronto | 11 |
| london | 50 |
| vancouver | 14 |
| tokyo | 21 |
| ny | 0 in seed files |
| **total** | **~156** |

Sources: `20260330133000_seed_companies.sql`, `20260330151000_seed_toronto_companies.sql`, `20260331111000_seed_london_companies.sql`, `20260331121000_seed_vancouver_companies.sql`, `20260406144000_seed_tokyo_companies.sql`.
Upserts for `cursor` / `modal` update existing SF rows rather than adding net-new slugs.

At ~156 pages, full `generateStaticParams` is appropriate; no need for incremental/on-demand-only generation for scale reasons.

Cross-city slug collisions found in seeds: **`cohere` only** (`sf` + `toronto`).

---

## Maintenance notes

- This doc + plan 017 helpers are the input to the company-pages build plan.
- Plan 019 interacts only at share-affordance level.
- Strategy Phase 3 (guilds / sponsored layers) may later attach guild affiliation to company pages — treat as an extension point on the page template; do not design it now.
- Decision-oriented: Section 1 is blocked on maintainer choice; Sections 2–6 are ready to execute once that choice is city-scoped (or a collision policy exists for global).
