# Phase 6: Static Charts - Research

**Researched:** 2026-03-04
**Domain:** Recharts 2.15.x — BarChart, AreaChart/LineChart, ResponsiveContainer, SSR hydration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Chart Types:**
- Pipeline to Invoiced: Recharts `BarChart` — teal `#05AB8C` bars, 5 CRM stages, probability-weighted tooltip
- AR Aging: Stacked horizontal bar — single bar, 5 buckets, warm-to-red color progression
- 13-Week Cash Flow: Recharts `LineChart` or `AreaChart` — solid actuals, dashed forecast

**Layout:**
- Top row: 2-column — Pipeline to Invoiced (left ~50%) + AR Aging (right ~50%)
- Bottom row: full-width — 13-Week Cash Flow
- Integration point: replace `<div id="slot-charts" />` with `<ChartsSection seedData={seedData} />`

**AR Aging bucket colors:**
- Current: teal/green `var(--color-success)`
- 1-30: amber `var(--accent)`
- 31-60: amber-dark `var(--crowe-amber-dark)` or `#D7761D`
- 61-90: coral-light (between amber-dark and coral)
- 90+: coral `var(--color-error)`

**Cash Flow Toggle:**
- Section header "Hide" / "Show" toggle using local React `useState` — NOT Redux
- Default: visible (expanded)
- Collapsed: header remains visible

**DashboardApp integration:**
- `DashboardApp.tsx` is the `'use client'` boundary — chart components inside it do NOT need their own `'use client'` directive unless extracted to separate files that are imported outside this boundary

**Formatters:**
- Use `formatCurrency()` from `src/lib/formatters.ts` for Y-axis and tooltip values

### Claude's Discretion

- Exact Recharts component type for AR Aging (ComposedChart + Bar, or horizontal BarChart layout)
- Exact chart heights (recommend ~220-280px top row, ~220px cash flow)
- Whether to use `ResponsiveContainer` (yes — required for flex layout)
- Tooltip formatting details
- Whether Cash Flow uses `LineChart` vs `AreaChart` (AreaChart with low opacity fill recommended)
- Grid line styling (light `var(--border)` lines, subtle)
- Section headers and card wrapping for each chart

### Deferred Ideas (OUT OF SCOPE)

- Making charts react to scenario slider changes (Phase 7 handles Margin Bridge reactive chart)
- Chart zoom/pan interactions
- Export chart as PNG
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHRT-02 | Pipeline to Invoiced chart — Recharts BarChart, teal bars, 5 CRM stages (Qualified → Proposal → Negotiation → Closed Won → Invoiced), probability-weighted amounts from `crm_pipeline.csv` | Data shape confirmed; requires `crmPipeline: PipelineRow[]` added to `DashboardSeedData`; stage aggregation logic defined below |
| CHRT-03 | AR Aging panel — stacked bar from `ar_aging.csv`, 5 buckets (Current, 1-30, 31-60, 61-90, 90+), `ar90Ratio` summary stat displayed alongside | Data shape confirmed; requires `arAging: ARRow[]` added to `DashboardSeedData`; bucket aggregation pattern defined below |
| CHRT-04 | 13-Week Cash Flow — line/area chart from `cash_13_week.csv`, solid actuals vs dashed forecast, show/hide toggle | `cash13Week: Cash13WeekRow[]` already in `DashboardSeedData`; `is_actual` field is bare string `"true"`/`"false"` |
</phase_requirements>

---

## Summary

Phase 6 renders three static Recharts charts from data already loaded by the server and passed via `seedData` props. The charts are purely display — no Redux dependency, no scenario reactivity. All three chart types (BarChart, horizontal stacked bar, AreaChart) are standard Recharts 2.15.x patterns that work well within the existing `'use client'` boundary of `DashboardApp.tsx`.

The single largest technical risk is a data-layer gap: `DashboardSeedData` currently exposes `cash13Week` but does NOT expose `arAging: ARRow[]` or `crmPipeline: PipelineRow[]`. Both arrays are loaded inside `loadDashboardSeedData()` but consumed internally and not returned. Wave 0 of the plan must add these two fields to the type definition and the return value.

