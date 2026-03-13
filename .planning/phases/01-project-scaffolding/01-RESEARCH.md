# Phase 1: Project Scaffolding - Research

**Researched:** 2026-03-03
**Domain:** Next.js 16 App Router bootstrapping — config files, entry points, shared utilities, Zod schema layer
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Theme System**
- `globals.css` uses `html[data-theme="light"]` and `html[data-theme="dark"]` CSS selectors — NOT Tailwind `dark:` class-based theming
- The blocking script in `layout.tsx` must set `document.documentElement.setAttribute('data-theme', value)` (NOT `classList.add('dark')`)
- localStorage key: `theme` with values `"light"` or `"dark"`
- Default: `"light"` (projector-friendly; dark mode charts can be invisible on projectors)
- The `<html>` element needs `suppressHydrationWarning` to avoid React mismatch on `data-theme`

**DashboardApp.tsx Shell**
- Placeholder shell only in Phase 1 — no functional sections yet
- Establishes the Redux Provider pattern using `makeStore` factory + `useRef` (NOT a module-level store singleton)
- Receives `seedData: DashboardSeedData` as props from page.tsx
- Layout structure: full-width single column with named section slots (Header, KpiSection, ScenarioPanel, etc.) as placeholder divs — actual layout built when sections are implemented in later phases

**CSV Parser (lib/csv.ts)**
- Must export `parseCsv(raw: string): Record<string, string>[]` — this exact signature is expected by the existing `dataLoader.ts`
- Use papaparse under the hood: `Papa.parse(raw, { header: true, skipEmptyLines: true })`
- Server-side only (imported by `dataLoader.ts` which runs in Node.js) — no browser bundle concern

**Formatters (lib/formatters.ts)**
- `formatCurrency(value: number, compact = true): string` — compact by default for KPI cards
  - compact: >=\$1M → `\$X.XM`, >=\$1K → `\$XK`, otherwise full Intl format
  - Negative values: minus sign with same compact logic (e.g., `−\$1.2M`)
- `formatPercent(value: number, isDecimal = true): string` — defaults to decimal (0.045 → "4.5%")
- Both use `Intl.NumberFormat('en-US', ...)` for locale-correct formatting

**Iconsax Wrapper (components/ui/icons.tsx)**
- Must have `"use client"` directive at the top
- Re-exports all Iconsax icons used across the dashboard in a single file
- Prevents `window is not defined` SSR error that would occur from importing `iconsax-react` directly in any file without the client boundary

**package.json and Next.js Config**
- Target Next.js 16.1.6 exactly (confirmed on-disk version in node_modules)
- Redux Toolkit + react-redux already in node_modules — include in package.json
- Add missing deps: `recharts@^2.15`, `zod@^3.24`, `openai@^4`, `iconsax-react`, `papaparse`
- Add Radix UI primitives: `@radix-ui/react-slider`, `@radix-ui/react-switch`, `@radix-ui/react-select`, `@radix-ui/react-tooltip`
- Add `@types/papaparse` as devDependency
- `next.config.ts` — minimal config, no special flags needed for Phase 1
- `tsconfig.json` — standard Next.js 16 config with `@/*` path alias pointing to `src/*`

**"use client" Boundary**
- `layout.tsx` — NO `"use client"` (stays as Server Component)
- `page.tsx` — NO `"use client"` (stays as Server Component; calls dataLoader)
- `DashboardApp.tsx` — has `"use client"` (the single correct client boundary)

### Claude's Discretion
- Exact `DashboardApp.tsx` placeholder layout (section names and div structure)
- Icon selection for Iconsax wrapper (include broadly — all icons likely needed across phases)
- `next.config.ts` specific options (image domains, etc.)
- Whether to add ESLint/Prettier config in Phase 1 or defer

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOND-01 | User can access a running application — all missing source files exist (`page.tsx`, `layout.tsx`, `DashboardApp.tsx`, `package.json`, `tsconfig.json`, `next.config.ts`) | Section: Standard Stack (exact file contents), Architecture Patterns (minimal viable App Router setup) |
| FOND-03 | Application parses CSV data — `lib/csv.ts` provides a papaparse wrapper used by `dataLoader.ts` | Section: Code Examples (parseCsv implementation), Don't Hand-Roll (papaparse vs custom parser) |
| FOND-05 | Dashboard displays all financial numbers in correct format — `lib/formatters.ts` provides `formatCurrency()` and `formatPercent()` | Section: Code Examples (formatter implementations), Common Pitfalls (Pitfall: number inconsistencies) |
| FOND-06 | All icons render without errors — `src/components/ui/icons.tsx` wraps all Iconsax imports with `"use client"` | Section: Common Pitfalls (Pitfall: window is not defined), Code Examples (icons.tsx wrapper) |
| FOND-07 | Dark mode activates without flash on page load — blocking `<script>` in `layout.tsx` reads `localStorage` before React hydrates | Section: Code Examples (blocking script), Common Pitfalls (Pitfall: hydration flicker) |
</phase_requirements>

---

## Summary

Phase 1 establishes the minimum viable file set that allows `npm run dev` to boot without TypeScript errors. The project root currently has no `package.json`, `tsconfig.json`, or `next.config.ts` — only `node_modules/` (with Next.js 16.1.6 and partial dependencies already installed), `src/app/globals.css` (complete, do not modify), and `src/lib/dataLoader.ts` (complete, do not modify). The task is to create the surrounding scaffolding so that `dataLoader.ts` is importable — which requires creating `src/lib/csv.ts` (papaparse wrapper), `src/features/model/types.ts` (all Zod schemas and TypeScript types), plus the App Router entry points (`layout.tsx`, `page.tsx`) and the root client boundary (`DashboardApp.tsx`).

