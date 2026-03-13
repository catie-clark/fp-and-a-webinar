# Domain Pitfalls

**Domain:** Next.js 15/16 App Router — FP&A Financial Close Dashboard (webinar demo)
**Researched:** 2026-03-03
**Confidence:** HIGH (Next.js App Router, Redux Toolkit, OpenAI) / LOW (21st.dev / React Bits — limited docs)

---

## Critical Pitfalls

Mistakes that cause rewrites, blank pages, or broken live demos.

---

### Pitfall 1: Non-Serializable Data Crossing the Server/Client Boundary

**What goes wrong:** `page.tsx` passes `DashboardSeedData` from `dataLoader.ts` to `DashboardApp.tsx`. If any field contains a `Date` object, `Map`, `Set`, class instance, or circular reference, Next.js throws a runtime serialization error. The existing `dataLoader.ts` uses Zod — if it uses `z.coerce.date()`, it will fail.

**Consequence:** Blank page. Cryptic error in terminal: `Error: Only plain objects, and a few built-ins, can be passed to Client Components from Server Components.`

**Prevention:**
- Audit every field in `DashboardSeedData` — replace `Date` with ISO strings, replace `Map`/`Set` with plain objects/arrays
- Use `z.string()` not `z.coerce.date()` for date columns in Zod schemas
- Day 1 test: add `console.log(JSON.stringify(data))` in `page.tsx` after `loadDashboardSeedData()` — any serialization exception surfaces immediately

**Phase:** Foundation — detect on first `page.tsx` → `DashboardApp.tsx` wire-up.

---

### Pitfall 2: Recharts ResponsiveContainer SSR Hydration Mismatch

**What goes wrong:** `ResponsiveContainer` reads DOM bounding box at render. During SSR, there's no DOM so it uses width=0. Client sees actual width (800+). React hydration mismatch floods console and causes charts to flash or go blank.

**Consequence:** Console warnings on every load. Charts briefly collapse. Dark mode flash is especially visible.

**Prevention:**
```typescript
// Wrap ALL chart components with dynamic + ssr: false
import dynamic from 'next/dynamic';
const MarginBridgeChart = dynamic(
  () => import('@/components/dashboard/ChartsMarginBridge'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
```
Also: always wrap `ResponsiveContainer` in a parent with explicit height:
```tsx
<div className="h-80 w-full">
  <ResponsiveContainer width="100%" height="100%">
```

**Phase:** Foundation — establish this pattern before the first chart is written.

---

### Pitfall 3: `"use client"` on `page.tsx` Breaks `fs` Module

**What goes wrong:** Developer adds `"use client"` to `page.tsx` (wrong) or `layout.tsx`. Webpack tries to bundle `dataLoader.ts` (which imports `fs`) for the browser.

**Consequence:** `Error: Can't resolve 'fs'` or `Error: Can't resolve 'path'` in browser bundle. Data loading strategy completely breaks.

**Prevention:**
- `layout.tsx` — NO `"use client"` directive
- `page.tsx` — NO `"use client"` directive
- `DashboardApp.tsx` — has `"use client"` (the single correct boundary)

**Phase:** Foundation — set boundaries correctly before writing any other component.

---

### Pitfall 4: Redux Store Singleton Causes SSR State Leakage

**What goes wrong:** Store created as `export const store = configureStore(...)` at module level. In Next.js, different users' SSR requests share the same store instance, leaking state. React strict mode double-renders cause double initialization in dev.

**Consequence:** Scenario slider values reset on navigation. `useSelector` errors outside Provider.

**Prevention:**
```typescript
// lib/store.ts — FACTORY, not singleton
export const makeStore = () => configureStore({ reducer: rootReducer });

// components/DashboardApp.tsx
'use client';
const storeRef = useRef<AppStore | null>(null);
if (!storeRef.current) {
  storeRef.current = makeStore();
}
return <Provider store={storeRef.current}>{children}</Provider>;
```
**Never export a `store` constant.** Export `makeStore`.

**Phase:** Foundation — implement from day 1.

---

### Pitfall 5: OpenAI API Route Times Out During Live Demo

**What goes wrong:** `/api/enhance-summary` calls GPT-4o with a financial prompt. Response takes 8-15 seconds. Vercel Serverless Functions default timeout is 10 seconds. Request silently killed → 504. AI panel shows infinite spinner during the webinar wow moment.

**Consequence:** Key webinar feature fails live.

**Prevention:**
```typescript
// app/api/enhance-summary/route.ts
export const runtime = 'nodejs';  // REQUIRED — OpenAI SDK uses Node APIs

export async function POST(request: Request) {
  const { scenarioState, kpiValues } = await request.json();

  const stream = openai.beta.chat.completions.stream({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: buildPrompt(scenarioState, kpiValues) }],
    max_tokens: 300,     // 3-4 sentences is ideal for live demo
    temperature: 0.3,    // deterministic, faster
  });

  return new Response(stream.toReadableStream());
}
```
- Pre-generate and cache the AI narrative for the primary demo scenario before the webinar
- Keep a pre-written fallback narrative ready to paste if API is unresponsive