The second risk is the stacked horizontal bar for AR Aging. Recharts does not have a native "horizontal stacked bar" as a single chart primitive — it must be constructed either as a `BarChart` with `layout="vertical"` (preferred, cleanest) or as a `ComposedChart`. The `layout="vertical"` approach with stacked `<Bar>` components and a single data point is the correct pattern for this use case.

**Primary recommendation:** Build three components (`PipelineChart`, `ArAgingChart`, `CashFlowChart`) composing them in a `ChartsSection` container. Use `ResponsiveContainer` on all three. Add `arAging` and `crmPipeline` to `DashboardSeedData` in Wave 0.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^2.15.0 | All chart rendering | Already installed; locked to 2.x per project decision |
| react | ^19.0.0 | Component framework | Project standard |

### No New Packages Required

All chart needs are covered by `recharts` already installed. No additional charting libraries needed.

**Installation:** None required — `recharts` is already in `package.json`.

---

## Architecture Patterns

### Recommended Project Structure

```
src/components/dashboard/
├── ChartsSection/
│   ├── ChartsSection.tsx        # Container: top row + bottom row layout
│   ├── PipelineChart.tsx        # CHRT-02: BarChart, teal bars
│   ├── ArAgingChart.tsx         # CHRT-03: Horizontal stacked bar
│   └── CashFlowChart.tsx        # CHRT-04: AreaChart + show/hide toggle
```

All four files sit alongside existing `KpiSection.tsx` and `CloseTracker/` directory.

### Pattern 1: ResponsiveContainer Wrapper (Required for All Charts)

**What:** Every Recharts chart must be wrapped in `<ResponsiveContainer>` to fill its CSS flex container.
**When to use:** Always — without it, charts render at 0px width in flex/grid layouts.

```tsx
// Source: Recharts 2.x official docs — ResponsiveContainer
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

<div style={{ height: 260 }}>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
      <XAxis dataKey="stage" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
      <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey="value" fill="#05AB8C" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>
```

**Note:** The outer `<div>` with an explicit `height` is required. `ResponsiveContainer` reads its parent's dimensions — the parent must have a defined height.

### Pattern 2: Pipeline to Invoiced BarChart (CHRT-02)

**Data preparation** — aggregate `crm_pipeline.csv` rows by stage, sum amount_usd and probability-weighted amount per stage:

```tsx
// Source: verified from crm_pipeline.csv data shape (deal_id, stage, amount_usd, probability)
const STAGE_ORDER = ['Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Invoiced'];

function buildPipelineChartData(rows: PipelineRow[]) {
  return STAGE_ORDER.map(stage => {
    const stageRows = rows.filter(r => r.stage === stage);
    const total = stageRows.reduce((s, r) => s + r.amount_usd, 0);
    const weighted = stageRows.reduce((s, r) => s + r.amount_usd * r.probability, 0);
    return { stage, total, weighted };
  });
}
```

**Actual data values from crm_pipeline.csv:**
- Qualified: 5 deals × $480K-$1.11M (prob 0.25)
- Proposal: 4 deals × $580K-$950K (prob 0.45)
- Negotiation: 3 deals × $420K-$600K (prob 0.70)
- Closed Won: 4 deals × $380K-$670K (prob 0.95)
- Invoiced: 4 deals × $280K-$420K (prob 1.0)

**Chart construction:**
```tsx
// Bar with radius on top corners — Crowe brand soft corners
<Bar dataKey="total" fill="#05AB8C" radius={[4, 4, 0, 0]} name="Pipeline Total" />
```

**Custom Tooltip for probability-weighted amount:**
```tsx
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { stage: string; total: number; weighted: number } }>;
}

function PipelineTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const { stage, total, weighted } = payload[0].payload;
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: '0 4px 12px rgba(1,30,65,0.10)',
    }}>
      <p style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}>{stage}</p>
      <p style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>Total: {formatCurrency(total)}</p>
      <p style={{ color: '#05AB8C', fontSize: 13 }}>Weighted: {formatCurrency(weighted)}</p>
    </div>
  );
}
```

