---
phase: 06-static-charts
plan: "01"
subsystem: data-layer
tags: [data-loader, tdd, red-tests, chart-data, typescript]
dependency_graph:
  requires: [05-03]
  provides: [arAging-in-seedData, crmPipeline-in-seedData, charts-test-stubs]
  affects: [06-02, 06-03]
tech_stack:
  added: []
  patterns: [beforeAll-error-capture, TDD-RED-stubs, DashboardSeedData-extension]
key_files:
  created:
    - Catie/FP&A Application/fpa-close-efficiency-dashboard/src/features/model/__tests__/charts.test.ts
  modified:
    - Catie/FP&A Application/fpa-close-efficiency-dashboard/src/lib/dataLoader.ts
    - Catie/FP&A Application/fpa-close-efficiency-dashboard/src/features/model/__tests__/dataLoader.test.ts
decisions:
  - "arAging and crmPipeline inserted after ar90Ratio in DashboardSeedData type — preserves field ordering convention"
  - "beforeAll error-capture pattern reused for charts.test.ts RED stubs — consistent with Phase 2 TDD approach"
metrics:
  duration_min: 2
  completed_date: "2026-03-04T23:44:16Z"
  tasks_completed: 2
  files_modified: 3
---

# Phase 6 Plan 01: Data Layer Gap Fix — arAging + crmPipeline + Chart Test Stubs Summary

Fixed the data layer gap blocking chart rendering by adding `arAging: ARRow[]` and `crmPipeline: PipelineRow[]` to `DashboardSeedData` type and return value, then wrote 11 RED TDD test stubs covering all 3 chart data transform functions for Wave 1 implementation.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add arAging + crmPipeline to DashboardSeedData type and return value | b219aad | dataLoader.ts |
| 2 | Write RED test stubs for chart data transforms + extend dataLoader.test.ts | ec77811 | charts.test.ts (new), dataLoader.test.ts |

## Verification Results

**Task 1 verification:**
- dataLoader.test.ts: 10/10 GREEN (all previously-passing tests remain GREEN)

**Task 2 verification:**
- charts.test.ts: 11/11 FAILED with importError (RED — expected, chartDataUtils does not exist yet)
- dataLoader.test.ts: 12/12 GREEN including 2 new arAging + crmPipeline assertions
- Full suite: 8 test files pass (62 GREEN), only charts.test.ts fails as expected

## Decisions Made

1. **arAging and crmPipeline inserted after ar90Ratio** in DashboardSeedData type — preserves existing field ordering convention and groups computed vs raw data logically.

2. **beforeAll error-capture pattern reused** for charts.test.ts RED stubs — consistent with Phase 2 TDD approach established for kpiSelectors and dataLoader. Tests show as FAILED not SKIPPED in Vitest.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: charts.test.ts
- FOUND: dataLoader.ts
- FOUND: dataLoader.test.ts
- FOUND: 06-01-SUMMARY.md
- FOUND commit: b219aad (Task 1)
- FOUND commit: ec77811 (Task 2)
