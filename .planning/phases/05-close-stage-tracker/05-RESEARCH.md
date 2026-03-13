# Phase 5: Close Stage Tracker - Research

**Researched:** 2026-03-04
**Domain:** React component architecture, CSV data computation, RAG status UI, Iconsax icons
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Layout — Stage Card Style**
- Vertical list — one full-width horizontal card per stage
- Each card spans the full content width with: stage name + progress bar + RAG badge + contextual note (for At Risk / Delayed stages)
- 6 cards stacked vertically below the days-to-close metric card
- No grid — single column, easy to scan top-to-bottom on a widescreen webinar display

**RAG Thresholds**
- Finance-standard thresholds:
  - >=75% → On Track (green, `var(--color-success)` / `#05AB8C`)
  - 50-74% → At Risk (amber, `var(--accent)` / `#f5a800`)
  - <50% → Delayed (red, `var(--color-error)` / `#E5376B`)
- These thresholds map naturally to the JE data's story: AP close (78%) = On Track, Financial statement package (47%) = Delayed

**Days-to-Close Metric**
- Standalone mini KPI card at the top of the tracker section, above all 6 stage cards
- Styled consistently with Phase 3 KPI cards: floating shadow, warm background, no border
- Shows: calendar Iconsax icon + `closeTargetBusinessDays` value from `company.json` + label ("Days to Close Target")
- Non-interactive — display only

**Contextual Notes for At-Risk/Delayed Stages (CLOS-03)**
- Claude's discretion — data-driven from JE counts, credible for FP&A professionals
- Must derive from `erp_journal_entries.csv` `stage` and `status` fields — not hardcoded strings
- Notes appear only on stages with At Risk or Delayed status
- On Track stages show no note (clean, uncluttered appearance)

**Progress Computation (Critical — replaces hardcoding)**
- Phase 5 must update `dataLoader.ts` to compute `closeStages` progress from JE data:
  - For each stage name, count rows in `erp_journal_entries.csv` where `stage === stageName`
  - Progress = `posted count / total count` for that stage × 100
  - `CloseStage` type must be extended to include computed counts (posted, pendingApproval, total) so UI can render contextual notes
- The `DashboardSeedData` type and `closeStages` array shape will change: add `posted`, `pendingApproval`, `total` fields alongside `progress`

### Claude's Discretion

- Exact Iconsax icon per RAG status (e.g., TickCircle for On Track, InfoCircle for At Risk, CloseCircle for Delayed)
- Progress bar visual style (height, border-radius, track color, fill color matching RAG)
- Exact note phrasing (e.g., "X of Y JEs posted · Z pending approval")
- Section header text and spacing
- Whether the days-to-close card shows a secondary label (e.g., "Target: Jan 31, 2026" derived from current date logic, or just the day count)

### Deferred Ideas (OUT OF SCOPE)

- Click-through to individual JE rows per stage (v2, DATA-01)
- Animated progress bar fill on load
- Stage-level "expected completion date" derived from JE velocity
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLOS-01 | User can see month-end close progress — 6 close stages display progress bars computed from actual journal entry data counts | JE CSV analysis confirms (posted+approved)/total formula produces 78/70/67/59/62/47%. dataLoader.ts change is precise and surgical. |
| CLOS-02 | User can see close health at a glance — each stage shows a RAG status badge (On Track / At Risk / Delayed) with Iconsax icon, color-coded and visually prominent | RAG thresholds locked. TickCircle/Warning2/CloseCircle icons already exported from icons.tsx. CSS variable color tokens confirmed available. |
| CLOS-03 | User can understand why a stage is at risk — at-risk stages display a contextual note derived from JE data | Note formula: "X of Y JEs complete · Z pending approval". Requires `pendingApproval` count in `CloseStage` type. |
| CLOS-04 | User can see time pressure in the close — a "days to close target" metric is displayed, computed from `company.closeTargetBusinessDays` | closeTargetBusinessDays=5 already loaded in dataLoader.ts line 60. Calendar icon already in icons.tsx. KpiCard pattern established. |
</phase_requirements>

