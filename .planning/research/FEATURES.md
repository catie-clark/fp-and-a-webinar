# Feature Landscape

**Domain:** FP&A Close Management / Financial Analytics Dashboard (Webinar Demo)
**Researched:** 2026-03-03
**Confidence:** MEDIUM — Domain knowledge from training data (stable FP&A domain); web search unavailable. Competitor references: BlackLine, Workiva Close, FloQast, Planful, Vena.

---

## Context: The Webinar Demo Constraint

This is a **live demo artifact for FP&A professionals at a consulting firm webinar**. Feature decisions must pass two lenses:
1. **Credibility lens:** Does this make the demo look real to an FP&A audience that uses Workiva, Planful, BlackLine daily?
2. **Wow lens:** Does this create a moment that makes attendees say "I want that"?

Features that score on neither lens should not be built.

---

## Table Stakes

Features FP&A professionals expect to see. Their absence makes the demo feel like a toy.

| Feature | Why Expected | Complexity | Status in Plan | Notes |
|---------|--------------|------------|----------------|-------|
| KPI summary header cards | Every financial dashboard leads with summary metrics — without this, nothing has context | Low | ✓ Included (8 cards) | Good selection: Net Sales, COGS, Gross Profit, EBITDA, Cash, AR, AP, Inventory |
| Period label / reporting period indicator | Users must know what time period data represents | Low | ✓ Included (derived from GL) | Critical credibility detail. Hardcoded "Jan 2026" would be noticed immediately |
| Variance vs prior period or budget | Every FP&A professional asks "vs what?" | Low–Med | ⚠ Partial (company-level `variancePct` only) | **GAP: Per-KPI delta indicators are missing — see Missing Features** |
| Close stage / task tracker | Month-end close is fundamentally a checklist. BlackLine, FloQast, Workiva Close all lead with this | Medium | ✓ Included (6 stages) | Correct 6 stages: AP, AR, Revenue Rec, Inventory, Accruals/JEs, Financial Statement Package |
| Status indicators (on track / at risk / delayed) | CFOs want RAG status at a glance | Low | ✓ Included | Must be visually prominent — color-coded badges or icons, not just text |
| AR Aging panel | Overdue receivables = cash risk signal. CFOs monitor aging buckets during close | Medium | ✓ Included | Correct buckets: Current, 1–30, 31–60, 61–90, 90+ |
| Readable, formatted numbers | Currency formatting, thousands separators, consistent decimals | Low | Implied only | **Must be enforced explicitly: KPI cards, chart axes, tooltips, AI prompt values** |
| Chart tooltips with formatted values | Charts without hover tooltips feel unfinished to financial users | Low | ✓ Margin Bridge only | Ensure ALL charts — not just Margin Bridge — have formatted tooltips |
| Responsive widescreen layout | Dashboard must fill a presenter monitor without awkward whitespace | Low–Med | ✓ Included | Wide aspect ratio is critical — webinar is projected at 1080p/4K |
| Light/dark theme | Expected in modern web apps. Dark mode on a projector is a distinct scenario | Low | ✓ Included | Both themes must be complete — no half-implemented dark mode with broken chart colors |

---

## Differentiators

Features FP&A professionals do not expect but create genuine "I want this" moments.