The critical dependency chain is: `package.json` and `tsconfig.json` must exist before TypeScript can resolve anything → `src/features/model/types.ts` unblocks `dataLoader.ts` compilation → `src/lib/csv.ts` makes the `parseCsv` import resolve → `page.tsx` and `layout.tsx` give Next.js its required entry points → `DashboardApp.tsx` gives the client boundary. In Phase 1, `page.tsx` renders `<DashboardApp />` with stub/empty props (it does NOT call `loadDashboardSeedData()` — that is Phase 2). This means `types.ts` only needs to satisfy TypeScript's static analysis, not produce working runtime data.

The theme system requires one non-obvious pattern: a `dangerouslySetInnerHTML` blocking inline `<script>` in `layout.tsx` that runs synchronously before React hydrates. This script must use `setAttribute('data-theme', ...)` NOT `classList.add('dark')`, matching the CSS selectors already in `globals.css`. All other theme work (the toggle component itself) is deferred to later phases.

**Primary recommendation:** Build in strict dependency order — package.json/tsconfig.json first, then `types.ts`, then `csv.ts`, then layout/page/DashboardApp, then formatters, then icons wrapper. Each file has exactly one purpose in Phase 1 and no functional logic beyond type satisfaction.

---

## Standard Stack

### Core — Confirmed On-Disk (node_modules present)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Next.js | 16.1.6 | App Router framework | INSTALLED (confirmed via `.next/diagnostics/framework.json`) |
| React | 19.x (implied by Next 16) | UI framework | INSTALLED |
| TypeScript | bundled with Next.js | Type checking | INSTALLED (in Next.js devDependencies) |
| Tailwind CSS | v4 | Styling — `@import "tailwindcss"` syntax | INSTALLED (`@tailwindcss/oxide` in node_modules) |
| Redux Toolkit | 5.0.1 | State management | INSTALLED (on-disk package.json confirmed) |
| react-redux | 9.2.0 | React bindings for Redux | INSTALLED |
| Vitest | 4.0.18 | Unit testing framework | INSTALLED (`@vitest/utils` on-disk) |
| recharts | 2.x | Charts (used later phases) | INSTALLED (in node_modules) |
| zod | 3.x | Data validation | INSTALLED |

### Must-Install (MISSING from node_modules)

| Library | Version | Purpose | Install Command |
|---------|---------|---------|-----------------|
| papaparse | latest | CSV parsing in Node.js | `npm install papaparse` |
| @types/papaparse | latest | TypeScript types for papaparse | `npm install -D @types/papaparse` |
| iconsax-react | latest | Icon set with SSR safety concern | `npm install iconsax-react` |
| @radix-ui/react-slider | latest | Slider primitive (for Phase 4 ScenarioPanel) | `npm install @radix-ui/react-slider` |
| @radix-ui/react-switch | latest | Toggle primitive | `npm install @radix-ui/react-switch` |
| @radix-ui/react-select | latest | Dropdown primitive | `npm install @radix-ui/react-select` |
| @radix-ui/react-tooltip | latest | Tooltip primitive | `npm install @radix-ui/react-tooltip` |
| openai | ^4 | OpenAI SDK (for Phase 8 AI panel) | `npm install openai` |

**Why install Radix/OpenAI in Phase 1:** `package.json` is being written from scratch. Better to declare all production dependencies once in Phase 1 rather than repeatedly adding them per phase. Unused packages do not affect boot time.

**Installation:**
```bash
cd "Catie/FP&A Application/fpa-close-efficiency-dashboard"
npm install papaparse iconsax-react @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-select @radix-ui/react-tooltip openai
npm install -D @types/papaparse
```

### What NOT to Install

| Package | Reason |
|---------|--------|
| shadcn/ui (`npx shadcn init`) | Conflicts with Tailwind v4 + the copy-paste 21st.dev approach |
| Recharts 3.x | Beta with breaking SVG API changes — wrong for a live demo |
| Zod 4.x | Beta, API breaking changes from 3.x |
| tailwind.config.ts | Tailwind v4 uses CSS-only config — no JS config file needed |
| Anime.js | framer-motion already installed, covers all animation needs |

---

## Architecture Patterns

### Project Structure (App Router)

```
fpa-close-efficiency-dashboard/
├── package.json                          -- CREATE: all dependencies declared
├── tsconfig.json                         -- CREATE: standard Next.js 16 config
├── next.config.ts                        -- CREATE: minimal config
├── node_modules/                         -- EXISTS: do not touch
├── src/
│   ├── app/
│   │   ├── globals.css                   -- EXISTS: do not modify
│   │   ├── layout.tsx                    -- CREATE: HTML shell + blocking theme script
│   │   ├── page.tsx                      -- CREATE: Server Component, stub DashboardApp render
│   │   └── api/
│   │       └── enhance-summary/          -- EXISTS (dir only, no route.ts yet)
│   ├── components/
│   │   ├── DashboardApp.tsx              -- CREATE: "use client", Redux Provider shell
│   │   └── ui/
│   │       └── icons.tsx                 -- CREATE: "use client", all Iconsax re-exports
│   ├── features/
│   │   └── model/
│   │       ├── types.ts                  -- CREATE: all 9 Zod schemas + 11 TypeScript types
│   │       └── __tests__/               -- EXISTS (empty dir, ready for tests)
│   ├── lib/
│   │   ├── dataLoader.ts                 -- EXISTS: do not modify
│   │   ├── csv.ts                        -- CREATE: parseCsv papaparse wrapper
│   │   └── formatters.ts                 -- CREATE: formatCurrency + formatPercent
│   └── data/
│       └── external_vendor_price_index.csv  -- EXISTS: one CSV already present
```

### Pattern 1: Minimum Viable package.json

**What:** package.json must declare all dependencies so `npm install` can resolve them, and must include the standard Next.js scripts.

**Critical detail:** The `node_modules/` directory already exists with partial installs. The package.json being written is the manifest — it must match what is already installed plus add the missing packages.

