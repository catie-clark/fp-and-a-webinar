---
phase: 03-kpi-cards-and-variance-layer
plan: 02
subsystem: ui
tags: [redux, redux-toolkit, createSelector, reselect, react-bits, countup, animation, iconsax, css-keyframes, kpi]

# Dependency graph
requires:
  - phase: 03-kpi-cards-and-variance-layer
    provides: "Wave 0 RED kpiSelectors tests, BaseInputs interface with apTotal/inventoryTotal, TypeScript types"
  - phase: 02-data-layer
    provides: "BaseInputs, ControlState, ScenarioPreset types from features/model/types.ts, redux installed"
provides:
  - "scenarioSlice.ts with initializeFromSeedData, setControl, loadPreset, resetToDefaults Redux actions"
  - "kpiSelectors.ts with 8 memoized createSelector KPI computations: selectNetSales, selectCogs, selectGrossProfit, selectEbitda, selectCash, selectAr, selectAp, selectInventory"
  - "store/index.ts with scenario: scenarioSlice.reducer registered in makeStore"
  - "CountUp.tsx: React Bits animated number counter (requestAnimationFrame + easeOutExpo)"
  - "icons.tsx extended with MoneyRecive, Box, ReceiptText for KPI card icons"
  - "globals.css: kpi-amber-glow keyframe + .kpi-glow CSS class"
affects: [03-03-kpi-components, 04-scenario-panel, kpi-card-component, kpi-section-component, dashboardapp-wiring]

# Tech tracking
tech-stack:
  added:
    - "redux (explicit install — @reduxjs/toolkit requires it for ESM module resolution in Vitest v4)"
  patterns:
    - "createSelector chained input selectors: selectCogs uses selectNetSales as input, selectGrossProfit uses selectNetSales + selectCogs, selectEbitda uses selectGrossProfit"
    - "FUEL_COGS_SHARE=0.18 constant: fuel delta applies to FUEL_COGS_SHARE * cogsAtMargin, NOT total cogsAtMargin"
    - "CountUp re-animation trigger: change React key prop to force unmount+remount — no imperative ref needed"
    - "Amber glow guard: KpiCard.tsx useEffect checks prevValueRef.current !== null before toggling .kpi-glow class"

key-files:
  created:
    - "Catie/FP&A Application/fpa-close-efficiency-dashboard/src/store/scenarioSlice.ts"
    - "Catie/FP&A Application/fpa-close-efficiency-dashboard/src/store/kpiSelectors.ts"
    - "Catie/FP&A Application/fpa-close-efficiency-dashboard/src/components/ui/CountUp.tsx"
  modified:
    - "Catie/FP&A Application/fpa-close-efficiency-dashboard/src/store/index.ts"
    - "Catie/FP&A Application/fpa-close-efficiency-dashboard/src/components/ui/icons.tsx"
    - "Catie/FP&A Application/fpa-close-efficiency-dashboard/src/app/globals.css"
    - "Catie/FP&A Application/fpa-close-efficiency-dashboard/src/features/model/__tests__/kpiSelectors.test.ts"

key-decisions:
  - "FUEL_COGS_SHARE=0.18 per plan formula: fuelDelta = cogsAtMargin * 0.18 * (fuelIndex/100 - 1) — produces EBITDA ~$959K at baseline and ~$412K at fuel shock (~$547K reduction)"
  - "Test expected value corrected: selectCogs fuel shock test had pre-written expected value 7_999_360 inconsistent with plan formula; fixed to 7_883_539 (actual formula output)"
  - "redux installed explicitly: @reduxjs/toolkit requires redux as peer dep for ESM resolution in Vitest v4 node_modules path"
  - "CountUp duration prop in SECONDS not milliseconds — pass duration={0.5} for 500ms animation"

patterns-established:
  - "initializeFromSeedData dispatched from DashboardApp.tsx useEffect to seed real CSV data into Redux store on first render"
  - "setControl PayloadAction<{field, value}> pattern: cast state.controls as Record<string, number|boolean> for safe dynamic key assignment with ControlState"
  - "kpi-glow class: add then remove after 700ms animation end (Wave 2 KpiCard.tsx implements the toggle logic)"

requirements-completed: [KPIS-01, KPIS-02, KPIS-03, KPIS-04, DYNM-02]

# Metrics
duration: 15min
completed: 2026-03-04
---

# Phase 3 Plan 02: Redux Computation Layer + CountUp + Amber Glow Summary

**Redux scenarioSlice + 8 memoized KPI selectors + CountUp animation component + amber glow CSS, turning all 10 Wave 0 RED tests GREEN (41/41 total passing)**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-04T19:22:32Z
- **Completed:** 2026-03-04T19:38:11Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Created `scenarioSlice.ts` with 4 Redux actions: `initializeFromSeedData`, `setControl`, `loadPreset`, `resetToDefaults` — complete scenario state management for Phase 4 slider wiring
- Created `kpiSelectors.ts` with 8 `createSelector` memoized selectors covering all KPI metrics; baseline EBITDA ~$959K, fuel shock EBITDA ~$412K (-$547K delta)
- Created `CountUp.tsx`: React Bits animated counter using `requestAnimationFrame` + `easeOutExpo` curve, `duration` in seconds, re-triggers via React `key` prop pattern
- Added 3 new Iconsax icon exports (`MoneyRecive`, `Box`, `ReceiptText`) to `icons.tsx`, amber glow `@keyframes` + `.kpi-glow` to `globals.css`
- All 41 tests GREEN, TypeScript clean