### Pattern 3: AR Aging Horizontal Stacked Bar (CHRT-03)

**The correct Recharts pattern for a single horizontal stacked bar** is `BarChart` with `layout="vertical"` and a single data entry. Each bucket is a separate `<Bar>` component with `stackId="aging"`.

```tsx
// Source: Recharts 2.x — layout="vertical" + stacked bars pattern
// Data preparation: aggregate all AR rows into a single stacked record
function buildArAgingData(rows: ARRow[]) {
  const totals = rows.reduce(
    (acc, r) => ({
      current: acc.current + r.ar_current,
      d1_30: acc.d1_30 + r.ar_1_30,
      d31_60: acc.d31_60 + r.ar_31_60,
      d61_90: acc.d61_90 + r.ar_61_90,
      d90plus: acc.d90plus + r.ar_90_plus,
    }),
    { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 }
  );
  // Single data point — the entire horizontal bar is one stacked row
  return [totals];
}

// Bucket color progression: green → amber → red
const AGING_COLORS = {
  current: 'var(--color-success)',      // teal #05AB8C
  d1_30: 'var(--accent)',               // amber #F5A800
  d31_60: '#D7761D',                    // amber-dark
  d61_90: '#FF526F',                    // coral-bright
  d90plus: 'var(--color-error)',        // coral #E5376B
};
```

**Chart construction:**
```tsx
<ResponsiveContainer width="100%" height={80}>
  <BarChart layout="vertical" data={agingData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
    <XAxis type="number" hide />
    <YAxis type="category" hide />
    <Tooltip content={<AgingTooltip />} />
    <Bar dataKey="current" stackId="a" fill={AGING_COLORS.current} name="Current" />
    <Bar dataKey="d1_30" stackId="a" fill={AGING_COLORS.d1_30} name="1-30 days" />
    <Bar dataKey="d31_60" stackId="a" fill={AGING_COLORS.d31_60} name="31-60 days" />
    <Bar dataKey="d61_90" stackId="a" fill={AGING_COLORS.d61_90} name="61-90 days" />
    <Bar dataKey="d90plus" stackId="a" fill={AGING_COLORS.d90plus} name="90+ days" radius={[0, 4, 4, 0]} />
  </BarChart>
</ResponsiveContainer>
```

**`ar90Ratio` summary stat** — display as text alongside the chart:
```tsx
// ar90Ratio already computed in dataLoader: ar90 / arTotal
<span style={{ color: 'var(--color-error)', fontWeight: 700 }}>
  {formatPercent(ar90Ratio)} aged 90+ days
</span>
```

### Pattern 4: 13-Week Cash Flow AreaChart (CHRT-04)

**Actuals vs forecast split** — the `is_actual` field is a bare string `"true"` or `"false"` (PapaParse CSV behavior, confirmed in existing code decisions). Split the 13 rows into two series for a two-`<Area>` approach, or use a single `<Area>` with `strokeDasharray` conditional rendering.

**Recommended: two separate `<Line>` components on a `ComposedChart` or `LineChart`** — simpler than trying to conditionally style a single line. Each series has 13 data points but only the relevant weeks have values (others are `null`/`undefined`).

```tsx
// Source: confirmed from cash_13_week.csv — W1-W6 actual (is_actual="true"), W7-W13 forecast
function buildCashFlowData(rows: Cash13WeekRow[]) {
  return rows.map(r => ({
    week: r.week,
    isActual: r.is_actual === 'true',
    // Split into two series — null means no point rendered for that week
    actualNetCash: r.is_actual === 'true' ? r.net_cash : null,
    forecastNetCash: r.is_actual === 'false' ? r.net_cash : null,
    // For the overlap point (W6→W7 bridge): both need W6 value for visual continuity
    inflow: r.inflow,
    outflow: r.outflow,
    net_cash: r.net_cash,
  }));
}
```

