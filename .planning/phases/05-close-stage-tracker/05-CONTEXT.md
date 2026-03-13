# Phase 5: Close Stage Tracker - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Display 6 close stages with progress bars computed from actual JE data counts (replacing hardcoded values in `dataLoader.ts`), RAG status badges with Iconsax icons, contextual notes for at-risk/delayed stages, and a days-to-close metric card. Replace `<div id="slot-close-tracker" />` in `DashboardApp.tsx`.

The critical fix: `dataLoader.ts` lines 120–127 currently hardcode progress values (78, 70, 66, 59, 62, 47). Phase 5 replaces these with values computed from `erp_journal_entries.csv` `stage` + `status` counts.

Requirements covered: CLOS-01, CLOS-02, CLOS-03, CLOS-04

</domain>

<decisions>
## Implementation Decisions

### Layout — Stage Card Style

- **Vertical list — one full-width horizontal card per stage**
- Each card spans the full content width with: stage name + progress bar + RAG badge + contextual note (for At Risk / Delayed stages)
- 6 cards stacked vertically below the days-to-close metric card
- No grid — single column, easy to scan top-to-bottom on a widescreen webinar display

### RAG Thresholds

- **Finance-standard thresholds:**
  - ≥75% → **On Track** (green, `var(--color-success)` / `#05AB8C`)
  - 50–74% → **At Risk** (amber, `var(--accent)` / `#f5a800`)
  - <50% → **Delayed** (red, `var(--color-error)` / `#E5376B`)
- These thresholds map naturally to the JE data's story: AP close (78%) = On Track, Financial statement package (47%) = Delayed

### Days-to-Close Metric

- **Standalone mini KPI card** at the top of the tracker section, above all 6 stage cards
- Styled consistently with Phase 3 KPI cards: floating shadow, warm background, no border
- Shows: calendar Iconsax icon + `closeTargetBusinessDays` value from `company.json` + label ("Days to Close Target")
- Non-interactive — display only

### Contextual Notes for At-Risk/Delayed Stages (CLOS-03)

- **Claude's discretion** — data-driven from JE counts, credible for FP&A professionals
- Must derive from `erp_journal_entries.csv` `stage` and `status` fields — not hardcoded strings
- Notes appear only on stages with At Risk or Delayed status
- On Track stages show no note (clean, uncluttered appearance)

### Progress Computation (Critical — replaces hardcoding)

- Phase 5 must update `dataLoader.ts` to compute `closeStages` progress from JE data:
  - For each stage name, count rows in `erp_journal_entries.csv` where `stage === stageName`
  - Progress = `posted count / total count` for that stage × 100
  - `CloseStage` type must be extended to include computed counts (posted, pending, total) so UI can render contextual notes
- The `DashboardSeedData` type and `closeStages` array shape will change: add `posted`, `pendingApproval`, `total` fields alongside `progress`

### Claude's Discretion

- Exact Iconsax icon per RAG status (e.g., TickCircle for On Track, InfoCircle for At Risk, CloseCircle for Delayed)
- Progress bar visual style (height, border-radius, track color, fill color matching RAG)
- Exact note phrasing (e.g., "X of Y JEs posted · Z pending approval")
- Section header text and spacing
- Whether the days-to-close card shows a secondary label (e.g., "Target: Jan 31, 2026" derived from current date logic, or just the day count)

</decisions>

<specifics>
## Specific Ideas

- The tracker section should feel like a "control room status board" — each stage card is a row you can scan quickly. Color tells the story: mostly green means close is on track, amber/red draws the presenter's eye immediately.
- The Financial statement package stage at ~47% (Delayed) and Inventory valuation at ~59% (At Risk) should look obviously different from AP close at ~78% (On Track) — the RAG color contrast is the key visual moment.
- Contextual notes should sound like something a CFO would actually say: factual, data-derived, specific. Not generic messages like "Review required."

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/lib/dataLoader.ts` — `closeStages` array at lines 120–127 has hardcoded progress values; `closeTargetBusinessDays` at line 60 is already loaded from `company.json`. Both are part of `DashboardSeedData` passed to `DashboardApp`.
- `src/data/erp_journal_entries.csv` — 98 rows with columns: `je_id`, `period`, `account`, `description`, `amount`, `stage`, `status`. Status values: `posted`, `pending_approval`, `draft`. Six stage names match the 6 close stages.
- `src/components/ui/icons.tsx` — Iconsax wrapper; add new RAG icons here
- `src/lib/formatters.ts` — available for any formatted values in stage cards
- `src/components/dashboard/KpiCard.tsx` — reference for floating card style (no border, indigo-tinted shadow, `var(--card)` background)
- `src/features/model/types.ts` — `CloseStage` type will need new fields (`posted`, `pendingApproval`, `total`)

### Established Patterns

- **Card style**: No border, `box-shadow` with `rgba(1,30,65,...)` indigo-tinted layers, `var(--card)` background — match KpiCard exactly
- **CSS variables**: All colors via CSS variables — `var(--color-success)`, `var(--accent)`, `var(--color-error)`, `var(--foreground)`, `var(--muted-foreground)`
- **`"use client"` boundary**: `DashboardApp.tsx` is the client boundary; `CloseTracker` renders inside it — no additional directive needed
- **Data flow**: `page.tsx` (server) → `DashboardApp.tsx` (client) → child components receive `seedData` props
- **Iconsax pattern**: Import from `src/components/ui/icons.tsx`, not directly from `iconsax-react`

### Integration Points

- `DashboardApp.tsx` line 72: `<div id="slot-close-tracker" />` → replace with `<CloseTracker seedData={seedData} />`
- `src/lib/dataLoader.ts` lines 120–127: replace hardcoded `closeStages` array with computed values from `erp_journal_entries.csv` data
- `src/features/model/types.ts`: extend `CloseStage` type to include `posted: number`, `pendingApproval: number`, `total: number` fields
- `DashboardSeedData` type: `closeStages` array element shape changes — all consumers must handle new fields

</code_context>

<deferred>
## Deferred Ideas

- Click-through to individual JE rows per stage (v2, DATA-01) — out of scope
- Animated progress bar fill on load — could be added but not required for webinar
- Stage-level "expected completion date" derived from JE velocity — future enhancement

</deferred>

---

*Phase: 05-close-stage-tracker*
*Context gathered: 2026-03-04*
