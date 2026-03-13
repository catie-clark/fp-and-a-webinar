# Architecture Patterns: FP&A Close Efficiency Dashboard

**Domain:** Next.js 15/16 App Router + Redux Toolkit + Recharts
**Researched:** 2026-03-03
**Confidence:** HIGH (Next.js RSC, Redux Toolkit) / MEDIUM (21st.dev / React Bits RSC compatibility)

---

## Recommended Architecture

The architecture follows a strict **Server-to-Client handoff pattern**: all I/O, validation, and data shaping on the server; all interactivity, scenario state, and rendering on the client. The boundary is a single root Client Component (`DashboardApp.tsx`) that owns the Redux store.

```
┌─────────────────────────────────────────────────────────────────────┐
│  SERVER LAYER (Node.js runtime — never sent to browser)             │
│                                                                     │
│  CSV/JSON files                                                     │
│       │                                                             │
│       ▼                                                             │
│  dataLoader.ts     ← Zod schema validation, fs/promises, papaparse │
│       │              Returns: DashboardSeedData (plain JSON object) │
│       ▼                                                             │
│  page.tsx          ← async Server Component                        │
│  (app/page.tsx)       Calls loadDashboardSeedData(), no state      │
│       │ serialized props (JSON-safe plain objects only)            │
└───────┼─────────────────────────────────────────────────────────────┘
        │  SERIALIZATION BOUNDARY
        │  (no Date, Map, Set, class instances, functions, undefined)
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER ("use client" — runs in browser)                      │
│                                                                     │
│  DashboardApp.tsx      ← Root Client Component                     │
│  (components/DashboardApp.tsx)                                      │
│       │  Wraps Redux <Provider>                                     │
│       │  Receives seedData from page.tsx                           │
│       │  Initializes store via preloadedState                       │
│       │                                                             │
│       ├── Header (period label, company name, theme toggle)        │
│       ├── KpiSection (KPI cards, animated counters)                │
│       ├── CloseTracker (6 stages, dynamic progress)                │
│       ├── ScenarioPanel (sliders, toggles, presets)                │
│       ├── ChartsMarginBridge (Recharts, reactive to scenario)      │
│       ├── ChartsPipeline (Recharts, static CRM funnel)             │
│       ├── ChartsArAging (Recharts, static AR buckets)              │
│       ├── ChartsCash13Week (Recharts, 13-week view)                │
│       └── AiSummaryPanel (OpenAI narrative, loading state)         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

### Server Components (no `"use client"`)

| Component | File | Responsibility |
|-----------|------|---------------|
| Root page | `app/page.tsx` | Load + validate data, render DashboardApp |
| Layout | `app/layout.tsx` | HTML shell, font loading, metadata, theme blocking script |
| Data Loader | `lib/dataLoader.ts` | CSV/JSON parsing, Zod validation (Node.js `fs`) |

**Critical rule:** RSC cannot import Redux, React hooks, browser APIs, Recharts, or framer-motion. `page.tsx` must only pass plain JSON-serializable props.

### Client Components (`"use client"` required)

| Component | Why Client |
|-----------|------------|
| `DashboardApp.tsx` | Redux Provider requires browser context — this is the single client boundary |
| All dashboard sections | Descendants of DashboardApp — automatically client even without explicit directive |
| All Recharts chart components | Recharts uses browser SVG/ResizeObserver APIs |
| All 21st.dev components | Use React hooks and browser APIs |
| All React Bits components | framer-motion + React hooks |
| `AiSummaryPanel.tsx` | Calls `/api/enhance-summary` via `fetch` in browser |

**Key rule:** Because `DashboardApp.tsx` is `"use client"`, ALL its children are client-side by default. You only need explicit `"use client"` at the DashboardApp boundary and for any component imported independently outside this subtree.

---

## Data Flow

### Server Side

```
CSV/JSON files on disk
    │
    ▼
dataLoader.ts
    ├── papaparse for CSV files
    ├── JSON.parse for .json files
    ├── Zod schema.safeParse() → skip invalid rows, warn
    └── Returns: DashboardSeedData (plain typed object, ISO strings not Date objects)
    │
    ▼
page.tsx (async Server Component)
    ├── const data = await loadDashboardSeedData()
    ├── Serialization check: all fields must be JSON.stringify-safe
    └── return <DashboardApp seedData={data} />
```

### Serialization Boundary (CRITICAL)

Next.js serializes props via React's flight protocol. Only these cross the boundary:
- ✅ `string`, `number`, `boolean`, `null`, arrays, plain objects
- ❌ `Date` (serialize as ISO string), `Map`, `Set`, class instances, functions, `undefined`

```typescript
// CORRECT — serialize Date before passing
const data = await loadDashboardSeedData();
// dataLoader must return ISO strings, not Date objects
return <DashboardApp seedData={data} />;
```

### Client Side

```
DashboardApp.tsx mounts
    │
    ├── Store initializes with preloadedState from seedData (no useEffect needed)
    └── All child components render from Redux store
