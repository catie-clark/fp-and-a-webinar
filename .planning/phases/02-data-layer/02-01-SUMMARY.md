---
phase: 02-data-layer
plan: "01"
subsystem: testing
tags: [vitest, integration-test, tdd, dataLoader, red-green-refactor]

# Dependency graph
requires:
  - phase: 01-project-scaffolding
    provides: vitest config, @/lib/dataLoader.ts, @/features/model/types.ts, test infrastructure
provides:
  - Failing Wave 0 integration test stubs for dataLoader covering FOND-02, FOND-04, DYNM-01, DYNM-02, DYNM-03, DYNM-04
  - RED test contract: 10 failing assertions that define exactly what Wave 1 data files and Wave 2 code fixes must satisfy
affects: [02-data-layer Wave 1 (data files), 02-data-layer Wave 2 (code fixes), 02-data-layer Wave 3 (page wiring)]

# Tech tracking
tech-stack:
  added: []
  patterns: [beforeAll error-capture pattern for ENOENT RED tests (tests FAIL not skip), integration test with no vi.mock]

key-files:
  created:
    - Catie/FP&A Application/fpa-close-efficiency-dashboard/src/features/model/__tests__/dataLoader.test.ts
  modified: []

key-decisions:
  - "beforeAll error-capture pattern: catch ENOENT in beforeAll, re-throw in each it() so tests show as FAILED not SKIPPED"
  - "No vi.mock — integration tests must verify real file system and actual computed values"

patterns-established:
  - "Wave 0 RED pattern: beforeAll catches load error, each it() re-throws it — gives 10 individual FAIL counts not 10 skips"

requirements-completed: [FOND-02, FOND-04, DYNM-01, DYNM-02, DYNM-03, DYNM-04]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 2 Plan 01: dataLoader Integration Test Stubs (Wave 0 RED) Summary

**10 failing integration test stubs for loadDashboardSeedData() covering all 6 data-layer requirements — RED now, GREEN after Wave 1 data files and Wave 2 variancePct fix**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T16:41:37Z
- **Completed:** 2026-03-04T16:44:14Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `dataLoader.test.ts` with 10 individual failing `it()` tests in a single `describe` block
- Tests fail with ENOENT (missing data files) — the correct RED state per the Nyquist contract
- Used beforeAll error-capture pattern so tests appear as FAILED (10 failed) not SKIPPED, giving meaningful CI signal
- Verified all 4 pre-existing tests (csv, formatters, icons, layout — 21 tests) still pass with no regressions
- Assertions cover all 6 requirements: company name, closeTargetBusinessDays, variancePct, baseNetSales, presets count, cash13Week rows, ar90Ratio range, journalEntries minimum, externalFuelIndex rows, externalVendorPriceIndex rows

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing dataLoader.test.ts stubs** - `51d371a` (test)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `Catie/FP&A Application/fpa-close-efficiency-dashboard/src/features/model/__tests__/dataLoader.test.ts` - 10 failing integration test stubs, Wave 0 RED contract for Phase 2

## Decisions Made
- **beforeAll error-capture pattern:** The default Vitest behavior when `beforeAll` throws is to mark all tests as "skipped" — not "failed". This provides a misleading CI signal. By catching the error in `beforeAll` and re-throwing it inside each `it()`, all 10 tests show as FAILED with the ENOENT error, which is the correct signal that data files are missing.
- **No vi.mock:** These are integration tests. The point is to verify the real file system and actual computed values (variancePct 0.034 vs hardcoded 0.037). Mocking would defeat the purpose.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restructured beforeAll to use error-capture pattern**
- **Found during:** Task 1 (verification)
- **Issue:** Default Vitest behavior: when `beforeAll` throws, tests are marked SKIPPED not FAILED. Plan done criteria explicitly requires tests to show as FAILED.
- **Fix:** Wrapped `loadDashboardSeedData()` call in try/catch in `beforeAll`, stored error in `loadError`. Each `it()` starts with `if (loadError) throw loadError` — this propagates the ENOENT into each test body, producing 10 FAILED results.
- **Files modified:** `src/features/model/__tests__/dataLoader.test.ts`
- **Verification:** Vitest output shows `10 tests | 10 failed` with ENOENT error message
- **Committed in:** 51d371a (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug in test structure)
**Impact on plan:** Fix required for done criteria compliance. No scope change — same 10 tests, same assertions, same ENOENT failure mode.

## Issues Encountered
None beyond the beforeAll/skip vs fail issue documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Wave 0 contract established: 10 FAILING tests define the acceptance criteria for all subsequent plans in Phase 2
- Wave 1 (02-02): Create the 8 CSV and 2 JSON data files in `src/data/` — tests will turn GREEN on data-presence assertions
- Wave 2 (02-03): Fix `variancePct: 0.037` hardcoded value in `dataLoader.ts` to read from `company.json` (0.034) — turns the variancePct test GREEN
- Wave 3 (02-04): Wire `page.tsx` to call `loadDashboardSeedData()` and pass `seedData` to `<DashboardApp />`
- All 4 pre-existing tests continue to pass (no regressions introduced)

---
*Phase: 02-data-layer*
*Completed: 2026-03-04*