**Phase:** AI Feature — implement streaming from day 1, not as an afterthought.

---

### Pitfall 6: Light/Dark Theme Hydration Flicker

**What goes wrong:** Theme stored in `localStorage`. Server renders HTML without `dark` class. Client reads `localStorage`, adds the class, but there's a visible wrong-theme frame. On a projected screen this is jarring.

**Prevention:**
```typescript
// app/layout.tsx — blocking script before React hydrates
<html lang="en" suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: `
      (function() {
        var t = localStorage.getItem('theme') || 'light';
        if (t === 'dark') document.documentElement.classList.add('dark');
      })();
    `}} />
  </head>
  <body>{children}</body>
</html>
```
`suppressHydrationWarning` suppresses the React class attribute mismatch warning.

**Phase:** Foundation — blocking script must be in `layout.tsx` from day 1.

---

## Moderate Pitfalls

---

### Pitfall 7: Zod Schema Throws on First Invalid CSV Row

**What goes wrong:** `.parse()` throws on the first bad row, crashing the entire data load. Realistic sample data may have empty cells, extra commas, or whitespace.

**Prevention:**
```typescript
const result = GLRowSchema.safeParse(row);
if (!result.success) {
  console.warn('Invalid GL row skipped:', result.error.issues);
  return null;
}
return result.data;
// ...
.filter(Boolean) // remove nulls
```
- Default numeric fields to 0 for empty CSV cells: `z.coerce.number().default(0)`
- Keep demo CSV files to 200-500 rows — no benefit from thousands of rows for a webinar
- Add `export const dynamic = 'force-static'` to `page.tsx` — runs dataLoader once at build time

**Phase:** Foundation.

---

### Pitfall 8: Financial Number Formatting Inconsistencies

**What goes wrong:** `$12.4M` on KPI card, `$12,400,000.00` in chart tooltip, `12400000` in AI prompt. Percentages stored as decimals (`0.124`) display as `12400%`.

**Prevention:**
Create `src/lib/formatters.ts` on day 1:
```typescript
export function formatCurrency(value: number, compact = true): string {
  if (compact && Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (compact && Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number, isDecimal = true): string {
  return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(isDecimal ? value : value / 100);
}
```
- Document in `dataLoader.ts` whether percentages are stored as decimals or whole numbers
- Use the same formatter in Recharts tooltip `formatter` props — never inline

**Phase:** Foundation — `formatters.ts` must exist before any component renders a number.

---

### Pitfall 9: Rerender Storm on Slider Drag

**What goes wrong:** Every slider drag dispatches to Redux. All chart components call `useSelector` on computed data arrays. Arrays are new references on every recompute. All 4 charts rerender simultaneously at 60fps slider events → visible lag.

**Prevention:**
```typescript
// selectors.ts — memoize ALL chart data
export const selectMarginBridgeData = createSelector(
  [(s: RootState) => s.scenario.grossMarginPct, (s: RootState) => s.scenario.revenueGrowthPct],
  (margin, growth) => computeMarginBridge(margin, growth)
);

// Chart components — wrap in React.memo
export const ChartsMarginBridge = React.memo(function ChartsMarginBridge() {
  const data = useAppSelector(selectMarginBridgeData);
  // ...
});

// Sliders — debounce dispatch
const debouncedDispatch = useDebouncedCallback(
  (value) => dispatch(setRevenueGrowthPct(value)), 150
);
```

**Phase:** Scenario Controls — apply from first slider implementation.

---

### Pitfall 10: Redux Initial State vs Preset Defaults Out of Sync

**What goes wrong:** Redux `scenarioSlice` hardcodes `initialState` values. `scenario-presets.json` has a "Base" preset with different values. "Reset to defaults" and "Select Base Preset" show different numbers.

**Prevention:**
- Single source of truth: load default scenario from `scenario-presets.json` via `dataLoader.ts`
- Pass as `seedData.defaultScenario` and initialize Redux via `preloadedState`
- Redux `initialState` contains zeros/nulls only — never hardcoded demo values
- "Reset to defaults" restores from `seedData.defaultScenario` stored in a ref

**Phase:** Scenario Controls.

---

### Pitfall 11: Iconsax Causes `window is not defined` on Server

**What goes wrong:** Icon libraries may reference browser globals at module initialization. If imported in a component without `"use client"`, Next.js tries to run it during SSR → `ReferenceError: window is not defined`.

**Prevention:**
```typescript
// src/components/ui/icons.tsx — single "use client" wrapper
'use client';
export { ArrowUp2, ArrowDown2, TrendUp, Dollar, Wallet, Chart,
         ReceiptItem, Clock, Warning2 } from 'iconsax-react';
```
Import icons exclusively from this wrapper. Never import directly from `iconsax-react` in other files.