```json
{
  "name": "fpa-close-efficiency-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "16.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@reduxjs/toolkit": "^5.0.1",
    "react-redux": "^9.2.0",
    "recharts": "^2.15.0",
    "zod": "^3.24.0",
    "papaparse": "^5.4.1",
    "iconsax-react": "^0.0.8",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "openai": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/papaparse": "^5.3.14",
    "vitest": "^2.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8",
    "eslint-config-next": "16.1.6"
  }
}
```

**Note on versions:** The exact installed versions of react, @types/react, vitest may differ. The planner should run `npm install` after writing package.json — npm will reconcile the installed versions with the declared ranges.

### Pattern 2: tsconfig.json for Next.js 16

**What:** Standard Next.js 16 TypeScript config with the `@/*` path alias that `dataLoader.ts` already uses.

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Why `moduleResolution: "bundler"`:** Required in Next.js 14+ with TypeScript 5+. The older `"node"` setting breaks many modern package imports including Tailwind v4 type definitions.

### Pattern 3: Minimal next.config.ts

**What:** Next.js 16 config in TypeScript format (`.ts`, not `.js`). Minimal for Phase 1.

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Tailwind v4: no special config needed here
  // Image optimization: add domains here when needed (Phase 9+)
};

export default nextConfig;
```

**Why TypeScript config:** Next.js 15+ supports and prefers `next.config.ts`. The TypeScript format gives type checking on config options.

### Pattern 4: layout.tsx with Blocking Theme Script

**What:** The App Router root layout. Must be a Server Component (no `"use client"`). The blocking inline script is the key mechanism for flash-free theme activation.

**Why blocking inline script:** A script tag in `<head>` without `async` or `defer` blocks HTML parsing and runs synchronously before the browser paints. This ensures `data-theme` is set before any CSS is applied — preventing the flash of wrong-theme content (FOUC).

```typescript
// src/app/layout.tsx
// NO "use client" — this is a Server Component
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FP&A Close Efficiency Dashboard',
  description: 'Real-time financial close tracking and scenario modeling',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              var t = localStorage.getItem('theme') || 'light';
              document.documentElement.setAttribute('data-theme', t);
            })();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Key decisions:**
- `suppressHydrationWarning` on `<html>`: suppresses React's mismatch warning when `data-theme` differs between server render (no attribute) and client (attribute set by script). Required when using any attribute modified by inline scripts.
- Default is `'light'`: projector-safe. Dark mode can make charts invisible on projectors.
- `localStorage.getItem('theme') || 'light'`: graceful fallback when localStorage is empty or throws (private browsing mode).
- The script uses `setAttribute('data-theme', t)` NOT `classList.add('dark')` — the CSS in globals.css uses `html[data-theme="dark"]` selectors, not `.dark` class selectors.

### Pattern 5: page.tsx — Stub Server Component

**What:** The App Router root page. Server Component (no `"use client"`). In Phase 1 it renders `<DashboardApp />` with stub/empty props — it does NOT call `loadDashboardSeedData()` yet (that is Phase 2).

```typescript
// src/app/page.tsx
// NO "use client" — Server Component
import DashboardApp from '@/components/DashboardApp';

export default function Page() {
  // Phase 2 will call loadDashboardSeedData() here
  // Phase 1: render with empty stub props to prove the app boots
  return <DashboardApp />;
}
```

**Why NOT call dataLoader in Phase 1:** The data files (CSVs, JSON) don't exist yet — that's Phase 2. Calling `loadDashboardSeedData()` would throw a file-not-found error. Phase 1 only proves the app boots; Phase 2 proves data loads.

**Consequence for DashboardApp.tsx:** In Phase 1, `DashboardApp` must accept props as optional or have a default. In Phase 2 these become required after the data layer is complete.

### Pattern 6: DashboardApp.tsx — Redux Provider Shell

**What:** The single client boundary that owns the Redux store. Uses `makeStore` factory + `useRef` pattern to prevent store singleton (which leaks state between SSR requests in Next.js).

```typescript
// src/components/DashboardApp.tsx
'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/store';
import type { AppStore } from '@/store';
import type { DashboardSeedData } from '@/lib/dataLoader';

interface DashboardAppProps {
  seedData?: DashboardSeedData; // optional in Phase 1; required from Phase 2+
}

export default function DashboardApp({ seedData }: DashboardAppProps) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <div style={{ minHeight: '100vh', padding: '1rem' }}>
        {/* Phase 1: placeholder shell — sections added in later phases */}
        <div id="slot-header" />
        <div id="slot-kpi-section" />
        <div id="slot-close-tracker" />
        <div id="slot-scenario-panel" />
        <div id="slot-charts" />
        <div id="slot-ai-summary" />
        <p style={{ color: 'var(--foreground)' }}>
          FP&amp;A Dashboard — Phase 1 boot confirmed
        </p>
      </div>
    </Provider>
  );
}
```

**Why `useRef` not `useMemo`:** `useMemo` does not guarantee stable references across renders in React 19 strict mode. `useRef` with the `if (!storeRef.current)` pattern is the Redux Toolkit official recommendation for Next.js App Router.

**Store import:** `DashboardApp.tsx` imports from `@/store` — this module does NOT need to exist in Phase 1 for the app to boot IF the import is not actually called at runtime. However, TypeScript will fail compilation. Options: (a) create a minimal `src/store/index.ts` stub in Phase 1, or (b) defer `DashboardApp.tsx`'s Redux Provider pattern to Phase 3 when the store is built, and use a simpler div wrapper in Phase 1. **Recommendation: create a minimal store stub in Phase 1** — it keeps the Phase 1 `DashboardApp.tsx` accurate to its final form.

### Pattern 7: Minimal Store Stub (src/store/index.ts)

**What:** Phase 1 only needs enough store code for TypeScript to compile. The full store (slices, selectors) is Phase 3.

```typescript
// src/store/index.ts
// Phase 1 stub — expanded in Phase 3
import { configureStore } from '@reduxjs/toolkit';

export const makeStore = () =>
  configureStore({
    reducer: {
      // slices added in Phase 3
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
```

