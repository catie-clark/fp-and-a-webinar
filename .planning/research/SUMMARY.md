# Project Research Summary

**Project:** FP&A Close Efficiency Dashboard (Webinar Demo)
**Domain:** Next.js 16 financial analytics — interactive FP&A close management dashboard
**Researched:** 2026-03-03
**Confidence:** HIGH

## Executive Summary

This is a live webinar demo artifact targeting FP&A professionals who use enterprise tools like BlackLine, FloQast, Workiva, and Planful daily. The core challenge is passing two simultaneous tests: the credibility lens (does this look real to someone who lives in close management software?) and the wow lens (does this create a "I want that" moment no legacy tool offers?). The recommended approach is a React server-to-client handoff architecture where all I/O and data shaping happens on the server, and all interactivity lives in a single Redux-managed client subtree rooted at `DashboardApp.tsx`. The project already has the right foundation — Next.js 16, Redux Toolkit, Tailwind v4, framer-motion — and needs a targeted set of additions (Recharts, Zod, OpenAI SDK, iconsax-react, papaparse) to be complete.

The single biggest differentiator is the interactive scenario panel: 7 sliders and 4 toggles that cascade live updates through 8 KPI cards, a reactive Margin Bridge chart, and an AI-generated executive narrative. No static reporting tool offers this, and no demo moment lands harder than a presenter adjusting Revenue Growth and watching the entire dashboard update in real time. This is the product's reason for existing. Everything else (AR Aging, Pipeline funnel, 13-week cash) is credibility scaffolding that makes the scenario panel feel real rather than gimmicky.

The primary risk is a cascade of Next.js App Router integration mistakes — non-serializable data crossing the server/client boundary, Redux store singletons leaking state, Recharts SSR hydration mismatches, and OpenAI API timeouts during the live demo. Every one of these risks manifests as a blank page or a broken feature in front of an audience. All are well-understood and preventable with patterns established in the Foundation phase. The second risk is a credibility gap: FP&A professionals will notice missing per-KPI variance indicators immediately. This is a low-effort fix that must be treated as table stakes, not polish.

---

## Key Findings

### Recommended Stack

The project already has the core framework installed and confirmed on-disk (Next.js 16.1.6, Redux Toolkit 5.0.1, react-redux 9.2.0, Tailwind v4, framer-motion). The remaining dependencies to install are: `recharts@^2.15` (not 3.x — beta with breaking changes), `zod@^3.24` (not 4.x — beta), `openai@^4`, `iconsax-react`, `papaparse`, and the Radix UI primitive set for 21st.dev copy-paste components. UI components from 21st.dev and animations from React Bits are copy-paste patterns (not npm packages), with framer-motion as the peer dependency. shadcn CLI should not be run — it conflicts with Tailwind v4.

**Core technologies:**
- **Next.js 16.1.6 (App Router):** Framework — already installed, use RSC for data loading and Client Components for all interactivity
- **Redux Toolkit (installed):** State management — 11 interdependent controls require `createSelector` memoization to prevent rerender storms; Zustand is wrong here
- **Recharts 2.15.x:** Charts — stable, React-native; must be wrapped in `dynamic({ ssr: false })` and `ResponsiveContainer` requires explicit parent height
- **Zod 3.24.x:** Data validation — use `safeParse` (not `parse`) to skip invalid rows without crashing; use `z.string()` not `z.coerce.date()` to avoid serialization errors
- **OpenAI SDK 4.x:** AI narrative — route handler must declare `export const runtime = 'nodejs'`; use streaming to avoid 504 timeout in live demo
- **iconsax-react:** Icons — real npm package; must be wrapped in a single `"use client"` file to prevent `window is not defined` SSR error
- **papaparse:** CSV parsing — server-side only in `dataLoader.ts`; no browser bundle impact
- **framer-motion (installed):** Animations — KPI number counters, scroll reveals; already present

### Expected Features

All feature decisions must pass both the credibility lens and the wow lens. Features scoring on neither should not be built.