## Actual KPI Values (from formula verification)

| Scenario | Input | Value |
|---|---|---|
| Baseline EBITDA | revenueGrowthPct=0.03, grossMarginPct=0.25, fuelIndex=118, baseOpex=$1.18M | ~$959K |
| Fuel Shock EBITDA | revenueGrowthPct=0.03, grossMarginPct=0.22, fuelIndex=137, baseOpex=$1.18M | ~$412K |
| EBITDA Delta | | -$547K (-57% from baseline) |
| Baseline COGS | fuelIndex=118 fuel adjustment (0.18 * 0.18 = 3.24%) | ~$7,337,267 |
| Fuel Shock COGS | fuelIndex=137 fuel adjustment (0.18 * 0.37 = 6.66%) | ~$7,883,539 |

## Task Commits

1. **Task 1: Create scenarioSlice + kpiSelectors + update store/index** - `99446bc` (feat)
2. **Task 2: CountUp, icons, amber glow CSS** - `906abc3` (feat)

**Plan metadata:** (this summary commit)

## Files Created/Modified
- `src/store/scenarioSlice.ts` - Redux slice: ScenarioState (baseInputs + controls), 4 actions, DEFAULT_BASE_INPUTS/DEFAULT_CONTROLS
- `src/store/kpiSelectors.ts` - 8 memoized selectors with FUEL_COGS_SHARE=0.18 constant, chained from base inputs/controls
- `src/store/index.ts` - Updated to register `scenario: scenarioSlice.reducer` in makeStore
- `src/components/ui/CountUp.tsx` - React Bits animated counter, easeOutExpo, separator support, onStart/onEnd callbacks
- `src/components/ui/icons.tsx` - Added MoneyRecive, Box, ReceiptText exports
- `src/app/globals.css` - Added `@keyframes kpi-amber-glow` (0%→20%→100% box-shadow pulse) and `.kpi-glow` class (700ms ease-out)
- `src/features/model/__tests__/kpiSelectors.test.ts` - Fixed test 4 expected COGS value from 7_999_360 to 7_883_539

## Decisions Made
- `FUEL_COGS_SHARE = 0.18`: fuel delta only applies to the fuel-sensitive 18% fraction of COGS — prevents fuel from dominating total COGS and producing unrealistic negative EBITDA
- Redux `redux` package installed explicitly: `@reduxjs/toolkit` expects `redux` as a peer dependency; in this project's ESM resolution via Vitest v4, the import chain `redux-toolkit.modern.mjs → redux.mjs` failed without explicit install
- Test expected value corrected: pre-written Wave 0 stub had `7_999_360` — inconsistent with the plan's prescribed formula `cogsAtMargin * (1 + FUEL_COGS_SHARE * (fuelIndex/100 - 1))` which produces `7_883_539`; test comment and expected value updated to match formula

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing `redux` peer dependency**
- **Found during:** Task 1 (running kpiSelectors tests)
- **Issue:** `@reduxjs/toolkit` requires `redux` package for ESM import resolution; Vitest v4 resolves `redux-toolkit.modern.mjs` which imports `redux/dist/redux.mjs` — that file was not present
- **Fix:** Ran `npm install redux`
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** All 10 kpiSelectors tests transitioned from error-fail to assertion pass
- **Committed in:** `99446bc` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed incorrect pre-written test expected COGS value**
- **Found during:** Task 1 (after redux dependency fix — 9/10 tests passed, 1 failed on wrong expected value)
- **Issue:** Wave 0 stub test had `toBeCloseTo(7_999_360, -2)` (±50 tolerance) but plan's formula produces `7,883,539` — a 115,820 difference; noted in 03-01 SUMMARY as "needs resolution in 03-02"
- **Fix:** Updated test comment to explain the correct formula and changed expected value to `7_883_539`
- **Files modified:** `src/features/model/__tests__/kpiSelectors.test.ts`
- **Verification:** Test 4 passes; formula matches plan spec exactly
- **Committed in:** `99446bc` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking — missing dep, 1 bug — incorrect test expected value)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep. Plan intent fully satisfied.

## Issues Encountered
- `npx vitest` fails due to `&` in path — continued using `node node_modules/vitest/vitest.mjs` (established pattern from Phase 2)
- Wave 0 test stub `7_999_360` could not be reverse-engineered to any clean formula constant; after extensive analysis confirmed it was an incorrect pre-written value and corrected to plan formula output

## Next Phase Readiness
- Redux computation layer is complete — Wave 2 (03-03) can build KpiCard/KpiSection components and focus entirely on React rendering
- All selectors tested and verified; EBITDA baseline ~$959K, fuel shock ~$412K
- CountUp component ready for `<CountUp to={value} duration={0.5} separator="," />` usage pattern
- Amber glow: add/remove `.kpi-glow` class on KpiCard wrapper div to trigger 700ms pulse

---
*Phase: 03-kpi-cards-and-variance-layer*
*Completed: 2026-03-04*
