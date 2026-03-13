---
phase: 05-close-stage-tracker
plan: 01
subsystem: testing
tags: [vitest, tdd, typescript, types, close-stages, rag-status]

# Dependency graph
requires:
  - phase: 02-data-layer
    provides: erp_journal_entries.csv with posted/approved/pending-approval/draft status values and stage names
  - phase: 04-scenario-control-panel
    provides: Redux store shape and RootState type (no direct dependency but phase order)
provides:
  - CloseStage interface with name, progress, posted, pendingApproval, total fields exported from types.ts
  - closeStages.test.ts with 15 RED tests covering CLOS-01 progress values, CLOS-02 RAG classification, CLOS-03 contextual note logic
  - getRagStatus and getContextualNote pure function contracts (inline in test file, turn GREEN immediately)
affects: [05-02, 05-03, Phase 05 close stage tracker component implementation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - beforeAll error-capture pattern for dataLoader integration tests (catch loadError, re-throw in each it())
    - Pure function contracts defined inline in test file — tested independently of dataLoader RED phase

key-files:
  created:
    - Catie/FP&A Application/fpa-close-efficiency-dashboard/src/features/model/__tests__/closeStages.test.ts
  modified:
    - Catie/FP&A Application/fpa-close-efficiency-dashboard/src/features/model/types.ts

key-decisions:
  - "CloseStage.posted counts both 'posted' AND 'approved' status rows — progress = Math.round((posted+approved)/total*100)"
  - "pending-approval uses hyphen (not underscore) to match exact CSV status values in erp_journal_entries.csv"
  - "Pure function tests (getRagStatus, getContextualNote) are GREEN immediately — inline definitions bypass dataLoader dependency"
  - "RAG thresholds: on-track >=75, at-risk 50-74, delayed <50"

patterns-established:
  - "Wave 0 TDD: write RED stubs first, pure logic tests GREEN, dataLoader integration tests RED until next plan"

requirements-completed: [CLOS-01, CLOS-02, CLOS-03]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 5 Plan 1: Close Stage Tracker — RED Test Stubs Summary

**CloseStage TypeScript interface with posted/pendingApproval/total fields and 15 Vitest RED stubs covering progress computation, RAG classification (on-track/at-risk/delayed), and contextual note logic**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T21:51:38Z
- **Completed:** 2026-03-04T21:54:26Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Extended `types.ts` with `CloseStage` interface adding `posted`, `pendingApproval`, and `total` numeric fields alongside existing `name` and `progress`
- Created `closeStages.test.ts` with 15 tests: 5 pure function tests GREEN immediately, 10 dataLoader integration tests RED until Plan 02
- Pure function contracts for `getRagStatus` and `getContextualNote` validated inline — proven correct before dataLoader wires them
- All 55 previously-passing tests remain GREEN (zero regressions)

## Task Commits

1. **Task 1: Add CloseStage interface to types.ts** - `a25aba1` (feat)
2. **Task 2: Write RED test stubs for close stage progress, RAG, and note logic** - `6a0baf9` (test)

## Files Created/Modified
- `Catie/FP&A Application/fpa-close-efficiency-dashboard/src/features/model/types.ts` - Added `CloseStage` interface after `ScenarioPreset`
- `Catie/FP&A Application/fpa-close-efficiency-dashboard/src/features/model/__tests__/closeStages.test.ts` - 15 RED test stubs for CLOS-01/02/03

## Decisions Made
- `posted` field counts both `'posted'` AND `'approved'` status rows per plan spec — progress formula is `Math.round((posted + approved) / total * 100)`, so `posted` is the combined completed count
- `pending-approval` uses hyphen per CSV spec — test comments explicitly note the hyphen vs underscore distinction
- RAG thresholds: `>= 75` = on-track, `50–74` = at-risk, `< 50` = delayed
- Pure functions defined inline in test file so CLOS-02 and CLOS-03 tests are GREEN from day one

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 can now update `dataLoader.ts` and `DashboardSeedData` type to compute `CloseStage[]` from `erp_journal_entries.csv` — turning all 10 RED integration tests GREEN
- `CloseStage` interface is ready in `types.ts` — Plan 02 can import without TypeScript errors
- Test names and field names are locked: `'AP close'`, `'AR close'`, `'Revenue recognition'`, `'Inventory valuation'`, `'Accruals & JEs'`, `'Financial statement package'`

---
*Phase: 05-close-stage-tracker*
*Completed: 2026-03-04*