**Must have (table stakes — their absence makes the demo feel like a toy):**
- KPI summary header cards (8 cards: Net Sales, COGS, Gross Profit, EBITDA, Cash, AR, AP, Inventory)
- Per-KPI variance indicators (delta vs prior month on each card) — currently a GAP in the plan; FP&A professionals will notice immediately
- Period label and company name in header, derived from data — not hardcoded
- Close stage progress tracker (6 stages: AP, AR, Revenue Rec, Inventory, Accruals/JEs, Financial Statement Package)
- RAG status indicators (on track / at risk / delayed) — must be visually prominent, not just text
- Readable, formatted financial numbers everywhere (currency, percent, thousands separators)
- Chart tooltips with formatted values on all charts
- Light/dark theme working on all components including charts

**Should have (differentiators — create "I want that" moments):**
- Interactive scenario panel with 7 sliders + 4 toggles driving live KPI updates — the primary differentiator
- Named scenario presets (use realistic FP&A framing: "Conservative Close", "Q4 Push for Target")
- AI-generated executive narrative via OpenAI, updating on scenario change with streaming output
- Margin Bridge chart, reactive to scenario state — a standard FP&A tool made interactive
- Animated number counters on KPI cards triggered by scenario change (under 600ms)
- Scenario change highlight (amber glow on changed KPI cards) — critical for live audience storytelling
- "Why at risk" contextual note on close stage tracker for at-risk stages
- AR Aging panel (static, bounded scope)
- Pipeline to Invoiced funnel chart (static, bounded scope)
- 13-Week Cash Flow view (clearly distinguishing actuals from forecast)

**Defer without regret:**
- Authentication, multi-tenant, ERP integration, export to PDF/Excel, alert systems, audit trail, role-based permissions, mobile layout below 1024px, comprehensive test suite

### Architecture Approach

The architecture follows a strict server-to-client handoff: all file I/O, CSV parsing, and Zod validation happen in `dataLoader.ts` on the server. `page.tsx` (async Server Component) calls the loader and passes a serialized `DashboardSeedData` plain-object to `DashboardApp.tsx`, which is the single client boundary. `DashboardApp.tsx` owns the Redux Provider, initializes the store via `preloadedState`, and renders all dashboard sections as descendants (automatically client without additional `"use client"` directives). The Redux store uses a 2-slice structure: `scenarioSlice` (all 11 user controls) and `dataSlice` (seed data, set once). All derived values — KPI computations, chart data, close stage percentages — live exclusively in `selectors.ts` via `createSelector`, never inside component render functions.

**Major components:**
1. `lib/dataLoader.ts` — Server-only: CSV/JSON loading, Zod schema validation, returns `DashboardSeedData` (plain JSON, ISO strings)
2. `app/page.tsx` — Async Server Component: calls loader, passes serialized data to client; never `"use client"`
3. `components/DashboardApp.tsx` — Root Client Component: Redux Provider, store initialization from `preloadedState`, main layout
4. `store/` (4 files) — `scenarioSlice.ts`, `dataSlice.ts`, `selectors.ts`, `hooks.ts`: all state and derived computations
5. `components/dashboard/ScenarioPanel.tsx` — Sliders + toggles + preset selector; dispatches to Redux
6. `components/dashboard/KpiSection.tsx` + `KpiCard.tsx` — Reads from selectors, animated counters, variance deltas
7. `components/dashboard/ChartsMarginBridge.tsx` — Recharts bar chart, reactive to scenario state
8. `components/dashboard/AiSummaryPanel.tsx` — Calls `/api/enhance-summary`, streaming response display
9. `app/api/enhance-summary/route.ts` — OpenAI POST handler, Node runtime, streaming

### Critical Pitfalls

1. **Non-serializable data at server/client boundary** — Any `Date`, `Map`, `Set`, or class instance in `DashboardSeedData` causes a blank page with cryptic error. Prevention: use `z.string()` for dates in Zod schemas, test with `JSON.stringify(data)` in `page.tsx` on day 1.

