# Phase 6: Static Charts - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Render 3 Recharts charts from CSV data already loaded in `DashboardSeedData`: Pipeline to Invoiced (teal BarChart), AR Aging (stacked horizontal bar), and 13-Week Cash Flow (line/area with actuals vs forecast). Replace `<div id="slot-charts" />` in `DashboardApp.tsx`. All charts are static display — no Redux state dependency, no scenario reactivity in this phase.

**Out of scope:** Margin Bridge chart (Phase 7), AI summary (Phase 8), making charts react to scenario sliders.

Requirements covered: CHRT-02, CHRT-03, CHRT-04

</domain>

<decisions>
## Implementation Decisions

### AR Aging Chart Type (CHRT-03)

- **Stacked horizontal bar** — single bar showing all 5 bucket proportions (Current, 1–30, 31–60, 61–90, 90+) left-to-right = good-to-bad direction
- `ar90Ratio` summary stat displayed alongside the chart (e.g., "11.0% aged 90+ days")
- Bucket colors: use a warm-to-red progression — Current (teal/green `var(--color-success)`), 1–30 (amber `var(--accent)`), 31–60 (amber-dark), 61–90 (coral-light), 90+ (coral `var(--color-error)`)

### Chart Layout

- **Top row: 2-column** — Pipeline to Invoiced (left, ~50%) + AR Aging (right, ~50%), side by side
- **Bottom row: full-width** — 13-Week Cash Flow spans the full content width
- Both rows sit in the main content area (right of the 280px sidebar) below the Close Stage Tracker
- `<div id="slot-charts" />` replaced by a `<ChartsSection seedData={seedData} />` container component

### 13-Week Cash Flow Toggle (CHRT-04)

- **Section header toggle** — "Hide" / "Show" text button (or chevron icon) in the Cash Flow panel header
- Panel collapses/expands in place using local React `useState` — **not Redux**
- Default state: **visible** (expanded on load)
- Collapsed state: section header remains visible so presenter can click "Show" to restore it

### Pipeline to Invoiced (CHRT-02)

- Recharts `BarChart` with **teal `#05AB8C` bars** (use `var(--color-success)` or hardcoded teal per REQUIREMENTS.md)
- 5 CRM stages from `crm_pipeline.csv`: Qualified → Proposal → Negotiation → Closed Won → Invoiced
- Probability-weighted amount in tooltip: `amount * probability` formatted as currency
- X-axis: stage names, Y-axis: dollar amounts formatted with `formatCurrency()`

### 13-Week Cash Flow (CHRT-04)

- Recharts `LineChart` or `AreaChart`
- **Solid line** for actual weeks (`is_actual === 'true'`), **dashed line** for forecast weeks
- Toggle show/hide the entire panel (local `useState`)
- Actuals/forecast distinction via `strokeDasharray` on the line segment or two separate `<Line>` components

### Claude's Discretion

- Exact Recharts component type for AR Aging (ComposedChart + Bar, or custom horizontal BarChart)
- Exact chart heights (recommend ~220–280px for top row, ~220px for cash flow)
- Whether to use `ResponsiveContainer` (yes — required for flex layout)
- Tooltip formatting details
- Whether Cash Flow uses `LineChart` vs `AreaChart` (AreaChart with low opacity fill recommended for visual polish)
- Grid line styling (light `var(--border)` lines, subtle)
- Section headers and card wrapping for each chart

</decisions>

<specifics>
## Specific Ideas

- The Pipeline to Invoiced chart tells the revenue funnel story — the drop from "Closed Won" to "Invoiced" is the key insight. Make the Y-axis readable at a glance (M suffix for millions).
- The AR Aging bar should immediately show if collections are healthy — a dominant Current (green) section with a thin 90+ (red) tail is the "healthy" picture for Summit Logistics.
- Cash Flow actuals vs forecast visual distinction is important for presenter credibility — solid line = known data, dashed = projection.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/lib/formatters.ts` — `formatCurrency(value, compact=true)` for chart axes and tooltips
- `src/components/ui/icons.tsx` — Iconsax wrapper for any section header icons
- `src/lib/dataLoader.ts` — `DashboardSeedData` already includes: `arAging` (array from `ar_aging.csv`), `crmPipeline` (array from `crm_pipeline.csv`), `cashFlow` (array from `cash_13_week.csv`), `ar90Ratio` (computed summary stat)
- `src/components/dashboard/KpiCard.tsx` — reference for floating card style (shadow, `var(--card)` bg, no border)

### Established Patterns

- **Recharts 2.15.x** — not 3.x; use `ResponsiveContainer` + specific chart types
- **SSR safety**: Recharts requires `'use client'` — all chart components must either be in a client component or wrapped with `dynamic(() => import(...), { ssr: false })`
- **CSS variables**: `var(--accent)` for gold/amber, `var(--color-success)` for teal, `var(--color-error)` for coral, `var(--foreground)`, `var(--card)`, `var(--border)`
- **`"use client"` boundary**: `DashboardApp.tsx` is the single client boundary; chart components render inside it — no additional directive needed unless extracted to separate files

### Integration Points

- `DashboardApp.tsx` line 74: `<div id="slot-charts" />` → replace with `<ChartsSection seedData={seedData} />`
- `seedData.arAging` — array of AR aging rows, `seedData.ar90Ratio` — pre-computed 90+ ratio
- `seedData.crmPipeline` — array of CRM deal rows
- `seedData.cashFlow` — array of 13 cash flow weeks with `is_actual` field
- All chart data is already server-loaded and passed via props — no additional data fetching needed

</code_context>

<deferred>
## Deferred Ideas

- Making charts react to scenario slider changes (this phase is static — Phase 7 handles Margin Bridge which is reactive)
- Chart zoom/pan interactions — out of scope for webinar demo
- Export chart as PNG — v2 backlog

</deferred>

---

*Phase: 06-static-charts*
*Context gathered: 2026-03-04*
