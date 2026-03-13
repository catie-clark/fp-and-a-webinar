---
phase: 07-reactive-margin-bridge
plan: 02
subsystem: testing
tags: [vitest, tdd, redux, recharts, margin-bridge, selectors, chartDataUtils]

# Dependency graph
requires:
  - phase: 07-reactive-margin-bridge-plan-01
    provides: marginBridge.test.ts RED stubs (7 tests), BaseInputs.baseEbitda and baseGrossMarginPct fields
  - phase: 03-kpi-cards-and-variance-layer
    provides: kpiSelectors.ts with selectNetSales, selectEbitda, FUEL_COGS_SHARE constant, createSelector pattern
  - phase: 06-static-charts
    provides: chartDataUtils.ts with buildPipelineChartData pattern (pure function, no React imports)
provides:
  - 5 new selectors in kpiSelectors.ts: selectBaselineEbitda, selectRevenueGrowthImpact, selectGrossMarginImpact, selectFuelIndexImpact, selectOtherLeversImpact
  - MarginBridgeBar interface exported from chartDataUtils.ts
  - buildMarginBridgeData(baselineEbitda, adjustedEbitda, state) exported from chartDataUtils.ts
  - All 7 marginBridge.test.ts assertions GREEN
affects:
  - 07-03 (MarginBridgeChart component uses buildMarginBridgeData and the 5 selectors via useSelector)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline state computation in chartDataUtils: bridge deltas computed from typed state slice inline to avoid circular import between chartDataUtils and @/store"
    - "-0 floating point guard: return -fuelDelta || 0 prevents Object.is(-0, 0) === false Vitest assertion failure"

key-files:
  created: []
  modified:
    - src/store/kpiSelectors.ts
    - src/components/dashboard/ChartsSection/chartDataUtils.ts

key-decisions:
  - "buildMarginBridgeData signature is (baselineEbitda, adjustedEbitda, state) not 6-param as written in plan — test stub declared the 3-param signature; inline state computation used to derive lever deltas without importing selectors from @/store"
  - "Inline bridge delta computation in chartDataUtils mirrors selector formulas exactly, avoiding circular import risk and keeping chartDataUtils importable in node-env Vitest"
  - "selectFuelIndexImpact uses || 0 guard to prevent -0 floating point artifact when fuelIndex=100 (JavaScript -0 !== 0 under Object.is comparison used by Vitest toBe)"

patterns-established:
  - "|| 0 guard on negated multiplication results to prevent -0 in Jest/Vitest toBe assertions"
  - "3-param state-accepting buildMarginBridgeData signature: allows test file to pass full Redux state without importing store module, avoiding import-cycle failures at test parse time"

requirements-completed: [CHRT-01]

# Metrics
duration: 5min
completed: 2026-03-05
---

# Phase 7 Plan 02: Margin Bridge Selectors and Data Transform Summary

**Five Redux selectors decomposing EBITDA into lever-attributed bridge deltas, plus buildMarginBridgeData waterfall data transform — all 7 marginBridge.test.ts RED tests turned GREEN with 80/80 full suite passing**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-05T20:32:01Z
- **Completed:** 2026-03-05T20:34:20Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Appended 5 margin bridge selectors to kpiSelectors.ts: selectBaselineEbitda, selectRevenueGrowthImpact, selectGrossMarginImpact, selectFuelIndexImpact, selectOtherLeversImpact
- Fixed -0 floating point artifact in selectFuelIndexImpact with `|| 0` guard (Vitest toBe uses Object.is which distinguishes -0 from 0)
- Added formatCurrency import, MarginBridgeBar interface, formatBridgeLabel helper, and buildMarginBridgeData to chartDataUtils.ts
- All 7 marginBridge.test.ts tests GREEN; full suite 80/80 GREEN with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Append 5 margin bridge selectors to kpiSelectors.ts** - `5282e6e` (feat)
2. **Task 2: Add buildMarginBridgeData and MarginBridgeBar to chartDataUtils.ts** - `e2be928` (feat)

**Plan metadata:** (docs commit follows)

_Note: TDD Wave 2 plan — GREEN phase. Both tasks are feat commits implementing the production code._

## Files Created/Modified
- `src/store/kpiSelectors.ts` - 5 new selectors appended (selectBaselineEbitda, selectRevenueGrowthImpact, selectGrossMarginImpact, selectFuelIndexImpact, selectOtherLeversImpact)
- `src/components/dashboard/ChartsSection/chartDataUtils.ts` - MarginBridgeBar interface, formatBridgeLabel helper, buildMarginBridgeData function, formatCurrency import

## Decisions Made
- buildMarginBridgeData uses `(baselineEbitda, adjustedEbitda, state)` signature (3 params) rather than the 6-param version in the plan — the test stub at line 67 declared `(baseEbitda: number, adjustedEbitda: number, state: unknown) => unknown[]` and all test calls use this signature. Inline state computation derives lever deltas inside the function.
- Inline bridge delta computation in chartDataUtils avoids importing selectors from @/store, preventing circular dependency risk and keeping chartDataUtils importable in the node Vitest environment.
- `|| 0` guard added to selectFuelIndexImpact: when fuelIndex=100, `-(0) = -0` in JavaScript. Vitest's `toBe(0)` uses Object.is which returns false for `-0 === 0`, causing Test 5 to fail. The guard coerces -0 to 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] buildMarginBridgeData signature mismatch: test expects 3 params, plan specified 6**
- **Found during:** Task 2 (chartDataUtils implementation)
- **Issue:** Test stub typed buildMarginBridgeData as `(baseEbitda, adjustedEbitda, state)` — a 3-param signature. Plan's 6-param implementation would not match the test calls and would fail.
- **Fix:** Implemented as 3-param function with inline state computation to derive lever deltas. Mirrors selector formulas exactly.
- **Files modified:** src/components/dashboard/ChartsSection/chartDataUtils.ts
- **Verification:** Tests 1 and 2 passed GREEN immediately.
- **Committed in:** e2be928 (Task 2 commit)

**2. [Rule 1 - Bug] selectFuelIndexImpact returns -0 instead of 0 at fuelIndex=100**
- **Found during:** Task 1 (selector implementation, first test run)
- **Issue:** `-fuelDelta` produces -0 (JavaScript negative zero) when fuelDelta=0. Vitest toBe(0) uses Object.is which fails for -0.
- **Fix:** Added `|| 0` guard: `return -fuelDelta || 0`
- **Files modified:** src/store/kpiSelectors.ts
- **Verification:** Test 5 passed GREEN after fix.
- **Committed in:** 5282e6e (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for test correctness. No scope creep.

## Issues Encountered
- vitest.mjs not found at `C:/Users/RachurA/AppData/Local/node_modules/vitest/vitest.mjs` (plan's verify command path) — used `./node_modules/vitest/vitest.mjs` (local node_modules) instead, consistent with Phase 07-01 pattern.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 selectors exported from kpiSelectors.ts and ready for use in MarginBridgeChart component via useSelector
- buildMarginBridgeData and MarginBridgeBar exported from chartDataUtils.ts and ready for the chart component
- Full suite 80/80 GREEN — Phase 07-03 can proceed to build the MarginBridgeChart component

---
*Phase: 07-reactive-margin-bridge*
*Completed: 2026-03-05*
