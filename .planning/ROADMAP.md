# Roadmap: FP&A Close Efficiency Dashboard

## Overview

Nine phases that move from a blank directory to a fully functioning, webinar-ready interactive FP&A dashboard. The dependency chain is strict: configuration files must exist before data can be loaded, data must be validated before the Redux store can be initialized, the store must be stable before KPI cards can verify scenario math, and scenario math must be frozen before the AI prompt can be locked. Every phase delivers one coherent, independently verifiable capability. Phase 7 (Reactive Margin Bridge) is intentionally isolated because it is the visual centerpiece of the demo and deserves its own delivery boundary rather than being a footnote in the static charts phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Project Scaffolding** - All source files, config files, and shared utilities exist and the app starts
- [ ] **Phase 2: Data Layer** - All 10 data files exist, Zod schemas validate them, and the server pipeline delivers clean data to the client boundary
- [ ] **Phase 3: KPI Cards and Variance Layer** - All 8 KPI metric cards render with real data, variance deltas, animated counters, and amber change highlight
- [ ] **Phase 4: Scenario Control Panel** - All 7 sliders, 4 toggles, preset selector, and reset button are wired to Redux and update KPI values live
- [ ] **Phase 5: Close Stage Tracker** - 6 close stages display JE-computed progress, RAG status badges, contextual at-risk notes, and days-to-close metric
- [x] **Phase 6: Static Charts** - AR Aging, Pipeline to Invoiced, and 13-Week Cash Flow charts render correctly from CSV data (completed 2026-03-05)
- [x] **Phase 7: Reactive Margin Bridge** - Margin Bridge chart updates in real time as scenario sliders change (completed 2026-03-05)
- [ ] **Phase 8: AI Executive Summary** - Streaming AI narrative panel generates and displays an executive summary from scenario state
- [ ] **Phase 9: Webinar Readiness and Polish** - Layout fills presenter display, both themes work on all charts, build is clean, all presets tested end-to-end

## Phase Details

### Phase 1: Project Scaffolding
**Goal**: The application can boot — all required config files, entry point components, and shared utility files exist with no TypeScript errors
**Depends on**: Nothing (first phase)
**Requirements**: FOND-01, FOND-03, FOND-05, FOND-06, FOND-07
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts without errors and the browser shows a page (even a placeholder) at localhost:3000
  2. Switching the OS/browser to dark mode does not cause a visible flash of the wrong theme on page load
  3. Any icon imported from the Iconsax wrapper renders on the page without a `window is not defined` SSR error
  4. `formatCurrency(1234567.89)` returns `$1,234,567.89` and `formatPercent(0.045)` returns `4.5%`
  5. `lib/csv.ts` papaparse wrapper is importable from `dataLoader.ts` without browser bundle errors
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Wave 0: test infrastructure (vitest.config.ts + 4 failing test stubs)
- [ ] 01-02-PLAN.md — Wave 1: config files, Zod types, csv.ts, store stub (npm install)
- [ ] 01-03-PLAN.md — Wave 2: app entry points (layout, page, DashboardApp), formatters, icons

### Phase 2: Data Layer
**Goal**: All 10 data files exist with realistic, internally consistent webinar-quality sample data, Zod schemas validate every file, and `dataLoader.ts` returns a serializable `DashboardSeedData` object to `page.tsx`
**Depends on**: Phase 1
**Requirements**: FOND-02, FOND-04, FOND-08, DYNM-01, DYNM-02, DYNM-03, DYNM-04
**Success Criteria** (what must be TRUE):
  1. `dataLoader.ts` loads all 10 files and returns without throwing — verified by `console.log(JSON.stringify(seedData))` in `page.tsx` producing valid JSON with no `undefined` values
  2. The dashboard header shows a period label derived from the latest period in `erp_gl_summary.csv`, not the string "Jan 2026"
  3. The dashboard header shows a company name loaded from `company.json`, not a hardcoded string
  4. Close stage progress reads `closeTargetBusinessDays` from `company.json` and produces a non-zero "days to target" value
  5. `.env.local` exists, contains `OPENAI_API_KEY`, and is listed in `.gitignore`
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — Wave 0: failing dataLoader.test.ts stubs (RED — 10 assertions)
- [x] 02-02-PLAN.md — Wave 1: company.json, scenario-presets.json, GL/fuel/vendor/cash/inventory CSVs (7 files)
- [x] 02-03-PLAN.md — Wave 1: ar_aging.csv, crm_pipeline.csv, erp_journal_entries.csv (3 arithmetic-critical files)
- [ ] 02-04-PLAN.md — Wave 2: fix dataLoader.ts variancePct, wire page.tsx async, create .env.local