| Feature | Value Proposition | Complexity | Status in Plan | Notes |
|---------|-------------------|------------|----------------|-------|
| Interactive scenario panel (7 sliders + 4 toggles) | Live "what if" modeling in front of an audience. No static reporting tool does this. Adjusting Revenue Growth and watching KPIs update in real time demonstrates a paradigm shift from Excel. | High | ✓ Included | **The single biggest differentiator.** The 7 sliders (Revenue Growth, Gross Margin, Fuel Index, Collections Rate, Returns, Late Invoice Hours, Journal Load) cover both P&L and operational levers |
| Scenario presets with named business contexts | Presets let a presenter jump to pre-configured scenarios instantly. A demo superpower — no fumbling with sliders. | Low–Med | ✓ Included | Preset names matter: "Conservative Close" or "Q4 Push for Target" > "Scenario A". Ensure 4-6 named presets with realistic FP&A framing |
| AI-generated executive narrative | Generative narrative that updates based on current scenario state. No legacy close tool has this. Directly answers: "How does AI help FP&A?" | High | ✓ Included (OpenAI) | The wow moment: watching narrative update live after the presenter changes a slider and hits "Regenerate" |
| Margin Bridge chart (scenario-reactive) | Waterfall/bridge is a standard FP&A communication tool. Few digital dashboards render it interactively with scenario-driven data. | Medium | ✓ Included | A static bridge is close to table stakes; a live-updating bridge is a genuine differentiator |
| 13-Week Cash Flow view | Rolling 13-week cash forecast is a CFO-level tool. Including it alongside close data signals this dashboard integrates planning + reporting. | Medium | ✓ Included | Clearly distinguish actuals (solid line) from forecast (dashed/lighter) weeks |
| Pipeline to Invoiced funnel chart | Bridges CRM data to invoiced revenue — the sales-to-finance handoff. Unusual in a close dashboard. | Medium | ✓ Included | Visual must make "conversion loss" obvious — where deals fall out between stages |
| Animated number counters on KPI cards | On scenario change, counters animate to new value. Signals data is live and reactive, not a screenshot. | Low | ✓ Included (React Bits) | Keep under 600ms. Trigger on scenario change, not just page load |
| Close stage progress computed from JE data | Progress bars driven by actual journal entry counts — not hardcoded percentages — grounds the demo in GL mechanics | Medium | ✓ Included | Surface the computation: "X of Y expected JEs posted = Z% complete" — FP&A professionals appreciate this |

---

## Anti-Features

Features to deliberately NOT build for this webinar context.

| Anti-Feature | Why Avoid |
|--------------|-----------|
| Authentication / login | Zero demo value. Breaks "open in browser and go" webinar setup. Plan correctly excludes auth. |
| Multi-company / multi-tenant switching | Adds complexity, zero webinar value. One company dataset tells a cleaner story. |
| Real ERP integration (SAP, Oracle, NetSuite) | Months of work, irrelevant to demo goals. Audience understands it's sample data. |
| User settings / preferences persistence | No users means no persistence needed. |
| Transaction-level drill-down grids | Time-consuming to build, adds nothing for a 45-minute webinar. Use tooltip-level detail instead. |
| Export to PDF / Excel | Plumbing, not storytelling. Invisible during a live demo. |
| Alert / notification system | Close management alerts (email, Slack) require infrastructure irrelevant to local/Vercel demo. |
| Audit trail / change log | No value without multi-user context. |
| Collaborative chart annotation | Requires backend + multi-user context. The AI narrative serves this function. |
| Role-based permissions | No value without authentication. |
| Mobile-optimized layout (sub-1024px) | Webinar is never viewed on a phone. Responsive to tablet (1024px) is sufficient. |
| Comprehensive unit/integration tests | Demo-context deadline. Zero console errors is the real quality gate. Manual preset testing suffices. |

---

## Feature Dependencies

```
dataLoader.ts (existing) ──► page.tsx (Server Component)
                          └──► DashboardApp.tsx (Client, Redux Provider)

page.tsx + dataLoader.ts ──► KPI cards (display only, no interactivity)
                          ├──► Close stage progress tracker (computed from JE data)
                          ├──► AR Aging panel (static chart)
                          ├──► 13-Week Cash Flow (static chart)
                          ├──► Pipeline to Invoiced (static chart)
                          └──► Margin Bridge (static chart, base data)

Redux store (scenario state) ──► Scenario control panel (sliders + toggles write state)
                             ├──► All KPI cards (reactive to scenario values)
                             ├──► Margin Bridge (reactive — bars update with scenario)
                             └──► AI Executive Summary (reads scenario state before POST)

OpenAI route (/api/enhance-summary) ──► AI Executive Summary UI panel
    NOTE: Redux state is client-only. Pass scenario state in POST body — never read Redux on server.

All data files (CSV/JSON) ──► dataLoader.ts ──► everything downstream
```

