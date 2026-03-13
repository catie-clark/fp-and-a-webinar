# Phase 4: Scenario Control Panel - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Render all 11 interactive controls (7 sliders + 4 toggles) in a fixed left sidebar using 21st.dev components. Each control dispatches to the existing Redux `scenarioSlice` — KPI cards already react to state changes (Phase 3). Add a preset dropdown and Reset button at the top of the sidebar. Phase 4 is pure UI wiring — no new selectors or computation logic needed.

**Out of scope:** Close Tracker (Phase 5), charts (Phases 6–7), AI summary (Phase 8), any new Redux selectors.

Requirements covered: SCEN-01, SCEN-02, SCEN-03, SCEN-04

</domain>

<decisions>
## Implementation Decisions

### Panel Placement

- **Fixed left sidebar** — approximately 280px wide, always visible
- Dashboard content (KPIs, Close Tracker, Charts, AI Summary) flows to the right of the sidebar
- `DashboardApp.tsx` outer `<div>` becomes a two-column CSS Grid or flex layout: sidebar left, main content right
- Replace `<div id="slot-scenario-panel" />` by restructuring DashboardApp layout — sidebar is a sibling column to the main content area, not a stacked section
- Always visible — no collapse/drawer behavior

### Control Grouping & Hierarchy

- **Labeled groups** with clear section headers:
  - **Revenue Levers**: Revenue Growth (`revenueGrowthPct`), Gross Margin (`grossMarginPct`)
  - **Cost Levers**: Fuel Index (`fuelIndex`), Returns (`returnsPct`)
  - **Operations**: Collections Rate (`collectionsRatePct`), Late Invoice Hours (`lateInvoiceHours`), Journal Load (`journalLoadMultiplier`)
  - **Business Modes**: Prioritize Cash Mode, Conservative Forecast Bias, Tighten Credit Holds, Inventory Complexity (all 4 toggles as a group)
- Group headers use a small uppercase label style (e.g., `text-xs font-semibold uppercase tracking-wide opacity-60`)
- Sliders and toggles are NOT mixed — toggles are a distinct final group

### Live Update Behavior

- **Real-time dispatch on every drag event** — `onChange` fires `dispatch(setControl({ field, value }))` on every slider position change
- No debounce — Redux selectors are memoized via `createSelector` so unnecessary re-renders are suppressed naturally
- KPI amber glow fires on every value change, audience sees numbers updating continuously as the slider moves
- This is the primary webinar "wow" moment — do NOT add debounce or throttle

### Preset Selector

- **Compact header at the very top of the sidebar**, above all control groups
- Layout: `[Preset dropdown ▼]  [Reset]` on the same row
- Selecting a preset immediately dispatches `loadPreset(preset.controls)` — all 11 controls jump to new values at once
- Reset button dispatches `resetToDefaults(baselineControls)` — restores the `baseline` preset values
- No scenario description text shown — just the preset name in the dropdown
- Use 21st.dev dropdown/select component; if RSC/SSR incompatible, fallback to a styled native `<select>` with CSS variables applied

### Slider Value Display

- **Live value label next to the slider thumb** — formatted value updates in real-time as the user drags
- Format per slider:
  - `revenueGrowthPct`: `+3.0%` (sign-prefixed percentage)
  - `grossMarginPct`: `25.0%`
  - `fuelIndex`: `118` (integer, no unit)
  - `collectionsRatePct`: `97.0%`
  - `returnsPct`: `1.2%`
  - `lateInvoiceHours`: `4 hrs`
  - `journalLoadMultiplier`: `1.00×`
- Value label positioned to the right of the slider track or below the label text

### Claude's Discretion

- Exact 21st.dev component selection (slider, toggle, dropdown) — inspect each for SSR compatibility before use; fallback to styled native HTML if incompatible
- Sidebar scrolling behavior if content overflows viewport height
- Exact padding, gap, and spacing within the sidebar
- Toggle switch visual style (pill shape, size, animation speed)
- Hover and focus states on sliders and toggles
- Whether to show slider min/max range labels beneath the track

</decisions>

<specifics>
## Specific Ideas

- The sidebar should feel like a lightweight "control deck" — not a form, not a settings page. Warm card surface (`var(--card)`) on the cream background, no harsh borders, same floating shadow style as KPI cards.
- The "Fuel Cost Shock" preset (fuelIndex: 137, grossMarginPct: 0.22) is the signature demo moment — presenter selects it from the dropdown and the audience watches EBITDA crater in real time. The preset selector must make this transition feel instant and dramatic.
- Slider thumbs should use the gold accent color (`var(--accent)` = `#f5a800`) — consistent with the amber glow and the brand.
- Business Modes toggles are the "on/off switches" of the demo — they should look visually distinct from sliders. Bold label, prominent toggle switch, no value label needed.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/store/scenarioSlice.ts` — `setControl`, `loadPreset`, `resetToDefaults`, `initializeFromSeedData` actions all exist and are ready to dispatch
- `src/features/model/types.ts` — `ControlState` interface defines all 11 fields with correct types (number for sliders, boolean for toggles)
- `src/data/scenario-presets.json` — 5 presets: "Jan 2026 Baseline", "Conservative Close", "Q4 Push for Target", "Fuel Cost Shock", + 1 more; `label` field is the display name
- `src/lib/formatters.ts` — `formatPercent()` available for slider value labels
- `src/components/ui/icons.tsx` — Iconsax wrapper; add any sidebar icons here

### Established Patterns

- **CSS variables**: All colors via `var(--accent)`, `var(--background)`, `var(--card)`, `var(--foreground)` — no hardcoded colors
- **`"use client"` boundary**: `DashboardApp.tsx` is the single boundary; `ScenarioPanel` renders inside it and can use `useSelector`, `useDispatch` without its own directive
- **Redux pattern**: `useDispatch()` from `react-redux` inside any component under `<Provider>` — dispatch directly, no thunks needed
- **Tailwind v4**: `@import "tailwindcss"` — standard utility classes work; no config file

### Integration Points

- `DashboardApp.tsx` needs layout restructure: current single-column `<div style={{ minHeight: '100vh', padding: '1.5rem' }}>` becomes a two-column layout — `ScenarioPanel` (left sidebar) + main content area (right)
- `<div id="slot-scenario-panel" />` is removed; `ScenarioPanel` becomes the left column of the new layout
- `seedData.presets` (array of `ScenarioPreset`) is passed to `ScenarioPanel` for the dropdown
- Slider ranges come from REQUIREMENTS.md SCEN-01: Revenue Growth (−4% to +8%), Gross Margin (18%–28%), Fuel Index (80–140), Collections Rate (94%–100%), Returns (0.6%–2.5%), Late Invoice Hours (0–14), Journal Load (0.8×–1.3×)

</code_context>

<deferred>
## Deferred Ideas

- Collapsible/drawer sidebar — out of scope for webinar; always-visible sidebar is sufficient
- Slider debouncing — explicitly rejected; real-time dispatch is the webinar wow factor
- Scenario description text in preset dropdown — adds complexity; preset label name is sufficient
- Side-by-side scenario comparison (INTV-01) — v2 backlog

</deferred>

---

*Phase: 04-scenario-control-panel*
*Context gathered: 2026-03-04*
