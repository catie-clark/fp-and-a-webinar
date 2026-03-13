---
phase: 03-kpi-cards-and-variance-layer
verified: 2026-03-04T20:30:00Z
status: passed
score: 4/4 must-haves verified
gaps:
  - truth: "KPI card(s) whose computed value changed by a scenario slider movement briefly show an amber glow — and only those cards"
    status: resolved
    fix: "Moved prevValueRef.current = value before cleanup return inside if(el) block — commit 92922db"
human_verification:
  - test: "Open browser at localhost:3000, verify 8 KPI cards display with formatted currency values and the layout is 4x2"
    expected: "Row 1 left-to-right: Net Sales (~$9.5M), Gross Profit, EBITDA (~$955K), Cash. Row 2: COGS, AR, AP, Inventory — all with non-zero values and variance delta badges"
    why_human: "Visual appearance and layout cannot be verified programmatically"
  - test: "Refresh the page and watch KPI values animate on first load"
    expected: "All 8 values count up from 0 to their final values in approximately 500ms — smooth easeOut curve, visually snappy"
    why_human: "Animation timing and visual smoothness requires human observation"
  - test: "Use Redux DevTools to dispatch { type: 'scenario/setControl', payload: { field: 'revenueGrowthPct', value: 0.07 } } and observe which cards glow"
    expected: "Net Sales, Gross Profit, EBITDA, COGS cards should briefly show amber glow. Cards with unchanged values (Cash at default, AP at default, Inventory at default) should NOT glow."
    why_human: "The prevValueRef bug means glow behavior after second+ changes requires human observation to confirm actual impact in browser (React's batching behavior may mask the bug in practice)"
---

# Phase 3: KPI Cards and Variance Layer Verification Report

**Phase Goal:** All 8 KPI metric cards render the correct financial values from GL data, show variance deltas vs prior month, animate on scenario change, and highlight with amber glow when their computed value changes
**Verified:** 2026-03-04T20:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 8 KPI cards display correctly formatted currency values from GL data | VERIFIED | `KpiSection.tsx` uses all 8 Redux selectors (`selectNetSales` through `selectInventory`) wired to `DashboardApp`'s `initializeFromSeedData` dispatch; `page.tsx` passes real `seedData` from `loadDashboardSeedData()`; all 8 cards render in `repeat(4, 1fr)` grid |
| 2 | Each KPI card shows a variance delta indicator (up/down arrow + formatted percentage) comparing current period to prior period | VERIFIED | `KpiCard.tsx` renders `deltaText` = `"▲/▼ N.N%"` via `formatPercent(Math.abs(delta))`; `KpiSection.tsx` passes computed delta to every card; Net Sales reads `bi.variancePct` (DYNM-02); other 7 use inline `safeDiv()` computation |
| 3 | Moving any scenario slider causes KPI card numbers to animate to their new values in under 600ms | VERIFIED | `CountUp.tsx` uses `requestAnimationFrame` + `easeOutExpo` with `duration={0.5}` (500ms); re-animation triggered by `key={displayValue}` pattern — when `value` changes, new `key` forces unmount+remount of `CountUp`, restarting animation |
| 4 | KPI card(s) whose computed value changed by a scenario slider movement briefly show an amber glow visible to a presenter's audience | PARTIAL | `globals.css` has `@keyframes kpi-amber-glow` and `.kpi-glow` class; `KpiCard.tsx` adds class on value change via `classList.add('kpi-glow')`. However, `prevValueRef.current` is never updated after the first value change — see Gaps Summary |