2. **Redux store as module-level singleton** — Module-level `export const store = configureStore(...)` leaks state between SSR requests. Prevention: export `makeStore` factory; initialize in `DashboardApp.tsx` via `useRef`.

3. **OpenAI API timeout during live demo** — GPT-4o responses take 8-15 seconds; Vercel default timeout is 10 seconds. Prevention: use streaming response (`stream: true`, `max_tokens: 300`); pre-cache the primary demo scenario's narrative before the webinar.

4. **Recharts SSR hydration mismatch** — `ResponsiveContainer` reads DOM bounding box that doesn't exist during SSR. Prevention: wrap all chart components in `dynamic(() => import(...), { ssr: false })`; always give parent div explicit height (`h-80 w-full`).

5. **Rerender storm on slider drag** — Without memoization, 4 charts and 8 KPI cards recompute simultaneously at 60fps slider events. Prevention: all derived values via `createSelector`; chart components wrapped in `React.memo`; slider dispatch debounced at 150ms.

6. **Light/dark theme hydration flicker** — `localStorage` is unavailable during SSR, causing a visible wrong-theme frame on load. Prevention: blocking `<script>` in `layout.tsx` before React hydrates, with `suppressHydrationWarning` on `<html>`.

7. **`"use client"` on `page.tsx`** — Causes webpack to bundle `fs`/`path` for the browser. Prevention: `page.tsx` and `layout.tsx` must never have `"use client"`; the only correct client boundary is `DashboardApp.tsx`.

---

## Implications for Roadmap

Based on the combined research, the critical path is: **Types → Data → Store → Client boundary → Controls → Metrics → Charts → AI → Polish**. Each phase is blocked by the previous. This is not a "build in parallel" project — the dependency chain is strict.

### Phase 1: Foundation

**Rationale:** Everything downstream depends on correct data types, a working data pipeline, and a stable Redux store. Building UI without these guarantees is writing code twice. Every critical pitfall (serialization boundary, store singleton, `"use client"` placement, theme flicker, Iconsax SSR, formatters) must be defeated in this phase before any user-visible component is written.

**Delivers:** A verified end-to-end data pipeline (`dataLoader.ts` → `page.tsx` → `DashboardApp.tsx`), all 10 data files, Zod schemas, Redux store (2 slices + selectors + hooks), `formatters.ts`, icon wrapper, theme blocking script, and `Header.tsx` with dynamic company name and period label.

**Addresses:** Table stakes credibility (period label, company name), data integrity, Redux architecture.

**Avoids:** Pitfalls 1 (serialization), 3 ("use client" on page.tsx), 4 (store singleton), 6 (theme flicker), 7 (Zod crash on bad rows), 8 (number formatting), 11 (Iconsax SSR), 12 (.env.local committed), 14 (hardcoded period label).

**Research flag:** Standard patterns — well-documented Next.js App Router + Redux Toolkit integration. Skip phase research.

---

### Phase 2: Scenario Controls and KPI Layer

**Rationale:** Build inputs before outputs. `ScenarioPanel.tsx` must dispatch correctly before `KpiSection.tsx` can verify scenario math in text form. This validates the entire Redux data flow before introducing Recharts complexity.

**Delivers:** Fully wired scenario panel (7 sliders, 4 toggles, named presets), all 8 KPI cards with variance deltas, `selectors.ts` fully complete and verified, per-KPI scenario change highlight (amber glow), animated number counters.

**Addresses:** Primary differentiator (interactive scenario panel), per-KPI variance indicators (gap fix), scenario presets with FP&A-framed names, scenario change visual signal for live demo storytelling.

**Avoids:** Pitfall 9 (rerender storm — apply `createSelector` + `React.memo` + 150ms debounce from first slider), Pitfall 10 (initial state vs preset defaults — initialize Redux from `seedData.defaultScenario`).

**Research flag:** Standard patterns — RTK `createSelector` and slider debouncing are documented patterns. Skip phase research.

---