### Phase 3: KPI Cards and Variance Layer
**Goal**: All 8 KPI metric cards render the correct financial values from GL data, show variance deltas vs prior month, animate on scenario change, and highlight with amber glow when their computed value changes
**Depends on**: Phase 2
**Requirements**: KPIS-01, KPIS-02, KPIS-03, KPIS-04, DYNM-02
**Success Criteria** (what must be TRUE):
  1. All 8 KPI cards (Net Sales, COGS, Gross Profit, EBITDA, Cash, AR, AP, Inventory) display correctly formatted currency values from GL data
  2. Each KPI card shows a variance delta indicator (up/down arrow + formatted percentage) comparing current period to prior period — no card is missing this indicator
  3. Moving any scenario slider causes KPI card numbers to animate to their new values in under 600ms
  4. The KPI card(s) whose computed value changed by a scenario slider movement briefly show an amber glow that is visible to a presenter's audience
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Wave 0: RED test stubs + fix BaseInputs type + fix dataLoader.ts apTotal/inventoryTotal
- [ ] 03-02-PLAN.md — Wave 1: scenarioSlice.ts + kpiSelectors.ts + store/index.ts + CountUp.tsx + icons.tsx + globals.css glow keyframe
- [ ] 03-03-PLAN.md — Wave 2: KpiCard.tsx + KpiSection.tsx + DashboardApp.tsx integration (checkpoint)

### Phase 4: Scenario Control Panel
**Goal**: All 11 user controls (7 sliders + 4 toggles) are rendered with Radix UI primitives, dispatch correctly to Redux, and cause KPI values to update live; preset selection and reset work
**Depends on**: Phase 3
**Requirements**: SCEN-01, SCEN-02, SCEN-03, SCEN-04
**Success Criteria** (what must be TRUE):
  1. All 7 sliders (Revenue Growth, Gross Margin, Fuel Index, Collections Rate, Returns, Late Invoice Hours, Journal Load) are draggable within their documented ranges and each change immediately updates at least one KPI card value
  2. All 4 toggles (Prioritize Cash Mode, Conservative Forecast Bias, Tighten Credit Holds, Inventory Complexity) toggle on/off and their state is reflected in KPI computations
  3. Selecting a named preset from the dropdown (e.g., "Conservative Close") updates all 11 controls to that preset's values and KPI cards reflect the new scenario
  4. Clicking "Reset to defaults" restores all 11 controls to their default values from `scenario-presets.json`
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — Wave 1: scenarioSlice Redux reducer tests (GREEN contract verification, all 4 SCEN requirements)
- [ ] 04-02-PLAN.md — Wave 2: ScenarioPanel.tsx — all 7 sliders + 4 toggles with Radix primitives, Redux dispatch
- [ ] 04-03-PLAN.md — Wave 3: DashboardApp two-column layout + PresetRow + Reset + human-verify checkpoint

### Phase 5: Close Stage Tracker
**Goal**: The close stage tracker displays 6 stages with progress bars computed from journal entry data, RAG status badges with Iconsax icons, contextual notes for at-risk stages, and a days-to-close metric
**Depends on**: Phase 2
**Requirements**: CLOS-01, CLOS-02, CLOS-03, CLOS-04
**Success Criteria** (what must be TRUE):
  1. All 6 close stages (AP close, AR close, Revenue recognition, Inventory valuation, Accruals and manual JEs, Financial statement package) display progress bars with percentages computed from actual journal entry data counts — not hardcoded values
  2. Every close stage shows a color-coded RAG badge (On Track green, At Risk amber, Delayed red) with a matching Iconsax icon that is large enough to read at a glance
  3. Any stage with "At Risk" or "Delayed" status displays a contextual note explaining why (e.g., "12 of 15 expected JEs posted — 3 pending approval") derived from JE data
  4. A "days to close target" metric is visible and shows a non-zero computed value based on `closeTargetBusinessDays` from `company.json`
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md — Wave 1: CloseStage type interface + RED test stubs
- [ ] 05-02-PLAN.md — Wave 2: dataLoader.ts JE-computed closeStages (makes tests GREEN)
- [ ] 05-03-PLAN.md — Wave 3: CloseTracker components + DashboardApp wire-in + human verify

### Phase 6: Static Charts
**Goal**: AR Aging, Pipeline to Invoiced, and 13-Week Cash Flow charts render correctly from their CSV data files with formatted tooltips and no SSR hydration errors
**Depends on**: Phase 2
**Requirements**: CHRT-02, CHRT-03, CHRT-04
**Success Criteria** (what must be TRUE):
  1. The Pipeline to Invoiced chart displays 5 CRM stages (Qualified through Invoiced) as a bar chart with teal bars and probability-weighted amounts from `crm_pipeline.csv` shown in tooltips
  2. The AR Aging panel displays Current, 1-30, 31-60, 61-90, and 90+ day buckets from `ar_aging.csv` and shows an `ar90Ratio` summary stat
  3. The 13-Week Cash Flow chart clearly distinguishes actual weeks (solid line) from forecast weeks (dashed line), with a toggle that shows or hides the entire panel
  4. No chart throws a Recharts SSR hydration error — all three charts load cleanly on initial page render