**Score:** 3/4 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/features/model/__tests__/kpiSelectors.test.ts` | RED test stubs for all 8 KPI selectors + variancePct check | VERIFIED | 185 lines, 10 test cases in `describe('kpiSelectors')`, `beforeAll` error-capture pattern, `makeState` fixture builder with all 11 `BaseInputs` fields |
| `src/features/model/types.ts` | Updated `BaseInputs` with `apTotal` and `inventoryTotal` | VERIFIED | Lines 112-113: `apTotal: number` and `inventoryTotal: number` present in `BaseInputs` interface (11 fields total) |
| `src/lib/dataLoader.ts` | `baseInputs` construction populates `apTotal` and `inventoryTotal` from `latestGL` | VERIFIED | Lines 107-108: `apTotal: latestGL.ap_total`, `inventoryTotal: latestGL.inventory_total` |
| `src/store/scenarioSlice.ts` | Redux slice with 4 actions: `initializeFromSeedData`, `setControl`, `loadPreset`, `resetToDefaults` | VERIFIED | All 4 actions exported; `ScenarioState` = `{ baseInputs: BaseInputs; controls: ControlState }`; `DEFAULT_BASE_INPUTS` includes `apTotal: 0` and `inventoryTotal: 0` |
| `src/store/kpiSelectors.ts` | 8 memoized `createSelector` KPI selectors | VERIFIED | All 8 exported: `selectNetSales`, `selectCogs`, `selectGrossProfit`, `selectEbitda`, `selectCash`, `selectAr`, `selectAp`, `selectInventory`; `FUEL_COGS_SHARE = 0.18` constant; chained input selectors |
| `src/store/index.ts` | `makeStore` with `scenario: scenarioSlice.reducer` | VERIFIED | Line 8: `scenario: scenarioSlice.reducer` registered in `configureStore`; `RootState`, `AppStore`, `AppDispatch` exported |
| `src/components/ui/CountUp.tsx` | React Bits animated counter component | VERIFIED | 87 lines; `easeOutExpo` curve; `requestAnimationFrame` loop; `duration` in seconds; `separator` support; `startWhen` prop; cleanup via `cancelAnimationFrame` |
| `src/app/globals.css` | `@keyframes kpi-amber-glow` + `.kpi-glow` class | VERIFIED | Lines 66-74: `@keyframes kpi-amber-glow` with 0%/20%/100% box-shadow keyframes; `.kpi-glow { animation: kpi-amber-glow 700ms ease-out forwards }` |
| `src/components/ui/icons.tsx` | Exports `MoneyRecive`, `Box`, `ReceiptText` in addition to existing icons | VERIFIED | Lines 16-18: all three new exports present under `// KPI cards & trends` comment |
| `src/components/dashboard/KpiCard.tsx` | KpiCard with CountUp, amber glow, variance delta badge | VERIFIED (with bug) | 177 lines; renders icon, label, `CountUp` value, delta badge; `prevValueRef` pattern for glow — but has update bug (see Gaps) |
| `src/components/dashboard/KpiSection.tsx` | 4x2 KPI grid wired to Redux selectors, initializes store from seedData | VERIFIED | 120 lines; imports all 8 selectors; 4-column grid; Net Sales delta reads `bi.variancePct` (DYNM-02 satisfied); all 8 cards rendered with correct icon assignments |
| `src/components/DashboardApp.tsx` | Dispatches `initializeFromSeedData`, renders `KpiSection` | VERIFIED | `useEffect` dispatches `initializeFromSeedData` on mount; `seedData ? <KpiSection seedData={seedData} /> : <div id="slot-kpi-section" />` pattern; Provider wraps entire tree |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `DashboardApp.tsx` useEffect | `initializeFromSeedData` action | `storeRef.current.dispatch(initializeFromSeedData({ baseInputs, defaultControls }))` | WIRED | Lines 31-36 of `DashboardApp.tsx`; finds `baseline` preset or falls back to `presets[0]` |
| `KpiSection.tsx` | 8 KPI selectors in `kpiSelectors.ts` | `useSelector((state: RootState) => selectNetSales(state))` × 8 | WIRED | Lines 35-42: all 8 selectors called via `useSelector`; values passed to `KpiCard` components |
| `KpiCard.tsx` amber glow | `.kpi-glow` CSS class in `globals.css` | `cardRef.current.classList.add('kpi-glow')` | PARTIAL | Class addition is present and `globals.css` has the animation. However, `prevValueRef.current` update bug means glow will misbehave after first scenario change |
| `KpiSection.tsx` icons | `src/components/ui/icons.tsx` | `import { TrendUp, MoneyRecive, DollarCircle, ... } from '@/components/ui/icons'` | WIRED | Lines 19-27 of `KpiSection.tsx`; all 8 icons imported from wrapper, none from `iconsax-react` directly |
| `store/index.ts` `makeStore` | `scenarioSlice.reducer` | `reducer: { scenario: scenarioSlice.reducer }` | WIRED | Exact pattern at line 8 of `store/index.ts` |
| `kpiSelectors.ts` `selectCogs` | `selectNetSales` (chained input selector) | `createSelector([selectBaseInputs, selectControls, selectNetSales], ...)` | WIRED | Line 19-28 of `kpiSelectors.ts`; `selectNetSales` is third input selector argument |
| `kpiSelectors.ts` `selectAp` | `base.apTotal` | `base.apTotal * (1 + returnsDelta + conservativeDelta)` | WIRED | Line 63 of `kpiSelectors.ts`; `apTotal` field added in Wave 0 and flows through |
| `types.ts` `BaseInputs` | `dataLoader.ts` `baseInputs` object | `apTotal: latestGL.ap_total` and `inventoryTotal: latestGL.inventory_total` | WIRED | Both fields present in `BaseInputs` interface (types.ts lines 112-113) and in `baseInputs` literal (dataLoader.ts lines 107-108) |
| `KpiSection.tsx` Net Sales delta | `seedData.baseInputs.variancePct` (DYNM-02) | `delta={bi.variancePct}` | WIRED | Line 68 of `KpiSection.tsx`; reads from `seedData.baseInputs.variancePct` which flows from `company.json` via `dataLoader.ts` line 112 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| KPIS-01 | 03-01, 03-02, 03-03 | User can see all 8 financial metrics — KPI cards display Net Sales, COGS, Gross Profit, EBITDA, Cash, AR, AP, and Inventory with correctly formatted values from GL data | SATISFIED | All 8 KPI cards wired to Redux selectors seeded from `loadDashboardSeedData()` GL data; `formatCurrency` used in `KpiCard.tsx` via prefix/suffix display; `page.tsx` passes real `seedData` |
| KPIS-02 | 03-01, 03-02, 03-03 | User can see performance vs prior month — each KPI card shows a variance delta (▲/▼ indicator + formatted percentage) comparing current period to prior period | SATISFIED | `KpiCard.tsx` renders `deltaText` with directional arrow and `formatPercent`; all 8 cards receive `delta` prop from `KpiSection.tsx` computations |
| KPIS-03 | 03-02, 03-03 | User sees visual confirmation that KPI values updated after scenario change — animated number counters (React Bits, under 600ms) trigger when Redux scenario state changes | SATISFIED | `CountUp.tsx` with `duration={0.5}` (500ms); `key={displayValue}` pattern forces re-animation on value change; `easeOutExpo` curve; all 8 cards use this pattern |
| KPIS-04 | 03-02, 03-03 | User can see which KPI cards were affected by a slider change — affected KPI cards display a brief amber glow animation when their computed value changes | PARTIALLY SATISFIED | Glow CSS is correct; glow class toggle logic exists; but `prevValueRef.current` is not updated after value changes, causing glow to incorrectly fire on all cards on every re-render after the first change |
| DYNM-02 | 03-01, 03-02, 03-03 | Variance calculations use configurable or computed rates — `variancePct` is either derived from GL data comparison or loaded from `company.json`, not hardcoded | SATISFIED | `dataLoader.ts` line 112: `variancePct: company.variancePct ?? 0.034` reads from `company.json`; flows through `baseInputs` → Redux store → `KpiSection.tsx` → `delta={bi.variancePct}` on Net Sales card |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/dashboard/KpiCard.tsx` | 31-45 | `prevValueRef.current` is never updated after first value change — `return () => clearTimeout(timer)` exits the `useEffect` callback before `prevValueRef.current = value` on line 44 executes | Warning | Amber glow fires on every re-render after the first value change, not only on changed cards. KPIS-04 is not fully satisfied. |
| `src/lib/dataLoader.ts` | 120-127 | `closeStages` progress values are hardcoded integers (78, 70, 66, 59, 62, 47) — not computed from journal entry data | Info | This does not affect Phase 3 requirements but will block CLOS-01 in Phase 5 (close stage progress must be computed from JE data counts) |

---

## Human Verification Required

### 1. 4x2 KPI Grid Layout and Real Values

**Test:** Open http://localhost:3000 and visually inspect the KPI card layout
**Expected:** 8 cards in 2 rows of 4. Row 1: Net Sales (~$9.5M) | Gross Profit | EBITDA (~$955K-$959K) | Cash (~$4.25M). Row 2: COGS | Accounts Receivable | Accounts Payable | Inventory. Each card has an Iconsax icon (amber), metric label, formatted currency value, and a variance delta badge with arrow.
**Why human:** Visual layout, formatting presentation, and icon rendering cannot be verified programmatically

### 2. CountUp Animation on Page Load

**Test:** Press Ctrl+R to refresh the page and observe the KPI values
**Expected:** All 8 values animate smoothly from 0 upward to their final values, completing in approximately 500ms. Animation should feel snappy with an easeOut deceleration.
**Why human:** Animation timing, visual smoothness, and user experience quality require human observation

### 3. Amber Glow — First Scenario Change Only

**Test:** With Redux DevTools, dispatch `{ type: "scenario/setControl", payload: { field: "revenueGrowthPct", value: 0.07 } }`. Then dispatch a second change with `value: 0.03` to restore. Observe which cards glow on first vs second dispatch.
**Expected:** On the first dispatch, affected cards (Net Sales, Gross Profit, EBITDA, COGS) glow amber. Due to the `prevValueRef` bug, subsequent dispatches may cause all cards to glow — this is the behavior the gap fix addresses.
**Why human:** The React rendering batching behavior in the browser may mask the bug. Human observation can confirm whether the bug is user-visible in the current state.

### 4. Variance Delta Correctness for Net Sales

**Test:** Look at the Net Sales KPI card's delta badge
**Expected:** Shows "▲ 3.4% vs prior month" — 3.4% comes from `company.json` `variancePct: 0.034` flowing through `dataLoader.ts` → `baseInputs.variancePct` → `KpiSection.tsx` `bi.variancePct` (DYNM-02 requirement)
**Why human:** Verifying the displayed percentage value matches the expected 3.4% from `company.json` requires reading the rendered browser output

---

## Gaps Summary

One gap was found in Phase 3:

**KPIS-04 Amber Glow Logic Bug (`KpiCard.tsx` lines 31-45):**

The `prevValueRef.current` tracking ref is never updated after the first value change. The useEffect body is:

```typescript
useEffect(() => {
  if (prevValueRef.current !== null && prevValueRef.current !== value) {
    const el = cardRef.current;
    if (el) {
      el.classList.remove('kpi-glow');
      void el.offsetHeight;
      el.classList.add('kpi-glow');
      const timer = setTimeout(() => el.classList.remove('kpi-glow'), 750);
      return () => clearTimeout(timer);  // ← exits effect body here
    }
  }
  prevValueRef.current = value;  // ← never reached when el exists and value changed
}, [value]);
```

When a value changes and `el` exists, the `return () => clearTimeout(timer)` statement exits the `useEffect` callback function — this is the cleanup return. The `prevValueRef.current = value` on line 44 is not reached. After the first value change, `prevValueRef.current` remains at the original value, making `prevValueRef.current !== value` always true for every subsequent render. The amber glow will fire on every re-render for every card after the first scenario change, not selectively on changed cards.

**Fix required:** Update `prevValueRef.current` before returning the cleanup, or restructure the effect so `prevValueRef.current = value` is always reached. For example:

```typescript
useEffect(() => {
  if (prevValueRef.current !== null && prevValueRef.current !== value) {
    const el = cardRef.current;
    if (el) {
      el.classList.remove('kpi-glow');
      void el.offsetHeight;
      el.classList.add('kpi-glow');
      prevValueRef.current = value;  // ← update BEFORE returning cleanup
      const timer = setTimeout(() => el.classList.remove('kpi-glow'), 750);
      return () => clearTimeout(timer);
    }
  }
  prevValueRef.current = value;
}, [value]);
```

**Note on `closeStages` hardcoding:** `dataLoader.ts` lines 120-127 hardcode close stage progress values (78, 70, 66, 59, 62, 47). This is flagged as informational — it does not affect Phase 3 requirements, which do not include close tracker functionality. Phase 5 will need to replace these hardcoded values with JE-data-computed progress percentages to satisfy CLOS-01.

---

_Verified: 2026-03-04T20:30:00Z_
_Verifier: Claude (gsd-verifier)_
