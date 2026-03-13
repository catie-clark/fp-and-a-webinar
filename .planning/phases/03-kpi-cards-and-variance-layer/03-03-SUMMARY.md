---
phase: 03-kpi-cards-and-variance-layer
plan: "03"
subsystem: ui
tags: [react, redux, iconsax, countup, kpi-cards, variance-delta, amber-glow, framer-motion]

# Dependency graph
requires:
  - phase: 03-kpi-cards-and-variance-layer/03-01
    provides: RED test stubs for all 8 KPI selectors
  - phase: 03-kpi-cards-and-variance-layer/03-02
    provides: scenarioSlice, kpiSelectors, CountUp component, icon exports, amber glow CSS

provides:
  - KpiCard.tsx — animated metric card with CountUp, variance delta badge, and amber glow on value change
  - KpiSection.tsx — 4x2 KPI grid wired to all 8 Redux selectors (Net Sales, COGS, Gross Profit, EBITDA, Cash, AR, AP, Inventory)
  - DashboardApp.tsx — dispatches initializeFromSeedData on mount, renders KpiSection with real GL data
  - First visible financial data in the browser — dashboard shows real GL values to end users

affects: [04-close-tracker, 05-scenario-panel, 06-charts, 08-ai-narrative]

# Tech tracking
tech-stack:
  added: [caniuse-lite (browserslist compat)]
  patterns:
    - KpiCard prevValueRef pattern — tracks previous value for CountUp from-prop and amber glow guard (fires only on change, not first render)
    - KpiSection inline base-value computation — delta = (current - base) / |base|, with Net Sales using seedData.baseInputs.variancePct directly (DYNM-02)
    - DashboardApp useEffect seed pattern — dispatches initializeFromSeedData once on mount, finds baseline preset by id then falls back to presets[0]
    - deltaInverted / deltaNeutral flags — COGS uses inverted colors (positive = bad); AP and Inventory use amber regardless of direction

key-files:
  created:
    - Catie/FP&A Application/fpa-close-efficiency-dashboard/src/components/dashboard/KpiCard.tsx
    - Catie/FP&A Application/fpa-close-efficiency-dashboard/src/components/dashboard/KpiSection.tsx
  modified:
    - Catie/FP&A Application/fpa-close-efficiency-dashboard/src/components/DashboardApp.tsx
    - Catie/FP&A Application/fpa-close-efficiency-dashboard/package.json
    - Catie/FP&A Application/fpa-close-efficiency-dashboard/package-lock.json
    - Catie/FP&A Application/fpa-close-efficiency-dashboard/tsconfig.json

key-decisions:
  - "No 'use client' on KpiCard or KpiSection — they run inside DashboardApp's existing client boundary, no separate directive needed"
  - "CountUp displays raw rounded integers (e.g., 9476000) with prefix/suffix labels rather than compact formatting — simpler and works well for a webinar demo"
  - "tsconfig.json jsx changed to react-jsx from preserve — required for TypeScript to resolve JSX without Next.js plugin at tsc --noEmit time"
  - "Net Sales delta reads directly from seedData.baseInputs.variancePct (0.034) per DYNM-02 — not computed from selector comparison"

patterns-established:
  - "KpiCard pattern: prevValueRef tracks last value → CountUp from-prop animates from previous not zero on scenario change → glow guard only fires when value actually changes"
  - "deltaInverted flag: COGS treated as inverted (positive delta = costs up = bad = coral red)"
  - "deltaNeutral flag: AP and Inventory show amber regardless of direction (neither purely good nor bad)"
  - "KpiSection base-value inline computation: uses seedData.baseInputs directly with default control constants to compute baseline for delta % — avoids re-running selectors with mock state"

requirements-completed: [KPIS-01, KPIS-02, KPIS-03, KPIS-04, DYNM-02]

# Metrics
duration: ~45min
completed: 2026-03-04
---

# Phase 3 Plan 03: KPI Cards and Variance Layer Summary

**4x2 KPI card grid with CountUp animation, variance delta badges, amber glow on change, and real GL data from Redux selectors — first visible financial output in the browser**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-03-04 (after 03-02 checkpoint approval)
- **Completed:** 2026-03-04
- **Tasks:** 2 auto + 1 checkpoint (human-verify)
- **Files modified:** 6