```

### Scenario State Loop

```
User moves slider / toggles switch
    │
    ▼
ScenarioPanel dispatches action to Redux
    │
    ▼
scenarioSlice.ts updates state
    │
    ▼
selectors.ts (memoized via createSelector)
    ├── selectMarginBridgeData — recomputes bridge drivers
    ├── selectKpiValues — recomputes 8 KPIs
    └── selectCloseStageStatus — recomputes stage % + RAG status
    │
    ▼
Components with useAppSelector re-render only if their selected data changed
```

---

## Redux Architecture

### 2-Slice Structure

```
store/
├── index.ts              — makeStore factory, RootState, AppDispatch types
├── scenarioSlice.ts      — all user-controlled inputs (7 sliders + 4 toggles + preset)
├── dataSlice.ts          — seed data from server (set once via preloadedState)
├── selectors.ts          — all memoized derived computations (createSelector)
└── hooks.ts              — typed useAppDispatch, useAppSelector wrappers
```

### scenarioSlice.ts — Key Pattern

```typescript
interface ScenarioState {
  // Sliders
  revenueGrowthPct: number;       // -0.04 to 0.08
  grossMarginPct: number;          // 0.18 to 0.28
  fuelIndex: number;               // 80 to 140
  collectionsRatePct: number;      // 0.94 to 1.0
  returnsPct: number;              // 0.006 to 0.025
  lateInvoiceHours: number;        // 0 to 14
  journalLoadMultiplier: number;   // 0.8 to 1.3

  // Toggles
  prioritizeCashMode: boolean;
  conservativeForecastBias: boolean;
  tightenCreditHolds: boolean;
  inventoryComplexity: boolean;

  // Preset tracking
  activePresetId: string | null;   // null = 'custom'
}
```

**RTK Query vs manual slices:** Use manual slices. RTK Query is for async server-state with caching/refetching. This dashboard loads data once from the server — RTK Query adds complexity with no benefit.

### StoreProvider Pattern (SSR Safety)

```typescript
// CORRECT — factory, not singleton
export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({ reducer: { scenario: scenarioReducer, data: dataReducer }, preloadedState });
}

// DashboardApp.tsx
'use client';
const storeRef = useRef<AppStore | null>(null);
if (!storeRef.current) {
  storeRef.current = makeStore({ data: { raw: seedData, status: 'loaded' } });
}
return <Provider store={storeRef.current}>{children}</Provider>;
```

**NEVER export a store singleton** — module-level singletons leak state between SSR requests in Next.js.

---

## Recharts in App Router

Recharts uses browser-only APIs (SVG, ResizeObserver). Critical rules:

```typescript
// All chart components must be Client Components with 'use client'
// Wrap in dynamic() with ssr: false IF they're ever used outside DashboardApp subtree
// Inside DashboardApp subtree — no dynamic() needed, already client-side

// CRITICAL: ResponsiveContainer needs explicit height on parent
<div className="h-80 w-full">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>...</BarChart>
  </ResponsiveContainer>
