# Phase 1: Project Scaffolding - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

The application can boot — all required config files, entry point components (page.tsx, layout.tsx, DashboardApp.tsx), and shared utility files (lib/csv.ts, lib/formatters.ts, components/ui/icons.tsx) exist with no TypeScript errors, and `npm run dev` shows a page at localhost:3000. Data loading, Redux store, KPI cards, charts, and all functional content are out of scope for this phase.

Requirements covered: FOND-01, FOND-03, FOND-05, FOND-06, FOND-07

</domain>

<decisions>
## Implementation Decisions

### Theme System
- `globals.css` uses `html[data-theme="light"]` and `html[data-theme="dark"]` CSS selectors — NOT Tailwind `dark:` class-based theming
- The blocking script in `layout.tsx` must set `document.documentElement.setAttribute('data-theme', value)` (NOT `classList.add('dark')`)
- localStorage key: `theme` with values `"light"` or `"dark"`
- Default: `"light"` (projector-friendly; dark mode charts can be invisible on projectors)
- The `<html>` element needs `suppressHydrationWarning` to avoid React mismatch on `data-theme`

### DashboardApp.tsx Shell
- Placeholder shell only in Phase 1 — no functional sections yet
- Establishes the Redux Provider pattern using `makeStore` factory + `useRef` (NOT a module-level store singleton)
- Receives `seedData: DashboardSeedData` as props from page.tsx
- Layout structure: full-width single column with named section slots (Header, KpiSection, ScenarioPanel, etc.) as placeholder divs — actual layout built when sections are implemented in later phases

### CSV Parser (lib/csv.ts)
- Must export `parseCsv(raw: string): Record<string, string>[]` — this exact signature is expected by the existing `dataLoader.ts`
- Use papaparse under the hood: `Papa.parse(raw, { header: true, skipEmptyLines: true })`
- Server-side only (imported by `dataLoader.ts` which runs in Node.js) — no browser bundle concern

### Formatters (lib/formatters.ts)
- `formatCurrency(value: number, compact = true): string` — compact by default for KPI cards
  - compact: ≥$1M → `$X.XM`, ≥$1K → `$XK`, otherwise full Intl format
  - Negative values: minus sign with same compact logic (e.g., `−$1.2M`)
- `formatPercent(value: number, isDecimal = true): string` — defaults to decimal (0.045 → "4.5%")
- Both use `Intl.NumberFormat('en-US', ...)` for locale-correct formatting

### Iconsax Wrapper (components/ui/icons.tsx)
- Must have `"use client"` directive at the top
- Re-exports all Iconsax icons used across the dashboard in a single file
- Prevents `window is not defined` SSR error that would occur from importing `iconsax-react` directly in any file without the client boundary

### package.json and Next.js Config
- Target Next.js 16.1.6 exactly (confirmed on-disk version in node_modules)
- Redux Toolkit + react-redux already in node_modules — include in package.json
- Add missing deps: `recharts@^2.15`, `zod@^3.24`, `openai@^4`, `iconsax-react`, `papaparse`
- Add Radix UI primitives: `@radix-ui/react-slider`, `@radix-ui/react-switch`, `@radix-ui/react-select`, `@radix-ui/react-tooltip`
- Add `@types/papaparse` as devDependency
- `next.config.ts` — minimal config, no special flags needed for Phase 1
- `tsconfig.json` — standard Next.js 16 config with `@/*` path alias pointing to `src/*`

### "use client" Boundary
- `layout.tsx` — NO `"use client"` (stays as Server Component)
- `page.tsx` — NO `"use client"` (stays as Server Component; calls dataLoader)
- `DashboardApp.tsx` — has `"use client"` (the single correct client boundary)

### Claude's Discretion
- Exact `DashboardApp.tsx` placeholder layout (section names and div structure)
- Icon selection for Iconsax wrapper (include broadly — all icons likely needed across phases)
- `next.config.ts` specific options (image domains, etc.)
- Whether to add ESLint/Prettier config in Phase 1 or defer

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/globals.css`: Complete design token system — all CSS variables for colors, spacing, and theme. Do NOT modify. All new components should use `var(--background)`, `var(--foreground)`, `var(--accent)`, etc.
- `src/lib/dataLoader.ts`: Complete server-side data loader. Imports `parseCsv` from `./csv` and all Zod schemas from `@/features/model/types`. Phase 1 must create these two dependencies to make dataLoader.ts compilable.

### Established Patterns
- **Theme**: `data-theme` attribute on `<html>`, NOT Tailwind `dark:` class. The blocking script and React toggle must both use `setAttribute('data-theme', ...)`.
- **CSS tokens**: All colors are CSS variables from globals.css. Use `var(--accent)` not `#f5a800` in any new component styles.
- **Tailwind v4**: Uses `@import "tailwindcss"` syntax. No `tailwind.config.ts` or `@tailwind` directives needed.

### Integration Points
- `dataLoader.ts` `@/features/model/types` import: Phase 1 must create `src/features/model/types.ts` with all the exact named exports that dataLoader.ts imports:
  - Zod schemas: `arRowSchema`, `cash13WeekRowSchema`, `controlStateSchema`, `externalFuelIndexRowSchema`, `externalVendorPriceIndexRowSchema`, `glRowSchema`, `inventoryAdjustmentRowSchema`, `journalEntryRowSchema`, `pipelineRowSchema`
  - TypeScript types: `ARRow`, `BaseInputs`, `Cash13WeekRow`, `ControlState`, `ExternalFuelIndexRow`, `ExternalVendorPriceIndexRow`, `GLRow`, `InventoryAdjustmentRow`, `JournalEntryRow`, `PipelineRow`, `ScenarioPreset`
- `dataLoader.ts` `./csv` import: Phase 1 must create `src/lib/csv.ts` exporting `parseCsv`

</code_context>

<specifics>
## Specific Ideas

- The Crowe brand warm cream background (`#f7f3ea`) is already in globals.css — `layout.tsx` body will inherit this automatically
- The layered radial gradient background is already in globals.css `body` rule — no additional background code needed in layout.tsx
- Font stack in globals.css: `"Helvetica Now Display", "Helvetica Now Text", "Helvetica Neue", Helvetica, Arial, sans-serif` — layout.tsx should reference this if adding a font variable
- `page.tsx` will be a placeholder in Phase 1 — it won't call `loadDashboardSeedData()` yet (that's Phase 2). It should render `<DashboardApp />` with empty/stub props.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-project-scaffolding*
*Context gathered: 2026-03-03*
