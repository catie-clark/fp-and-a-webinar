# Phase 7: Reactive Margin Bridge - Research

**Researched:** 2026-03-05
**Domain:** Recharts 2.15.x waterfall bar chart + Redux selector derivation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Bridge Structure**
- 6-bar waterfall: Baseline EBITDA | Revenue Growth Impact | Gross Margin Impact | Fuel Index Impact | All Other Levers | Adjusted EBITDA
- Baseline = EBITDA computed from raw `baseInputs` (no slider adjustments)
- At default sliders: all 4 delta bars render at zero height; Baseline = Adjusted EBITDA

**Chart Placement**
- Full-width row, inserted between `<CloseTracker />` and `<ChartsSection />` in `DashboardApp.tsx`
- Wrapped in floating card: `var(--card)` background, crowe-card shadow, 12px radius, no border

**Bar Colors (hardcoded hex — CSS vars don't resolve in SVG `fill` attributes)**
- Positive delta bars: `#F5A800` (Crowe Amber)
- Negative delta bars: `#E5376B` (Crowe Coral)
- Baseline EBITDA bar: `#002E62` (Crowe Indigo)
- Adjusted EBITDA bar: `#002E62` (Crowe Indigo)
- ReferenceLine at zero: `var(--border)` color, `strokeDasharray="4 2"`

**Bar Labels**
- `<LabelList>` above each bar, compact currency format (`$2.1M`, `+$340K`, `–$420K`)
- Positive deltas prefixed `+`, negative prefixed `–`, zero labels omitted
- Tooltip on hover: bar name, dollar impact, formatted currency value
- Card header: left "Margin Bridge" title, right live `selectEbitda` as "Adjusted EBITDA: $2.1M"

**Update Animation**
- `isAnimationActive={true}` ~300ms — bars animate to new heights on slider change
- Amber glow on card border when Adjusted EBITDA changes — same CSS animation as KPI cards
- No debounce or throttle on slider events

**No new Redux slices or data files** — pure component + selector derivation from existing slice

### Claude's Discretion

- Exact Recharts chart type (BarChart vs ComposedChart for mixed positive/negative)
- Exact label font size and positioning (recommend `fontSize={11}`, 6px offset)
- Chart height (recommend 260–300px)
- Whether "All Other Levers" bar shown when delta is exactly zero
- Tooltip component design (`MarginBridgeTooltip` component)
- Whether `buildMarginBridgeData` pure function goes in `chartDataUtils.ts`

### Deferred Ideas (OUT OF SCOPE)

- Per-toggle breakdown in "All Other Levers" — bundle all into one bar
- Chart zoom/pan
- Side-by-side scenario comparison (INTV-01)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHRT-01 | Margin Bridge chart (Recharts BarChart, gold `#F5A800` bars, ReferenceLine at zero, currency-formatted tooltips) updates in real time as scenario sliders change | Recharts 2.15.x `BarChart` + `Cell` per-bar color pattern, Redux `useSelector` isolation, `kpi-amber-glow` keyframe reuse, selector derivation formulas |
</phase_requirements>

---

## Summary

Phase 7 builds a single reactive component — `MarginBridgeSection` — that derives 6 waterfall bars from existing Redux state and re-renders live as scenario sliders move. The hardest technical problem is not reactivity (Redux `useSelector` handles that natively) but **waterfall bar coloring**: Recharts 2.15.x has no built-in waterfall type, so per-bar colors require the `<Cell>` child element pattern inside a single `<Bar>` component.

The selector derivation is the most arithmetic-intensive part. All four delta bars can be expressed as differences between "EBITDA with one lever active" and "baseline EBITDA" using values already computed by the existing `selectEbitda` chain — no new Redux slice fields are needed. The baseline itself requires a new `selectBaselineEbitda` selector that uses `baseInputs` directly without reading `controls`.

The amber glow animation is already implemented in `globals.css` as `@keyframes kpi-amber-glow` / `.kpi-glow`. The Margin Bridge card can reuse the same class toggle pattern from `KpiCard.tsx` — no new CSS is needed.

**Primary recommendation:** Use a single `<BarChart>` with one `<Bar>` using `<Cell>` children for per-bar colors, plus `<ReferenceLine y={0}>`, and derive all 6 values via 5 new `createSelector` selectors added to `kpiSelectors.ts`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^2.15.0 (installed) | Bar chart rendering | Already in use for Phases 5–6 charts |
| react-redux | ^9.2.0 (installed) | `useSelector` for live Redux state | Already the project state layer |
| @reduxjs/toolkit | ^2.0.0 (installed) | `createSelector` for memoized selectors | Already used in `kpiSelectors.ts` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| formatters.ts (local) | — | `formatCurrency(value, true)` for bar labels and tooltip | All label/tooltip formatting |
| globals.css `.kpi-glow` | — | Amber glow animation on card border | When Adjusted EBITDA value changes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `<Cell>` for per-bar color | Two `<Bar>` series (positive + negative) | Two `<Bar>` series requires splitting the data array into two separate arrays — complex and breaks the left-to-right bar order. `<Cell>` children is simpler and correct. |
| BarChart | ComposedChart | ComposedChart is only needed when mixing bar+line. Not needed here. |

**No new installations needed.** All required libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure (new files)

```
src/
├── store/
│   └── kpiSelectors.ts              # Add 5 new selectors (append to existing file)
├── components/dashboard/
│   ├── MarginBridgeSection/
│   │   ├── MarginBridgeSection.tsx  # Card wrapper + header + chart
│   │   └── MarginBridgeChart.tsx    # Recharts BarChart component
│   └── ChartsSection/
│       └── chartDataUtils.ts        # Add buildMarginBridgeData (optional pure fn)
└── features/model/__tests__/
    └── marginBridge.test.ts         # Wave 0 RED stubs
```

### Pattern 1: Per-Bar Color With `<Cell>` in Recharts 2.15.x

**What:** Recharts 2.x `<Bar>` accepts `<Cell>` children. Each `<Cell>` receives a `fill` prop that overrides the parent `<Bar>` fill for that specific data point. This is the only correct way to render mixed colors in a single bar series.

**When to use:** Any time different bars in the same series need different colors (waterfall, diverging bar).

**Example:**
```tsx
// Source: Recharts 2.x official docs — Cell API
import { BarChart, Bar, Cell, ReferenceLine, XAxis, YAxis,
         CartesianGrid, Tooltip, LabelList, ResponsiveContainer } from 'recharts';

const BAR_COLORS = {
  total: '#002E62',    // Indigo — Baseline and Adjusted EBITDA
  positive: '#F5A800', // Amber — positive delta
  negative: '#E5376B', // Coral — negative delta
};

function getBarColor(entry: MarginBridgeBar): string {
  if (entry.isTotal) return BAR_COLORS.total;
  return entry.value >= 0 ? BAR_COLORS.positive : BAR_COLORS.negative;
}

<BarChart data={chartData} margin={{ top: 24, right: 16, bottom: 8, left: 16 }}>
  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
  <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
  <YAxis tickFormatter={(v) => formatCurrency(v, true)} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
  <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 2" />
  <Tooltip content={<MarginBridgeTooltip />} />
  <Bar dataKey="value" isAnimationActive={true} animationDuration={300} radius={[4, 4, 0, 0]}>
    {chartData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
    ))}
    <LabelList dataKey="label" position="top" style={{ fontSize: 11, fill: 'var(--foreground)' }} />
  </Bar>
</BarChart>
```

**CRITICAL NOTE on negative bars and LabelList:** When `position="top"` is set on `<LabelList>`, Recharts 2.15.x places the label above the bar's highest pixel — meaning for negative bars (extending downward), "top" is actually the zero line, and the label renders above zero, not below the bar bottom. This is usually acceptable for a waterfall display. However if labels on negative bars must appear below the bar tip, use `position="insideBottom"` with a negative `offset` value, or use a custom `content` renderer. For a conference room readability goal, `position="top"` with a `formatter` that prefixes `–` is sufficient.

### Pattern 2: Selector Derivation for 6 Waterfall Values

**What:** Five new `createSelector` calls added to `kpiSelectors.ts`. Each computes one bar's value from existing selectors with surgical lever isolation.

**When to use:** Any time a derivative KPI can be expressed as a delta between two selector invocations.

**Exact formulas (derived from reading `kpiSelectors.ts`):**

**Bar 1 — `selectBaselineEbitda` (total bar, Indigo)**

Baseline means: zero revenue growth, gross margin at the seed-data level (implied by `baseInputs` having no "base gross margin" field — see note below), fuelIndex=100 (no fuel adjustment).

The existing formulas:
- `selectNetSales = baseNetSales * (1 + revenueGrowthPct)` — at zero growth → `baseNetSales`
- `selectCogs = netSales * (1 - grossMarginPct) * (1 + FUEL_COGS_SHARE * (fuelIndex/100 - 1))` — at fuelIndex=100 → `baseNetSales * (1 - grossMarginPct_default)`
- `selectEbitda = grossProfit - baseOpex`

**Problem:** `baseInputs` has no `baseGrossMarginPct` field. The gross margin target comes from `controls.grossMarginPct` (default: 0.25). "Baseline EBITDA" should use those default controls (the seeded preset controls), not zero.

**Correct definition of baseline:** EBITDA when all controls are at their default/seeded values (i.e., when `controls === defaultControls`). Since the slice is initialized with `initializeFromSeedData({ baseInputs, defaultControls })`, the simplest approach is: **capture the initial `selectEbitda` value before any slider is moved**, OR compute it from `state.scenario.baseInputs` using the seeded controls.

**Recommended implementation:** Add a `selectBaselineEbitda` selector that uses `baseInputs` to compute EBITDA without any lever adjustments — treat fuelIndex=100 and revenueGrowthPct=0 and grossMarginPct from controls as the "neutral" state. But since CONTEXT.md says "seed data EBITDA (raw baseInputs, no slider adjustments)", the correct formula is:

```typescript
// selectBaselineEbitda — EBITDA with all levers at their neutral/zero-adjustment state:
// revenueGrowthPct=0, fuelIndex=100, grossMarginPct=controls.grossMarginPct (unchanged)
// This gives: baseNetSales * grossMarginPct - baseOpex
export const selectBaselineEbitda = createSelector(
  [selectBaseInputs, selectControls],
  (base, controls) => {
    const baseNetSales = base.baseNetSales;
    const baseGrossProfit = baseNetSales * controls.grossMarginPct;
    return baseGrossProfit - base.baseOpex;
  }
);
```

**Bar 2 — `selectRevenueGrowthImpact` (delta, Amber/Coral)**

Revenue growth changes net sales, which flows through to gross profit. Fuel index and gross margin are held at current controls.

```typescript
// Delta = EBITDA_with_growth - EBITDA_without_growth
// = (baseNetSales * (1 + revGrowthPct) * grossMarginPct - baseOpex)
//   - (baseNetSales * grossMarginPct - baseOpex)
// = baseNetSales * revGrowthPct * grossMarginPct
// Note: excludes fuel effect on the incremental revenue (conservative, simpler)
export const selectRevenueGrowthImpact = createSelector(
  [selectBaseInputs, selectControls],
  (base, controls) =>
    base.baseNetSales * controls.revenueGrowthPct * controls.grossMarginPct
);
```

**Bar 3 — `selectGrossMarginImpact` (delta, Amber/Coral)**

Gross margin changes EBITDA by changing how much of net sales is gross profit. Revenue growth is included in net sales here.

```typescript
// Net sales at current growth: base.baseNetSales * (1 + controls.revenueGrowthPct)
// EBITDA at grossMarginPct vs at neutral (no gross margin adjustment means grossMarginPct=0.25 default)
// But "baseline" uses current controls.grossMarginPct — so this bar is always 0 if the user hasn't moved the slider.
// Delta = netSales * grossMarginPct - netSales * grossMarginPct_baseline
// Since baseline IS grossMarginPct (it uses controls.grossMarginPct), this bar IS zero at default.
// That satisfies CONTEXT.md: "at default sliders, all delta bars render at zero height."
//
// The real question is: what gross margin does baseline use?
// Answer: baseline uses controls.grossMarginPct (the current slider value).
// So Gross Margin Impact = 0 always? NO — this is the delta vs the seed-data gross margin.
//
// Correct interpretation from CONTEXT.md §Bridge Structure:
// "Baseline EBITDA — EBITDA computed from raw baseInputs (seed data, no slider adjustments)"
// This means the SEED gross margin (from the defaultPreset controls loaded at init),
// not the current slider position.
//
// The seed grossMarginPct is stored in controls when first initialized.
// But it changes when the user moves the slider — we need the seed value.
//
// Solution: Store the "defaultControls" in baseInputs or separately.
// But baseInputs has no grossMarginPct field.
//
// PRACTICAL IMPLEMENTATION: Use a memoized ref to the initial controls in the component,
// OR add baseGrossMarginPct to baseInputs (a minor data model extension).
// The cleanest Redux approach: baseInputs gets a baseGrossMarginPct field.
// Alternative: compute baseline EBITDA using CURRENT grossMarginPct (making baseline=adjusted
// when only the revenue lever is moved) — simpler but less illustrative.
//
// RECOMMENDED: Since this is a webinar demo, use the SIMPLEST defensible formula:
// Gross Margin Impact = (currentGrossMarginPct - 0.25_default) * netSalesAtCurrentGrowth
// where 0.25 is the known default from scenarioSlice DEFAULT_CONTROLS.
// But this hardcodes 0.25. Better: add baseGrossMarginPct to baseInputs.
//
// FINAL RECOMMENDED APPROACH (avoids model change):
// Keep ALL selectors reading from controls (current slider values).
// Define baseline as "what EBITDA would be if revenueGrowthPct=0, fuelIndex=FUEL_BASE_INDEX,
// and grossMarginPct = controls.grossMarginPct (unchanged from baseline)".
// Then:
// - Revenue Growth Impact = selectEbitda(currentState) - selectEbitda(state with revGrowth=0)
// - Gross Margin Impact = 0 (gross margin is already in both baseline and adjusted)
// This breaks the waterfall — Gross Margin Impact is always zero if baseline uses current grossMarginPct.
//
// THE CORRECT APPROACH (matches CONTEXT.md intent):
// Baseline = EBITDA using seed defaultControls (all sliders at their loaded-preset values).
// Store defaultControls snapshot separately OR capture selectEbitda at seed time.
//
// SIMPLEST IMPLEMENTATION:
// Add baseEbitda to baseInputs (computed at dataLoader time from seed controls).
// Then selectBaselineEbitda = (state) => state.scenario.baseInputs.baseEbitda
// This is one scalar field, trivial to add.
```

**PLANNER NOTE:** The selector derivation requires a decision on baseline representation. Two options:

**Option A (recommended):** Add `baseEbitda` to `BaseInputs` type. Compute it in `dataLoader.ts` from `baseNetSales * defaultPreset.grossMarginPct - baseOpex` (+ fuelIndex=100 applied). Then all delta selectors are: `selectXImpact = selectEbitdaWithXActive - selectBaselineEbitda`. No component state needed.

**Option B (no model change):** Derive baseline inside the component using a snapshot of controls at mount time. More fragile — baseline shifts if user navigates away and back.

**Option A is the correct path.** `baseEbitda` is a one-field addition to `BaseInputs`.

**Delta selector formulas given Option A:**

```typescript
// ─── BASELINE ──────────────────────────────────────────────────────────────
export const selectBaselineEbitda = (state: RootState) =>
  state.scenario.baseInputs.baseEbitda;

// ─── REVENUE GROWTH IMPACT ─────────────────────────────────────────────────
// Isolate revenue growth: hold grossMarginPct and fuelIndex at their seed values.
// Since we can't call createSelector with counterfactual args directly,
// compute analytically:
// revenueGrowthDelta = baseNetSales * revenueGrowthPct * grossMarginPct_seed
// Where grossMarginPct_seed is approximated by controls.grossMarginPct
// (if user hasn't moved it, it IS the seed value)
export const selectRevenueGrowthImpact = createSelector(
  [selectBaseInputs, selectControls],
  (base, controls) =>
    base.baseNetSales * controls.revenueGrowthPct * controls.grossMarginPct
);

// ─── GROSS MARGIN IMPACT ───────────────────────────────────────────────────
// grossMarginPct slider changes gross profit per dollar of net sales.
// Delta vs seed margin:
// grossMarginDelta = netSalesAtCurrentGrowth * (grossMarginPct - grossMarginPct_seed)
// grossMarginPct_seed from baseInputs.baseGrossMarginPct
// OR: compute as selectGrossProfit - (netSalesAtCurrentGrowth * baseGrossMarginPct)
// With Option A approach, add baseGrossMarginPct to baseInputs too.
export const selectGrossMarginImpact = createSelector(
  [selectBaseInputs, selectControls, selectNetSales],
  (base, controls, netSales) =>
    netSales * (controls.grossMarginPct - base.baseGrossMarginPct)
);

// ─── FUEL INDEX IMPACT ─────────────────────────────────────────────────────
// Fuel delta from kpiSelectors.ts formula:
// fuelDelta = cogsAtMargin * FUEL_COGS_SHARE * (fuelIndex/100 - 1)
// Since fuel increases COGS, it DECREASES gross profit and EBITDA.
// So the EBITDA impact = -fuelDelta
const FUEL_COGS_SHARE = 0.18;
const FUEL_BASE_INDEX = 100;
export const selectFuelIndexImpact = createSelector(
  [selectControls, selectNetSales],
  (controls, netSales) => {
    const cogsAtMargin = netSales * (1 - controls.grossMarginPct);
    const fuelDelta = cogsAtMargin * FUEL_COGS_SHARE * (controls.fuelIndex / FUEL_BASE_INDEX - 1);
    return -fuelDelta; // positive fuelDelta = higher COGS = negative EBITDA impact
  }
);

// ─── ALL OTHER LEVERS IMPACT ────────────────────────────────────────────────
// Residual: Adjusted EBITDA - Baseline - Revenue - GrossMargin - Fuel
// This is the cleanest math — it captures collections, returns, mode toggles,
// lateInvoiceHours, journalLoadMultiplier effects without knowing each formula.
// Note: current selectEbitda does NOT include collections/returns/toggles in EBITDA
// (those affect Cash and AR, not EBITDA per kpiSelectors.ts). So "All Other Levers"
// will always be zero unless the formula is expanded.
// See "Open Questions" section for resolution.
export const selectOtherLeversImpact = createSelector(
  [selectEbitda, selectBaselineEbitda, selectRevenueGrowthImpact,
   selectGrossMarginImpact, selectFuelIndexImpact],
  (adjusted, baseline, revGrowth, grossMargin, fuel) =>
    adjusted - baseline - revGrowth - grossMargin - fuel
);
```

### Pattern 3: Amber Glow Reuse on Card Border

**What:** `globals.css` already defines `@keyframes kpi-amber-glow` and `.kpi-glow`. KpiCard.tsx uses `useEffect` + `useRef` to add/remove the class when `value` changes.

**Exact keyframe name:** `kpi-amber-glow`
**Exact class name:** `.kpi-glow`
**Duration:** 700ms, `ease-out forwards`

**Reuse pattern** (from KpiCard.tsx lines 31–46):
```tsx
const cardRef = useRef<HTMLDivElement>(null);
const prevEbitdaRef = useRef<number | null>(null);

useEffect(() => {
  if (prevEbitdaRef.current !== null && prevEbitdaRef.current !== adjustedEbitda) {
    const el = cardRef.current;
    if (el) {
      el.classList.remove('kpi-glow');
      void el.offsetHeight; // force reflow to restart animation
      el.classList.add('kpi-glow');
      const timer = setTimeout(() => el.classList.remove('kpi-glow'), 750);
      return () => clearTimeout(timer);
    }
  }
  prevEbitdaRef.current = adjustedEbitda;
}, [adjustedEbitda]);
```

**Dark mode:** The `kpi-amber-glow` keyframe uses rgba(245,168,0,...) — the amber glow is visible in both light and dark themes because it is an emissive effect (adds glow, doesn't depend on background). No dark mode override needed.

### Pattern 4: Label Formatting for Positive/Negative/Zero Bars

**What:** LabelList in Recharts 2.x accepts a `formatter` prop for custom label text.

```tsx
// Returns null for zero (omits label), '+$X' for positive, '–$X' for negative
function formatBridgeLabel(value: number): string | null {
  if (value === 0) return null;
  const formatted = formatCurrency(Math.abs(value), true);
  return value > 0 ? `+${formatted}` : `\u2013${formatted}`; // – (en dash)
}

<LabelList
  dataKey="value"
  position="top"
  formatter={formatBridgeLabel}
  style={{ fontSize: 11, fill: 'var(--foreground)', fontWeight: 600 }}
/>
```

**Note on null labels:** Recharts 2.15.x renders `null` from a `formatter` as an empty string (no label rendered). This handles the zero-case cleanly.

### Pattern 5: Theme Visibility for Bars

**What:** Hardcoded hex fills (`#F5A800`, `#E5376B`, `#002E62`) are tested against both themes in globals.css:

- Light theme background (`--card: #fffaf2cc`): all three colors have sufficient contrast.
- Dark theme background (`--card: #17263be0`, which is approximately `#17263b`): `#002E62` (Crowe Indigo) against `#17263b` is PROBLEMATIC — dark indigo on dark card may not be visible.

**Resolution for dark mode:**

The Adjusted EBITDA and Baseline bars use `#002E62`. On dark backgrounds this is nearly invisible. Use a CSS variable approach via `getComputedStyle` OR use a lighter indigo for dark mode.

**Recommended approach:** Since SVG `fill` cannot use CSS vars, read the computed CSS variable value at render time:

```tsx
// In component body (inside the client boundary — no SSR issue):
const isDark = typeof document !== 'undefined' &&
  document.documentElement.getAttribute('data-theme') === 'dark';

const TOTAL_BAR_COLOR = isDark ? '#5B8FD4' : '#002E62'; // light blue-indigo for dark mode
```

OR use `useMemo` that depends on a theme state (if theme toggle is wired to Redux or a context). The simplest implementation: read `data-theme` attribute directly.

**This is a CRITICAL finding** — without this, the Baseline and Adjusted EBITDA bars are invisible in dark mode (WBNR-02 requirement). The planner MUST include a dark-mode color branch for the total bars.

### Anti-Patterns to Avoid

- **Using two `<Bar>` data series** to separate positive/negative bars: breaks bar left-to-right order, requires custom legend, more complex.
- **CSS variables in SVG `fill` attributes**: They do not resolve in SVG context (confirmed in Phase 6 decision log). Always use hardcoded hex.
- **`debounce` on slider onChange**: Explicitly forbidden in CONTEXT.md. The `onValueChange` dispatches on every drag position for live updates.
- **Adding `'use client'` to MarginBridgeSection**: Not needed — runs inside `DashboardApp.tsx` existing client boundary.
- **Importing `kpiSelectors` constants (`FUEL_COGS_SHARE`, `FUEL_BASE_INDEX`) into new selector file**: Instead, keep them co-located in `kpiSelectors.ts` and add the new selectors to the same file.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-bar coloring | Custom SVG bar renderer | `<Cell>` in Recharts 2.x | Cell is the documented API for per-datum overrides |
| Selector memoization | Manual `useMemo` in component | `createSelector` from RTK | Already the project pattern; prevents unnecessary re-renders |
| Currency label formatting | Custom formatter | `formatCurrency` from `src/lib/formatters.ts` | Single source of truth for all numeric display in the project |
| Card amber glow | New CSS keyframe | `.kpi-glow` from `globals.css` | Already defined and tested; adding a duplicate creates drift |

---

## Common Pitfalls

### Pitfall 1: Invisible Total Bars in Dark Mode

**What goes wrong:** `#002E62` (Crowe Indigo Dark) renders near-invisibly on the dark theme card background `#17263b`.
**Why it happens:** Hardcoded SVG `fill` values bypass CSS variable theming.
**How to avoid:** Add a dark-mode branch in `getBarColor()` that returns a lighter indigo (`#5B8FD4` or similar) for total bars when `data-theme="dark"`.
**Warning signs:** During dark mode browser QA, Baseline and Adjusted EBITDA bars disappear.

### Pitfall 2: selectBaselineEbitda Returns Stale Value After Preset Load

**What goes wrong:** If baseline is computed from `baseInputs.baseEbitda` (the recommended Option A), this value is set once at `initializeFromSeedData` and never changes. This is correct behavior — but confirm that `loadPreset` and `resetToDefaults` dispatches do NOT also update `baseInputs` (they don't — they only update `controls`). Verify in `scenarioSlice.ts`: confirmed that `loadPreset` and `resetToDefaults` only touch `state.controls`, not `state.baseInputs`. Baseline is stable.

### Pitfall 3: Bar Height at Zero — Radius Artifact

**What goes wrong:** When delta bars have value `0` (default state), Recharts renders them as zero-height bars. The `radius={[4,4,0,0]}` prop can produce a tiny 4px visual artifact at the zero line.
**Why it happens:** Border-radius still renders even when bar height is 0.
**How to avoid:** Either conditionally set `radius={entry.value !== 0 ? [4,4,0,0] : [0,0,0,0]}` via `Cell`, or accept the 4px artifact (minimal visual impact at webinar scale).

### Pitfall 4: LabelList and Negative Bar Positions

**What goes wrong:** `position="top"` on `<LabelList>` for a bar with a negative value places the label at the zero line, not below the bar tip. The bar tip (lowest point) is unlabeled.
**Why it happens:** Recharts interprets "top" as the higher end of the bar's bounding box — for negative bars this is the zero crossing, not the bar bottom.
**How to avoid:** For webinar-scale readability, `position="top"` is acceptable — the label value (e.g., `–$420K`) communicates the magnitude even if it renders at the zero line. The planner may choose a custom `content` renderer if precise placement is required.

### Pitfall 5: "All Other Levers" Is Always Zero

**What goes wrong:** `selectEbitda` in `kpiSelectors.ts` does NOT incorporate collections rate, returns rate, late invoice hours, journal load multiplier, or toggles (other than `inventoryComplexity`). Those controls only affect `selectCash`, `selectAr`, `selectAp`, `selectInventory`. So `selectOtherLeversImpact` will always be exactly 0 because the residual formula yields `adjusted - baseline - revGrowth - grossMargin - fuel = 0` (since adjusted IS baseline + revGrowth + grossMargin + fuel per the current formulas).
**Why it happens:** The "other levers" (collections, returns, etc.) were intentionally not wired to EBITDA in Phase 3.
**How to avoid:** This is a design choice. The planner has two options:
  1. **Accept zero for "All Other Levers"** — the bar renders at zero height at default state (per CONTEXT.md requirement). The label is omitted (zero labels omitted per design). The bar name still shows in the tooltip on hover. This is honest — those levers don't drive EBITDA in the current model.
  2. **Wire a small EBITDA proxy for other levers** (e.g., `lateInvoiceHours * someRate`) — adds complexity, risks inconsistency.
**Recommendation:** Accept zero for "All Other Levers" in the current model. The bar renders; its zero value communicates that those levers operate outside the EBITDA path (e.g., cash and AR). This is defensible for the webinar context.

### Pitfall 6: BaseInputs Type Does Not Have baseEbitda / baseGrossMarginPct

**What goes wrong:** If Option A is used (recommended), two new fields must be added to the `BaseInputs` type in `features/model/types.ts` and populated in `dataLoader.ts`.
**How to avoid:** The planner must include a task wave that adds these fields. They are scalar numbers, computed at load time from seed data. The `Zod` schema for `BaseInputs` also needs updating.

---

## Code Examples

Verified patterns from existing codebase:

### Recharts Bar With Cell (per-bar colors)

```tsx
// Source: Recharts 2.x docs + PipelineChart.tsx as structural reference
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
         LabelList, ReferenceLine, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height="100%">
  <BarChart data={chartData} margin={{ top: 24, right: 16, bottom: 8, left: 16 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
    <XAxis
      dataKey="name"
      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
      axisLine={false}
      tickLine={false}
    />
    <YAxis
      tickFormatter={(v: number) => formatCurrency(v, true)}
      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
      axisLine={false}
      tickLine={false}
      width={64}
    />
    <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 2" />
    <Tooltip content={<MarginBridgeTooltip />} />
    <Bar
      dataKey="value"
      isAnimationActive={true}
      animationDuration={300}
      radius={[4, 4, 0, 0]}
    >
      {chartData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={getBarColor(entry, isDark)} />
      ))}
      <LabelList
        dataKey="label"
        position="top"
        style={{ fontSize: 11, fill: 'var(--foreground)', fontWeight: 600 }}
      />
    </Bar>
  </BarChart>
</ResponsiveContainer>
```

### KPI Amber Glow Pattern (from KpiCard.tsx)

```tsx
// Source: KpiCard.tsx lines 31–46 — reuse verbatim in MarginBridgeSection
const cardRef = useRef<HTMLDivElement>(null);
const prevEbitdaRef = useRef<number | null>(null);

useEffect(() => {
  if (prevEbitdaRef.current !== null && prevEbitdaRef.current !== adjustedEbitda) {
    const el = cardRef.current;
    if (el) {
      el.classList.remove('kpi-glow');
      void el.offsetHeight;
      el.classList.add('kpi-glow');
      const timer = setTimeout(() => el.classList.remove('kpi-glow'), 750);
      return () => clearTimeout(timer);
    }
  }
  prevEbitdaRef.current = adjustedEbitda;
}, [adjustedEbitda]);
```

### buildMarginBridgeData Pure Function Signature

```typescript
// Source: chartDataUtils.ts pattern — add to same file
export interface MarginBridgeBar {
  name: string;          // X-axis label
  value: number;         // bar height (positive = up, negative = down)
  label: string | null;  // formatted label (null = omit)
  isTotal: boolean;      // true for Baseline and Adjusted EBITDA bars
}

export function buildMarginBridgeData(
  baselineEbitda: number,
  revenueGrowthImpact: number,
  grossMarginImpact: number,
  fuelIndexImpact: number,
  otherLeversImpact: number,
  adjustedEbitda: number
): MarginBridgeBar[] {
  return [
    { name: 'Baseline EBITDA', value: baselineEbitda, label: formatCurrency(baselineEbitda, true), isTotal: true },
    { name: 'Revenue Growth', value: revenueGrowthImpact, label: formatBridgeLabel(revenueGrowthImpact), isTotal: false },
    { name: 'Gross Margin', value: grossMarginImpact, label: formatBridgeLabel(grossMarginImpact), isTotal: false },
    { name: 'Fuel Index', value: fuelIndexImpact, label: formatBridgeLabel(fuelIndexImpact), isTotal: false },
    { name: 'All Other Levers', value: otherLeversImpact, label: formatBridgeLabel(otherLeversImpact), isTotal: false },
    { name: 'Adjusted EBITDA', value: adjustedEbitda, label: formatCurrency(adjustedEbitda, true), isTotal: true },
  ];
}
```

**NOTE:** `buildMarginBridgeData` cannot import `formatCurrency` directly if the function lives in `chartDataUtils.ts` (which currently imports only CSV type shapes). The formatter import must be added. This is safe — `formatters.ts` is a pure function with no DOM dependencies.

### New BaseInputs Fields (type extension)

```typescript
// In features/model/types.ts — add to BaseInputs interface:
baseEbitda: number;           // Seed EBITDA: baseNetSales * baseGrossMarginPct - baseOpex (fuelIndex=100)
baseGrossMarginPct: number;   // Seed gross margin from defaultPreset.controls.grossMarginPct

// In dataLoader.ts — compute at load time:
const defaultPreset = presets.find(p => p.id === 'baseline') ?? presets[0];
const baseGrossMarginPct = defaultPreset.controls.grossMarginPct;
const baseEbitda = baseInputs.baseNetSales * baseGrossMarginPct - baseInputs.baseOpex;
// Note: fuelIndex at 100 means no fuel adjustment to baseEbitda (FUEL_COGS_SHARE * 0 = 0)
baseInputs.baseEbitda = baseEbitda;
baseInputs.baseGrossMarginPct = baseGrossMarginPct;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts 3.x (new SVG refactor) | Recharts 2.15.x | Project init (out of scope per REQUIREMENTS.md) | 2.x has stable `Cell` API; 3.x beta has breaking changes |
| Separate positive/negative Bar series | Single Bar + Cell per bar | Phase 7 research finding | Cell approach preserves bar order and simplifies data model |

**Deprecated/outdated:**
- `recharts` 3.x: Out of scope per REQUIREMENTS.md "Out of Scope" table — beta with breaking SVG API changes, wrong for live demo. Use 2.15.x.

---

## Open Questions

1. **"All Other Levers" always zero**
   - What we know: Current `selectEbitda` formula only incorporates `revenueGrowthPct`, `grossMarginPct`, and `fuelIndex`. Collections, returns, and toggles affect cash/AR/AP but not EBITDA. Therefore `selectOtherLeversImpact` residual = 0.
   - What's unclear: Whether the webinar presenter needs this bar to show non-zero values to tell the "collections matter" story.
   - Recommendation: Accept zero. The bar renders; the tooltip confirms "All Other Levers: $0" is honest (those levers operate outside EBITDA in this model). If the presenter needs a non-zero bar, a later phase could add a small EBITDA proxy for lateInvoiceHours (e.g., $cost_per_hour * hours). This is deferred to Phase 9 polish.

2. **Baseline definition requires new `BaseInputs` fields**
   - What we know: `baseInputs` currently has no `baseEbitda` or `baseGrossMarginPct` field. Adding them requires touching `types.ts`, `dataLoader.ts`, the Zod schema, and potentially the test fixtures in `kpiSelectors.test.ts`.
   - What's unclear: Whether the planner wants to add these fields in a Wave 0 task or bundle with Wave 1.
   - Recommendation: Make it Wave 0 (scaffolding) — add fields to types, Zod schema, and dataLoader before writing the selectors. The test fixture in `kpiSelectors.test.ts` uses hardcoded `makeState()` so it is unaffected (no `baseEbitda` in fixture — it will read 0 and tests will still pass their narrow assertions).

3. **Dark mode color for total bars**
   - What we know: `#002E62` is nearly invisible on dark card background `#17263b`.
   - What's unclear: Whether to read `data-theme` attribute in the component or use a different CSS approach.
   - Recommendation: Read `document.documentElement.getAttribute('data-theme')` inside the component with a `useState` + event listener, or simply use a less dark indigo (`#3B6DB5` or similar) that is visible in both themes. The planner should specify the light/dark color pair for total bars.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.x |
| Config file | `vitest.config.ts` (app root) |
| Quick run command | `node "C:/Users/RachurA/AppData/Local/node_modules/vitest/vitest.mjs" run --reporter=verbose 2>&1` (run from app dir) |
| Full suite command | same — no separate full suite command |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHRT-01 | `buildMarginBridgeData` returns 6 bars in correct order | unit | `vitest run src/features/model/__tests__/marginBridge.test.ts` | ❌ Wave 0 |
| CHRT-01 | `selectBaselineEbitda` returns baseInputs.baseEbitda | unit | same file | ❌ Wave 0 |
| CHRT-01 | `selectRevenueGrowthImpact` = 0 at revenueGrowthPct=0 | unit | same file | ❌ Wave 0 |
| CHRT-01 | `selectFuelIndexImpact` = 0 at fuelIndex=100 | unit | same file | ❌ Wave 0 |
| CHRT-01 | `selectGrossMarginImpact` = 0 when grossMarginPct=baseGrossMarginPct | unit | same file | ❌ Wave 0 |
| CHRT-01 | Fuel shock scenario: fuelIndexImpact < 0 (negative bar) | unit | same file | ❌ Wave 0 |
| CHRT-01 | Positive revenue growth: revenueGrowthImpact > 0 (gold bar) | unit | same file | ❌ Wave 0 |
| CHRT-01 | Chart rendering in browser (dark/light, no invisible bars) | manual | — | manual-only (browser QA) |

### Sampling Rate
- **Per task commit:** `node .../vitest.mjs run --reporter=verbose`
- **Per wave merge:** Full test suite (all 9 test files)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/model/__tests__/marginBridge.test.ts` — covers CHRT-01 selector and data transform tests (RED stubs, beforeAll error-capture pattern)
- [ ] `baseEbitda` and `baseGrossMarginPct` fields added to `BaseInputs` Zod schema and TypeScript type
- [ ] `dataLoader.ts` populates `baseEbitda` and `baseGrossMarginPct` at load time

---

## Sources

### Primary (HIGH confidence)
- Direct codebase reading: `kpiSelectors.ts`, `scenarioSlice.ts`, `chartDataUtils.ts`, `PipelineChart.tsx`, `DashboardApp.tsx`, `globals.css`, `KpiCard.tsx`, `formatters.ts`, `package.json`, `vitest.config.ts`
- All formulas derived analytically from existing source code — no external verification needed for project-internal logic

### Secondary (MEDIUM confidence)
- Recharts 2.x `Cell` API behavior for per-bar coloring — confirmed by existing PipelineChart.tsx pattern and Phase 6 decision log ("Hardcoded hex for SVG fill colors in Recharts — CSS variables do not resolve reliably inside SVG attributes")
- Recharts `LabelList` `position="top"` behavior for negative bars — based on documented Recharts 2.x behavior; recommend browser verification during QA

### Tertiary (LOW confidence — validate during implementation)
- Dark mode color `#002E62` invisible on `#17263b` card background — visual judgment from hex color values; verify in browser during Phase 7 QA
- "All Other Levers" residual always zero — analytical conclusion from reading kpiSelectors formulas; verify by running test with non-zero other-lever controls

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed installed in package.json
- Architecture: HIGH — all patterns derived from existing codebase, no external dependencies
- Selector formulas: HIGH — derived analytically from kpiSelectors.ts source
- Pitfalls: HIGH (items 1, 2, 5, 6) / MEDIUM (items 3, 4) — items 3 and 4 need browser QA

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable stack — Recharts 2.15.x, no fast-moving dependencies)