**Plans**: 3 plans

Plans:
- [ ] 06-01-PLAN.md — Wave 1: fix DashboardSeedData type gap (arAging + crmPipeline) + RED test stubs
- [ ] 06-02-PLAN.md — Wave 2: PipelineChart + ArAgingChart + CashFlowChart + ChartsSection + DashboardApp wire-in
- [ ] 06-03-PLAN.md — Wave 3: dev server start + human-verify checkpoint (charts render, no SSR errors)

### Phase 7: Reactive Margin Bridge
**Goal**: The Margin Bridge chart updates in real time as scenario sliders change, serving as the visual centerpiece that demonstrates financial consequence of the scenario panel
**Depends on**: Phase 4
**Requirements**: CHRT-01
**Success Criteria** (what must be TRUE):
  1. The Margin Bridge chart renders as a Recharts BarChart with gold (`#F5A800`) bars, a ReferenceLine at zero, and currency-formatted tooltips
  2. Moving the Revenue Growth or Gross Margin slider causes the Margin Bridge chart to visually update within one second without causing other dashboard components to flicker or re-render noticeably
  3. The chart renders correctly in both light and dark themes without any bar or label becoming invisible
**Plans**: 4 plans

Plans:
- [ ] 07-01-PLAN.md — Wave 1: RED test stubs (marginBridge.test.ts) + BaseInputs type extension + dataLoader computation
- [ ] 07-02-PLAN.md — Wave 2: 5 new kpiSelectors + buildMarginBridgeData in chartDataUtils (tests GREEN)
- [ ] 07-03-PLAN.md — Wave 3: MarginBridgeChart.tsx + MarginBridgeSection.tsx + DashboardApp wire-in
- [ ] 07-04-PLAN.md — Wave 4: dev server start + human-verify checkpoint (chart renders, animates, dark mode correct)

### Phase 8: AI Executive Summary
**Goal**: An AI-generated executive narrative streams character-by-character into a 21st.dev panel, with a React Bits loading animation during generation and a pre-cached response for the primary demo scenario
**Depends on**: Phase 4
**Requirements**: AISU-01, AISU-02, AISU-03, AISU-04
**Success Criteria** (what must be TRUE):
  1. The `/api/enhance-summary` route handler responds to a POST request with a streaming text response using OpenAI GPT-4o, and the browser developer tools shows the response arriving incrementally (not all at once)
  2. The AI summary panel displays the streaming narrative updating character-by-character as the OpenAI stream arrives — text is readable and not jumbled
  3. While the AI is generating, a React Bits loading animation is visible in the panel — the panel does not show a blank white box
  4. On the very first page load with the default scenario active, the AI summary panel displays a complete pre-cached narrative immediately without waiting for an API call
**Plans**: TBD

### Phase 9: Webinar Readiness and Polish
**Goal**: The complete dashboard is presentation-ready — responsive for 1080p/4K widescreen, both themes work on every component including charts, the production build is clean, and all scenario presets produce valid output
**Depends on**: Phase 8
**Requirements**: WBNR-01, WBNR-02, WBNR-03, WBNR-04
**Success Criteria** (what must be TRUE):
  1. On a 1920x1080 or 4K display the dashboard fills the screen without visible empty space, overflow, or misaligned sections — no awkward whitespace gaps in any column
  2. Toggling between light and dark themes with all scenario presets active shows every chart, KPI card, badge, and label remaining readable — no element becomes invisible in either theme
  3. `npm run build` completes without TypeScript errors, and `npm run start` in a browser shows zero console errors and zero React dev warnings
  4. Each of the named presets in `scenario-presets.json` can be selected, and every KPI card and every chart displays a non-error, non-NaN value for that preset
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

Note: Phase 5 (Close Tracker) depends only on Phase 2 and can begin after Phase 2 completes, in parallel with Phases 3-4. Phase 6 (Static Charts) also depends only on Phase 2.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Scaffolding | 2/3 | In Progress|  |
| 2. Data Layer | 3/4 | In Progress | - |
| 3. KPI Cards and Variance Layer | 2/3 | In Progress|  |
| 4. Scenario Control Panel | 2/3 | In Progress|  |
| 5. Close Stage Tracker | 2/3 | In Progress|  |
| 6. Static Charts | 3/3 | Complete   | 2026-03-05 |
| 7. Reactive Margin Bridge | 4/4 | Complete   | 2026-03-05 |
| 8. AI Executive Summary | 0/TBD | Not started | - |
| 9. Webinar Readiness and Polish | 0/TBD | Not started | - |
