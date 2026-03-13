# Phase 3: KPI Cards and Variance Layer - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

All 8 KPI metric cards (Net Sales, COGS, Gross Profit, EBITDA, Cash, AR, AP, Inventory) render with real data from `DashboardSeedData`, show variance deltas vs prior period, animate counters via React Bits, and glow amber when scenario changes affect their value.

**This phase also builds the Redux scenario computation layer** — `scenarioSlice` with default control values and `createSelector` KPI selectors for all 8 metrics — so that Phase 4 only needs to wire slider/toggle UI to dispatch, not rebuild the computation model.

**Out of scope for this phase:** Slider/toggle controls (Phase 4), Close Stage Tracker (Phase 5), all charts (Phases 6-7), AI summary (Phase 8).

Requirements covered: KPIS-01, KPIS-02, KPIS-03, KPIS-04, DYNM-02

</domain>

<decisions>
## Implementation Decisions

### Redux Store — Full Computation Layer in Phase 3

- **Phase 3 builds** `src/store/scenarioSlice.ts` with:
  - Initial state seeded from `seedData.baseInputs.controls` (from the default preset in `scenario-presets.json`)
  - All 7 slider fields + 4 toggle fields matching `ControlState` type
  - Actions: `setControl(field, value)` + `loadPreset(controls)` + `resetToDefaults(controls)`
- **Phase 3 builds** `src/store/kpiSelectors.ts` with `createSelector` memoized selectors for all 8 KPI computed values:
  - `selectNetSales`: `baseNetSales * (1 + revenueGrowthPct)`
  - `selectCogs`: `selectNetSales * (1 - grossMarginPct)` + fuel index adjustment
  - `selectGrossProfit`: `selectNetSales - selectCogs`
  - `selectEbitda`: `selectGrossProfit - baseOpex`
  - `selectCash`: based on `baseCash` + collections rate + cash mode toggle
  - `selectAr`: `arTotal * (1 - collectionsRatePct adjustment)`
  - `selectAp`: derived from `baseNetSales` and `returnsPct`
  - `selectInventory`: `inventoryTotal` adjusted by `inventoryComplexity` toggle
- **Phase 4** only needs to wire slider/toggle UI components to dispatch — no selector work needed
- **Store wiring**: `store/index.ts` adds `scenarioSlice` to `configureStore` reducer in this phase

### KPI Card Grid Layout

- **2 rows of 4 (4×2 grid)** for widescreen webinar display
- Row 1 (P&L metrics): Net Sales, Gross Profit, EBITDA, Cash
- Row 2 (Balance sheet metrics): COGS, AR, AP, Inventory
- Cards use CSS Grid: `grid-template-columns: repeat(4, 1fr)` with responsive fallback to 2×4 below 1024px
- Each card: icon (Iconsax), metric label, formatted value, variance delta badge

### Variance Delta Color Semantics

- **Directional coloring** with smart per-metric logic:
  - Green ▲ / Red ▼ for: Net Sales, Gross Profit, EBITDA, Cash, AR (lower AR aging = better collections)
  - **Inverted**: COGS — ▲ is red (cost increase is bad), ▼ is green (cost reduction is good)
  - **Inverted**: AP — ▲ is amber-neutral (higher payables = cash conservation), ▼ is neutral
  - Inventory — neutral amber (neither direction is inherently good/bad without context)
- **Color tokens**: use `var(--color-success)` (`#05AB8C` teal) for positive, `var(--color-error)` (`#E5376B` coral) for negative, `var(--accent)` (`#f5a800`) for neutral
- Delta display format: `▲ 3.4%` or `▼ 2.1%` using `formatPercent()` from `lib/formatters.ts`
- **Prior period source**: `variancePct` from `seedData.baseInputs.variancePct` (loaded from `company.json`) is used for Net Sales variance display. Other metrics derive their variance from the computed scenario delta vs base.

### Animated Counter Behavior (React Bits CountUp)

- **Fires on both:**
  1. First load — counts from 0 to the computed value (500ms, ease-out)
  2. Scenario state changes — re-counts from the previous value to the new value (400ms, ease-out)
- React Bits `CountUp` component with `duration={500}` and `easing="easeOut"`
- Trigger: `useSelector` value change drives re-mount or key change pattern to restart animation
- **Under 600ms** per KPIS-03 requirement — use 400-500ms to stay comfortably under

### Amber Glow on Scenario Change (KPIS-04)

- Brief amber `box-shadow` pulse animation when a KPI card's computed value changes
- Use CSS transition / keyframe: `0ms → amber glow → 600ms → fade back to normal shadow`
- Only cards whose `useSelector` value changed get the glow — not all cards on every dispatch
- Implement via a `useRef` tracking previous value + `useEffect` triggering a CSS class toggle

