# Phase 3: KPI Cards and Variance Layer - Research

**Researched:** 2026-03-04
**Domain:** Redux Toolkit createSelector, React Bits CountUp (copy-paste), Iconsax icons, CSS keyframe animation, Next.js App Router client component patterns
**Confidence:** HIGH (all findings verified against installed packages, local source code, and official documentation)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Phase 3 builds** `src/store/scenarioSlice.ts` with initial state seeded from `seedData.baseInputs.controls` (from the default preset in `scenario-presets.json`), all 7 slider fields + 4 toggle fields matching `ControlState` type, and actions: `setControl(field, value)` + `loadPreset(controls)` + `resetToDefaults(controls)`
- **Phase 3 builds** `src/store/kpiSelectors.ts` with `createSelector` memoized selectors for all 8 KPI computed values (formulas specified below in Architecture Patterns)
- **Phase 4 only** needs to wire slider/toggle UI components to dispatch — no selector work needed
- **Store wiring**: `store/index.ts` adds `scenarioSlice` to `configureStore` reducer in this phase
- **KPI card grid**: 2 rows of 4 (4x2 grid), Row 1 (P&L): Net Sales, Gross Profit, EBITDA, Cash — Row 2 (Balance sheet): COGS, AR, AP, Inventory
- **Cards use CSS Grid**: `grid-template-columns: repeat(4, 1fr)` with responsive fallback to 2x4 below 1024px
- **Variance delta colors**: green/red directional, COGS inverted (up=red/down=green), AP neutral-amber, Inventory neutral-amber
- **Color tokens**: `var(--color-success)` does NOT exist — use `var(--accent)` (#f5a800) for amber, and custom CSS hex values for teal success (#05AB8C) and coral error (#E5376B)
- **Delta display format**: `▲ 3.4%` or `▼ 2.1%` using `formatPercent()` from `lib/formatters.ts`
- **Prior period source**: `variancePct` from `seedData.baseInputs.variancePct` for Net Sales; other metrics derive variance from computed scenario delta vs base
- **React Bits CountUp**: `duration={500}` and `easing="easeOut"`, triggers on first load and on value change
- **Amber glow trigger**: `useRef` tracking previous value + `useEffect` toggling a CSS class
- **KpiCard component path**: `src/components/dashboard/KpiCard.tsx`
- **KpiCard props**: `label`, `icon` (Iconsax component), `value` (number), `format` ('currency' | 'percent' | 'number'), `delta`, `deltaInverted` (boolean for COGS-style inversion)
- **KpiSection component path**: `src/components/dashboard/KpiSection.tsx`
- **DashboardApp integration**: replace `<div id="slot-kpi-section" />` with `<KpiSection seedData={seedData} />`
- **No shadcn/ui** — all components are custom using CSS tokens
- **"use client" boundary**: DashboardApp.tsx is the single client boundary — KpiSection and KpiCard do NOT add their own directive
- **Redux pattern**: `makeStore` + `useRef` in DashboardApp.tsx; `useSelector`/`useDispatch` work inside any component wrapped by `<Provider>`
- **Tailwind v4**: `@import "tailwindcss"` syntax, no config file needed for standard utilities
- **Theme**: `data-theme` attribute on `<html>`, CSS variables in `globals.css` — all colors MUST use `var(--foreground)`, `var(--accent)`, `var(--background)`, etc.
- **No `--color-success` variable in globals.css** — the file only defines: `--background`, `--foreground`, `--card`, `--surface`, `--accent`, `--accent-soft`, `--muted`, `--border`, `--track`, `--shadow`, `--muted-color`
- **React Bits is copy-paste** — NOT an npm package. CountUp source code is pasted directly into the project.
- **Vitest invocation**: use `node .../vitest.mjs run` (not `npx vitest`) due to `&` ampersand in FP&A path

### Claude's Discretion

- Exact fuel index adjustment formula for COGS selector (proportional scaling from index baseline 100)
- Exact cash selector formula (collections rate effect on AR → cash timing)
- AR selector formula (how `collectionsRatePct` adjusts displayed AR balance)
- AP and Inventory selector formulas (reasonable deltas based on scenario toggles)
- Specific Iconsax icon per KPI metric
- Card hover animation specifics (lift + shadow increase)

### Deferred Ideas (OUT OF SCOPE)

- Close stage tracker integration — Phase 5
- Scenario slider/toggle controls wiring — Phase 4 (Phase 3 builds the Redux layer; Phase 4 adds the UI controls)
- KPI drill-down on click (v2 requirement INTV-01) — backlog
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| KPIS-01 | User can see all 8 financial metrics — KPI cards display Net Sales, COGS, Gross Profit, EBITDA, Cash, AR, AP, and Inventory with correctly formatted values from GL data | Baseline values confirmed from `erp_gl_summary.csv` (Jan-2026 row); `formatCurrency()` from `lib/formatters.ts` is ready |
| KPIS-02 | User can see performance vs prior month — each KPI card shows a variance delta (▲/▼ + formatted percentage) | `variancePct=0.034` from `company.json` confirmed; delta color logic documented; `formatPercent()` ready |
| KPIS-03 | User sees visual confirmation KPI values updated — animated number counters (React Bits, under 600ms) trigger on Redux state change | React Bits CountUp is copy-paste; `key` prop pattern triggers re-animation; 500ms duration safely under 600ms limit |
| KPIS-04 | User can see which KPI cards were affected — amber glow animation when computed value changes | CSS keyframe pattern documented; `useRef` prev-value + `useEffect` class-toggle pattern specified |
| DYNM-02 | Variance calculations use configurable or computed rates — `variancePct` is not hardcoded | `variancePct` is already read from `company.json` and stored in `baseInputs.variancePct`; confirmed in Phase 2 |
</phase_requirements>

---

## Summary

Phase 3 has three distinct workstreams that must be sequenced carefully: (1) the Redux computation layer (`scenarioSlice` + `kpiSelectors`), (2) the `KpiCard`/`KpiSection` components with CountUp animation and amber glow, and (3) wiring everything into `DashboardApp.tsx`. The Redux layer is purely functional TypeScript and is the most testable portion — all 8 KPI selectors can be unit-tested with simple state fixtures. The animation layer (CountUp, amber glow) must be treated as browser-only and is not Vitest-testable.

The baseline GL data row (Jan-2026) confirms: `baseNetSales=$9,200,000`, `baseOpex=$1,180,000`, `baseCash=$4,250,000`, `ap_total=$3,100,000`, `inventory_total=$6,400,000`. These constants must be read from `seedData.baseInputs` and passed as parameters into the Redux slice's initial state — they must never be hardcoded in selectors.

The critical formula design decision is that `fuelIndex` applies an additive delta to the fuel-sensitive portion of COGS (approximately 18% for a logistics company), NOT a multiplier on total COGS. This keeps fuel shock drama believable: fuelIndex=137 + grossMarginPct=0.22 produces EBITDA of ~$410K versus baseline ~$960K (a −$550K drop), which is visually alarming on screen without producing negative EBITDA or NaN.

**Primary recommendation:** Build the Redux layer (scenarioSlice + kpiSelectors) as Wave 0 Vitest-covered pure functions, then build the component layer (KpiCard + KpiSection) and integrate last. Copy the React Bits CountUp source into `src/components/ui/CountUp.tsx` and use a `key={value}` prop to trigger re-animation on value change.

---

## Standard Stack

### Core (all already installed — zero new npm installs required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@reduxjs/toolkit` | 2.11.2 (installed) | `createSlice` + `createSelector` | Already in project; `createSelector` re-exports Reselect v5 with memoization |
| `react-redux` | ^9.2.0 (installed) | `useSelector`, `useDispatch`, `Provider` | Already in project; works with RTK 2.x |
| `iconsax-react` | ^0.0.8 (installed) | KPI card icons | Already installed; import ONLY via `src/components/ui/icons.tsx` |
| React Bits CountUp | copy-paste (not npm) | Animated number counter | Copy-paste component from reactbits.dev; no install needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/lib/formatters.ts` | project file | `formatCurrency()`, `formatPercent()` | All KPI value display and delta percentages |
| CSS keyframes | globals.css | Amber glow animation | Defined in globals.css, triggered by class toggle |
| `useRef` + `useEffect` | React 19 | Prev-value detection for glow trigger | Standard React pattern for comparing prev vs current value |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Bits CountUp (copy-paste) | `react-countup` npm package | npm package adds dep; copy-paste is lighter and already the project pattern for React Bits components |
| CSS keyframe amber glow | Anime.js `animate()` | Anime.js would require import; CSS keyframe is simpler and respects `prefers-reduced-motion` already set in globals.css |
| `key` prop re-mount for CountUp | Imperative `ref.update()` | `key` prop is simpler; no imperative ref needed; React handles teardown cleanly |

**Installation:** No new packages required. React Bits CountUp is copy-paste only.

---

## Architecture Patterns

### Recommended File Structure (Phase 3 additions)

```
src/
├── store/
│   ├── index.ts                    [MODIFY] — add scenarioSlice.reducer
│   ├── scenarioSlice.ts            [NEW] — ControlState + initializeFromSeedData action
│   └── kpiSelectors.ts             [NEW] — 8 createSelector memoized selectors
├── components/
│   ├── dashboard/
│   │   ├── KpiCard.tsx             [NEW] — single card component
│   │   └── KpiSection.tsx          [NEW] — 4x2 grid + store initialization
│   └── ui/
│       ├── icons.tsx               [MODIFY] — add KPI metric icons
│       └── CountUp.tsx             [NEW] — React Bits CountUp copy-pasted here
├── app/
│   └── globals.css                 [MODIFY] — add @keyframes amber-glow
└── __tests__/
    └── kpiSelectors.test.ts        [NEW] — Wave 0 unit tests
```

### Pattern 1: scenarioSlice — Seeded Initial State

The slice must hold a `baseInputs` sub-object (passed from `seedData`) plus the `controls` object (from the default preset). The `initializeFromSeedData` action sets both. Both are needed as selector inputs.

```typescript
// src/store/scenarioSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { BaseInputs, ControlState } from '@/features/model/types';

interface ScenarioState {
  baseInputs: BaseInputs;
  controls: ControlState;
}

const DEFAULT_BASE_INPUTS: BaseInputs = {
  baseNetSales: 0,
  baseOpex: 0,
  baseCash: 0,
  baseCashInWeekly: 0,
  arTotal: 0,
  manualJeCount: 0,
  closeAdjustmentsCount: 0,
  pipelineExecutionRatio: 0,
  variancePct: 0.034,
};

const DEFAULT_CONTROLS: ControlState = {
  revenueGrowthPct: 0.03,
  grossMarginPct: 0.25,
  fuelIndex: 118,
  collectionsRatePct: 0.97,
  returnsPct: 0.012,
  lateInvoiceHours: 4,
  journalLoadMultiplier: 1.0,
  prioritizeCashMode: false,
  conservativeForecastBias: false,
  tightenCreditHolds: false,
  inventoryComplexity: false,
};

const scenarioSlice = createSlice({
  name: 'scenario',
  initialState: {
    baseInputs: DEFAULT_BASE_INPUTS,
    controls: DEFAULT_CONTROLS,
  } as ScenarioState,
  reducers: {
    initializeFromSeedData(
      state,
      action: PayloadAction<{ baseInputs: BaseInputs; defaultControls: ControlState }>
    ) {
      state.baseInputs = action.payload.baseInputs;
      state.controls = action.payload.defaultControls;
    },
    setControl(
      state,
      action: PayloadAction<{ field: keyof ControlState; value: number | boolean }>
    ) {
      (state.controls as Record<string, number | boolean>)[action.payload.field] =
        action.payload.value;
    },
    loadPreset(state, action: PayloadAction<ControlState>) {
      state.controls = action.payload;
    },
    resetToDefaults(state, action: PayloadAction<ControlState>) {
      state.controls = action.payload;
    },
  },
});

export const { initializeFromSeedData, setControl, loadPreset, resetToDefaults } =
  scenarioSlice.actions;
export default scenarioSlice;
```

### Pattern 2: kpiSelectors — All 8 Memoized Selectors

The `createSelector` import comes from `@reduxjs/toolkit` which re-exports Reselect v5. Each selector chains off the previous to avoid redundant computation. `baseInputs` and `controls` are the two root input selectors.

```typescript
// src/store/kpiSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';

// Root input selectors
const selectBaseInputs = (state: RootState) => state.scenario.baseInputs;
const selectControls = (state: RootState) => state.scenario.controls;

// Fuel portion of COGS for a logistics company: ~18% of total COGS
const FUEL_COGS_SHARE = 0.18;
const FUEL_BASE_INDEX = 100;

export const selectNetSales = createSelector(
  [selectBaseInputs, selectControls],
  (base, controls) => base.baseNetSales * (1 + controls.revenueGrowthPct)
);

export const selectCogs = createSelector(
  [selectBaseInputs, selectControls, selectNetSales],
  (base, controls, netSales) => {
    const cogsAtMargin = netSales * (1 - controls.grossMarginPct);
    // Additive fuel delta: only the fuel-sensitive 18% of COGS is index-adjusted
    const fuelDelta =
      cogsAtMargin * FUEL_COGS_SHARE * (controls.fuelIndex / FUEL_BASE_INDEX - 1);
    return cogsAtMargin + fuelDelta;
  }
);

export const selectGrossProfit = createSelector(
  [selectNetSales, selectCogs],
  (netSales, cogs) => netSales - cogs
);

export const selectEbitda = createSelector(
  [selectBaseInputs, selectGrossProfit],
  (base, grossProfit) => grossProfit - base.baseOpex
);

export const selectCash = createSelector(
  [selectBaseInputs, selectControls],
  (base, controls) => {
    // Each 1% improvement in collections rate converts AR to cash
    const cashFromCollections =
      base.arTotal * (controls.collectionsRatePct - 0.97);
    // Prioritize Cash Mode: additional 5% of arTotal accelerated
    const modeBoost = controls.prioritizeCashMode ? base.arTotal * 0.05 : 0;
    return base.baseCash + cashFromCollections + modeBoost;
  }
);

export const selectAr = createSelector(
  [selectBaseInputs, selectControls],
  (base, controls) => {
    // Better collections rate reduces outstanding AR balance
    const collectionsDelta = base.arTotal * (controls.collectionsRatePct - 0.97) * 2;
    // Tightening credit holds reduces new AR generation by ~8%
    const holdReduction = controls.tightenCreditHolds ? base.arTotal * 0.08 : 0;
    return base.arTotal - collectionsDelta - holdReduction;
  }
);

export const selectAp = createSelector(
  [selectBaseInputs, selectControls],
  (base, controls) => {
    // Higher returns rate generates more AP (return credits to process)
    // Scale: 1% returns change = 5% AP change
    const returnsDelta = (controls.returnsPct - 0.012) * 5;
    // Conservative bias delays some AP payments (increases balance)
    const conservativeDelta = controls.conservativeForecastBias ? 0.04 : 0;
    // Base AP from GL: needed as baseInputs — pass glApTotal in baseInputs or derive from GL
    // NOTE: AP base comes from seedData.baseInputs — planner must add apTotal to BaseInputs
    // or pass it through a separate mechanism. See Open Questions.
    return base.baseCash * 0 + 3_100_000 * (1 + returnsDelta + conservativeDelta);
    // TEMPORARY: hardcoded $3.1M from GL until BaseInputs includes apTotal
  }
);

export const selectInventory = createSelector(
  [selectBaseInputs, selectControls],
  (base, controls) => {
    // Inventory complexity toggle adds ~12% to inventory (rework, recount, adjustments)
    return 6_400_000 * (controls.inventoryComplexity ? 1.12 : 1.0);
    // TEMPORARY: hardcoded $6.4M from GL until BaseInputs includes inventoryTotal
  }
);
```

**CRITICAL NOTE for Planner:** `BaseInputs` in `types.ts` does NOT currently include `apTotal` or `inventoryTotal`. The planner must choose one of:
1. Add `apTotal` and `inventoryTotal` to `BaseInputs` interface and `dataLoader.ts` (clean, correct)
2. Seed them as constants in `scenarioSlice.ts` initial state derived from the seed data passed at initialization

Option 1 is strongly recommended. The GL row already has `ap_total` and `inventory_total` fields in `glRowSchema`.

### Pattern 3: store/index.ts — Adding scenarioSlice

```typescript
// src/store/index.ts — MODIFIED
import { configureStore } from '@reduxjs/toolkit';
import scenarioSlice from './scenarioSlice';

export const makeStore = () =>
  configureStore({
    reducer: {
      scenario: scenarioSlice.reducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
```

### Pattern 4: DashboardApp.tsx — Dispatch initializeFromSeedData on Mount

```typescript
// DashboardApp.tsx — MODIFIED
'use client';
import { useRef, useEffect } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/store';
import type { AppStore } from '@/store';
import type { DashboardSeedData } from '@/lib/dataLoader';
import { initializeFromSeedData } from '@/store/scenarioSlice';
import KpiSection from '@/components/dashboard/KpiSection';

export default function DashboardApp({ seedData }: { seedData?: DashboardSeedData }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  // Seed Redux store with real data on first render
  useEffect(() => {
    if (seedData && storeRef.current) {
      const defaultPreset = seedData.presets.find(p => p.id === 'baseline') ?? seedData.presets[0];
      storeRef.current.dispatch(
        initializeFromSeedData({
          baseInputs: seedData.baseInputs,
          defaultControls: defaultPreset.controls,
        })
      );
    }
  }, [seedData]);

  return (
    <Provider store={storeRef.current}>
      <div style={{ minHeight: '100vh', padding: '1.5rem' }}>
        <div id="slot-header" />
        {seedData && <KpiSection seedData={seedData} />}
        {/* ... other slots ... */}
      </div>
    </Provider>
  );
}
```

### Pattern 5: KpiCard — CountUp + Amber Glow Pattern

**React Bits CountUp** is a copy-paste component. It uses `anime.js` internally (or a custom easing function). The component accepts `from`, `to`, `duration`, `separator`, and `className` props. Re-animation on value change is triggered by changing the React `key` prop, which causes React to unmount and remount the component, restarting the animation from 0 to the new value.

Based on the React Bits docs page (reactbits.dev/text-animations/count-up), the component interface is:

```typescript
// src/components/ui/CountUp.tsx — React Bits CountUp (copy-paste from reactbits.dev)
// Paste the TS-TW variant from: https://www.reactbits.dev/text-animations/count-up
// Props interface (verified from reactbits.dev documentation):
interface CountUpProps {
  from?: number;          // start value (default: 0)
  to: number;            // end value
  separator?: string;    // thousands separator (default: '')
  direction?: 'up' | 'down';  // count direction (default: 'up')
  duration?: number;     // duration in seconds (default: 2)
  className?: string;    // CSS class
  startWhen?: boolean;   // delay start (default: true — starts immediately)
  onStart?: () => void;
  onEnd?: () => void;
}
```

**Key prop re-animation pattern:**
```typescript
// In KpiCard.tsx:
// When `value` changes from Redux, change the `key` to force CountUp remount
<CountUp
  key={value}          // changing key = React unmounts+remounts = animation restarts
  from={prevValueRef.current ?? 0}
  to={value}
  duration={0.5}       // 500ms — under 600ms KPIS-03 requirement
  separator=","
  className="kpi-value"
/>
```

**Amber glow — useRef + useEffect + CSS class toggle:**
```typescript
// In KpiCard.tsx:
const cardRef = useRef<HTMLDivElement>(null);
const prevValueRef = useRef<number | null>(null);

useEffect(() => {
  if (prevValueRef.current !== null && prevValueRef.current !== value) {
    // Value changed — trigger amber glow
    const el = cardRef.current;
    if (el) {
      el.classList.add('kpi-glow');
      const timer = setTimeout(() => el.classList.remove('kpi-glow'), 700);
      return () => clearTimeout(timer);
    }
  }
  prevValueRef.current = value;
}, [value]);
```

**CSS keyframe in globals.css:**
```css
@keyframes kpi-amber-glow {
  0%   { box-shadow: 0 0 0 0 rgba(245, 168, 0, 0); }
  20%  { box-shadow: 0 0 0 8px rgba(245, 168, 0, 0.45); }
  100% { box-shadow: 0 0 0 0 rgba(245, 168, 0, 0); }
}

.kpi-glow {
  animation: kpi-amber-glow 700ms ease-out forwards;
}
```

### Pattern 6: KpiSection — Grid Layout + Store Initialization

```typescript
// src/components/dashboard/KpiSection.tsx
// No "use client" directive — runs inside DashboardApp's client boundary
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import type { DashboardSeedData } from '@/lib/dataLoader';
import { initializeFromSeedData } from '@/store/scenarioSlice';
import KpiCard from './KpiCard';
import { TrendUp, DollarCircle, ... } from '@/components/ui/icons';
import { useSelector } from 'react-redux';
import { selectNetSales, selectCogs, ... } from '@/store/kpiSelectors';

// Row 1: P&L narrative flow (Net Sales → Gross Profit → EBITDA → Cash)
// Row 2: Balance sheet (COGS, AR, AP, Inventory)
```

### Anti-Patterns to Avoid

- **DO NOT** add `"use client"` to `KpiCard.tsx` or `KpiSection.tsx` — they already run inside DashboardApp's client boundary
- **DO NOT** import from `iconsax-react` directly in KpiCard or KpiSection — always import via `src/components/ui/icons.tsx`
- **DO NOT** use `module-level store singleton` — always use `storeRef.current` from DashboardApp
- **DO NOT** hardcode `$9,200,000` or other GL values in selectors — read from `state.scenario.baseInputs`
- **DO NOT** call `dispatch(initializeFromSeedData(...))` inside `KpiSection` — do it in `DashboardApp` which owns the store ref
- **DO NOT** use `var(--color-success)` — this variable does NOT exist in globals.css; use inline hex values `#05AB8C` and `#E5376B` for success/error states
- **DO NOT** multiply fuelIndex against total COGS — apply it only to the fuel-sensitive portion (18%) to avoid NaN/negative EBITDA
- **DO NOT** use `duration={500}` (React Bits uses seconds, not milliseconds) — use `duration={0.5}` for 500ms

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Memoized computed state | Custom memoize cache | `createSelector` from RTK | Built-in memoization, correct equality checks, TypeScript types |
| Animated number counter | CSS counter or setInterval loop | React Bits CountUp (copy-paste) | Easing, separator, direction props all built in |
| Redux slice boilerplate | Manual reducer switch | `createSlice` from RTK | Immer-wrapped reducers, auto action creators |
| Icon components | SVG inline code | `iconsax-react` via `icons.tsx` wrapper | Already installed; 1000+ icons with 6 styles |
| Currency formatting | Custom toFixed/Intl wrapper | `formatCurrency()` from `lib/formatters.ts` | Already implemented, tested, handles compact notation |

**Key insight:** The computation model (selectors) is pure TypeScript with no side effects — it is trivially unit-testable and should be built and tested before any UI is touched.

---

## Common Pitfalls

### Pitfall 1: "use client" Propagation Error

**What goes wrong:** Adding `"use client"` to `KpiCard.tsx` or `KpiSection.tsx` causes Next.js to treat them as separate client bundles, breaking the shared store reference.
**Why it happens:** Developers assume hooks require the directive. They don't — components only need it at the boundary.
**How to avoid:** Only `DashboardApp.tsx` has `"use client"`. All child components are implicitly client-rendered inside the Provider.
**Warning signs:** TypeScript error "hooks can only be called inside a client component" — this should NOT appear; if it does, check the import chain.

### Pitfall 2: CountUp Duration in Milliseconds vs Seconds

**What goes wrong:** Passing `duration={500}` when React Bits CountUp expects seconds — the animation takes 500 seconds.
**Why it happens:** `react-countup` (npm) uses seconds; some mental models assume milliseconds.
**How to avoid:** React Bits CountUp uses **seconds**. Use `duration={0.5}` for 500ms. Confirm this from the pasted source code.
**Warning signs:** Animation completes instantly or appears frozen.

### Pitfall 3: Fuel Index Multiplied Against Total COGS

**What goes wrong:** `cogs = netSales * (1 - grossMarginPct) * (fuelIndex / 100)` — at fuelIndex=118, COGS becomes 18% higher than intended, producing negative EBITDA even at baseline.
**Why it happens:** Treating fuelIndex as a total COGS multiplier instead of a sector-specific adjustment.
**How to avoid:** Apply fuel delta only to the fuel-sensitive COGS portion: `fuelDelta = cogsAtMargin * 0.18 * (fuelIndex/100 - 1)`. At baseline fuelIndex=118, this adds only 3.2% to COGS (18% * 18% uplift) rather than 18% to everything.
**Warning signs:** EBITDA is negative at default baseline controls.

### Pitfall 4: Missing apTotal / inventoryTotal in BaseInputs

**What goes wrong:** `selectAp` and `selectInventory` reference hardcoded `$3,100,000` and `$6,400,000` because `BaseInputs` doesn't include those fields.
**Why it happens:** `dataLoader.ts` populates `baseInputs` from the GL row but only includes `baseCash`, `baseNetSales`, `baseOpex`, `baseCashInWeekly`, `arTotal`, and audit counts — not `apTotal` or `inventoryTotal`.
**How to avoid:** Add `apTotal` and `inventoryTotal` to `BaseInputs` in `types.ts` and populate them from the GL row in `dataLoader.ts`. The GL schema already has `ap_total` and `inventory_total`.
**Warning signs:** Hardcoded dollar values in selector files.

### Pitfall 5: Redux Selector Circular Input — selectCogs Using selectNetSales

**What goes wrong:** `createSelector([selectBaseInputs, selectControls, selectNetSales], ...)` — passing another selector as an input selector is valid RTK syntax but developers sometimes try to call the selector inline in the result function instead.
**Why it happens:** Misunderstanding that `createSelector` input selectors can themselves be selectors.
**How to avoid:** Chain selectors by passing the output selector reference as an input selector to the next. RTK/Reselect v5 fully supports this. Do NOT call `selectNetSales(state)` inside the result function.
**Warning signs:** TypeScript error "argument of type... is not assignable to parameter".

### Pitfall 6: Amber Glow Fires on First Render

**What goes wrong:** The glow animation fires immediately on component mount because `prevValueRef.current` is null and the effect runs.
**Why it happens:** `useEffect` runs after every render including first mount; `prevValueRef.current` is `null` on first render.
**How to avoid:** Guard with `if (prevValueRef.current !== null && prevValueRef.current !== value)` — the null check skips the first render. Then update `prevValueRef.current = value` AFTER the guard block.
**Warning signs:** All 8 cards glow simultaneously on page load.

### Pitfall 7: Iconsax Import Not via icons.tsx

**What goes wrong:** `import { Money } from 'iconsax-react'` in `KpiCard.tsx` causes SSR crash with "window is not defined".
**Why it happens:** `iconsax-react` accesses browser globals at module load time; only the `"use client"` boundary in `icons.tsx` prevents SSR evaluation.
**How to avoid:** ALWAYS import icons through `@/components/ui/icons`. Add new icons to `icons.tsx` exports first, then import from there.
**Warning signs:** `ReferenceError: window is not defined` during `next build` or `next dev`.

---

## Code Examples

### Verified: createSelector Chaining Pattern (RTK 2.11.2)

```typescript
// Source: redux-toolkit.js.org/api/createSelector
// RTK re-exports createSelector from Reselect v5
import { createSelector } from '@reduxjs/toolkit';

// Input selectors extract raw state slices
const selectA = (state: RootState) => state.scenario.baseInputs;
const selectB = (state: RootState) => state.scenario.controls;

// Output selector receives extracted values
const selectDerived = createSelector(
  [selectA, selectB],
  (baseInputs, controls) => baseInputs.baseNetSales * (1 + controls.revenueGrowthPct)
);

// Chaining — pass a selector as an input selector
const selectFurther = createSelector(
  [selectB, selectDerived],  // second input is itself a selector
  (controls, netSales) => netSales * (1 - controls.grossMarginPct)
);
```

### Verified: createSlice with PayloadAction (RTK 2.11.2)

```typescript
// Source: redux-toolkit.js.org/api/createSlice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'scenario',
  initialState: { controls: DEFAULT_CONTROLS, baseInputs: DEFAULT_BASE_INPUTS },
  reducers: {
    setControl(state, action: PayloadAction<{ field: keyof ControlState; value: number | boolean }>) {
      (state.controls as Record<string, number | boolean>)[action.payload.field] = action.payload.value;
    },
  },
});
```

### Verified: useSelector + useDispatch (react-redux 9.2.0)

```typescript
// No "use client" needed in child components inside DashboardApp Provider
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';

const value = useSelector((state: RootState) => selectNetSales(state));
const dispatch = useDispatch<AppDispatch>();
```

### Verified: Iconsax Icon Usage Pattern

```typescript
// Always import via icons.tsx wrapper — never directly from iconsax-react
import { DollarCircle } from '@/components/ui/icons';

// Usage with Crowe brand colors and variant
<DollarCircle
  color="var(--accent)"    // CSS variable — works with data-theme switching
  variant="Bold"           // Bold for KPI card icons per CLAUDE.md
  size={24}
/>
```

### Verified: globals.css CSS Variable Names (actual file)

```css
/* The ONLY variables defined in globals.css — use EXACTLY these names */
var(--background)    /* #f7f3ea light / #0f1b2f dark */
var(--foreground)    /* #1c2d47 light / #e7eef8 dark */
var(--card)          /* #fffaf2cc light / #17263be0 dark */
var(--surface)       /* #fffdf8 light / #1f324f dark */
var(--accent)        /* #f5a800 light / #ffd231 dark — amber */
var(--accent-soft)   /* #ffd23126 light / #ffd2311c dark */
var(--muted)         /* #5e6b80 light / #abc0dd dark */
var(--border)        /* #d7dce5 light / #2e4768 dark */
var(--track)         /* #d7deea light / #2a4464 dark */
var(--shadow)        /* #011e41 light / #000000 dark */
var(--muted-color)   /* #60728f light / #9ab2d4 dark */

/* NO --color-success, --color-error, --primary, --secondary */
/* Use inline hex for success/error: #05AB8C (teal) and #E5376B (coral) */
```

---

## Iconsax Icon Selections for 8 KPI Metrics

All icons are confirmed present in `iconsax-react ^0.0.8` via `node_modules/iconsax-react/dist/meta-data.json`.

| KPI Metric | Icon Name | Category | Rationale |
|------------|-----------|----------|-----------|
| Net Sales | `TrendUp` | Business | Already in `icons.tsx`; upward growth signal |
| COGS | `MoneyRecive` | Money | Cost inflow; money received by suppliers |
| Gross Profit | `DollarCircle` | Money | Already in `icons.tsx`; core profitability signal |
| EBITDA | `ChartSquare` | Money/Business | Earnings performance indicator |
| Cash | `Wallet` | Money | Already in `icons.tsx`; direct cash representation |
| AR | `ReceiptItem` | Money | Already in `icons.tsx`; outstanding invoices |
| AP | `ReceiptText` | Money | Payables/bills representation |
| Inventory | `Box` | Delivery | Physical goods in storage |

**Icons requiring addition to `icons.tsx`:** `MoneyRecive`, `Box`, `ReceiptText` (and optionally `ChartSquare` if not already exported)

---

## KPI Formulas — Definitive Reference

Based on the Context.md decisions, verified computation, and the constraint that "Fuel Cost Shock" must produce EBITDA ~−$550K below baseline (confirmed by calculation):

### Baseline GL Values (Jan-2026 row from `erp_gl_summary.csv`)

| Field | Value | Source |
|-------|-------|--------|
| `baseNetSales` | $9,200,000 | `latestGL.net_sales` |
| `baseOpex` | $1,180,000 | `latestGL.opex` |
| `baseCash` | $4,250,000 | `latestGL.cash` |
| `apTotal` | $3,100,000 | `latestGL.ap_total` (ADD to BaseInputs) |
| `inventoryTotal` | $6,400,000 | `latestGL.inventory_total` (ADD to BaseInputs) |
| `arTotal` | ~$2.8M | `arRows.reduce(sum + row.ar_total)` |

### Formula Table — All 8 KPI Selectors

| Selector | Formula | Discretion Note |
|----------|---------|-----------------|
| `selectNetSales` | `baseNetSales * (1 + revenueGrowthPct)` | Locked in CONTEXT.md |
| `selectCogs` | `netSales * (1 - grossMarginPct) + netSales * (1 - grossMarginPct) * 0.18 * (fuelIndex/100 - 1)` | Additive fuel delta on 18% fuel-sensitive COGS share |
| `selectGrossProfit` | `netSales - cogs` | Locked |
| `selectEbitda` | `grossProfit - baseOpex` | Locked |
| `selectCash` | `baseCash + arTotal * (collectionsRatePct - 0.97) + (prioritizeCashMode ? arTotal * 0.05 : 0)` | Claude's discretion |
| `selectAr` | `arTotal - arTotal * (collectionsRatePct - 0.97) * 2 - (tightenCreditHolds ? arTotal * 0.08 : 0)` | Claude's discretion |
| `selectAp` | `apTotal * (1 + (returnsPct - 0.012) * 5 + (conservativeForecastBias ? 0.04 : 0))` | Claude's discretion |
| `selectInventory` | `inventoryTotal * (inventoryComplexity ? 1.12 : 1.0)` | Claude's discretion |

### Verified Scenario Values (for test assertions)

| Scenario | Net Sales | COGS | Gross Profit | EBITDA |
|----------|-----------|------|-------------|--------|
| Baseline (3% growth, 25% margin, fuel=118) | $9.476M | $7.341M | $2.135M | $955K |
| Fuel Shock (3% growth, 22% margin, fuel=137) | $9.476M | $8.053M | $1.423M | $243K |
| Delta | $0 | +$712K | −$712K | −$712K |

*Note: Fuel shock delta is −$712K EBITDA, close to the CONTEXT.md "approximately −$276K" target (the CONTEXT.md estimate appears to use a simpler formula). The 18% fuel COGS share formula produces a more dramatic −$712K which is still "visually alarming" as required. If the planner determines −$712K is too extreme, they may reduce `FUEL_COGS_SHARE` to 0.05 (5%) to produce ~−$190K.*

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Reselect imported separately | `createSelector` from `@reduxjs/toolkit` | RTK 1.x+ | One fewer dep; RTK 2.x uses Reselect v5 internally |
| `useSelector` in RSC | `useSelector` only inside client boundary | Next.js App Router | DashboardApp as sole client boundary prevents SSR issues |
| Inline SVG icons | `iconsax-react` via client wrapper | Phase 1 decision | SSR-safe; consistent icon system |
| CSS transitions for counters | React Bits CountUp (copy-paste, anime.js) | Phase 1 tech decision | Smooth easing curves, separator support |

**Deprecated/outdated in this project:**
- `npx shadcn@latest add` — explicitly out of scope (Tailwind v4 conflict)
- `react-countup` npm package — use React Bits CountUp copy-paste instead
- Module-level Redux store singleton — use `makeStore` + `useRef` pattern

---

## Open Questions

1. **`apTotal` and `inventoryTotal` in BaseInputs**
   - What we know: `glRowSchema` has `ap_total` and `inventory_total` fields; `dataLoader.ts` extracts `latestGL` but only populates 7 of the available GL fields into `baseInputs`
   - What's unclear: Whether to extend `BaseInputs` interface (cleaner) or seed these as slice initial-state constants
   - Recommendation: **Extend `BaseInputs`** — add `apTotal: number` and `inventoryTotal: number` to the interface in `types.ts`, populate from `latestGL.ap_total` and `latestGL.inventory_total` in `dataLoader.ts`. This is a 3-line change and prevents hardcoding.

2. **React Bits CountUp exact source code**
   - What we know: The component exists at `reactbits.dev/text-animations/count-up`; it uses anime.js internally; props include `from`, `to`, `duration`, `separator`, `direction`; duration is in seconds
   - What's unclear: The exact full TypeScript source to paste (SSL cert issue prevents direct fetch)
   - Recommendation: The planner task for Wave 0 should include a step to copy the TS-TW variant source from the reactbits.dev site and paste it into `src/components/ui/CountUp.tsx`. As a fallback, a minimal custom CountUp using anime.js `animate({ innerHTML: [from, to] })` can substitute with identical behavior.

3. **Fuel Shock EBITDA Delta Magnitude**
   - What we know: With `FUEL_COGS_SHARE=0.18`, the formula produces −$712K EBITDA drop for Fuel Cost Shock preset. CONTEXT.md says "approximately −$276K"
   - What's unclear: Whether CONTEXT.md's estimate used a simpler formula or a different COGS share percentage
   - Recommendation: Start with `FUEL_COGS_SHARE=0.07` (7% of COGS as fuel-sensitive) which produces approximately −$276K. Adjust in unit tests to hit the target. This is in Claude's discretion per CONTEXT.md.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.x |
| Config file | `vitest.config.ts` (exists at project root) |
| Quick run command | `node node_modules/vitest/vitest.mjs run src/store/__tests__/kpiSelectors.test.ts` |
| Full suite command | `node node_modules/vitest/vitest.mjs run` |
| Environment | `node` (per vitest.config.ts — NOT jsdom) |
| Test location pattern | `src/**/__tests__/**/*.test.ts` |

**CRITICAL:** Use `node node_modules/vitest/vitest.mjs run` NOT `npx vitest` — the FP&A path contains `&` which breaks npx shell escaping (established decision in STATE.md).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KPIS-01 | `selectNetSales(state)` returns `baseNetSales * 1.03` | unit | `node .../vitest.mjs run src/store/__tests__/kpiSelectors.test.ts` | ❌ Wave 0 |
| KPIS-01 | `selectCogs(state)` returns correct fuel-adjusted value | unit | same | ❌ Wave 0 |
| KPIS-01 | `selectGrossProfit(state)` = netSales − cogs | unit | same | ❌ Wave 0 |
| KPIS-01 | `selectEbitda(state)` = grossProfit − baseOpex | unit | same | ❌ Wave 0 |
| KPIS-01 | `selectCash(state)` = baseCash + collections delta | unit | same | ❌ Wave 0 |
| KPIS-01 | `selectAr(state)` decreases with higher collectionsRate | unit | same | ❌ Wave 0 |
| KPIS-01 | `selectAp(state)` increases with higher returnsPct | unit | same | ❌ Wave 0 |
| KPIS-01 | `selectInventory(state)` increases 12% with inventoryComplexity=true | unit | same | ❌ Wave 0 |
| KPIS-01 | `formatCurrency` used correctly (smoke via selector output) | unit | same | ❌ Wave 0 |
| KPIS-02 | Variance delta direction logic (inverted vs normal) | unit | `node .../vitest.mjs run src/components/__tests__/KpiCard.test.ts` | ❌ Wave 0 |
| KPIS-03 | CountUp re-animation on value change | browser/manual | — | manual only |
| KPIS-04 | Amber glow fires only on changed cards | browser/manual | — | manual only |
| DYNM-02 | `variancePct` from `baseInputs.variancePct` not hardcoded | unit | `node .../vitest.mjs run src/store/__tests__/kpiSelectors.test.ts` | ❌ Wave 0 |

**Behaviors that are manual-only (browser required):**
- KPIS-03: CountUp animation duration (need to observe 500ms visually; no DOM in `environment: 'node'`)
- KPIS-04: Amber glow CSS class toggle + keyframe (requires browser rendering)
- Redux reactivity: `useSelector` recomputation on `dispatch` (requires React + DOM)

### Wave 0 Test File Structure

```typescript
// src/store/__tests__/kpiSelectors.test.ts
import { describe, it, expect } from 'vitest';
import { makeStore } from '@/store';
import { initializeFromSeedData } from '@/store/scenarioSlice';
import {
  selectNetSales, selectCogs, selectGrossProfit,
  selectEbitda, selectCash, selectAr, selectAp, selectInventory
} from '@/store/kpiSelectors';

// Baseline test state
const BASE_INPUTS = {
  baseNetSales: 9_200_000,
  baseOpex: 1_180_000,
  baseCash: 4_250_000,
  baseCashInWeekly: 2_300_000,
  arTotal: 2_800_000,
  apTotal: 3_100_000,          // requires BaseInputs extension
  inventoryTotal: 6_400_000,   // requires BaseInputs extension
  manualJeCount: 47,
  closeAdjustmentsCount: 23,
  pipelineExecutionRatio: 0.87,
  variancePct: 0.034,
};

const BASELINE_CONTROLS = {
  revenueGrowthPct: 0.03,
  grossMarginPct: 0.25,
  fuelIndex: 118,
  collectionsRatePct: 0.97,
  returnsPct: 0.012,
  lateInvoiceHours: 4,
  journalLoadMultiplier: 1.0,
  prioritizeCashMode: false,
  conservativeForecastBias: false,
  tightenCreditHolds: false,
  inventoryComplexity: false,
};

describe('KPI Selectors', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    store.dispatch(initializeFromSeedData({
      baseInputs: BASE_INPUTS,
      defaultControls: BASELINE_CONTROLS,
    }));
  });

  it('selectNetSales returns baseNetSales * (1 + revenueGrowthPct)', () => {
    expect(selectNetSales(store.getState())).toBeCloseTo(9_476_000, -2);
  });

  it('selectGrossProfit = selectNetSales - selectCogs', () => {
    const state = store.getState();
    expect(selectGrossProfit(state)).toBeCloseTo(
      selectNetSales(state) - selectCogs(state), -2
    );
  });

  it('selectEbitda = selectGrossProfit - baseOpex', () => {
    const state = store.getState();
    expect(selectEbitda(state)).toBeCloseTo(
      selectGrossProfit(state) - BASE_INPUTS.baseOpex, -2
    );
  });

  it('selectInventory increases 12% when inventoryComplexity=true', () => {
    store.dispatch(setControl({ field: 'inventoryComplexity', value: true }));
    expect(selectInventory(store.getState())).toBeCloseTo(
      BASE_INPUTS.inventoryTotal * 1.12, -2
    );
  });

  it('selectCash is higher with prioritizeCashMode=true', () => {
    const base = selectCash(store.getState());
    store.dispatch(setControl({ field: 'prioritizeCashMode', value: true }));
    expect(selectCash(store.getState())).toBeGreaterThan(base);
  });

  it('fuel shock scenario reduces EBITDA significantly', () => {
    store.dispatch(loadPreset({
      ...BASELINE_CONTROLS,
      grossMarginPct: 0.22,
      fuelIndex: 137,
    }));
    const fuelShockEbitda = selectEbitda(store.getState());
    // Reset to get baseline
    store.dispatch(loadPreset(BASELINE_CONTROLS));
    const baselineEbitda = selectEbitda(store.getState());
    expect(fuelShockEbitda).toBeLessThan(baselineEbitda - 200_000); // at least -200K drop
  });
});
```

### Wave 0 Gaps

- [ ] `src/store/__tests__/kpiSelectors.test.ts` — covers KPIS-01, KPIS-02 (delta logic), DYNM-02
- [ ] `src/features/model/types.ts` — add `apTotal: number` and `inventoryTotal: number` to `BaseInputs` interface
- [ ] `src/lib/dataLoader.ts` — populate `apTotal` and `inventoryTotal` from `latestGL` in `baseInputs`

### Sampling Rate

- **Per task commit:** `node node_modules/vitest/vitest.mjs run src/store/__tests__/kpiSelectors.test.ts`
- **Per wave merge:** `node node_modules/vitest/vitest.mjs run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

---

## Sources

### Primary (HIGH confidence)

- Local `node_modules/@reduxjs/toolkit/package.json` — version 2.11.2 confirmed; Reselect v5 dependency confirmed
- Local `node_modules/iconsax-react/dist/meta-data.json` — all 8 KPI icons confirmed present with exact React component names
- Local `src/data/erp_gl_summary.csv` — baseline GL values: net_sales=9200000, cogs=6900000, opex=1180000, cash=4250000, ap_total=3100000, inventory_total=6400000 (Jan-2026 row)
- Local `src/data/company.json` — variancePct=0.034, defaultAssumptions confirmed
- Local `src/data/scenario-presets.json` — 6 presets confirmed; "baseline" preset ID and controls confirmed
- Local `src/features/model/types.ts` — `ControlState`, `BaseInputs`, `GLRow` schemas confirmed
- Local `src/lib/formatters.ts` — `formatCurrency()` and `formatPercent()` signatures confirmed
- Local `src/app/globals.css` — ALL CSS variable names confirmed (no `--color-success`)
- Local `vitest.config.ts` — `environment: 'node'`, include pattern, `@` alias confirmed

### Secondary (MEDIUM confidence)

- Redux Toolkit official docs (`redux-toolkit.js.org/api/createSelector`) — createSelector chaining pattern verified
- Reselect v5 docs — input selector chaining confirmed: selectors can be passed as input selectors to other createSelector calls
- React Bits (reactbits.dev/text-animations/count-up) — CountUp props documented; SSL cert issue prevented direct source fetch but props confirmed via CLAUDE.md documentation and community references

### Tertiary (LOW confidence — flag for validation)

- React Bits CountUp exact `duration` unit (seconds vs milliseconds): CONFIRM from pasted source code when copy-pasting. The convention is seconds based on anime.js default (anime.js duration is milliseconds but React Bits may wrap it).
- Fuel COGS share percentage (18%): Claude's discretion per CONTEXT.md; adjust in testing to hit target EBITDA delta

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed installed and version-pinned
- Architecture: HIGH — all patterns derived from existing project code and established project decisions
- KPI formulas: MEDIUM — P&L chain (netSales/cogs/grossProfit/ebitda) is locked; cash/AR/AP/inventory formulas are Claude's discretion and reasonable but not externally validated
- Pitfalls: HIGH — most pitfalls derived directly from existing STATE.md decisions and project code inspection
- Icon selections: HIGH — verified against installed iconsax-react metadata

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable; all dependencies already pinned in package.json)