---

## Summary

Phase 5 replaces a stub `<div id="slot-close-tracker" />` in `DashboardApp.tsx` with a fully functional `CloseTracker` component. The phase has two distinct workstreams: a **data layer change** (updating `dataLoader.ts` to compute progress from JE CSV counts instead of hardcoded values, and extending the `CloseStage` type with `posted`, `pendingApproval`, and `total` fields) and a **UI layer build** (the `CloseTracker` component itself, plus a `StageCard` sub-component and a `DaysToCloseCard`).

The JE CSV analysis reveals that "progress" is defined as `(posted + approved) / total × 100`, not just `posted / total`. This matches the hardcoded targets in STATE.md ("78/70/67/59/62/47%"). The six stage names in the CSV match the six display names exactly, with one critical exception: the CSV uses `"Accruals & JEs"` but the hardcoded array used `"Accruals and manual JEs"`. The stage name mapping must be verified and consistent across type, dataLoader, and component.

The RAG logic, icon choices, card styling, and data flow pattern are all derivable from existing codebase conventions. No new libraries are needed — Iconsax icons (`TickCircle`, `Warning2`, `CloseCircle`, `Calendar`) are already exported from `icons.tsx`. The component renders inside the existing `DashboardApp` client boundary so no new `"use client"` directive is needed.

**Primary recommendation:** Implement in two waves — Wave 1: extend `CloseStage` type + update `dataLoader.ts` computation + add dataLoader tests. Wave 2: build `CloseTracker` + `StageCard` + `DaysToCloseCard` components + wire into `DashboardApp.tsx`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (TSX) | 18.x (via Next.js 14+) | Component rendering | Project standard |
| iconsax-react | installed | RAG status icons + calendar icon | Already in project; already wrapped in icons.tsx |
| CSS Variables | — | Color tokens for RAG states | Project convention — all colors via `var(--*)` |
| TypeScript | — | Type safety for CloseStage | Consistent with all project types |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 3.24.x | Schema validation for parsed CSV | Already used in dataLoader.ts for all other data |
| Node.js fs/path | built-in | CSV reading in dataLoader.ts | Already the pattern in loadDashboardSeedData |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline style (current project pattern) | Tailwind classes | Inline style is the established pattern in KpiCard, DashboardApp — stay consistent |
| Manual progress bar div | shadcn Progress | The div approach matches project weight (no unnecessary shadcn dep for a simple element) |

**Installation:** No new packages required. All dependencies already installed.

---

## Architecture Patterns

### Recommended File Structure
```
src/
├── features/model/
│   └── types.ts                    # EXTEND: add CloseStage interface with posted/pendingApproval/total
├── lib/
│   └── dataLoader.ts               # MODIFY: replace hardcoded closeStages with JE-computed values
├── components/dashboard/
│   ├── CloseTracker/
│   │   ├── CloseTracker.tsx        # NEW: section container + DaysToCloseCard + 6x StageCard
│   │   ├── StageCard.tsx           # NEW: single horizontal stage row card
│   │   └── DaysToCloseCard.tsx     # NEW: mini KPI card for days-to-close metric
├── features/model/__tests__/
│   └── closeStages.test.ts         # NEW: Wave 0 RED tests for dataLoader closeStages shape
```

### Pattern 1: CloseStage Type Extension

**What:** Add `posted`, `pendingApproval`, `total` fields to the `CloseStage` shape in `DashboardSeedData`.
**When to use:** Required so `StageCard` can render the contextual note without re-computing from raw JE rows.

```typescript
// src/features/model/types.ts — add this interface
export interface CloseStage {
  name: string;
  progress: number;      // 0-100, computed as Math.round((posted + approved) / total * 100)
  posted: number;        // count of rows where status === 'posted' OR status === 'approved'
  pendingApproval: number; // count of rows where status === 'pending-approval'
  total: number;         // total JE row count for this stage
}
```