### Pattern 8: Zod Schemas (src/features/model/types.ts)

**What:** All 9 Zod schemas and 11 TypeScript types that `dataLoader.ts` imports. This is the most complex file to create because the column names for 7 of the 8 CSVs must be inferred (only `external_vendor_price_index.csv` exists on disk). The approach is to derive column names from how `dataLoader.ts` accesses row fields.

**Fields derived from dataLoader.ts analysis:**

| Schema | Columns Used in dataLoader.ts | Additional Columns Needed |
|--------|------------------------------|--------------------------|
| `glRowSchema` → `GLRow` | `net_sales`, `opex`, `cash`, `manual_je_count`, `close_adjustments_count` | `period`, `cogs`, `gross_profit`, `ebitda`, `ap_total`, `inventory_total` (for KPI cards in Phase 3) |
| `arRowSchema` → `ARRow` | `ar_total`, `ar_90_plus` | `period`, `customer_id`, `ar_current`, `ar_1_30`, `ar_31_60`, `ar_61_90` |
| `pipelineRowSchema` → `PipelineRow` | `amount_usd`, `probability` | `deal_id`, `stage`, `close_date` |
| `journalEntryRowSchema` → `JournalEntryRow` | (passed through as array, no field access in dataLoader) | `je_id`, `period`, `account`, `amount`, `stage`, `status` |
| `inventoryAdjustmentRowSchema` → `InventoryAdjustmentRow` | (passed through as array) | `adj_id`, `period`, `item`, `quantity`, `amount` |
| `cash13WeekRowSchema` → `Cash13WeekRow` | (passed through as array) | `week`, `is_actual`, `inflow`, `outflow`, `net_cash` |
| `externalFuelIndexRowSchema` → `ExternalFuelIndexRow` | (passed through as array) | `period`, `fuel_index` |
| `externalVendorPriceIndexRowSchema` → `ExternalVendorPriceIndexRow` | (passed through as array) | `period`, `vendor_price_index` (CONFIRMED from existing CSV header) |
| `controlStateSchema` → `ControlState` | Used in presets validation | 7 sliders + 4 toggles — see ControlState section |

**ControlState shape** (derived from REQUIREMENTS.md SCEN-01/SCEN-02 and CONTEXT.md):
- `revenueGrowthPct: number` — slider −0.04 to +0.08
- `grossMarginPct: number` — slider 0.18 to 0.28
- `fuelIndex: number` — slider 80 to 140
- `collectionsRatePct: number` — slider 0.94 to 1.0
- `returnsPct: number` — slider 0.006 to 0.025
- `lateInvoiceHours: number` — slider 0 to 14
- `journalLoadMultiplier: number` — slider 0.8 to 1.3
- `prioritizeCashMode: boolean` — toggle
- `conservativeForecastBias: boolean` — toggle
- `tightenCreditHolds: boolean` — toggle
- `inventoryComplexity: boolean` — toggle

Also confirmed from `dataLoader.ts`: `Company.defaultAssumptions` picks `revenueGrowthPct | grossMarginPct | fuelIndex | collectionsRatePct | returnsPct` from `ControlState` — so these 5 fields MUST match exactly.

**BaseInputs** (derived from `dataLoader.ts` construction at line 99-109):
```typescript
interface BaseInputs {
  baseNetSales: number;
  baseOpex: number;
  baseCash: number;
  baseCashInWeekly: number;
  arTotal: number;
  manualJeCount: number;
  closeAdjustmentsCount: number;
  pipelineExecutionRatio: number;
  variancePct: number;
}
```

**ScenarioPreset** (derived from dataLoader.ts preset parsing):
```typescript
interface ScenarioPreset {
  id: string;
  label: string;
  controls: ControlState;
}
```

**Important note on schema design:** All numeric CSV fields should use `z.coerce.number()` not `z.number()`. PapaParse returns all values as strings. `z.coerce.number()` converts `"116.4"` to `116.4` automatically. Using `z.number()` would fail on every single CSV row.

### Pattern 9: lib/csv.ts (papaparse wrapper)

**What:** Thin wrapper around PapaParse that returns the exact type `dataLoader.ts` expects: `Record<string, string>[]`.

```typescript
// src/lib/csv.ts
// Server-side only — imported by dataLoader.ts which runs in Node.js
import Papa from 'papaparse';

export function parseCsv(raw: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data;
}
```

**Why this exact signature:** `dataLoader.ts` calls `parseCsv(await readDataFile("erp_gl_summary.csv"))` and immediately pipes the result into `z.array(glRowSchema).parse(...)`. The Zod schema receives `Record<string, string>[]` — a plain array of string-keyed objects. The `z.coerce.number()` in each schema converts strings to numbers at validation time.

**No browser bundle concern:** `lib/csv.ts` is only imported by `dataLoader.ts`. `dataLoader.ts` uses `node:fs` at the top level — Next.js tree-shaking automatically excludes Node.js-only modules from the browser bundle when they appear in files that are exclusively server-side.

### Pattern 10: lib/formatters.ts

**What:** Two functions that are the single source of truth for all number display in the app. Must match the success criteria exactly: `formatCurrency(1234567.89)` returns `$1,234,567.89` and `formatPercent(0.045)` returns `4.5%`.

**Confirming success criteria expectations:**
- `formatCurrency(1234567.89)` with compact=true (default): 1234567.89 >= 1,000,000 → `$1.2M` (not `$1,234,567.89`)
- Wait — the success criteria says: `formatCurrency(1234567.89)` returns `$1,234,567.89`. This implies compact=false is tested, OR the compact threshold check gives the non-compact result.