**AreaChart construction with actuals solid + forecast dashed:**
```tsx
import { AreaChart, Area, LineChart, Line, ComposedChart, XAxis, YAxis,
         CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

<ResponsiveContainer width="100%" height={220}>
  <ComposedChart data={cashData} margin={{ top: 8, right: 16, bottom: 8, left: 60 }}>
    <defs>
      <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="var(--crowe-indigo-bright, #003F9F)" stopOpacity={0.15} />
        <stop offset="95%" stopColor="var(--crowe-indigo-bright, #003F9F)" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
    <XAxis dataKey="week" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
    <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
    <Tooltip content={<CashFlowTooltip />} />
    {/* Actuals — solid line with area fill */}
    <Area
      dataKey="actualNetCash"
      name="Actuals"
      stroke="#002E62"
      strokeWidth={2.5}
      fill="url(#actualGradient)"
      connectNulls={false}
      dot={{ fill: '#002E62', r: 3 }}
    />
    {/* Forecast — dashed line, no fill */}
    <Area
      dataKey="forecastNetCash"
      name="Forecast"
      stroke="#002E62"
      strokeWidth={2}
      strokeDasharray="6 3"
      fill="none"
      connectNulls={false}
      dot={false}
    />
  </ComposedChart>
</ResponsiveContainer>
```

**Show/Hide toggle — local useState:**
```tsx
const [cashFlowVisible, setCashFlowVisible] = useState(true);

// Panel header
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <h3>13-Week Cash Flow</h3>
  <button onClick={() => setCashFlowVisible(v => !v)} style={{ ... }}>
    {cashFlowVisible ? 'Hide' : 'Show'}
  </button>
</div>
{cashFlowVisible && (
  <div style={{ height: 220 }}>
    <ResponsiveContainer ...>...</ResponsiveContainer>
  </div>
)}
```

### Pattern 5: ChartsSection Container