**Note on naming:** "posted" in this type represents the fully-processed count (status `posted` + status `approved`). This matches the user's intent: "X of Y JEs complete" where X = posted+approved.

### Pattern 2: dataLoader Computation

**What:** Replace lines 120–127 of `dataLoader.ts` with a derived computation over the already-loaded `journalEntries` array.
**When to use:** Always — hardcoded values must go.

```typescript
// Compute closeStages from journalEntries (already loaded above)
const STAGE_NAMES = [
  'AP close',
  'AR close',
  'Revenue recognition',
  'Inventory valuation',
  'Accruals & JEs',
  'Financial statement package',
] as const;

const closeStages: CloseStage[] = STAGE_NAMES.map(name => {
  const rows = journalEntries.filter(je => je.stage === name);
  const total = rows.length;
  const posted = rows.filter(je => je.status === 'posted' || je.status === 'approved').length;
  const pendingApproval = rows.filter(je => je.status === 'pending-approval').length;
  const progress = total > 0 ? Math.round((posted / total) * 100) : 0;
  return { name, progress, posted, pendingApproval, total };
});
```

**CRITICAL:** The `STAGE_NAMES` array must exactly match the `stage` column values in `erp_journal_entries.csv`. From CSV inspection: `'AP close'`, `'AR close'`, `'Revenue recognition'`, `'Inventory valuation'`, `'Accruals & JEs'`, `'Financial statement package'`. Note `'Revenue recognition'` (not "checks") and `'Accruals & JEs'` (not "Accruals and manual JEs").

### Pattern 3: DashboardSeedData Type Update

**What:** Change the `closeStages` field type from inline `{ name: string; progress: number }[]` to `CloseStage[]`.

```typescript
// src/lib/dataLoader.ts — update the DashboardSeedData type
import type { CloseStage } from '@/features/model/types';

export type DashboardSeedData = {
  // ...existing fields...
  closeStages: CloseStage[];   // was: { name: string; progress: number }[]
  // ...
};
```

### Pattern 4: RAG Classification Function

**What:** Pure function converting progress number to RAG status. Define in the component file or a small utility.

```typescript
type RagStatus = 'on-track' | 'at-risk' | 'delayed';

function getRagStatus(progress: number): RagStatus {
  if (progress >= 75) return 'on-track';
  if (progress >= 50) return 'at-risk';
  return 'delayed';
}

const RAG_CONFIG = {
  'on-track': {
    label: 'On Track',
    color: 'var(--color-success)',    // #05AB8C teal
    Icon: TickCircle,
  },
  'at-risk': {
    label: 'At Risk',
    color: 'var(--accent)',           // #F5A800 amber
    Icon: Warning2,
  },
  'delayed': {
    label: 'Delayed',
    color: 'var(--color-error)',      // #E5376B coral
    Icon: CloseCircle,
  },
} as const;
```

### Pattern 5: Contextual Note Formula

**What:** Derive a CFO-quality note string from `posted`, `pendingApproval`, `total` counts.
**When shown:** Only for `at-risk` and `delayed` stages. On Track = no note.

```typescript
function getContextualNote(stage: CloseStage): string | null {
  const rag = getRagStatus(stage.progress);
  if (rag === 'on-track') return null;
  const incomplete = stage.total - stage.posted;
  return `${stage.posted} of ${stage.total} JEs complete · ${stage.pendingApproval} pending approval`;
}
```

**Example outputs from actual data:**
- AP close: 14/18 complete → `"14 of 18 JEs complete · 3 pending approval"` (At Risk at 78%... wait, 78% ≥ 75 = On Track → no note shown)
- Inventory valuation: 10/17 complete → `"10 of 17 JEs complete · 4 pending approval"` (At Risk)
- Accruals & JEs: 8/13 complete → `"8 of 13 JEs complete · 3 pending approval"` (At Risk)
- Financial statement package: 7/15 complete → `"7 of 15 JEs complete · 5 pending approval"` (Delayed)
- AR close: 14/20 complete → `"14 of 20 JEs complete · 3 pending approval"` (At Risk at 70%)
- Revenue recognition: 10/15 complete → `"10 of 15 JEs complete · 3 pending approval"` (At Risk at 67%)

