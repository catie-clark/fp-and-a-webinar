# FP&A Close Efficiency Dashboard

## What This Is

A Next.js 15/16 (TypeScript, App Router) interactive financial close efficiency dashboard built for a Crowe LLP FP&A webinar. It demonstrates how FP&A teams can use real GL data and interactive scenario modeling to manage and analyze month-end close performance. The entire application is built from scratch within an existing project shell that provides `globals.css` (design tokens) and `dataLoader.ts` (server-side data loader).

## Core Value

FP&A teams can interactively model real financial close scenarios — adjusting revenue growth, margins, fuel index, collections, and close stage controls — and immediately see the impact on KPIs, charts, and an AI-generated executive narrative. The dashboard must be compelling and fully functional for a live webinar demonstration.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Foundation**
- [ ] All missing source files created from scratch: `page.tsx`, `layout.tsx`, `DashboardApp.tsx`, all chart/layout components, `types.ts`, `csv.ts`, `package.json`, `tsconfig.json`, `next.config.ts`
- [ ] All 10 data files created in `src/data/` with realistic sample webinar data (2 JSON, 8 CSV)
- [ ] App boots successfully with `npm run dev`, data loads without errors

**KPI & Close Tracker**
- [ ] KPI metric cards display Net Sales, COGS, Gross Profit, EBITDA, Cash, AR, AP, Inventory with animated number counters (React Bits) and Iconsax icons
- [ ] Close stage progress tracker (AP close, AR close, Revenue recognition, Inventory valuation, Accruals & JEs, Financial statement package) with progress bars computed dynamically from journal entry data
- [ ] Close stage status indicators (on track / at risk / delayed)

**Scenario Control Panel**
- [ ] 7 sliders (Revenue Growth, Gross Margin, Fuel Index, Collections Rate, Returns, Late Invoice Hours, Journal Load) using 21st.dev slider components, wired to Redux
- [ ] 4 toggles (Prioritize Cash Mode, Conservative Forecast Bias, Tighten Credit Holds, Inventory Complexity) using 21st.dev toggle components
- [ ] Scenario preset selector (dropdown from `scenario-presets.json`) and "Reset to defaults" button

**Charts**
- [ ] Margin Bridge chart (Recharts BarChart, gold `#F5A800` bars, ReferenceLine at zero, currency-formatted tooltips)
- [ ] Pipeline to Invoiced chart (Recharts BarChart, teal `#05AB8C` bars, 5-stage funnel from CRM data)
- [ ] AR Aging panel (stacked bar or donut from `ar_aging.csv` — Current, 1–30, 31–60, 61–90, 90+)
- [ ] 13-Week Cash Flow view (line/area chart from `cash_13_week.csv`, toggle visibility)

**AI Feature**
- [ ] `/api/enhance-summary` POST route implemented with OpenAI API
- [ ] AI summary panel UI using 21st.dev component with React Bits loading animation
- [ ] `.env.local` with `OPENAI_API_KEY`, excluded from git

**Dynamic Values**
- [ ] `periodLabel` derived from latest GL period row (not hardcoded "Jan 2026")
- [ ] `variancePct` computed from data or loaded from `company.json`
- [ ] Close stage target days configurable from `company.json`

**Webinar Readiness**
- [ ] Fully responsive layout
- [ ] All scenario presets tested end-to-end
- [ ] Zero console errors or dev warnings
- [ ] Light/dark theme works on all components
- [ ] Header with company name, period label, theme toggle, and Crowe LLP branding

### Out of Scope

- Mobile native app — web-first, dashboard optimized for landscape/widescreen
- Multi-tenant / multi-company data — single company demo dataset only
- Real ERP data integration — sample CSV/JSON data only for webinar
- Authentication / user accounts — open access demo, no auth needed
- Deployment to production — webinar runs locally or on internal Vercel preview

## Context

- **Project path**: `Catie/FP&A Application/fpa-close-efficiency-dashboard/` within the workspace
- **Existing files**: `src/app/globals.css` (full design token system, light/dark theme with warm cream `#f7f3ea` background and gold `#f5a800` accent) and `src/lib/dataLoader.ts` (complete server-side loader — reads from `src/data/`, returns `DashboardSeedData`)
- **Data flow**: CSVs/JSONs → `dataLoader.ts` (Zod validation) → `page.tsx` (Server Component) → `DashboardApp.tsx` (Client Component + Redux store) → all dashboard sections
- **UI libraries**: React Bits (animations/motion), 21st.dev (interactive UI components), Iconsax (all icons) — these are the designated toolkit, do not deviate
- **Design**: Warm cream/navy palette. Light: bg `#f7f3ea`, card `#fffaf2cc`, gold `#f5a800`, navy `#1c2d47`. Dark: bg `#0f1b2f`, card `#17263be0`. Layered radial gradient body background.

## Constraints

- **Tech stack**: Next.js 15/16 App Router, TypeScript, Recharts, Redux Toolkit, Tailwind CSS — must match existing project shell
- **Design system**: Crowe brand identity per `globals.css` — warm palette, no pure `#FFFFFF` page backgrounds, no harsh borders, indigo-tinted shadows
- **UI libraries**: React Bits + 21st.dev + Iconsax only — all icons, animations, and interactive components must come from these three sources
- **AI provider**: OpenAI (`OPENAI_API_KEY`) — not Anthropic, not a choice during implementation
- **Config files**: Must create `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs` to match a standard Next.js 15/16 setup
- **No secrets committed**: `.env.local` must be gitignored

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build all source files from scratch | Other developer's files unavailable; building gives full control and no legacy debt | — Pending |
| OpenAI for AI summary | User's preference; OpenAI GPT-4o for narrative generation | — Pending |
| Redux Toolkit for scenario state | Already implied by existing architecture (DashboardApp receives Redux provider pattern) | — Pending |
| Recharts for all charts | Existing codebase assumed Recharts (Margin Bridge + Pipeline components were Recharts) | — Pending |
| Zod for data validation | Already used in `dataLoader.ts` — consistent with existing code | — Pending |

---
*Last updated: 2026-03-03 after initialization*