```tsx
// src/components/dashboard/ChartsSection/ChartsSection.tsx
// No "use client" needed — renders inside DashboardApp client boundary

interface ChartsSectionProps {
  seedData: DashboardSeedData;
}

export default function ChartsSection({ seedData }: ChartsSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
      {/* Top row: 2-column */}
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <PipelineChart data={seedData.crmPipeline} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ArAgingChart data={seedData.arAging} ar90Ratio={seedData.ar90Ratio} />
        </div>
      </div>
      {/* Bottom row: full-width */}
      <CashFlowChart data={seedData.cash13Week} />
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **No `width` prop on chart components directly:** Always use `ResponsiveContainer` — setting `width={500}` on `BarChart` directly breaks in flex layouts.
- **No SVG-rendered text with `document` calls:** Recharts 2.x tooltip and axis formatters run client-side only; this is safe inside `DashboardApp` but would fail in RSC.
- **No default Recharts colors for brand charts:** Override every `fill` and `stroke` explicitly with Crowe CSS variables or hex values — never let Recharts pick its default blue/green palette.
- **No `layout="horizontal"` for AR Aging:** The horizontal stacked bar requires `layout="vertical"` — counter-intuitive but correct in Recharts API.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bar chart rendering | Custom SVG bar chart | `recharts BarChart` | Recharts handles resize, tooltip, axis formatting, accessibility |
| Chart tooltip positioning | CSS positioned div + mouse events | Recharts `<Tooltip content={...}>` | Recharts manages viewport overflow, scroll offset, show/hide timing |
| Responsive chart sizing | `ResizeObserver` + manual width state | `<ResponsiveContainer>` | Already handles RAF-debounced resize, percentage-based sizing |
| Y-axis number formatting | Custom tick component | `tickFormatter` prop on `<YAxis>` | Simple function prop, uses existing `formatCurrency()` |
| SVG gradient for area fill | Raw `<defs><linearGradient>` in custom SVG | Recharts `<defs>` inside `AreaChart` | Recharts allows `<defs>` as a child — renders inside the chart SVG |

**Key insight:** Recharts 2.x SVG output is fully controlled through declarative props. Custom SVG manipulation is almost never needed and creates hydration risks.

---

## Critical Pre-Implementation Gap

### `DashboardSeedData` Missing Fields

**The CONTEXT.md states** `seedData.arAging`, `seedData.crmPipeline` are available. **They are NOT in the current type.**

`src/lib/dataLoader.ts` loads `arRows` and `pipelineRows` internally but only exposes `ar90Ratio: number` and computed `baseInputs`. The raw arrays are not in the return value.

**Wave 0 must add:**

```ts
// DashboardSeedData type — add two fields:
arAging: ARRow[];         // raw rows from ar_aging.csv
crmPipeline: PipelineRow[]; // raw rows from crm_pipeline.csv
```

```ts
// loadDashboardSeedData() return value — add:
return {
  // ... existing fields ...
  arAging: arRows,       // add this
  crmPipeline: pipelineRows,  // add this
};
```

**Note:** `cash13Week` is already in the type and returned. No gap there.

---

## Common Pitfalls

### Pitfall 1: SSR Hydration with Recharts

**What goes wrong:** Recharts uses `window` and browser SVG APIs. If a Recharts component renders on the server (SSR), the build will throw `window is not defined` or produce hydration mismatch warnings.

**Why it happens:** Next.js App Router server-renders by default. Recharts 2.x is not SSR-safe.

**How to avoid:** Chart components that import from recharts must be inside a `'use client'` component OR imported with `dynamic(() => import(...), { ssr: false })`.

**This project's solution:** `DashboardApp.tsx` is already marked `'use client'`. All chart components created inside `src/components/dashboard/ChartsSection/` do NOT need their own `'use client'` directive as long as they are only imported by `DashboardApp.tsx` or other client components. If a chart file is ever imported from a server component, add `'use client'` to that file.

**Warning sign:** `Error: window is not defined` during `npm run build` or hydration warnings in browser console.

### Pitfall 2: ResponsiveContainer Requires a Sized Parent

**What goes wrong:** Chart renders at 0px height or throws "width(0) and height(0) of chart...".

**Why it happens:** `ResponsiveContainer` reads its parent's CSS dimensions. If the parent div has no explicit height, the container collapses to 0.

**How to avoid:** Always wrap `<ResponsiveContainer>` in a div with an explicit `height` style:
```tsx
<div style={{ height: 260 }}>
  <ResponsiveContainer width="100%" height="100%">
    ...
  </ResponsiveContainer>
</div>
```

**Warning sign:** Blank white space where chart should be; no error in console.

### Pitfall 3: AR Aging `layout="vertical"` Confusion

**What goes wrong:** Developer uses `layout="horizontal"` (default) with `dataKey` on `<YAxis>` and gets a vertical bar chart, not a horizontal bar.

**Why it happens:** Recharts API is counter-intuitive: `layout="vertical"` = bars grow horizontally (left-to-right). `layout="horizontal"` (default) = bars grow vertically.

**How to avoid:** For a left-to-right bar spanning the full width (like AR aging buckets), use `layout="vertical"` with `XAxis type="number"` and `YAxis type="category"`.

**Warning sign:** Bars render vertically instead of the intended horizontal single-bar display.

### Pitfall 4: `is_actual` String Comparison

**What goes wrong:** Code uses `row.is_actual === true` (boolean comparison) — always false because CSV values are strings.

**Why it happens:** PapaParse returns CSV values as strings. The Zod schema uses `z.string()` for `is_actual`, not `z.coerce.boolean()`.

**How to avoid:** Use `row.is_actual === 'true'` (string comparison). This is documented in STATE.md accumulated context from Phase 2.

**Warning sign:** All 13 cash flow weeks render as "forecast" (dashed), none as "actual" (solid).

### Pitfall 5: Recharts CSS Variable Colors in Dark Mode

**What goes wrong:** Chart colors are hardcoded hex (`#05AB8C`) — they don't adapt when dark mode activates. The CSS variable colors (`var(--color-success)`) do not work inside SVG `fill` attributes in all browsers.