**Detection:** `ReferenceError: window is not defined` with `iconsax` in the stack trace.

**Phase:** Foundation — create wrapper before using any icons.

---

### Pitfall 12: `.env.local` Accidentally Committed

**What goes wrong:** `OPENAI_API_KEY` ends up in git history. Even after removal, must be rotated.

**Prevention:**
- Verify `.gitignore` includes `.env.local` before first `git add`
- Run `git status` and confirm no `.env*` files are staged before every commit

**Phase:** Foundation — before the first commit.

---

### Pitfall 13: Recharts Tooltip Crashes on `undefined` or `null` Values

**What goes wrong:** Missing CSV rows or empty cells produce `undefined` in chart data. Custom tooltip formatters calling `.toFixed()` on `undefined` throw `TypeError`, crashing the chart.

**Prevention:**
```typescript
formatter={(value: number | undefined) => {
  if (value == null || isNaN(value)) return ['—', ''];
  return [formatCurrency(value), 'Amount'];
}}
```
Ensure Zod schemas default numeric fields: `z.coerce.number().default(0)`.

**Phase:** Charts.

---

### Pitfall 14: `periodLabel` Never Replaced After Temporary Hardcode

**What goes wrong:** Developer temporarily hardcodes `"Jan 2026"` during wiring and forgets to replace it. Webinar shows the correct data under the wrong period label.

**Prevention:**
- `periodLabel` is derived in `dataLoader.ts` from the latest GL period row — thread through `DashboardSeedData` → `page.tsx` → `DashboardApp.tsx` from day 1
- Pre-webinar check: confirm period label matches the slide deck

**Phase:** Foundation.

---

## Webinar Demo-Specific Pitfalls

---

### Pitfall 15: Cold Start Stalls the Demo Opening

**What goes wrong:** First page load in `npm run dev` takes 3-4 seconds. Audience sees a spinner at the worst moment.

**Prevention:**
- Use `npm run build && npm run start` for the webinar — production build is 10x faster
- Pre-navigate to the dashboard 5 minutes before session and leave the tab open. Never hard-refresh during the presentation.
- Add `export const dynamic = 'force-static'` to `page.tsx` for zero-latency static HTML

**Phase:** Webinar Readiness.

---

### Pitfall 16: AI Summary Spinner Kills Demo Momentum

**What goes wrong:** Presenter clicks "Generate AI Summary." 8 seconds of silence. Audience attention drifts.

**Prevention:**
- Streaming (Pitfall 5) shows text character-by-character within 1-2 seconds — visually engaging even if full response takes longer
- Pre-generate and cache the AI narrative for the primary demo scenario
- Keep a pre-written fallback narrative ready if API is unresponsive

**Phase:** Webinar Readiness.

---

### Pitfall 17: Dark Mode Charts Invisible on Projector

**What goes wrong:** Charts look great on developer monitor in dark mode. On projector, dark backgrounds wash out and chart colors (amber `#F5A800`, teal `#05AB8C`) become faded or invisible.

**Prevention:**
- Demo in light mode on projected screens. Warm cream (`#f7f3ea`) projects cleanly.
- Test charts at 60% monitor brightness viewed from 2 meters before the event.

**Phase:** Webinar Readiness.

---

## Phase-Specific Warning Summary

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Foundation: data types | `Date` objects in DashboardSeedData | Audit types; use ISO strings |
| Foundation: Redux setup | Store singleton | makeStore factory + useRef |
| Foundation: "use client" placement | page.tsx accidentally client | Keep page.tsx and layout.tsx as RSC |
| Foundation: Iconsax | `window is not defined` | `src/components/ui/icons.tsx` wrapper |
| Foundation: theme toggle | Hydration flicker | Blocking `<script>` in layout.tsx |
| Foundation: first commit | .env.local committed | Verify .gitignore before git add |
| Foundation: formatters | Number inconsistencies | Create formatters.ts before first render |
| Charts: all chart components | Recharts SSR mismatch | `dynamic({ ssr: false })` on all charts |
| Charts: tooltips | undefined crash | Null checks in all formatter props |
| Charts: performance | Rerender storm on slider drag | createSelector + React.memo + debounce |
| Scenario Controls: defaults | Initial state vs preset out of sync | Initialize Redux from seedData.defaultScenario |
| AI Feature: timeout | 504 in live demo | Streaming response + max_tokens: 300 |
| AI Feature: API key | Key in git history | .gitignore verification |
| Webinar Readiness: cold start | Spinner on demo open | force-static + production build |
| Webinar Readiness: AI demo | Spinner kills momentum | Pre-cache + streaming |
| Webinar Readiness: projector | Dark charts invisible | Demo in light mode |