**Resolving the ambiguity:** The success criteria `formatCurrency(1234567.89)` returns `$1,234,567.89` is testing `compact=false` behavior (or alternatively, testing that the full Intl format is used when compact is not requested). Given CONTEXT.md states "compact by default for KPI cards" and the test is checking the base behavior, the test is likely calling `formatCurrency(1234567.89, false)` OR is checking the compact result of `$1.2M`. The CONTEXT.md compact spec says >=\$1M → `$X.XM`, so 1234567.89 would become `$1.2M` in compact mode.

**Resolution:** The test `formatCurrency(1234567.89)` returning `$1,234,567.89` implies the test is NOT using compact mode. The planner should implement `compact = false` as the parameter default, OR confirm with the user. However, CONTEXT.md explicitly says "compact by default for KPI cards" — this means compact defaults to true in the function signature, but the success criteria test must be calling `formatCurrency(1234567.89, false)`. Document this as an open question.

```typescript
// src/lib/formatters.ts
export function formatCurrency(value: number, compact = true): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (compact && abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (compact && abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, isDecimal = true): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(isDecimal ? value : value / 100);
}
```

**Verification of success criteria:**
- `formatCurrency(1234567.89)` with compact=true → `$1.2M` (not `$1,234,567.89`)
- `formatCurrency(1234567.89, false)` → `$1,234,568` (rounds — may not match exactly)
- `formatPercent(0.045)` with isDecimal=true → `4.5%` — CONFIRMED matches

**Note on `$1,234,567.89`:** Intl.NumberFormat with `minimumFractionDigits: 0` would give `$1,234,568` (rounded), not `$1,234,567.89`. For the test to return `$1,234,567.89` exactly, the formatter needs `minimumFractionDigits: 2`. The planner should implement the non-compact path with cents as an option.

### Pattern 11: components/ui/icons.tsx

**What:** A `"use client"` boundary that re-exports all Iconsax icons. Any component importing icons imports from this file, never directly from `iconsax-react`.

**Why needed:** `iconsax-react` accesses browser globals at module load time. Without the `"use client"` boundary, Next.js attempts to evaluate this during SSR and throws `ReferenceError: window is not defined`.

**Which icons to include:** Include broadly — all icons that will be used across all 9 phases. Better to include unused icons than to remember to add them later. Key icons for this dashboard:

```typescript
// src/components/ui/icons.tsx
'use client';

export {
  // KPI cards
  TrendUp,
  TrendDown,
  DollarCircle,
  Wallet,
  ArrowUp2,
  ArrowDown2,
  // Close tracker
  TickCircle,
  CloseCircle,
  Warning2,
  Clock,
  // Charts
  Chart,
  Chart2,
  ChartSquare,
  // Scenario panel
  Setting2,
  Refresh2,
  // AI summary
  Cpu,
  MessageText,
  // Navigation
  Moon,
  Sun1,
  // General
  ReceiptItem,
  DocumentText,
  Calendar,
  Building,
} from 'iconsax-react';
```

### Anti-Patterns to Avoid

- **Module-level store singleton:** Never `export const store = configureStore(...)`. Always use `makeStore` factory + `useRef` in `DashboardApp.tsx`.
- **`"use client"` on page.tsx:** Would bundle `dataLoader.ts`'s `node:fs` import for the browser → crash.
- **`z.number()` for CSV fields:** PapaParse returns strings; must use `z.coerce.number()`.
- **`classList.add('dark')` in blocking script:** globals.css uses `html[data-theme="dark"]` selectors, not `.dark` class.
- **Missing `suppressHydrationWarning` on `<html>`:** Without it, React warns about data-theme mismatch on every page load.
- **Importing directly from `iconsax-react`:** Must route through `components/ui/icons.tsx` client boundary.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing with header extraction | Custom string split logic | papaparse | Edge cases: quoted fields with commas, newlines in values, BOM characters, empty rows — all handled by papaparse |
| Number/percent formatting | Manual string interpolation | `Intl.NumberFormat` | Locale handling, negative number edge cases, rounding modes |
| Type-safe runtime validation | Manual `typeof` checks | Zod `z.coerce.number()` | Automatic string-to-number coercion, precise error messages, TypeScript inference |
| Theme flicker prevention | CSS transitions, opacity tricks | Blocking inline `<script>` | CSS-based approaches still show the wrong theme for one frame; blocking scripts are the only reliable solution |
| Redux store in App Router | `useMemo`, module singleton | `makeStore` + `useRef` | Next.js SSR shares module scope; only `useRef` guarantees per-request isolation |

**Key insight:** Every item in this table has subtle edge cases that cost hours to debug. The libraries exist precisely because these problems are harder than they look.

---

## Common Pitfalls

### Pitfall 1: `z.number()` on CSV Rows Fails Silently
**What goes wrong:** PapaParse returns all CSV values as strings. `z.number()` expects a number type — it will fail validation for every single CSV row, causing all arrays to be empty or throwing.
**Why it happens:** Developers assume PapaParse converts number-looking strings to numbers (it does not with `header: true` by default).
**How to avoid:** Use `z.coerce.number()` or `z.coerce.number().default(0)` for all numeric fields in all schemas.
**Warning signs:** Zod validation succeeds but all numeric fields are 0, or `dataLoader.ts` returns empty arrays.

### Pitfall 2: Hydration Warning from data-theme Attribute
**What goes wrong:** Server renders `<html lang="en">` with no `data-theme` attribute. Inline script sets `data-theme="light"`. React hydration sees a mismatch and warns.
**Why it happens:** React compares server-rendered HTML to what it expects from the component tree. The component has no `data-theme` attribute but the DOM does.
**How to avoid:** Add `suppressHydrationWarning` to the `<html>` element. This suppresses the warning for attribute mismatches on that specific element.
**Warning signs:** Console warning `"Extra attributes from the server: data-theme"` on every page load.