**Why it happens:** SVG `fill` attribute does not resolve CSS custom properties in some browser contexts; it depends on the rendering engine.

**How to avoid:** For Recharts `fill` and `stroke` props, prefer hardcoded hex values or test that CSS variables resolve correctly in the target browser. The existing project uses both approaches — hardcoded teal/coral hex in KpiCard delta colors. Follow the same pattern for consistency.

**Recommendation:** Use hardcoded hex for chart fill/stroke, CSS variables for surrounding card/tooltip UI elements.

**Warning sign:** Charts appear with missing colors or show browser-default black fills in dark mode.

### Pitfall 6: `connectNulls` on Split Actuals/Forecast Lines

**What goes wrong:** Using `connectNulls={true}` on the area series draws a line from W6 (last actual) directly to W7 (first forecast), incorrectly showing a connected single line with no visual distinction.

**How to avoid:** Use `connectNulls={false}` on each series. To show visual continuity at the W6→W7 boundary, add W6 data to the forecast series as well (bridge point) so both lines share that final actual point.

---

## Code Examples

### Chart Card Wrapper (Consistent with KpiCard style)

```tsx
// Source: KpiCard.tsx pattern — floating card, no border, indigo-tinted shadow
<div
  style={{
    background: 'var(--card)',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow:
      '0 1px 3px rgba(1,30,65,0.04), 0 6px 16px rgba(1,30,65,0.04), 0 12px 32px rgba(1,30,65,0.02)',
  }}
>
  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
    Pipeline to Invoiced
  </h3>
  {/* chart here */}
</div>
```

### Y-Axis Currency Formatter

```tsx
// Source: formatters.ts — formatCurrency(value, compact=true)
<YAxis
  tickFormatter={(value: number) => formatCurrency(value)}
  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
  axisLine={false}
  tickLine={false}
  width={56}
/>
```

### Cash Flow Tooltip with Inflow/Outflow Breakdown

```tsx
function CashFlowTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as { week: string; inflow: number; outflow: number; net_cash: number; isActual: boolean };
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 13,
    }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>
        {row.week} — {row.isActual ? 'Actual' : 'Forecast'}
      </p>
      <p style={{ color: '#05AB8C' }}>Inflow: {formatCurrency(row.inflow)}</p>
      <p style={{ color: '#E5376B' }}>Outflow: {formatCurrency(row.outflow)}</p>
      <p style={{ fontWeight: 600 }}>Net: {formatCurrency(row.net_cash)}</p>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct SVG manipulation | Recharts declarative API | Project inception | Consistent, maintainable chart code |
| Recharts 3.x | Recharts 2.15.x | Locked at project start | 3.x still has breaking SVG API changes — stay on 2.x |
| `dynamic(() => import, { ssr: false })` for all Recharts | Charts inside existing `'use client'` boundary | Phase 1 client boundary decision | Simpler — DashboardApp is already client-side |

**Deprecated/outdated:**
- Recharts 3.x: Beta with breaking changes — explicitly out of scope per REQUIREMENTS.md

---

## Open Questions

1. **AR Aging: Single horizontal bar vs legend**
   - What we know: One stacked bar with 5 colored segments, ar90Ratio text alongside
   - What's unclear: Whether a color legend is needed under the bar for bucket labels
   - Recommendation: Include a small color-keyed legend row below the bar (5 colored dots + labels) — without it, the buckets are not self-explanatory in a live demo

2. **Cash Flow: W6/W7 bridge point for visual continuity**
   - What we know: W6 is last actual, W7 is first forecast; `connectNulls={false}` is needed
   - What's unclear: Whether to duplicate W6 in the forecast series to create a visual bridge
   - Recommendation: Include W6 `net_cash` in `forecastNetCash` series (not just `actualNetCash`) so the dashed forecast line visually starts from the last known actual point

3. **Y-axis label width for cash flow**
   - What we know: Values up to $2.4M — compact format `$2.4M` is 5 characters
   - What's unclear: Whether `width={56}` is sufficient or needs more room
   - Recommendation: Use `width={64}` with `fontSize: 11` for safety; test at demo resolution

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.0 |
| Config file | `Catie/FP&A Application/fpa-close-efficiency-dashboard/vitest.config.ts` |
| Quick run command | `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" vitest run -- src/features/model/__tests__/charts.test.ts` |
| Full suite command | `node .../vitest.mjs run` (per project vitest invocation pattern) |