**Critical path:** Data files → `dataLoader.ts` validation → all downstream features. A broken data layer breaks everything simultaneously.

**Second critical dependency:** Redux store must be complete and confirmed before scenario panel, KPI reactivity, or AI summary are built.

---

## Missing Features the Plan Overlooked

### 1. Per-KPI Variance Indicator (HIGH PRIORITY — significant credibility gap)

**What:** Each KPI card shows: primary value + secondary delta vs prior month. Example: `Net Sales $12.4M  ▲ +3.2% vs Jan 2025`

**Why it matters:** A bare "$12.4M" without a comparator is incomplete in financial reporting. Every competitor tool shows deltas by default. An FP&A audience will notice immediately.

**Complexity:** Low. The plan has `variancePct` at company level. Adding `prior` values per KPI to `company.json` (or deriving from a second GL CSV row) is a small data change. UI is a small tag beneath the primary value.

**Recommendation:** Add to Phase 1 scope. Highest-impact missing feature relative to effort.

---

### 2. Scenario Change Highlight / "What Just Changed" Signal (MEDIUM PRIORITY)

**What:** When the presenter moves a slider, affected KPI cards briefly flash or show a subtle amber glow before settling.

**Why it matters:** In a live webinar, the audience cannot track 8 KPI cards while watching the presenter move a slider. A visual "here's what just changed" signal is critical for live storytelling.

**Complexity:** Low–Medium. Triggered by detecting a Redux state diff between renders. Amber glow aligns with Crowe brand accent.

**Recommendation:** Add alongside animated counter work — they share the same trigger (KPI value changed).

---

### 3. "Why At Risk" Contextual Note on Close Stage Tracker (LOW–MEDIUM PRIORITY)

**What:** When a stage is "at risk," show a small explanation: "AP close: 12 of 15 expected JEs posted — 3 missing approvals"

**Why it matters:** FP&A professionals want to know not just that something is at risk but why. Even a synthetic reason derived from JE counts makes the demo feel intelligent rather than just colored badges.

**Complexity:** Medium. Template-driven from JE data. The data already exists in the plan.

**Recommendation:** Implement for "at risk" stages only. Omit for "on track" stages.

---

### 4. Company Name from `company.json` in Header (LOW PRIORITY — credibility detail)

**What:** Header displays demo company name from `company.json`, not hardcoded.

**Why it matters:** When the header says "Acme Manufacturing Co — January 2026 Close," an attendee imagines their own company name there. Generic headers break that identification moment.

**Complexity:** Trivial.

**Recommendation:** Confirm and document in build. 5 minutes of effort, disproportionate credibility payoff.

---

## MVP Recommendation

**Must ship (zero compromise):**
1. KPI metric cards with correct data, formatted numbers, and per-KPI variance indicators
2. Close stage progress tracker with status indicators (on track / at risk / delayed) + "why at risk" notes
3. Scenario control panel fully wired to Redux (sliders + toggles updating KPIs live)
4. Margin Bridge chart, reactive to scenario state — the visual centerpiece
5. Light/dark theme working on all components; header with derived period label and company name

**Ship if time permits:**
6. AR Aging panel (static chart, bounded scope)
7. Scenario presets with named business contexts
8. Pipeline to Invoiced chart (static chart, bounded scope)
9. AI Executive Summary (dependent on OpenAI key and prompt tuning)

**Defer without regret:**
10. 13-Week Cash Flow — self-contained, can show as screenshot if schedule is tight
11. Animated number counters — polish layer, add last after all features are stable