### Phase 3: Close Tracker and Static Charts

**Rationale:** Close stage tracker depends on journal entry data being in the store and selectors being stable (Phase 2 prerequisite). Static charts (AR Aging, Pipeline, 13-week cash) are self-contained and can be built in parallel once the Recharts SSR pattern is established.

**Delivers:** Close stage progress tracker (6 stages, JE-computed progress, RAG status, "why at risk" contextual notes for at-risk stages), AR Aging chart, Pipeline to Invoiced funnel, 13-Week Cash Flow chart with actuals vs forecast distinction.

**Addresses:** Close management credibility (stage tracker with computed progress), contextual intelligence ("why at risk" notes), AR/cash visibility features.

**Avoids:** Pitfall 2 (Recharts SSR — establish `dynamic({ ssr: false })` pattern before first chart), Pitfall 13 (tooltip null crashes — defensive null checks in all tooltip formatters).

**Research flag:** Standard patterns — Recharts documentation is thorough. Skip phase research.

---

### Phase 4: Reactive Margin Bridge Chart

**Rationale:** The Margin Bridge is separated from static charts because it must react to scenario state, requiring `selectors.ts` to be complete and verified. It is the visual centerpiece of the demo — treat it as its own deliverable, not bundled with static charts.

**Delivers:** Recharts bar/waterfall chart updating in real time as scenario sliders change; chart colors use CSS variables for light/dark theme; formatted tooltips.

**Addresses:** Key differentiator (a standard FP&A communication tool made interactive), visual demonstration that the scenario panel has real financial consequence.

**Avoids:** Pitfall 9 (rerender storm on slider drag — chart wrapped in `React.memo`, selector memoized).

**Research flag:** Standard patterns — well-documented Recharts bar chart. Skip phase research.

---

### Phase 5: AI Executive Summary

**Rationale:** AI feature depends on all scenario state being finalized (Phase 2), all KPI values being stable (Phase 2), and the OpenAI route being the last server-side component built. Building this early risks rework when scenario state shape changes.

**Delivers:** `AiSummaryPanel.tsx` with streaming text display, `/api/enhance-summary` route (Node runtime, `max_tokens: 300`, `temperature: 0.3`), pre-cached narrative for the primary demo scenario, pre-written fallback narrative.

**Addresses:** Primary wow moment — AI narrative updating live after slider changes.

**Avoids:** Pitfall 5 (API timeout — streaming from day 1, not retrofitted), Pitfall 16 (spinner kills demo momentum — streaming shows output within 1-2 seconds).

**Research flag:** Needs validation — test OpenAI streaming response with Vercel deployment before webinar. Confirm `export const runtime = 'nodejs'` behavior in Next.js 16 specifically.

---

### Phase 6: Webinar Readiness and Polish

**Rationale:** Polish applied before core features are stable delays the project. This phase runs only when all features are functional.

**Delivers:** React Bits animated components, 21st.dev copy-paste component upgrades, production build verification (`npm run build && npm run start`), light mode confirmed for projector use, pre-navigation of dashboard before webinar, OPENAI_API_KEY confirmed in `.env.local` and Vercel environment.

**Addresses:** Demo performance (production build is 10x faster than dev), projector visibility (dark mode charts can be invisible on projectors — demo in light mode), cold start prevention (pre-navigate before session).

**Avoids:** Pitfall 15 (cold start stalls demo opening), Pitfall 17 (dark mode charts invisible on projector).

**Research flag:** No research needed — operational checklist, not implementation work.

---

### Phase Ordering Rationale

- **Types before data before store before UI** is mandatory, not advisory. Next.js App Router serialization errors from wrong types are impossible to debug if they appear deep in the UI layer.
- **Scenario controls before charts** because memoized selectors must be validated in plain text KPI cards before introducing Recharts render complexity.
- **Margin Bridge isolated from static charts** because it is the only scenario-reactive chart and carries the most demo weight; it deserves its own phase rather than being a footnote in a charts sprint.
- **AI last** because it depends on scenario state shape being frozen. Any change to `ScenarioState` after the AI prompt is built forces prompt rework.
- **Polish always last** because unpolished working features are infinitely better than polished broken ones for a webinar.