### KPI Card Component Structure

- Single `KpiCard` component: `src/components/dashboard/KpiCard.tsx`
- Props: `label`, `icon` (Iconsax component), `value` (number), `format` ('currency' | 'percent' | 'number'), `delta`, `deltaInverted` (boolean for COGS-style inversion)
- Uses `formatCurrency()` or `formatPercent()` from `lib/formatters.ts`
- No external card library — custom component using CSS tokens from `globals.css`
- Shadow pattern: `var(--shadow)` with warm indigo-tinted rgba per CLAUDE.md

### DashboardApp Integration

- Replace `<div id="slot-kpi-section" />` placeholder in `DashboardApp.tsx` with `<KpiSection seedData={seedData} />`
- `KpiSection` component: `src/components/dashboard/KpiSection.tsx` — receives `seedData`, initializes Redux store with base values via `useEffect` dispatch on mount, renders the 4×2 KPI card grid

### Claude's Discretion

- Exact fuel index adjustment formula for COGS selector (proportional scaling from index baseline 100)
- Exact cash selector formula (collections rate effect on AR → cash timing)
- AR selector formula (how collectionsRatePct adjusts displayed AR balance)
- AP and Inventory selector formulas (reasonable deltas based on scenario toggles)
- Specific Iconsax icon per KPI metric
- Card hover animation specifics (lift + shadow increase)

</decisions>

<specifics>
## Specific Ideas

- The "Fuel Cost Shock" preset (fuelIndex: 137, grossMarginPct: 0.22) should cause a visibly dramatic EBITDA drop — approximately −$276K from baseline. The COGS selector formula must be sensitive enough that this preset looks alarming on screen.
- Cards should feel like they're floating on a warm surface — white card on the warm cream `#f7f3ea` background, no border, just the indigo-tinted box shadow from `globals.css`.
- The amber glow animation on scenario change is the key webinar "wow" moment — when a presenter moves a slider, the affected KPI cards should noticeably pulse amber to draw the audience's eye.
- Row 1 ordering prioritizes P&L story: Net Sales → Gross Profit → EBITDA → Cash is the "top-line to bottom-line" narrative flow.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/lib/formatters.ts` — `formatCurrency(value, compact=true)` and `formatPercent(value, isDecimal=true)` are ready; use for all KPI values and delta percentages
- `src/components/ui/icons.tsx` — Iconsax wrapper with `"use client"` directive; import icons from here, not directly from `iconsax-react`
- `src/store/index.ts` — stub ready for Phase 3 addition: comment explicitly says "Phase 3: add scenarioSlice, uiSlice here". `AppStore`, `RootState`, `AppDispatch` types already exported.
- `src/features/model/types.ts` — `ControlState`, `BaseInputs`, `ScenarioPreset` types all exist and match what scenarioSlice will need
- `src/lib/dataLoader.ts` — `DashboardSeedData` type exported; `baseInputs` includes `baseNetSales`, `baseOpex`, `baseCash`, `baseCashInWeekly`, `arTotal`, `variancePct`

### Established Patterns

- **Theme**: `data-theme` attribute on `<html>`, CSS variables in `globals.css` — all colors must use `var(--foreground)`, `var(--accent)`, `var(--background)`, etc.
- **No shadcn/ui** — all components are custom using CSS tokens
- **`"use client"` boundary**: `DashboardApp.tsx` is the single client boundary. KpiSection and KpiCard are rendered inside it — they can use hooks and Redux without their own `"use client"` directive.
- **Redux pattern**: `makeStore` + `useRef` in `DashboardApp.tsx`. `useSelector` and `useDispatch` work inside any component wrapped by `<Provider store={storeRef.current}>`.
- **Tailwind v4**: `@import "tailwindcss"` syntax — no config file needed for standard utilities.

### Integration Points

- `DashboardApp.tsx` `<div id="slot-kpi-section" />` → replace with `<KpiSection seedData={seedData} />`
- `store/index.ts` reducer `{}` → add `scenario: scenarioSlice.reducer` (and optional `ui: uiSlice.reducer`)
- `DashboardApp.tsx` `storeRef.current = makeStore()` → after store creation, dispatch `initializeFromSeedData(seedData.baseInputs)` to seed the scenario slice with base values
- `seedData.baseInputs.variancePct` → used in `KpiCard` for Net Sales delta badge (already 0.034 from `company.json`)

</code_context>

<deferred>
## Deferred Ideas

- Close stage tracker integration — Phase 5
- Scenario slider/toggle controls wiring — Phase 4 (Phase 3 builds the Redux layer; Phase 4 adds the UI controls)
- KPI drill-down on click (v2 requirement INTV-01) — backlog

</deferred>

---

*Phase: 03-kpi-cards-and-variance-layer*
*Context gathered: 2026-03-04*
