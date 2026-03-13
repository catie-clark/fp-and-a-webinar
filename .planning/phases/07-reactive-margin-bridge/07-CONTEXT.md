# Phase 7: Reactive Margin Bridge - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a single reactive `MarginBridgeChart` component that reads from existing Redux selectors (`selectNetSales`, `selectCogs`, `selectGrossProfit`, `selectEbitda`) and re-renders in real time as scenario sliders move. Wire it into `DashboardApp.tsx` above the existing static charts section. No new data files, no new Redux slices — this phase is pure chart component + selector derivation.

**Out of scope:** AI summary (Phase 8), layout polish (Phase 9), any new Redux slices or data files.

Requirements covered: CHRT-01

</domain>

<decisions>
## Implementation Decisions

### Bridge Structure

- **6-bar waterfall** — 2 totals + 4 delta bars:
  1. **Baseline EBITDA** — EBITDA computed from raw `baseInputs` (seed data, no slider adjustments)
  2. **Revenue Growth Impact** — delta from `revenueGrowthPct` slider
  3. **Gross Margin Impact** — delta from `grossMarginPct` slider
  4. **Fuel Index Impact** — delta from `fuelIndex` slider
  5. **All Other Levers** — combined impact of collections, returns, late invoice hours, journal load, and all toggles
  6. **Adjusted EBITDA** — final EBITDA from `selectEbitda` (all sliders applied)
- **Baseline definition** — seed data EBITDA before any slider adjustments (`baseInputs` values at default control state)
- **At default (all sliders at default values):** delta bars render at zero height; Baseline EBITDA = Adjusted EBITDA

### Chart Placement

- **Full-width row, between Close Tracker and static charts:**
  ```
  [ Scenario Panel ] | [ KPI Cards                     ]
                     | [ Close Tracker                  ]
                     | [ Margin Bridge — FULL WIDTH     ]   ← Phase 7
                     | [ Pipeline    ] [ AR Aging        ]
                     | [ 13-Week Cash Flow               ]
  ```
- In `DashboardApp.tsx`: insert `<MarginBridgeSection />` between `<CloseTracker />` and `<ChartsSection />`
- **Wrapped in a floating card** — `var(--card)` background, crowe-card shadow, 12px border-radius, no border (consistent with KPI cards and Close Tracker)

### Bar Colors

