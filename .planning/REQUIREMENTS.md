# Requirements: FP&A Close Efficiency Dashboard

**Defined:** 2026-03-03
**Core Value:** FP&A teams can interactively model real financial close scenarios and immediately see the impact on KPIs, charts, and an AI-generated executive narrative — fully functional for a live webinar demonstration.

---

## v1 Requirements

### Foundation

- [x] **FOND-01**: User can access a running application — all missing source files exist (`page.tsx`, `layout.tsx`, `DashboardApp.tsx`, all chart/layout components, `package.json`, `tsconfig.json`, `next.config.ts`)
- [x] **FOND-02**: Application validates all data on load — `features/model/types.ts` contains all Zod schemas and TypeScript types for every data file
- [x] **FOND-03**: Application parses CSV data — `lib/csv.ts` provides a papaparse wrapper used by `dataLoader.ts`
- [x] **FOND-04**: Dashboard loads real data — all 10 files exist in `src/data/` (`company.json`, `scenario-presets.json`, and 8 CSVs) with internally consistent, realistic webinar-quality sample data
- [x] **FOND-05**: Dashboard displays all financial numbers in correct format — `lib/formatters.ts` provides `formatCurrency()` and `formatPercent()` used consistently across all KPI cards, chart axes, and tooltips
- [x] **FOND-06**: All icons render without errors — `src/components/ui/icons.tsx` wraps all Iconsax imports with `"use client"` to prevent server-side `window is not defined` errors
- [x] **FOND-07**: Dark mode activates without flash on page load — blocking `<script>` in `layout.tsx` reads `localStorage` before React hydrates; `suppressHydrationWarning` on `<html>`
- [ ] **FOND-08**: OpenAI API key is available securely — `.env.local` contains `OPENAI_API_KEY`, is excluded from `.gitignore`, and is not committed to git

### KPI Cards

- [x] **KPIS-01**: User can see all 8 financial metrics — KPI cards display Net Sales, COGS, Gross Profit, EBITDA, Cash, AR, AP, and Inventory with correctly formatted values from GL data
- [x] **KPIS-02**: User can see performance vs prior month — each KPI card shows a variance delta (▲/▼ indicator + formatted percentage) comparing current period to prior period
- [x] **KPIS-03**: User sees visual confirmation that KPI values updated after scenario change — animated number counters (React Bits, under 600ms) trigger when Redux scenario state changes
- [x] **KPIS-04**: User can see which KPI cards were affected by a slider change — affected KPI cards display a brief amber glow animation when their computed value changes

### Close Tracker

- [x] **CLOS-01**: User can see month-end close progress — 6 close stages (AP close, AR close, Revenue recognition, Inventory valuation, Accruals & manual JEs, Financial statement package) display progress bars computed from actual journal entry data counts
- [x] **CLOS-02**: User can see close health at a glance — each stage shows a RAG status badge (On Track / At Risk / Delayed) with an Iconsax icon, color-coded and visually prominent
- [x] **CLOS-03**: User can understand why a stage is at risk — at-risk stages display a contextual note derived from JE data (e.g., "12 of 15 expected JEs posted — 3 pending approval")
- [x] **CLOS-04**: User can see time pressure in the close — a "days to close target" metric is displayed, computed from `company.closeTargetBusinessDays`

### Scenario Panel

- [x] **SCEN-01**: User can adjust 7 financial levers — sliders for Revenue Growth (−4% to +8%), Gross Margin (18%–28%), Fuel Index (80–140), Collections Rate (94%–100%), Returns (0.6%–2.5%), Late Invoice Hours (0–14), Journal Load (0.8x–1.3x) using 21st.dev slider components, dispatching to Redux
- [x] **SCEN-02**: User can activate 4 business mode switches — toggles for Prioritize Cash Mode, Conservative Forecast Bias, Tighten Credit Holds, and Inventory Complexity using 21st.dev toggle components, dispatching to Redux
- [x] **SCEN-03**: User can load a named scenario in one click — a dropdown selector loads presets from `scenario-presets.json` with FP&A-framed names (e.g., "Conservative Close", "Q4 Push for Target"), immediately updating all controls
- [x] **SCEN-04**: User can return to base scenario — a "Reset to defaults" button restores all controls to the default scenario values from `scenario-presets.json`

### Charts

- [x] **CHRT-01**: User can see how scenario choices drive margin — Margin Bridge chart (Recharts BarChart, gold `#F5A800` bars, ReferenceLine at zero, currency-formatted tooltips) updates in real time as scenario sliders change
- [x] **CHRT-02**: User can see the sales-to-finance revenue funnel — Pipeline to Invoiced chart (Recharts BarChart, teal `#05AB8C` bars) shows 5 CRM stages (Qualified → Proposal → Negotiation → Closed Won → Invoiced) with probability-weighted amounts from `crm_pipeline.csv`
- [x] **CHRT-03**: User can see accounts receivable aging health — AR Aging panel (stacked bar or donut chart from `ar_aging.csv`) displays Current, 1–30, 31–60, 61–90, and 90+ day buckets with an `ar90Ratio` summary stat
- [x] **CHRT-04**: User can view 13-week cash flow outlook — a line/area chart from `cash_13_week.csv` clearly distinguishes actuals (solid) from forecast (dashed) weeks, with a toggle to show/hide the panel

### AI Summary

