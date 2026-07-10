# Plan 004: Remove dead code and misplaced dependencies

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ba0778c..HEAD -- lib/yc-sf-companies.ts lib/supabase/middleware.ts components/theme-provider.tsx app/layout.tsx package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (001 recommended first so lockfile churn happens once)
- **Category**: tech-debt
- **Planned at**: commit `ba0778c`, 2026-07-06

## Why this matters

Four pieces of dead weight confuse both humans and coding agents working in this repo:
a 944-line static data file nothing imports, an unwired Supabase middleware helper that implies auth exists when it does not, a theme provider that can never switch themes in a deliberately dark-only app, and the `shadcn` CLI sitting in production `dependencies` where it drags a large transitive tree (`@modelcontextprotocol/sdk`, `express`, ...) into installs and `pnpm audit` noise.
Removing them shrinks the surface every future audit, refactor, and onboarding has to wade through.

## Current state

Verified at commit `ba0778c` (re-verify each with the grep commands in the steps — that IS the drift check):

- `lib/yc-sf-companies.ts` (944 lines) — exports static YC company data; `grep -rn "yc-sf-companies" app components lib scripts tests` returns only the file itself. Dead.
- `lib/supabase/middleware.ts` — a Supabase session-refresh helper for Next.js middleware; there is NO root `middleware.ts` (or `app/middleware.ts` / `proxy.ts`) in the repo, and `grep -rn "supabase/middleware" app lib components` returns nothing. Never executed.
- `components/theme-provider.tsx` — wraps `next-themes`. Used exactly once, in `app/layout.tsx:74-78`:

```tsx
// app/layout.tsx:74-80
<ThemeProvider
  attribute="class"
  forcedTheme="light"
  disableTransitionOnChange
>
  <QueryProvider>{children}</QueryProvider>
</ThemeProvider>
```

`forcedTheme` pins a single theme forever, and the project rule (`CLAUDE.md` UI Rules) says "there is no light/dark toggle. Do not add one." — so `next-themes` does nothing except add a client provider and ~KBs to the bundle.
Note the app's styling does NOT depend on a `light`/`dark` class: verify with `grep -rn "dark:" app components | head` and by checking `app/globals.css` for `.light` / `.dark` selectors before removing (see STOP conditions).

- `package.json` dependencies include `"shadcn": "^4.1.0"` — this is the shadcn CLI (component generator), not a runtime library. `grep -rn "from \"shadcn\"\|require(\"shadcn\")" app components lib` returns nothing. `components.json` exists for the CLI's config; the CLI can still be run via `pnpm dlx shadcn` when needed.
- `pnpm audit --prod` currently reports HIGH advisories (`path-to-regexp`, `fast-uri` via `@modelcontextprotocol/sdk`/`express`) that are reachable only through `shadcn` — moving it out of `dependencies` removes them from the `--prod` audit surface.

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|------------------|---------------------|
| Install   | `pnpm install`   | exit 0              |
| Typecheck | `pnpm typecheck` | exit 0              |
| Tests     | `pnpm test`      | all pass            |
| Lint      | `pnpm lint`      | exit 0              |
| Build     | `pnpm build`     | exit 0 (needs `.env.local`) |
| Audit     | `pnpm audit --prod` | no `shadcn`-path advisories |

## Scope

**In scope** (the only files you should modify/delete):
- `lib/yc-sf-companies.ts` (delete)
- `lib/supabase/middleware.ts` (delete)
- `components/theme-provider.tsx` (delete)
- `app/layout.tsx` (remove the ThemeProvider import and wrapper only)
- `package.json` + `pnpm-lock.yaml` (remove `next-themes`; remove `shadcn` from dependencies)

**Out of scope** (do NOT touch, even though they look related):
- `components.json` — keep; it is the shadcn CLI config and harmless.
- `lib/supabase/{admin,client,server}.ts` — all three are live.
- `components/world-map-select.tsx` — it LOOKS like a dead duplicate but is the WebGL-failure fallback used by `components/world-globe-select.tsx:402`. Do not delete.
- Any styling change — removing the provider must not alter rendered CSS.

## Git workflow

- Branch: `advisor/004-remove-dead-code`
- One commit per deletion group is fine; conventional commits in English (e.g. `chore: remove unused yc-sf-companies data file`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Delete the dead data file

**Verify first**: `grep -rn "yc-sf-companies" app components lib scripts tests --include='*.ts*' | grep -v 'lib/yc-sf-companies.ts'` → empty output.
Then `git rm lib/yc-sf-companies.ts`.

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Delete the unwired middleware helper

**Verify first**: `ls middleware.ts app/middleware.ts proxy.ts 2>&1` → all "No such file"; `grep -rn "supabase/middleware" app lib components --include='*.ts*'` → empty.
Then `git rm lib/supabase/middleware.ts`.

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Remove next-themes

1. In `app/layout.tsx`: delete the `ThemeProvider` import (line 13) and unwrap it so `<QueryProvider>{children}</QueryProvider>` sits directly inside `<body>`. Keep `suppressHydrationWarning` on `<html>` only if something else needs it — with next-themes gone it was only needed for theme class injection, so remove it too unless the grep in the pre-check below shows another reason.
2. `git rm components/theme-provider.tsx`.
3. Remove `"next-themes"` from `package.json` dependencies; run `pnpm install`.

**Pre-check**: `grep -rn "useTheme\|next-themes" app components lib --include='*.ts*' | grep -v theme-provider` → must be empty before deleting.

**Verify**: `pnpm typecheck` → exit 0; `pnpm build` → exit 0; visually the app renders identically (dark pixel theme comes from `globals.css`, not from the provider).

### Step 4: Move shadcn out of production dependencies

Remove `"shadcn": "^4.1.0"` from `dependencies` in `package.json`.
Do not re-add it to `devDependencies` — the CLI is invoked on demand via `pnpm dlx shadcn@latest ...`; add a one-line note to that effect in `README.md` ONLY if plan 008 has not already landed (008 owns README content; if 008 is done, put the note there via its conventions — or skip the note and mention it in your report).
Run `pnpm install`.

**Verify**: `pnpm audit --prod` → no advisories whose path starts with `shadcn >`; `pnpm build` → exit 0.

## Test plan

No new tests: deletions of unreferenced code.
Regression gate is the full suite: `pnpm typecheck && pnpm test && pnpm lint && pnpm build`.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `ls lib/yc-sf-companies.ts lib/supabase/middleware.ts components/theme-provider.tsx 2>&1` → all three "No such file or directory"
- [ ] `grep -n "next-themes\|\"shadcn\"" package.json` → no matches
- [ ] `grep -n "ThemeProvider" app/layout.tsx` → no matches
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm lint` exit 0; `pnpm build` exits 0
- [ ] `git status` shows only in-scope files changed
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any pre-check grep in Steps 1-3 returns matches — the file is no longer dead; the codebase drifted.
- Removing the ThemeProvider changes rendered styling (check: `grep -rn "dark:\|\.light\b" app components app/globals.css` before Step 3; if Tailwind `dark:` variants or a `.light` class selector are in use, the forced theme class was load-bearing — stop and report).
- `pnpm build` fails after removing `shadcn` — something imports it at build time after all.

## Maintenance notes

- If a theme toggle is ever requested, it contradicts the standing UI rule in `CLAUDE.md`; resolve the rule first, then reintroduce next-themes deliberately.
- Company data lives in Supabase (`companies` table); anyone looking for a static company list after this change should be pointed to the migrations under `supabase/migrations/*seed*`.
