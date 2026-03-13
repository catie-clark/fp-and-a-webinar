---
phase: 6
slug: static-charts
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `Catie/FP&A Application/fpa-close-efficiency-dashboard/vitest.config.ts` |
| **Quick run command** | `node node_modules/vitest/vitest.mjs run` |
| **Full suite command** | `node node_modules/vitest/vitest.mjs run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node node_modules/vitest/vitest.mjs run`
- **After every plan wave:** Run `node node_modules/vitest/vitest.mjs run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 0 | CHRT-02, CHRT-03 | unit (dataLoader) | `node node_modules/vitest/vitest.mjs run` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | CHRT-02 | tsc + vitest | `node node_modules/vitest/vitest.mjs run` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | CHRT-03 | tsc + vitest | `node node_modules/vitest/vitest.mjs run` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 1 | CHRT-04 | tsc + vitest | `node node_modules/vitest/vitest.mjs run` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | CHRT-02,03,04 | tsc + human-verify | `node node_modules/vitest/vitest.mjs run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `DashboardSeedData` type updated — add `arAging: ARRow[]` and `crmPipeline: PipelineRow[]` to the type definition and `loadDashboardSeedData()` return value

*No new test file needed — existing dataLoader.test.ts will cover the type gap once fixed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Charts render without SSR hydration errors | CHRT-02,03,04 | Browser console required to confirm no hydration errors | Open DevTools, reload page, verify zero console errors |
| Pipeline teal bars visually distinct | CHRT-02 | Color rendering requires browser | Verify bars are teal, not default Recharts blue |
| AR Aging stacked bar proportions readable | CHRT-03 | Visual proportion judgment requires human | Verify Current (largest) vs 90+ (smallest) buckets clearly visible |
| Cash Flow solid vs dashed distinction | CHRT-04 | Line style rendering requires browser | Verify actuals = solid, forecast = clearly dashed |
| Cash Flow toggle show/hide works | CHRT-04 | Interactive behavior requires browser | Click hide button, verify panel collapses; click show, verify it returns |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
