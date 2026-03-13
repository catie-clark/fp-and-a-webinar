---
phase: 07-reactive-margin-bridge
plan: 03
subsystem: ui
tags: [recharts, redux, react, margin-bridge, waterfall-chart, dark-mode, amber-glow]

# Dependency graph
requires:
  - phase: 07-reactive-margin-bridge-plan-02
    provides: buildMarginBridgeData (3-param signature), MarginBridgeBar interface, 5 kpiSelectors (selectBaselineEbitda, selectRevenueGrowthImpact, selectGrossMarginImpact, selectFuelIndexImpact, selectOtherLeversImpact)
  - phase: 03-kpi-cards-and-variance-layer
    provides: kpi-glow CSS class + keyframe in globals.css, amber glow pattern from KpiCard.tsx
  - phase: 06-static-charts
    provides: Recharts import patterns from PipelineChart.tsx, ChartsSection client boundary
provides:
  - MarginBridgeChart.tsx: Recharts BarChart with Cell-based per-bar coloring, LabelList above bars, ReferenceLine at y=0, custom tooltip
  - MarginBridgeSection.tsx: card wrapper with live Adjusted EBITDA header, amber glow on EBITDA change, dark mode detection via MutationObserver
  - DashboardApp.tsx: MarginBridgeSection inserted between CloseTracker and ChartsSection
affects:
  - 07-04 or phase 08 (AI narrative — MarginBridgeSection now visible in the webinar flow)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useStore().getState() to pass full Redux state to a 3-param utility function (avoids 6 separate useSelector calls when the utility was implemented with inline state computation)"
    - "MutationObserver on document.documentElement attributeFilter:['data-theme'] for reactive dark mode detection inside client components"
    - "kpi-glow CSS class + force-reflow pattern (void el.offsetHeight) to restart CSS animation on subsequent EBITDA changes"

key-files:
  created:
    - src/components/dashboard/MarginBridgeSection/MarginBridgeChart.tsx
    - src/components/dashboard/MarginBridgeSection/MarginBridgeSection.tsx
  modified:
    - src/components/DashboardApp.tsx

key-decisions:
  - "useStore().getState() used in MarginBridgeSection instead of 6 separate useSelectors — buildMarginBridgeData was implemented in plan 02 with a 3-param (baselineEbitda, adjustedEbitda, state) signature using inline computation; passing full state via useStore().getState() is simpler and avoids redundant selector calls"
  - "No 'use client' in MarginBridgeChart.tsx or MarginBridgeSection.tsx — both run inside DashboardApp.tsx existing client boundary"
  - "MarginBridgeSection renders without seedData conditional guard — useSelector returns 0/default values before store hydration, chart renders all-zero bars safely"

patterns-established:
  - "useStore().getState() pattern: when a pure utility function accepts full state (to avoid circular imports), use useStore().getState() in the consuming component rather than extracting individual values with useSelector"

requirements-completed: [CHRT-01]

# Metrics
duration: 6min
completed: 2026-03-05
---

# Phase 7 Plan 03: MarginBridgeChart and MarginBridgeSection Summary

**Recharts waterfall bar chart with Cell-based per-bar coloring (indigo/amber/coral), amber glow card animation on EBITDA change, and dark mode support — wired into DashboardApp as the reactive "wow moment" between CloseTracker and ChartsSection**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-05T02:36:46Z
- **Completed:** 2026-03-05T02:42:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created MarginBridgeChart.tsx with ResponsiveContainer, BarChart, Cell-based colors (totalLight #002E62, totalDark #3B6DB5, positive amber #F5A800, negative coral #E5376B), LabelList, ReferenceLine at y=0, and custom tooltip
- Created MarginBridgeSection.tsx with useStore().getState() for 3-param buildMarginBridgeData call, amber glow on adjustedEbitda change, MutationObserver-based dark mode detection
- Wired MarginBridgeSection into DashboardApp.tsx between CloseTracker and ChartsSection; updated footer label to Phase 7
- All 80/80 tests remain GREEN; no TypeScript errors in new files

## Task Commits

Each task was committed atomically:

1. **Task 1: Build MarginBridgeChart — Recharts bar chart with Cell coloring** - `309fa3f` (feat)
2. **Task 2: Build MarginBridgeSection and wire into DashboardApp** - `0621617` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/dashboard/MarginBridgeSection/MarginBridgeChart.tsx` - Recharts BarChart with Cell-based per-bar coloring, LabelList, ReferenceLine, custom tooltip
- `src/components/dashboard/MarginBridgeSection/MarginBridgeSection.tsx` - Card wrapper with useSelector data binding, amber glow, dark mode detection
- `src/components/DashboardApp.tsx` - Added MarginBridgeSection import and JSX insertion; updated footer label to Phase 7

## Decisions Made
- `useStore().getState()` used in MarginBridgeSection instead of 6 separate `useSelector` calls — `buildMarginBridgeData` was implemented in Plan 02 with a 3-param `(baselineEbitda, adjustedEbitda, state)` signature using inline state computation. Passing full state via `useStore().getState()` is simpler than extracting individual lever values since the function already computes them internally.
- No `'use client'` in either new component file — both run inside DashboardApp.tsx existing client boundary, consistent with KpiCard, CloseTracker, and ChartsSection patterns.
- MarginBridgeSection renders unconditionally (no `seedData &&` guard) — `useSelector` returns 0/default values before store hydration, producing safe all-zero bars.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adapted MarginBridgeSection to call buildMarginBridgeData with 3-param signature**
- **Found during:** Task 2 (MarginBridgeSection.tsx implementation)
- **Issue:** Plan's interface section showed `buildMarginBridgeData(baselineEbitda, revenueGrowthImpact, grossMarginImpact, fuelIndexImpact, otherLeversImpact, adjustedEbitda)` with 6 params. But Plan 02 implemented it as `(baselineEbitda, adjustedEbitda, state)` — a 3-param signature using inline state computation (documented in Plan 02 summary as a known deviation).
- **Fix:** Used `useStore().getState()` to get the full Redux state object and pass it as the 3rd argument. Removed the 4 individual lever `useSelector` calls that would have been unused.
- **Files modified:** src/components/dashboard/MarginBridgeSection/MarginBridgeSection.tsx
- **Verification:** TypeScript passes, 80/80 tests GREEN, no runtime errors.
- **Committed in:** 0621617 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — signature mismatch between plan interfaces and actual Plan 02 implementation)
**Impact on plan:** Fix necessary for correctness. The actual buildMarginBridgeData behavior is identical — inline computation produces the same lever values as 6 separate selector calls. No scope creep.

## Issues Encountered
- Pre-existing `aria-query` TypeScript type definition error in the project (TS2688) — unrelated to our changes, was present before this plan. Filtered from TypeScript verification output.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MarginBridgeSection is live in the dashboard, visible between CloseTracker and ChartsSection
- Chart updates reactively when slider controls change (amber glow fires on each EBITDA change)
- Dark mode correctly uses #3B6DB5 for total bars instead of invisible #002E62
- Phase 07 is complete — all 3 plans (01 RED tests, 02 GREEN selectors+data, 03 UI components) done
- Ready for Phase 08 (AI narrative) or any remaining phase

---
*Phase: 07-reactive-margin-bridge*
*Completed: 2026-03-05*