</div>
```

Chart color tokens (from globals.css, not hardcoded hex):
```typescript
// Use CSS variables so light/dark theme works on charts
stroke="var(--color-accent-primary)"   // gold #F5A800
fill="var(--crowe-teal-core)"          // teal #05AB8C
stroke="var(--crowe-indigo-core)"      // indigo #002E62
```

---

## File / Folder Organization

```
Catie/FP&A Application/fpa-close-efficiency-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    — RSC: HTML shell, font loading, theme blocking script
│   │   ├── page.tsx                      — RSC: calls dataLoader, renders DashboardApp
│   │   ├── globals.css                   — EXISTS: Crowe brand tokens, light/dark theme
│   │   └── api/
│   │       └── enhance-summary/
│   │           └── route.ts             — OpenAI streaming POST handler (export runtime = 'nodejs')
│   │
│   ├── components/
│   │   ├── DashboardApp.tsx              — CLIENT ROOT: Redux Provider, main layout
│   │   ├── dashboard/
│   │   │   ├── Header.tsx               — Company name, period label, theme toggle
│   │   │   ├── KpiSection.tsx           — KPI card grid + animated counters
│   │   │   ├── KpiCard.tsx              — Individual KPI card with variance delta
│   │   │   ├── CloseTracker.tsx         — 6 close stages with computed progress
│   │   │   ├── ScenarioPanel.tsx        — Sliders + toggles + preset selector
│   │   │   ├── ChartsMarginBridge.tsx   — Recharts: gold bar chart
│   │   │   ├── ChartsPipeline.tsx       — Recharts: teal funnel chart
│   │   │   ├── ChartsArAging.tsx        — Recharts: AR aging
│   │   │   ├── ChartsCash13Week.tsx     — Recharts: 13-week cash
│   │   │   └── AiSummaryPanel.tsx       — OpenAI narrative with streaming
│   │   └── ui/
│   │       └── icons.tsx               — "use client" wrapper for all Iconsax imports
│   │
│   ├── store/
│   │   ├── index.ts                     — makeStore factory
│   │   ├── scenarioSlice.ts             — 7 sliders + 4 toggles
│   │   ├── dataSlice.ts                 — seed data (set once)
│   │   ├── selectors.ts                 — createSelector memoized derived values
│   │   └── hooks.ts                     — typed useAppSelector, useAppDispatch
│   │
│   ├── features/
│   │   └── model/
│   │       └── types.ts                 — Zod schemas + TypeScript types for all data
│   │
│   ├── lib/
│   │   ├── dataLoader.ts                — EXISTS: server-only CSV/JSON loading
│   │   ├── csv.ts                       — CSV parser utility (papaparse wrapper)
│   │   └── formatters.ts               — Currency, percent, number formatting utilities
│   │
│   └── data/                           — All 10 data files (create in Phase 1)
│       ├── company.json
│       ├── scenario-presets.json
│       ├── erp_gl_summary.csv
│       ├── ar_aging.csv
│       ├── crm_pipeline.csv
│       ├── erp_journal_entries.csv
│       ├── inventory_adjustments.csv
│       ├── cash_13_week.csv
│       ├── external_fuel_index.csv
│       └── external_vendor_price_index.csv
```

---

## Build Order (Phase Dependencies)

| Order | What to Build | Depends On | Rationale |
|-------|--------------|------------|-----------|
| 1 | `features/model/types.ts` + Zod schemas + `lib/csv.ts` | Nothing | Lock types first. Everything downstream depends on the data shape. |
| 2 | All 10 `src/data/` files | Types | Data must exist for dataLoader to parse. |
| 3 | Verify `dataLoader.ts` runs without errors, `page.tsx` renders | Types + Data | Prove data flows end-to-end before building any UI. |
| 4 | `store/` — all slices, selectors, hooks | Types | Redux must exist before any client component reads state. |
| 5 | `DashboardApp.tsx` + `Header.tsx` | Store + page.tsx | Establishes RSC→Client handoff boundary. |
| 6 | `ScenarioPanel.tsx` (sliders + toggles) | Store | Build inputs before output displays to validate dispatch works. |
| 7 | `KpiSection.tsx` + `KpiCard.tsx` + complete `selectors.ts` | Store + ScenarioPanel | Verify scenario math in text before complex chart code. |
| 8 | All Recharts chart components | Selectors verified | Charts are the most complex render code — validate computations first. |
| 9 | `CloseTracker.tsx` (computed from JE data) | Selectors | Depends on journalEntries being in store and selectors being stable. |
| 10 | `AiSummaryPanel.tsx` + `/api/enhance-summary` route | All above | AI feature depends on scenario state being finalized. |
| 11 | Polish: animations (React Bits), icons (Iconsax), 21st.dev components | All features stable | Final layer. Never block functionality development with styling. |

**Critical path:** Types → Data → Store → Client boundary → Controls → Metrics → Charts → AI → Polish

---

## Critical Anti-Patterns to Avoid

| Anti-Pattern | Consequence | Prevention |
|--------------|-------------|------------|
| Passing `Date` objects as props from RSC to Client | Serialization error, blank page | Use ISO strings in dataLoader.ts |
| Redux store as module-level singleton | State leakage between SSR requests | Use `makeStore` factory + `useRef` |
| `"use client"` on `page.tsx` | `fs` module bundled for browser, crash | Keep page.tsx and layout.tsx as RSC |
| Computing derived values inside component render | Re-render storm on every slider change | All derived values in `selectors.ts` via `createSelector` |
| Importing Iconsax directly in non-"use client" files | `window is not defined` on server | Route all icon imports through `src/components/ui/icons.tsx` |
| Recharts without explicit parent height | Charts render at zero height silently | Always wrap in `<div className="h-80 w-full">` |

---

## Confidence Summary

| Claim | Confidence | Basis |
|-------|------------|-------|
| RSC serialization constraints | HIGH | Next.js App Router official docs |
| makeStore factory + useRef pattern | HIGH | Redux Toolkit + Next.js integration guide |
| createSelector for memoized state | HIGH | Redux Toolkit official docs |
| Recharts is client-only | HIGH | Recharts source; community consensus |
| dynamic(ssr:false) not needed inside client subtree | HIGH | Next.js App Router rendering model |
| 21st.dev RSC compatibility | MEDIUM | Inspect source per component before use |
| React Bits RSC compatibility | MEDIUM | Same |
| RTK Query not appropriate for static-seed pattern | HIGH | RTK Query docs: server-state vs client-state |