### Pitfall 3: localStorage Access in Blocking Script Throws in SSR
**What goes wrong:** The blocking script runs in Next.js — if Next.js evaluates it server-side, `localStorage` is not defined.
**Why it happens:** `dangerouslySetInnerHTML` scripts in layout.tsx run in the browser (not server). However, if the script is incorrectly placed or if a different rendering mode is used, server evaluation can occur.
**How to avoid:** The script is already safe because `dangerouslySetInnerHTML` content in `<head>` is browser-only. However, wrap with `typeof localStorage !== 'undefined'` as a defensive measure.
**Warning signs:** `ReferenceError: localStorage is not defined` in Next.js server logs.

### Pitfall 4: `window is not defined` from Iconsax
**What goes wrong:** `iconsax-react` accesses browser globals at module evaluation. If any file without `"use client"` imports directly from `iconsax-react`, the SSR phase crashes.
**Why it happens:** Next.js evaluates Server Component imports server-side. Browser-only module initializers run and throw.
**How to avoid:** All icon imports must go through `src/components/ui/icons.tsx` which has `"use client"` at the top. Never import from `iconsax-react` directly.
**Warning signs:** `ReferenceError: window is not defined` with `iconsax` in the stack trace.

### Pitfall 5: DashboardApp.tsx Imports from Non-Existent @/store
**What goes wrong:** Phase 1 creates `DashboardApp.tsx` which imports `makeStore` from `@/store`. If `src/store/index.ts` doesn't exist, TypeScript compilation fails and `npm run dev` errors immediately.
**Why it happens:** The client boundary component needs the Redux Provider, but the store file is technically "Phase 3" work.
**How to avoid:** Create a minimal stub `src/store/index.ts` in Phase 1 with just `makeStore`, `AppStore`, `RootState`, and `AppDispatch` type exports — no actual slices needed for the app to boot.
**Warning signs:** `Cannot find module '@/store'` TypeScript error, or `Module not found: Can't resolve '@/store'` from webpack.

### Pitfall 6: page.tsx Calls loadDashboardSeedData() Before Data Files Exist
**What goes wrong:** If `page.tsx` imports and calls `loadDashboardSeedData()` in Phase 1, it will throw `ENOENT: no such file or directory` because the CSV/JSON data files don't exist until Phase 2.
**Why it happens:** Developer wires up the full flow too eagerly.
**How to avoid:** In Phase 1, `page.tsx` renders `<DashboardApp />` with no props or empty stub props. Add the `loadDashboardSeedData()` call in Phase 2 after data files are created.
**Warning signs:** `ENOENT: no such file or directory` for `src/data/company.json` in the Next.js server log on page load.

### Pitfall 7: Tailwind v4 Does Not Use tailwind.config.ts
**What goes wrong:** Developer creates `tailwind.config.ts` expecting it to extend the theme. In Tailwind v4, the config is in CSS (the `@theme` block in `globals.css`) — the JS config file is ignored by default.
**Why it happens:** Tailwind v4 is a major paradigm shift from v3 that changed how config works.
**How to avoid:** Do not create `tailwind.config.ts`. Extend themes in `globals.css` using `@theme {}` blocks. The existing `globals.css` already has the complete design token system.
**Warning signs:** Custom colors defined in `tailwind.config.ts` don't appear in the output CSS.

---

## Code Examples

Verified patterns from the codebase and official documentation:

### Blocking Theme Script (no-flash data-theme)
```typescript
// In layout.tsx <head> — runs before any CSS is applied
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){
      try {
        var t = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', t);
      } catch(e) {}
    })();`,
  }}
/>
```
Source: Next.js App Router official docs — `dangerouslySetInnerHTML` in layout

### PapaParse Wrapper
```typescript
// src/lib/csv.ts
import Papa from 'papaparse';

export function parseCsv(raw: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data;
}
```
Source: PapaParse official docs — `Papa.parse(string, config)` with header mode

### Zod Schema with Coerce for CSV Fields
```typescript
// In src/features/model/types.ts
import { z } from 'zod';

// CORRECT — coerce converts CSV strings to numbers
export const glRowSchema = z.object({
  period: z.string(),
  net_sales: z.coerce.number().default(0),
  cogs: z.coerce.number().default(0),
  gross_profit: z.coerce.number().default(0),
  ebitda: z.coerce.number().default(0),
  opex: z.coerce.number().default(0),
  cash: z.coerce.number().default(0),
  ap_total: z.coerce.number().default(0),
  inventory_total: z.coerce.number().default(0),
  manual_je_count: z.coerce.number().default(0),
  close_adjustments_count: z.coerce.number().default(0),
});
export type GLRow = z.infer<typeof glRowSchema>;

// ControlState schema — used in scenario-presets.json validation
export const controlStateSchema = z.object({
  revenueGrowthPct: z.number(),
  grossMarginPct: z.number(),
  fuelIndex: z.number(),
  collectionsRatePct: z.number(),
  returnsPct: z.number(),
  lateInvoiceHours: z.number(),
  journalLoadMultiplier: z.number(),
  prioritizeCashMode: z.boolean(),
  conservativeForecastBias: z.boolean(),
  tightenCreditHolds: z.boolean(),
  inventoryComplexity: z.boolean(),
});
export type ControlState = z.infer<typeof controlStateSchema>;
```
Source: Zod 3.x official docs — `z.coerce.number()`, `z.infer<typeof schema>`

### makeStore Factory + useRef Pattern
```typescript
// src/store/index.ts (Phase 1 stub)
import { configureStore } from '@reduxjs/toolkit';

export const makeStore = () =>
  configureStore({ reducer: {} });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

// src/components/DashboardApp.tsx
'use client';
import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/store';
import type { AppStore } from '@/store';

export default function DashboardApp() {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }
  return (
    <Provider store={storeRef.current}>
      <div style={{ minHeight: '100vh' }}>
        <p style={{ color: 'var(--foreground)' }}>
          Dashboard — Phase 1 boot confirmed
        </p>
      </div>
    </Provider>
  );
}
```
Source: Redux Toolkit official Next.js App Router integration guide

### Complete Zod Types File Structure
```typescript
// src/features/model/types.ts — all required exports for dataLoader.ts