### Research Flags

Phases needing deeper research during planning:
- **Phase 5 (AI):** Validate OpenAI streaming behavior specifically with Next.js 16 App Router `export const runtime = 'nodejs'`; confirm Vercel function timeout behavior for streaming vs non-streaming responses.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1 (Foundation):** Next.js App Router + Redux Toolkit integration is thoroughly documented.
- **Phase 2 (Scenario + KPIs):** RTK `createSelector`, slider debouncing — standard patterns.
- **Phase 3 (Static Charts):** Recharts documentation covers all required patterns.
- **Phase 4 (Margin Bridge):** Recharts bar chart, `React.memo`, memoized selectors — standard.
- **Phase 6 (Polish/Readiness):** Operational checklist, no implementation unknowns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core packages confirmed on-disk; version decisions (Recharts 2.x, Zod 3.x) are based on confirmed beta status of major versions |
| Features | MEDIUM | Domain knowledge from training data (stable FP&A domain); competitor feature set (BlackLine, FloQast, Workiva) is well-understood; no web search available to verify 2026 feature landscape changes |
| Architecture | HIGH | Next.js App Router RSC serialization, Redux Toolkit integration, Recharts SSR behavior — all based on official documentation; 21st.dev / React Bits RSC compatibility is MEDIUM (inspect per component) |
| Pitfalls | HIGH | All 17 pitfalls are based on well-documented Next.js, Redux, and OpenAI integration failure modes; demo-specific pitfalls (projector, cold start) are experience-based |

**Overall confidence:** HIGH

### Gaps to Address

- **21st.dev component RSC compatibility:** Each copy-pasted component must be inspected before use — they may use hooks or browser APIs incompatible with RSC. Verify per component, not as a blanket assumption.
- **React Bits component SSR compatibility:** Same as above — framer-motion is fine, but individual React Bits components may have SSR issues. Inspect source before importing.
- **OpenAI streaming in Next.js 16 specifically:** The streaming pattern (`openai.beta.chat.completions.stream`) should be validated against Next.js 16.1.6 behavior before the AI phase begins — test on Vercel deployment, not just local dev.
- **Recharts 2.15.x exact version:** Confirm `recharts@^2.15` is available on npm at time of install; 2.x is the stable branch but minor versions matter for the SVG API.
- **Demo data realism:** The 10 CSV/JSON data files are synthetic. FP&A professionals will scrutinize whether GL entries, AR aging buckets, and cash flow numbers tell a coherent financial story. Invest time making the data internally consistent, not just structurally valid.

---

## Sources

### Primary (HIGH confidence)
- Next.js App Router official documentation — RSC serialization constraints, `"use client"` boundary rules, `dynamic()` import
- Redux Toolkit official documentation — `createSelector`, `makeStore` factory pattern, `useRef` store initialization
- OpenAI SDK 4.x documentation — streaming completions, Node runtime requirement
- On-disk `node_modules` + `package.json` — confirmed versions for Next.js 16.1.6, Redux 5.0.1, react-redux 9.2.0, Tailwind v4, Vitest 4.0.18

### Secondary (MEDIUM confidence)
- Community consensus on Recharts 2.x vs 3.x stability — 3.x beta breaking changes confirmed across multiple sources
- Zod 4.x beta status — API changes from 3.x confirmed in community channels
- FP&A competitor feature research (BlackLine, FloQast, Workiva, Planful, Vena) — domain knowledge from training data, stable domain
- 21st.dev component library — copy-paste pattern confirmed; RSC compatibility requires per-component inspection

### Tertiary (LOW confidence)
- React Bits RSC compatibility — inspect each component's source before use; do not assume
- 21st.dev Tailwind v4 compatibility — verified conceptually but not tested per component

---
*Research completed: 2026-03-03*
*Ready for roadmap: yes*