### Pattern 6: StageCard Component

**What:** Single horizontal card rendering one close stage row.

```tsx
// StageCard.tsx — no "use client" needed (inside DashboardApp boundary)
interface StageCardProps {
  stage: CloseStage;
}

export function StageCard({ stage }: StageCardProps) {
  const rag = getRagStatus(stage.progress);
  const config = RAG_CONFIG[rag];
  const note = getContextualNote(stage);

  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: '10px',
      padding: '1rem 1.25rem',
      boxShadow: '0 1px 3px rgba(1,30,65,0.04), 0 6px 16px rgba(1,30,65,0.04), 0 12px 32px rgba(1,30,65,0.02)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      {/* Row 1: stage name + RAG badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--foreground)' }}>
          {stage.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: config.color }}>
          <config.Icon color={config.color} variant="Bold" size={16} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{config.label}</span>
        </div>
      </div>
      {/* Row 2: progress bar */}
      <div style={{ position: 'relative', height: '8px', borderRadius: '4px', background: 'var(--muted-background, rgba(1,30,65,0.06))' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          width: `${stage.progress}%`,
          borderRadius: '4px',
          background: config.color,
        }} />
      </div>
      {/* Row 3: progress % + contextual note */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>
          {stage.progress}% complete
        </span>
        {note && (
          <span style={{ fontSize: '0.75rem', color: config.color, fontWeight: 500 }}>
            {note}
          </span>
        )}
      </div>
    </div>
  );
}
```

### Pattern 7: DaysToCloseCard Component

**What:** Mini KPI card consistent with Phase 3 KpiCard style, showing `closeTargetBusinessDays`.

```tsx
// DaysToCloseCard.tsx
import { Calendar } from '@/components/ui/icons';

interface DaysToCloseCardProps {
  days: number;
}

export function DaysToCloseCard({ days }: DaysToCloseCardProps) {
  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: '12px',
      padding: '1.25rem 1.5rem',
      boxShadow: '0 1px 3px rgba(1,30,65,0.04), 0 6px 16px rgba(1,30,65,0.04), 0 12px 32px rgba(1,30,65,0.02)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    }}>
      <Calendar color="var(--accent)" variant="Bold" size={28} />
      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.1 }}>
          {days}
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Days to Close Target
        </div>
      </div>
    </div>
  );
}
```

### Pattern 8: CloseTracker Container

**What:** Section container that renders `DaysToCloseCard` + 6x `StageCard`. Replaces `<div id="slot-close-tracker" />` in `DashboardApp.tsx`.

```tsx
// CloseTracker.tsx
import type { DashboardSeedData } from '@/lib/dataLoader';
import { DaysToCloseCard } from './DaysToCloseCard';
import { StageCard } from './StageCard';

interface CloseTrackerProps {
  seedData: DashboardSeedData;
}

export function CloseTracker({ seedData }: CloseTrackerProps) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{
        fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)',
        marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        Month-End Close Tracker
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <DaysToCloseCard days={seedData.company.closeTargetBusinessDays} />
        {seedData.closeStages.map(stage => (
          <StageCard key={stage.name} stage={stage} />
        ))}
      </div>
    </section>
  );
}
```

### Pattern 9: DashboardApp.tsx Wire-In

**What:** Replace `<div id="slot-close-tracker" />` with the `CloseTracker` component.

```tsx
// DashboardApp.tsx — add import and replace div
import { CloseTracker } from '@/components/dashboard/CloseTracker/CloseTracker';

// In JSX, replace:
// <div id="slot-close-tracker" />
// with:
{seedData && <CloseTracker seedData={seedData} />}
```

### Anti-Patterns to Avoid