- [ ] **AISU-01**: AI narrative generation is available — `/api/enhance-summary` POST route handler exists using OpenAI GPT-4o with streaming output, `export const runtime = 'nodejs'`, `max_tokens: 300`, `temperature: 0.3`
- [ ] **AISU-02**: User can read an AI-generated executive summary — an AI summary panel (21st.dev card component) displays the streaming narrative response, updating character-by-character as the OpenAI stream arrives
- [ ] **AISU-03**: User sees feedback while AI is generating — a React Bits loading animation displays while the streaming response is in progress
- [ ] **AISU-04**: Primary demo scenario narrative renders immediately — the default scenario's AI narrative is pre-generated and cached so the first webinar demo load shows output instantly without waiting for the API

### Dynamic Configuration

- [ ] **DYNM-01**: Dashboard header shows the correct reporting period — `periodLabel` is derived from the latest period in `erp_gl_summary.csv`, not hardcoded
- [x] **DYNM-02**: Variance calculations use configurable or computed rates — `variancePct` is either derived from GL data comparison or loaded from `company.json`, not hardcoded
- [x] **DYNM-03**: Close stage target days are configurable — close progress and "days to target" metric read `closeTargetBusinessDays` from `company.json`
- [x] **DYNM-04**: Dashboard header shows the correct company name — company name in header is loaded from `company.json`, not hardcoded

### Webinar Readiness

- [ ] **WBNR-01**: Dashboard fills a presenter display without awkward whitespace — layout is responsive and optimized for 1080p/4K widescreen presentation
- [ ] **WBNR-02**: All components and charts render correctly in both light and dark themes — Recharts chart colors use CSS variables (`var(--color-accent-primary)`, etc.) so they respond to theme changes; no chart is invisible in either mode
- [ ] **WBNR-03**: Production build is clean — `npm run build` completes without errors and `npm run start` shows zero console errors or React dev warnings
- [ ] **WBNR-04**: All scenario presets work end-to-end — each named preset in `scenario-presets.json` can be selected and produces correct, non-error KPI values and chart renders

---

## v2 Requirements

### Enhanced Interactivity

- **INTV-01**: Side-by-side scenario comparison — two Redux state trees rendered simultaneously for before/after comparison
- **INTV-02**: Presenter annotation overlays — lightweight annotation mode for drawing attention to chart sections during webinar
- **INTV-03**: Scenario save/load via localStorage — persist custom scenario configurations across browser sessions

### Data Depth

- **DATA-01**: Transaction-level JE drill-down — click-through from close stage to individual journal entry rows
- **DATA-02**: Segment-level KPI breakdown — AR and Pipeline data segmented by business unit

### Infrastructure

- **INFR-01**: Vercel deployment — public URL for external sharing
- **INFR-02**: Export to PDF — one-click PDF of dashboard state for post-webinar distribution

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Authentication / login | Zero demo value; breaks "open in browser and go" webinar setup |
| Multi-company / multi-tenant | Adds complexity; one company dataset tells a cleaner story |
| Real ERP data integration | Months of work; audience understands it's demo data |
| Mobile layout (below 1024px) | Webinar is never viewed on a phone |
| Comprehensive unit/integration test suite | Demo-context deadline; manual preset testing is the quality gate |
| Audit trail / change log | No value without multi-user context |
| Role-based permissions | No value without authentication |
| Alert / notification system (email, Slack) | Requires production infrastructure irrelevant to local demo |
| Real-time data refresh / WebSocket | Static demo data only; no live ERP connection |
| Recharts 3.x | Beta with breaking SVG API changes — wrong for a live demo |
| Zod 4.x | Beta with API changes from 3.x — use 3.24.x |
| shadcn/ui CLI init | Conflicts with Tailwind v4 + the copy-paste 21st.dev approach |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOND-01 | Phase 1 | Complete |
| FOND-03 | Phase 1 | Complete |
| FOND-05 | Phase 1 | Complete |
| FOND-06 | Phase 1 | Complete |
| FOND-07 | Phase 1 | Complete |
| FOND-02 | Phase 2 | Pending |
| FOND-04 | Phase 2 | Pending |
| FOND-08 | Phase 2 | Pending |
| DYNM-01 | Phase 2 | Pending |
| DYNM-02 | Phase 3 | Complete |
| DYNM-03 | Phase 2 | Pending |
| DYNM-04 | Phase 2 | Pending |
| KPIS-01 | Phase 3 | Complete |
| KPIS-02 | Phase 3 | Complete |
| KPIS-03 | Phase 3 | Complete |
| KPIS-04 | Phase 3 | Complete |
| SCEN-01 | Phase 4 | Complete |
| SCEN-02 | Phase 4 | Complete |
| SCEN-03 | Phase 4 | Complete |
| SCEN-04 | Phase 4 | Complete |
| CLOS-01 | Phase 5 | Complete |
| CLOS-02 | Phase 5 | Complete |
| CLOS-03 | Phase 5 | Complete |
| CLOS-04 | Phase 5 | Complete |
| CHRT-02 | Phase 6 | Complete |
| CHRT-03 | Phase 6 | Complete |
| CHRT-04 | Phase 6 | Complete |
| CHRT-01 | Phase 7 | Complete |
| AISU-01 | Phase 8 | Pending |
| AISU-02 | Phase 8 | Pending |
| AISU-03 | Phase 8 | Pending |
| AISU-04 | Phase 8 | Pending |
| WBNR-01 | Phase 9 | Pending |
| WBNR-02 | Phase 9 | Pending |
| WBNR-03 | Phase 9 | Pending |
| WBNR-04 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 36 total (note: original count of 32 was incorrect — actual count is 8 FOND + 4 KPIS + 4 CLOS + 4 SCEN + 4 CHRT + 4 AISU + 4 DYNM + 4 WBNR = 36)
- Mapped to phases: 36
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after roadmap creation — traceability updated to 9-phase fine-granularity structure*
