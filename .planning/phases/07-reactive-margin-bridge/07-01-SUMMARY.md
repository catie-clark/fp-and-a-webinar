---
phase: 07-reactive-margin-bridge
plan: 01
subsystem: testing
tags: [vitest, tdd, typescript, redux, recharts, margin-bridge, data-model]

# Dependency graph
requires:
  - phase: 06-static-charts
    provides: chartDataUtils with buildPipelineChartData, buildArAgingData, buildCashFlowData; beforeAll error-capture TDD pattern
  - phase: 03-kpi-cards-and-variance-layer
    provides: kpiSelectors.ts with selectNetSales, selectCogs, selectEbitda etc.; FUEL_COGS_SHARE constant
provides:
  - marginBridge.test.ts RED stubs for 7 assertions covering 5 selectors and buildMarginBridgeData
  - BaseInputs.baseEbitda and BaseInputs.baseGrossMarginPct TypeScript fields
  - dataLoader.ts populates baseEbitda and baseGrossMarginPct from baseline preset at load time
affects:
  - 07-02 (Wave 2 — implements selectors and buildMarginBridgeData to turn these RED tests GREEN)
  - 07-03 (MarginBridgeChart component uses the selectors and buildMarginBridgeData)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dual beforeAll error-capture pattern: two independent importError variables for two separate module imports in one test file"
    - "Inline makeState helper with Partial overrides avoids Redux store import at test parse time"

key-files:
  created:
    - src/features/model/__tests__/marginBridge.test.ts
  modified:
    - src/features/model/types.ts
    - src/lib/dataLoader.ts

key-decisions:
  - "Dual beforeAll blocks with chartUtilsError and selectorError isolate import failures independently — chartDataUtils and kpiSelectors are separate modules"
  - "baseEbitda formula: latestGL.net_sales * seedGrossMarginPct - latestGL.opex (no fuel adjustment at fuelIndex=100)"
  - "seedGrossMarginPct derived from baseline preset (presets.find(p => p.id === 'baseline') ?? presets[0]) in dataLoader, consistent with DashboardApp preset-switching logic"

patterns-established:
  - "Dual beforeAll error-capture: when a single test file imports from two separate modules, use two beforeAll blocks with separate error variables"
  - "makeState inline helper: always inline state construction helpers in test files — never import from the store module being tested"

requirements-completed: [CHRT-01]

# Metrics
duration: 2min
completed: 2026-03-05
---

# Phase 7 Plan 01: Test Contract and BaseInputs Extension Summary

**RED test scaffold for margin bridge: 7 Vitest stubs covering 5 new selectors and buildMarginBridgeData, plus BaseInputs extended with baseEbitda and baseGrossMarginPct fields seeded from baseline preset**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-05T02:26:58Z
- **Completed:** 2026-03-05T02:29:23Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created marginBridge.test.ts with 7 RED tests using the dual beforeAll error-capture pattern (two separate importError variables for chartDataUtils and kpiSelectors)
- Extended BaseInputs TypeScript interface with baseEbitda and baseGrossMarginPct fields
- Updated dataLoader.ts to derive seedGrossMarginPct from the baseline preset and compute baseEbitda inline in baseInputs object construction
- All 73 pre-existing tests remain GREEN; only marginBridge.test.ts shows 7 FAILED (correct RED state)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create marginBridge.test.ts RED stubs + extend BaseInputs type** - `75bc536` (test)
2. **Task 2: Populate baseEbitda and baseGrossMarginPct in dataLoader.ts** - `a394af0` (feat)

**Plan metadata:** (docs commit follows)

_Note: TDD Wave 1 plan — RED phase only. Task 1 is test-only commit, Task 2 is feat (data layer)._

## Files Created/Modified
- `src/features/model/__tests__/marginBridge.test.ts` - 7 RED test stubs for margin bridge selectors and buildMarginBridgeData chart data transform
- `src/features/model/types.ts` - BaseInputs interface extended with baseEbitda and baseGrossMarginPct fields
- `src/lib/dataLoader.ts` - Derives seedGrossMarginPct from baseline preset; adds baseEbitda and baseGrossMarginPct to baseInputs object

## Decisions Made
- Dual beforeAll blocks with independent chartUtilsError/selectorError variables: chartDataUtils and kpiSelectors are different modules, so isolating their import errors prevents one failing import from hiding the other
- baseEbitda formula uses no fuel adjustment: at fuelIndex=100 (the neutral baseline), FUEL_COGS_SHARE * 0 = 0, so the seed EBITDA is simply net_sales * grossMarginPct - opex
- seedGrossMarginPct derived from baseline preset consistent with how DashboardApp.tsx resolves the active preset for control initialization

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npx tsc --noEmit` path did not resolve on Windows (PATH issue); used `node ./node_modules/typescript/bin/tsc --noEmit` instead — pre-existing environment quirk
- Pre-existing tsc error for aria-query type definitions is unrelated to our changes and was present before this plan

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All test contracts are in place: marginBridge.test.ts has 7 RED tests that will drive Wave 2 implementation
- BaseInputs is extended and dataLoader populates both new fields — Wave 2 selectors can read baseEbitda and baseGrossMarginPct from state.scenario.baseInputs
- Full suite: 73 GREEN + 7 RED (marginBridge only)

---
*Phase: 07-reactive-margin-bridge*
*Completed: 2026-03-05*