## Accomplishments

- Built `KpiCard.tsx` — renders Iconsax icon, metric label, animated CountUp value (currency prefix/suffix), and variance delta badge with directional color logic (standard / inverted / neutral)
- Built `KpiSection.tsx` — 4x2 grid wired to all 8 Redux selectors; Net Sales delta reads `variancePct` from seedData (DYNM-02); other 7 metrics compute delta inline against default-control baseline
- Updated `DashboardApp.tsx` — dispatches `initializeFromSeedData` in useEffect on mount; renders `KpiSection` when seedData present; replaced placeholder div slot
- Browser verified by human: 8 cards visible with real GL values (~$9.5M Net Sales), variance deltas showing correctly, CountUp animation on load, warm card styling with no borders

## Task Commits

Each task was committed atomically:

1. **Task 1: Create KpiCard.tsx and KpiSection.tsx** - `640ae95` (feat)
2. **Task 2: Update DashboardApp.tsx to wire KpiSection and seed the store** - `93a04a4` (feat)
3. **Task 3: Checkpoint human-verify — APPROVED** - no separate commit (verification only)
4. **Chore: package.json + tsconfig.json updates** - `a10cda8` (chore)

## Files Created/Modified

- `src/components/dashboard/KpiCard.tsx` — KPI metric card: Iconsax icon, CountUp animation, prevValueRef amber glow guard, variance delta badge with inverted/neutral color flags
- `src/components/dashboard/KpiSection.tsx` — 4x2 grid layout using all 8 Redux selectors, inline baseline computation for delta percentages, Net Sales reads variancePct directly
- `src/components/DashboardApp.tsx` — Dispatches initializeFromSeedData on mount, renders KpiSection replacing placeholder slot, keeps future phase slots intact
- `package.json` — Added caniuse-lite dev dependency
- `package-lock.json` — Updated lockfile
- `tsconfig.json` — jsx: react-jsx, added .next/dev/types to include, reformatted arrays

## Decisions Made

- **No `"use client"` on KpiCard/KpiSection:** Both run inside DashboardApp's existing client boundary — adding separate directives would be redundant and could cause hydration issues.
- **CountUp displays raw integers:** Rather than counting fractional millions (9.476), CountUp counts the raw rounded value (9476000) with a `$` prefix. Simpler implementation, acceptable for a webinar demo.
- **tsconfig.json jsx changed to `react-jsx`:** The original `preserve` setting works fine in Next.js builds but causes `tsc --noEmit` to fail when JSX isn't processed. Changed to `react-jsx` for clean standalone TypeScript checks.
- **Net Sales delta via variancePct:** Per DYNM-02, Net Sales delta must read from `company.json` (via `seedData.baseInputs.variancePct = 0.034`), not from computed selector comparison. This was passed directly to KpiCard delta prop.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tsconfig.json jsx mode changed from preserve to react-jsx**
- **Found during:** Task 1 (KpiCard/KpiSection TypeScript verification)
- **Issue:** `npx tsc --noEmit` failed with JSX-related errors when running outside the Next.js build pipeline; `jsx: preserve` requires Next.js transform to process JSX
- **Fix:** Changed `jsx` from `"preserve"` to `"react-jsx"` in tsconfig.json
- **Files modified:** tsconfig.json
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** a10cda8 (chore commit after checkpoint)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix required for TypeScript clean builds. No scope creep.

## Issues Encountered

- caniuse-lite outdated warning during npm install — resolved by adding explicit version to devDependencies
- CountUp `key` prop strategy: using `key={displayValue}` triggers re-animation on each scenario change (value changes → new key → component remounts → animates from prevValue). This is intentional and matches the plan's per-value animation requirement.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 8 KPI cards rendering with real data — Phase 4 (Close Tracker) can begin immediately
- Redux store fully seeded via `initializeFromSeedData` — scenario controls in Phase 5 can dispatch `setControl` and all 8 selectors will recompute
- Amber glow CSS class (`.kpi-glow` in globals.css) is wired and tested — glow fires correctly on value change
- `slot-close-tracker`, `slot-scenario-panel`, `slot-charts`, `slot-ai-summary` divs remain in DashboardApp for future phases

---
*Phase: 03-kpi-cards-and-variance-layer*
*Completed: 2026-03-04*