import { z } from 'zod';

// ─── CSV Row Schemas (use z.coerce.number for all numeric fields) ───────────

export const glRowSchema = z.object({
  period: z.string(),
  net_sales: z.coerce.number().default(0),
  cogs: z.coerce.number().default(0),
  gross_profit: z.coerce.number().default(0),
  ebitda: z.coerce.number().default(0),
  opex: z.coerce.number().default(0),
  cash: z.coerce.number().default(0),
  ap_total: z.coerce.number().default(0),
  inventory_total: z.coerce.number().default(0),
  manual_je_count: z.coerce.number().default(0),
  close_adjustments_count: z.coerce.number().default(0),
});
export type GLRow = z.infer<typeof glRowSchema>;

export const arRowSchema = z.object({
  period: z.string(),
  customer_id: z.string(),
  ar_total: z.coerce.number().default(0),
  ar_current: z.coerce.number().default(0),
  ar_1_30: z.coerce.number().default(0),
  ar_31_60: z.coerce.number().default(0),
  ar_61_90: z.coerce.number().default(0),
  ar_90_plus: z.coerce.number().default(0),
});
export type ARRow = z.infer<typeof arRowSchema>;

export const pipelineRowSchema = z.object({
  deal_id: z.string(),
  stage: z.string(),
  amount_usd: z.coerce.number().default(0),
  probability: z.coerce.number().default(0),
  close_date: z.string(),
});
export type PipelineRow = z.infer<typeof pipelineRowSchema>;

export const journalEntryRowSchema = z.object({
  je_id: z.string(),
  period: z.string(),
  account: z.string(),
  description: z.string().optional(),
  amount: z.coerce.number().default(0),
  stage: z.string(),
  status: z.string(),
});
export type JournalEntryRow = z.infer<typeof journalEntryRowSchema>;

export const inventoryAdjustmentRowSchema = z.object({
  adj_id: z.string(),
  period: z.string(),
  item: z.string(),
  quantity: z.coerce.number().default(0),
  amount: z.coerce.number().default(0),
});
export type InventoryAdjustmentRow = z.infer<typeof inventoryAdjustmentRowSchema>;

export const cash13WeekRowSchema = z.object({
  week: z.string(),
  is_actual: z.string(), // "true" or "false" as string from CSV
  inflow: z.coerce.number().default(0),
  outflow: z.coerce.number().default(0),
  net_cash: z.coerce.number().default(0),
});
export type Cash13WeekRow = z.infer<typeof cash13WeekRowSchema>;

export const externalFuelIndexRowSchema = z.object({
  period: z.string(),
  fuel_index: z.coerce.number().default(0),
});
export type ExternalFuelIndexRow = z.infer<typeof externalFuelIndexRowSchema>;

export const externalVendorPriceIndexRowSchema = z.object({
  period: z.string(),
  vendor_price_index: z.coerce.number().default(0),
});
export type ExternalVendorPriceIndexRow = z.infer<typeof externalVendorPriceIndexRowSchema>;

// ─── Control State Schema (sliders + toggles) ────────────────────────────────

export const controlStateSchema = z.object({
  revenueGrowthPct: z.number(),
  grossMarginPct: z.number(),
  fuelIndex: z.number(),
  collectionsRatePct: z.number(),
  returnsPct: z.number(),
  lateInvoiceHours: z.number(),
  journalLoadMultiplier: z.number(),
  prioritizeCashMode: z.boolean(),
  conservativeForecastBias: z.boolean(),
  tightenCreditHolds: z.boolean(),
  inventoryComplexity: z.boolean(),
});
export type ControlState = z.infer<typeof controlStateSchema>;

// ─── Derived/Composite Types ──────────────────────────────────────────────────

export interface BaseInputs {
  baseNetSales: number;
  baseOpex: number;
  baseCash: number;
  baseCashInWeekly: number;
  arTotal: number;
  manualJeCount: number;
  closeAdjustmentsCount: number;
  pipelineExecutionRatio: number;
  variancePct: number;
}

export interface ScenarioPreset {
  id: string;
  label: string;
  controls: ControlState;
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact for This Project |
|--------------|------------------|------------------------|
| `tailwind.config.ts` for theme extension | `@theme {}` block in CSS (Tailwind v4) | Do NOT create tailwind.config.ts — it is ignored |
| `"dark"` class on `<html>` for dark mode | `data-theme="dark"` attribute on `<html>` | Blocking script and CSS selectors already use attribute approach |
| Redux store as module singleton | `makeStore` factory + Provider with `useRef` | SSR-safe, required for Next.js App Router |
| `z.number()` for external data | `z.coerce.number()` for string-origin data | CSV rows are always strings — coerce is required |
| `next.config.js` | `next.config.ts` | TypeScript config gives type checking on options |

**Confirmed deprecated/outdated:**
- `tailwind.config.js/ts` with `content` array: Tailwind v4 auto-detects source files — no config needed
- `@tailwind base; @tailwind components; @tailwind utilities;` directives: Replaced by `@import "tailwindcss"` in Tailwind v4

---

## Open Questions

1. **formatCurrency test expectation**
   - What we know: CONTEXT.md says compact=true is default; success criteria says `formatCurrency(1234567.89)` returns `$1,234,567.89`
   - What's unclear: With compact=true, 1234567.89 → `$1.2M`, not `$1,234,567.89`. The test implies compact=false OR that the test calls `formatCurrency(1234567.89, false)`.
   - Recommendation: Implement compact=true as default (matching CONTEXT.md intent for KPI cards). Write the success criteria test as `formatCurrency(1234567.89, false)` returning `$1,234,568` (rounded with 0 decimals) OR `$1,234,567.89` (with 2 decimals). Clarify with user before finalizing.

2. **is_actual field type in Cash13WeekRow**
   - What we know: CSV boolean fields come in as strings ("true"/"false" or "1"/"0"). The schema needs to handle this.
   - What's unclear: The exact string values in the CSV (which doesn't exist yet — created in Phase 2).
   - Recommendation: Use `z.string()` for `is_actual` in Phase 1. Phase 2 can refine to `z.enum(["true","false"]).transform(v => v === "true")` once the CSV format is known.