**Constraint:** Vitest environment is `node` (not `jsdom`). `@testing-library/react` is NOT installed. Component render tests are not possible without adding `jsdom` + testing-library. All tests must be pure logic/data-transformation tests.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHRT-02 | `buildPipelineChartData()` aggregates 5 stages correctly, returns weighted amounts | unit (pure function) | `vitest run src/features/model/__tests__/charts.test.ts` | Wave 0 |
| CHRT-03 | `buildArAgingData()` sums all customer rows into one stacked record, 5 buckets balance | unit (pure function) | `vitest run src/features/model/__tests__/charts.test.ts` | Wave 0 |
| CHRT-04 | `buildCashFlowData()` correctly splits actuals (W1-W6) vs forecast (W7-W13) on `is_actual` string | unit (pure function) | `vitest run src/features/model/__tests__/charts.test.ts` | Wave 0 |
| CHRT-02 | `DashboardSeedData` type includes `crmPipeline: PipelineRow[]` — dataLoader integration | integration | dataLoader.test.ts (existing, extend) | Existing file |
| CHRT-03 | `DashboardSeedData` type includes `arAging: ARRow[]` — dataLoader integration | integration | dataLoader.test.ts (existing, extend) | Existing file |

**Note:** Chart rendering correctness (correct colors, layout, responsiveness) is manual-only — cannot be tested without jsdom + testing-library. Visual QA is the quality gate for rendered output.

### Sampling Rate

- **Per task commit:** `node .../vitest.mjs run src/features/model/__tests__/charts.test.ts`
- **Per wave merge:** Full Vitest suite
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/features/model/__tests__/charts.test.ts` — covers CHRT-02, CHRT-03, CHRT-04 data transformation functions
- [ ] `DashboardSeedData` type addition: `arAging: ARRow[]` and `crmPipeline: PipelineRow[]`
- [ ] `loadDashboardSeedData()` return update to include `arAging` and `crmPipeline`
- [ ] Extend `src/features/model/__tests__/dataLoader.test.ts` to assert `arAging` and `crmPipeline` fields exist and are non-empty arrays

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection — `src/lib/dataLoader.ts`, `src/components/DashboardApp.tsx`, `src/lib/formatters.ts`, `src/components/dashboard/KpiCard.tsx`
- Direct CSV inspection — `ar_aging.csv`, `crm_pipeline.csv`, `cash_13_week.csv` (all data shapes verified)
- Direct schema inspection — `src/features/model/types.ts` (all Zod schemas for chart data types)
- `package.json` — recharts ^2.15.0 confirmed installed; no jsdom/testing-library present

### Secondary (MEDIUM confidence)

- Recharts 2.x documented API patterns — `layout="vertical"` for horizontal bars, `ResponsiveContainer` sizing requirements, `stackId` for stacked bars, `connectNulls` behavior
- STATE.md accumulated decisions — `is_actual` as string `"true"`/`"false"`, CSS variable color patterns

### Tertiary (LOW confidence)

- None — all research findings are grounded in direct codebase inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — recharts 2.15.0 already installed, version confirmed
- Architecture: HIGH — all data shapes verified from actual files; DashboardSeedData gap confirmed
- Pitfalls: HIGH — most pitfalls grounded in existing code decisions (STATE.md) and data inspection
- Data gap (arAging/crmPipeline missing from DashboardSeedData): HIGH — confirmed by reading type definition

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable recharts 2.x API, stable project stack)