- **Importing Iconsax directly in CloseTracker/StageCard:** Always import from `@/components/ui/icons` — never from `iconsax-react` directly (SSR crash risk)
- **Hardcoding RAG colors as hex strings in components:** Use CSS variables (`var(--color-success)`, `var(--accent)`, `var(--color-error)`) so dark mode works
- **Hardcoding stage names in the component:** Stage names come from `seedData.closeStages[].name` — they originate from dataLoader computation over CSV data
- **Using `status === 'pending_approval'` (underscore):** The CSV uses `pending-approval` (hyphen) — use hyphen in all comparisons
- **Assuming "posted" = status strictly equals "posted":** Progress formula = (posted + approved) / total — confirmed by matching hardcoded targets

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progress bar | Custom SVG arc or canvas | Simple `<div>` with width% | A div width percentage is sufficient and matches the webinar display context |
| RAG icon rendering | Custom SVG icons | Iconsax via `icons.tsx` wrapper | Already installed, already wrapped for SSR safety |
| Color tokens | Inline hex values | CSS variables from globals.css | Dark mode compatibility; single source of truth |

**Key insight:** This phase is deliberately simple in its visual primitives. The complexity is in data correctness (getting progress computation right), not in novel UI patterns.

---

## Common Pitfalls

### Pitfall 1: Stage Name Mismatch
**What goes wrong:** Component renders 0% for all stages or misses some stages entirely.
**Why it happens:** The CSV stage names differ from what Phase 3 UI displayed in the hardcoded array. Specifically: `"Revenue recognition"` (not "Revenue recognition checks") and `"Accruals & JEs"` (not "Accruals and manual JEs"). If `STAGE_NAMES` in dataLoader uses the wrong strings, `filter()` returns empty arrays, progress = 0.
**How to avoid:** Read the exact stage values from the CSV (`erp_journal_entries.csv` column 6). The STAGE_NAMES constant must match character-for-character.
**Warning signs:** `progress: 0` and `total: 0` for any stage in the computed array.

### Pitfall 2: Wrong Progress Formula
**What goes wrong:** Progress values don't match the expected targets (78/70/67/59/62/47).
**Why it happens:** Using only `status === 'posted'` instead of `status === 'posted' || status === 'approved'`. The "posted" field in the CloseStage type represents fully-processed JEs (both posted and approved).
**How to avoid:** Formula is `(posted_count + approved_count) / total_count`. Verified against actual CSV row counts.
**Warning signs:** AP close shows 50% (9/18) instead of 78% (14/18).

### Pitfall 3: Direct Iconsax Import in New Components
**What goes wrong:** `window is not defined` error during SSR, app crashes on first load.
**Why it happens:** `iconsax-react` accesses browser globals at module load time. New developers may import directly.
**How to avoid:** Always `import { TickCircle, Warning2, CloseCircle, Calendar } from '@/components/ui/icons'`.
**Warning signs:** Runtime error mentioning `window` during Next.js server rendering.

### Pitfall 4: Hardcoded Color Values for RAG Status
**What goes wrong:** Dark mode switches but RAG badge colors stay stuck (wrong contrast in dark mode).
**Why it happens:** Using `color: '#05AB8C'` instead of `color: 'var(--color-success)'`.
**How to avoid:** All RAG colors must use CSS variables. Verify the variables exist in `globals.css` — `--color-success`, `--accent`, `--color-error` are confirmed present based on KpiCard.tsx and CONTEXT.md.
**Warning signs:** Colors look fine in light mode, broken in dark mode.