3. **Exact versions of already-installed packages**
   - What we know: Next.js is 16.1.6. Redux Toolkit is 5.0.1. react-redux is 9.2.0. Recharts is 2.x. Zod is 3.x. Vitest is 4.0.18.
   - What's unclear: Exact minor/patch versions of react, react-dom, @types/react, @types/node that are installed.
   - Recommendation: Write package.json with range versions (e.g., `"^19.0.0"` for react) and run `npm install --no-save` first to see what's installed. If `npm install` updates anything, check for breaking changes before accepting.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 (confirmed installed in node_modules) |
| Config file | `vitest.config.ts` — does NOT exist, must be created in Wave 0 |
| Quick run command | `npx vitest run src/features/model/__tests__/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOND-01 | `npm run dev` starts without TypeScript errors | smoke | `npx tsc --noEmit` | ❌ Wave 0: needs tsconfig.json |
| FOND-03 | `parseCsv("a,b\n1,2")` returns `[{a:"1",b:"2"}]` | unit | `npx vitest run src/features/model/__tests__/csv.test.ts` | ❌ Wave 0 |
| FOND-05 | `formatCurrency(1234567.89, false)` returns `$1,234,568`; `formatPercent(0.045)` returns `4.5%` | unit | `npx vitest run src/features/model/__tests__/formatters.test.ts` | ❌ Wave 0 |
| FOND-06 | icons.tsx file has `"use client"` directive at line 1 | unit (static) | `npx vitest run src/features/model/__tests__/icons.test.ts` | ❌ Wave 0 |
| FOND-07 | layout.tsx contains `data-theme` blocking script string | unit (static) | `npx vitest run src/features/model/__tests__/layout.test.ts` | ❌ Wave 0 |

**Note on FOND-06 and FOND-07:** These are "file content" tests — they read the source file and assert strings are present. This is appropriate for Phase 1 where there's no runtime environment to test in yet.

**Note on FOND-01:** TypeScript compilation via `tsc --noEmit` is the most reliable Phase 1 test. If it passes, the app can boot.

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (TypeScript clean = primary quality gate)
- **Per wave merge:** `npx vitest run` + `npx tsc --noEmit`
- **Phase gate:** `npx tsc --noEmit` clean + `npx vitest run` all green before marking Phase 1 complete

### Wave 0 Gaps

- [ ] `vitest.config.ts` — Vitest config pointing to test environment (jsdom or node). Must use `node` environment for server-side utility tests (csv.ts, formatters.ts). Framework install: `npx vitest` (already installed)
- [ ] `src/features/model/__tests__/csv.test.ts` — covers FOND-03: parseCsv returns correct structure
- [ ] `src/features/model/__tests__/formatters.test.ts` — covers FOND-05: formatCurrency and formatPercent return correct strings
- [ ] `src/features/model/__tests__/icons.test.ts` — covers FOND-06: verifies "use client" directive presence
- [ ] `src/features/model/__tests__/layout.test.ts` — covers FOND-07: verifies blocking script string presence
- [ ] `src/features/model/__tests__/types.test.ts` — covers FOND-02 (Phase 2 but schema structure needed now): validates that glRowSchema parses a sample row correctly with coercion

**Vitest config for server-side utilities:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## Sources

### Primary (HIGH confidence)
- Existing codebase scan — `src/lib/dataLoader.ts` (complete, unmodified): all imports and field accesses verified directly
- `src/app/globals.css` (complete, existing): confirmed `html[data-theme]` selector pattern, Tailwind v4 `@import` syntax
- `src/data/external_vendor_price_index.csv` (existing): confirmed CSV column names `period`, `vendor_price_index`
- `.next/diagnostics/framework.json`: confirmed Next.js 16.1.6
- `node_modules/` directory scan: confirmed installed packages (next, react, react-redux, @reduxjs/toolkit, recharts, zod, vitest) and missing packages (papaparse, iconsax-react, @radix-ui/*)
- `.planning/research/STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md`: prior research from project inception (2026-03-03)
- CONTEXT.md (01-CONTEXT.md): all locked decisions verified and copied verbatim

### Secondary (MEDIUM confidence)
- Next.js 16 App Router patterns: derived from ARCHITECTURE.md research (which cited Next.js official docs)
- Redux Toolkit `makeStore` + `useRef` pattern: cited in ARCHITECTURE.md from Redux Toolkit official Next.js integration guide
- Tailwind v4 `@theme` approach: confirmed by presence of `@import "tailwindcss"` in globals.css (v3 would use `@tailwind` directives)

### Tertiary (LOW confidence)
- Exact `iconsax-react` version number: not verified (package not installed)
- Exact Radix UI package versions: not verified (packages not installed)
- `vitest.config.ts` syntax: derived from training data; verify against Vitest 4.x docs before implementing

---

## Metadata

**Confidence breakdown:**
- Standard stack (what's installed): HIGH — direct node_modules scan and diagnostic file read
- What needs to be installed: HIGH — node_modules scan confirmed absence
- Architecture patterns (layout, page, DashboardApp): HIGH — derived directly from existing dataLoader.ts and globals.css
- Zod schema column names: MEDIUM — GLRow/ARRow/PipelineRow columns confirmed from dataLoader.ts field access; other schemas (JournalEntry, Inventory, Cash13Week, FuelIndex) have no field access in dataLoader.ts so columns are inferred from domain knowledge
- Formatter behavior: MEDIUM — one ambiguity in success criteria (compact mode vs full format for the test case)
- Validation architecture: MEDIUM — Vitest confirmed installed but config file doesn't exist

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable libraries; Next.js 16.x patch releases unlikely to break patterns)
