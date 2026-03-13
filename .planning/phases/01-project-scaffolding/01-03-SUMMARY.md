---
plan: 01-03
phase: 01-project-scaffolding
status: complete
completed: "2026-03-04"
duration_min: 45
self_check: PASSED
---

# Plan 01-03 Summary — App Entry Points, Formatters, Icons

## One-Liner

Created `layout.tsx`, `page.tsx`, `DashboardApp.tsx`, `formatters.ts`, and the Iconsax SSR wrapper — app boots at localhost:3000 and passes all 21 Vitest tests with tsc clean.

## What Was Built

- **src/lib/formatters.ts** — `formatCurrency` (compact M/K/full) and `formatPercent` (decimal/non-decimal); handles negatives, zero, and edge cases
- **src/components/ui/icons.tsx** — `'use client'` boundary re-exporting 23 Iconsax icons; prevents `window is not defined` SSR errors
- **src/app/layout.tsx** — Server Component HTML shell with blocking `setAttribute('data-theme')` script (no flash of wrong theme), `suppressHydrationWarning`
- **src/app/page.tsx** — Server Component root page, renders `<DashboardApp />` with no props (data wired in Phase 2)
- **src/components/DashboardApp.tsx** — `'use client'` Redux Provider shell using `makeStore + useRef` pattern (prevents SSR state leak)
- **next-env.d.ts** — created manually (gitignored); tsc was failing without it
- **postcss.config.mjs** — added for Tailwind v4 (`@tailwindcss/postcss`)

## Test Results

All 21/21 Vitest tests GREEN:
- `csv.test.ts` — 4/4 ✓
- `formatters.test.ts` — 10/10 ✓
- `icons.test.ts` — 2/2 ✓
- `layout.test.ts` — 5/5 ✓

`tsc --noEmit` — 0 errors

## Human Verification

**Approved** — app boots at localhost:3000, no console errors, Phase 1 boot confirmed message visible.

## Key Deviations

1. **BOM in globals.css** — original file had UTF-8 BOM (`\xEF\xBB\xBF`) causing Turbopack parse failure on Vercel; stripped with Node.js
2. **Empty @types stubs** — `@types/d3-color`, `@types/d3-path`, `@types/deep-eql` were installed but empty directories; deleted to fix TS2688 errors
3. **react-redux corrupted** — `dist/react-redux.d.ts` missing from initial install; `npm install react-redux` repaired it
4. **tailwindcss missing** — `globals.css` uses `@import "tailwindcss"` (v4 syntax) but package was not in `package.json`; added `tailwindcss ^4.0.0` and `@tailwindcss/postcss ^4.0.0` + `postcss.config.mjs`
5. **tsconfig exclude** — added `src/**/__tests__/**` to exclude to prevent vitest globals (`describe`, `it`, `expect`) from causing tsc errors

## Key Files

### Created
- `Catie/FP&A Application/fpa-close-efficiency-dashboard/src/lib/formatters.ts`
- `Catie/FP&A Application/fpa-close-efficiency-dashboard/src/components/ui/icons.tsx`
- `Catie/FP&A Application/fpa-close-efficiency-dashboard/src/app/layout.tsx`
- `Catie/FP&A Application/fpa-close-efficiency-dashboard/src/app/page.tsx`
- `Catie/FP&A Application/fpa-close-efficiency-dashboard/src/components/DashboardApp.tsx`
- `Achyuth/postcss.config.mjs`

### Modified
- `Achyuth/package.json` — added tailwindcss v4, @tailwindcss/postcss
- `Achyuth/tsconfig.json` — excluded __tests__ dirs
- `Achyuth/src/app/globals.css` — stripped BOM

## Commits

- `5025e24` feat(01-03): create formatters.ts and icons.tsx SSR wrapper
- `de5eaf9` feat(01-03): create layout.tsx, page.tsx, DashboardApp.tsx — Phase 1 app skeleton complete, tsc clean
- `7289631` fix(achyuth): add tailwindcss v4, postcss config, strip BOM from globals.css