- **Positive delta bars** — gold `#F5A800` (hardcoded hex — CSS vars don't resolve in SVG attributes)
- **Negative delta bars** — red/coral `#E5376B` (Crowe Coral) — visually communicates "bad for EBITDA"
- **Baseline EBITDA bar** — Crowe Indigo `#002E62`
- **Adjusted EBITDA bar** — Crowe Indigo `#002E62` (same as baseline — these are totals, not deltas)
- **ReferenceLine at zero** — subtle `var(--border)` color, `strokeDasharray="4 2"`

### Bar Labels & Annotation

- **Value label above each bar** via Recharts `<LabelList>` — formatted as compact currency (e.g., `$2.1M`, `+$340K`, `–$420K`)
  - Positive delta labels: prefixed with `+`
  - Negative delta labels: prefixed with `–`
  - Zero delta labels: omitted (no clutter at default state)
- **Tooltip on hover** — shows bar name, dollar impact, and formatted currency value
- **Card header** — two-column: left `"Margin Bridge"` title, right live `selectEbitda` value: `"Adjusted EBITDA: $2.1M"` — updates in real time alongside bars

### Update Animation & Reactivity

- **Recharts `isAnimationActive={true}`** with duration ~300ms — bars smoothly animate to new heights as sliders move
- **Amber glow on card border** when any slider changes the Adjusted EBITDA — same CSS animation as KPI cards (`--glow-amber` keyframe from `globals.css`)
- The glow + bar animation combination is the Phase 7 "wow" moment — do NOT add debounce or throttle

### Claude's Discretion

- Exact Recharts chart type (BarChart with mixed positive/negative — may need `ComposedChart` with two separate `<Bar>` series: one for positive, one for negative)
- Exact label font size and positioning (recommend `fontSize={11}` above bars, offset 6px)
- Chart height (recommend ~260–300px)
- Whether "All Other Levers" bar is shown when its delta is exactly zero
- Tooltip component design (shared `MarginBridgeTooltip` component)
- Whether to add a pure data transform function in `chartDataUtils.ts` for Margin Bridge data (recommended — consistent with Phase 6 pattern)

</decisions>

<specifics>
## Specific Ideas

- The "Fuel Cost Shock" preset (fuelIndex: 137, grossMarginPct: 0.22) is the signature demo moment — the Fuel Index Impact bar should turn deep red and the Adjusted EBITDA bar should visibly drop. This preset was called out in Phase 4 context as the audience "wow" moment.
- The card header live EBITDA value (`Adjusted EBITDA: $2.1M`) lets the presenter narrate the number without reading bar heights — important for webinar credibility.
- Negative delta bars extend below the zero ReferenceLine — the audience reads depth-below-zero as magnitude of EBITDA erosion. Gold bars above the line = positive contribution. Clear enough to read from the back of a conference room.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/store/kpiSelectors.ts` — `selectNetSales`, `selectCogs`, `selectGrossProfit`, `selectEbitda` all exist and are memoized via `createSelector`. Phase 7 needs to derive per-lever deltas from these (additional selectors needed)
- `src/store/scenarioSlice.ts` — `state.scenario.baseInputs` contains `baseNetSales`, `baseOpex` needed for baseline EBITDA computation
- `src/store/kpiSelectors.ts` — `FUEL_COGS_SHARE = 0.18`, `FUEL_BASE_INDEX = 100` constants (already define the fuel impact formula)
- `src/lib/formatters.ts` — `formatCurrency(value, compact=true)` for bar labels and tooltip
- `src/components/dashboard/ChartsSection/chartDataUtils.ts` — pattern for pure data transform functions; add `buildMarginBridgeData` here
- `src/components/ui/icons.tsx` — Iconsax wrapper for any card header icons
- `globals.css` — amber glow keyframe already defined for KPI cards; reuse `--animation-glow-amber` on the card container

### Established Patterns

- **No `'use client'`** — `MarginBridgeSection` renders inside `DashboardApp.tsx` client boundary; no additional directive needed
- **`useSelector` from `react-redux`** — for live Redux state in the component
- **Hardcoded hex for SVG fills** — `#F5A800` (gold), `#E5376B` (coral) because CSS vars don't resolve inside SVG `fill`/`stroke` attributes (Phase 6 decision)
- **`ResponsiveContainer` required** — all Recharts charts use `ResponsiveContainer` for flex layout
- **Recharts 2.15.x** — not 3.x; `<BarChart>` + `<Bar>` + `<ReferenceLine>` + `<LabelList>` API is stable

### Integration Points

- `DashboardApp.tsx` — insert `{seedData && <MarginBridgeSection seedData={seedData} />}` between `<CloseTracker />` (line ~74) and `<ChartsSection />` (line ~75)
- `seedData` prop is already available in `DashboardApp.tsx` for passing `baseInputs` data
- New selectors needed: `selectBaselineEbitda` (from raw baseInputs, no controls), `selectRevenueGrowthImpact`, `selectGrossMarginImpact`, `selectFuelIndexImpact`, `selectOtherLeversImpact` — all can be derived from existing `selectNetSales`, `selectCogs`, `selectEbitda` and their base counterparts

</code_context>

<deferred>
## Deferred Ideas

- Per-toggle breakdown in "All Other Levers" — too granular for 6-bar target; bundle collections + returns + hours + journal + toggles into one combined bar
- Chart zoom/pan on the Margin Bridge — out of scope for webinar
- Side-by-side scenario comparison (INTV-01) — v2 backlog

</deferred>

---

*Phase: 07-reactive-margin-bridge*
*Context gathered: 2026-03-05*