### Pitfall 5: CloseStage Type Consumers Breaking
**What goes wrong:** TypeScript errors in existing code that references `closeStages`.
**Why it happens:** Changing `closeStages` from `{ name: string; progress: number }[]` to `CloseStage[]` is a breaking type change for anything that previously destructured only those two fields.
**How to avoid:** Search for all usages of `seedData.closeStages` or `closeStages` before the change. In the current codebase, the only consumer is `DashboardApp.tsx` (which currently renders nothing from closeStages — it only passes `seedData` to `KpiSection`, which doesn't use `closeStages`). The type change is safe. Add the `CloseStage` interface to types.ts before updating dataLoader.ts.
**Warning signs:** `Property 'posted' does not exist on type` errors in tsc.

### Pitfall 6: `pending-approval` vs `pending_approval`
**What goes wrong:** `pendingApproval` count is always 0, contextual notes say "0 pending approval".
**Why it happens:** CSV uses hyphenated `pending-approval` but code checks `status === 'pending_approval'` (underscore).
**How to avoid:** Check `status === 'pending-approval'` with a hyphen. Verified from CSV inspection.

---

## Code Examples

### JE Data Structure (verified from erp_journal_entries.csv)

```
Columns: je_id, period, account, description, amount, stage, status
Status values: 'posted', 'approved', 'pending-approval', 'draft'
Stage values (exact):
  'AP close'                    (18 rows: 9 posted, 5 approved, 3 pending-approval, 1 draft)
  'AR close'                    (20 rows: 8 posted, 6 approved, 3 pending-approval, 3 draft)
  'Revenue recognition'         (15 rows: 6 posted, 4 approved, 3 pending-approval, 2 draft)
  'Inventory valuation'         (17 rows: 6 posted, 4 approved, 4 pending-approval, 3 draft)
  'Accruals & JEs'              (13 rows: 5 posted, 3 approved, 3 pending-approval, 2 draft)
  'Financial statement package' (15 rows: 4 posted, 3 approved, 5 pending-approval, 3 draft)
Total: 98 rows
```

### Expected Progress Values (verified)

```
AP close:                    (9+5)/18  = 14/18  = 77.8% → round to 78% → On Track  ✓
AR close:                    (8+6)/20  = 14/20  = 70.0% → round to 70% → At Risk   ✓
Revenue recognition:         (6+4)/15  = 10/15  = 66.7% → round to 67% → At Risk   ✓
Inventory valuation:         (6+4)/17  = 10/17  = 58.8% → round to 59% → At Risk   ✓
Accruals & JEs:              (5+3)/13  =  8/13  = 61.5% → round to 62% → At Risk   ✓
Financial statement package: (4+3)/15  =  7/15  = 46.7% → round to 47% → Delayed   ✓
```

### RAG Stage Distribution

```
On Track  (>=75%): AP close (78%)                                        — 1 stage, no note
At Risk   (50-74%): AR close (70%), Revenue recognition (67%),
                    Inventory valuation (59%), Accruals & JEs (62%)      — 4 stages, show note
Delayed   (<50%):  Financial statement package (47%)                     — 1 stage, show note
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `closeStages` array in dataLoader.ts | Computed from journalEntries filter/reduce | Phase 5 | Progress values are now live-derived from data, not magic numbers |
| `{ name: string; progress: number }[]` type | `CloseStage[]` with `posted`, `pendingApproval`, `total` | Phase 5 | UI can display data-driven contextual notes |

**Note on muted-foreground CSS variable:** `KpiCard.tsx` uses `'var(--muted)'` (not `var(--muted-foreground)`) for secondary text. Verify against the actual CSS variable name in globals.css before using in StageCard. If `var(--muted-foreground)` is not defined, fall back to `var(--muted)`.

---

## Open Questions

1. **Exact CSS variable name for muted text color**
   - What we know: KpiCard.tsx uses `var(--muted)` for label/secondary text
   - What's unclear: Whether `var(--muted-foreground)` is also defined (shadcn standard name)
   - Recommendation: Use `var(--muted-foreground)` first; if TypeScript/runtime errors appear, fall back to `var(--muted)`

2. **Progress bar track color**
   - What we know: No existing progress bar in codebase to reference
   - What's unclear: Whether `rgba(1,30,65,0.06)` is sufficient contrast or needs slightly more opacity
   - Recommendation: Use `rgba(1,30,65,0.08)` — slightly darker than card shadows for visible track

3. **DaysToCloseCard: static vs dynamic days computation**
   - What we know: User said "just the day count" from `closeTargetBusinessDays`
   - What's unclear: Whether displaying today's date context adds value (e.g., "5 business days · Target: Jan 31")
   - Recommendation: Display count only — matches the locked decision ("non-interactive, display only"). Keep it clean.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing, configured) |
| Config file | `vitest.config.ts` at project root |
| Quick run command | `node /path/to/vitest.mjs run src/features/model/__tests__/closeStages.test.ts` |
| Full suite command | `node /path/to/vitest.mjs run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLOS-01 | closeStages progress values match JE-computed targets | integration | `node .../vitest.mjs run --reporter=verbose src/features/model/__tests__/closeStages.test.ts` | ❌ Wave 0 |
| CLOS-01 | closeStages array has exactly 6 entries | integration | same | ❌ Wave 0 |
| CLOS-01 | CloseStage type has posted, pendingApproval, total fields | type check | `tsc --noEmit` | ❌ Wave 0 (type) |
| CLOS-02 | RAG status is 'on-track' for AP close (78%) | unit (pure fn) | `node .../vitest.mjs run --reporter=verbose src/features/model/__tests__/closeStages.test.ts` | ❌ Wave 0 |
| CLOS-02 | RAG status is 'at-risk' for AR close (70%) | unit | same | ❌ Wave 0 |
| CLOS-02 | RAG status is 'delayed' for FS package (47%) | unit | same | ❌ Wave 0 |
| CLOS-03 | getContextualNote returns null for On Track stage | unit | same | ❌ Wave 0 |
| CLOS-03 | getContextualNote returns note string for At Risk stage | unit | same | ❌ Wave 0 |
| CLOS-04 | closeTargetBusinessDays is 5 in seedData | integration | dataLoader.test.ts (existing) | ✅ exists |

### Sampling Rate
- **Per task commit:** `node .../vitest.mjs run src/features/model/__tests__/closeStages.test.ts`
- **Per wave merge:** `node .../vitest.mjs run` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/model/__tests__/closeStages.test.ts` — covers CLOS-01, CLOS-02, CLOS-03 progress computation and RAG logic
- [ ] `CloseStage` interface in `types.ts` — needed before tests can reference the type

*(Existing `dataLoader.test.ts` already covers CLOS-04 via `closeTargetBusinessDays` test)*

---

## Sources

### Primary (HIGH confidence)
- Direct CSV inspection of `erp_journal_entries.csv` (98 rows) — stage names, status values, row counts, progress formula verification
- Direct code inspection of `dataLoader.ts` — current `closeStages` shape, data flow, import patterns
- Direct code inspection of `types.ts` — `JournalEntryRow` schema, existing type patterns
- Direct code inspection of `icons.tsx` — confirmed `TickCircle`, `Warning2`, `CloseCircle`, `Calendar` are exported
- Direct code inspection of `KpiCard.tsx` — confirmed card style: `var(--card)` bg, indigo-tinted shadow layers, borderless
- Direct code inspection of `DashboardApp.tsx` — confirmed `<div id="slot-close-tracker" />` integration point at line 72

### Secondary (MEDIUM confidence)
- `STATE.md` decision log: "erp_journal_entries.csv uses 98 rows with explicit posted/approved counts per stage to hit exact progress targets (78/70/67/59/62/47%)" — confirms progress formula includes both posted and approved statuses

### Tertiary (LOW confidence)
- None — all critical findings are directly verified from source code and data files

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use
- Architecture: HIGH — patterns derived directly from existing codebase (KpiCard, dataLoader, DashboardApp)
- Data computation: HIGH — verified by counting CSV rows and cross-checking against STATE.md targets
- Pitfalls: HIGH — identified from direct inspection of existing code patterns and naming in CSV
- Component design: HIGH (structure) / MEDIUM (CSS variable names) — pending globals.css inspection for exact muted variable name

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable project — no external API changes expected)
