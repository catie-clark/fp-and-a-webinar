---
phase: 07
slug: reactive-margin-bridge
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.x |
| **Config file** | `vitest.config.ts` (app root: `Catie/FP&A Application/fpa-close-efficiency-dashboard/`) |
| **Quick run command** | `node "C:/Users/RachurA/AppData/Local/node_modules/vitest/vitest.mjs" run --reporter=verbose` (run from app dir) |
| **Full suite command** | Same — run all test files |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick command
- **After every plan wave:** Run full suite (all test files)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 0 | CHRT-01 | unit | `vitest run src/features/model/__tests__/marginBridge.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 1 | CHRT-01 | unit | `vitest run src/features/model/__tests__/marginBridge.test.ts` | ✅ W0 | ⬜ pending |
| 07-02-02 | 02 | 1 | CHRT-01 | unit | `vitest run src/features/model/__tests__/marginBridge.test.ts` | ✅ W0 | ⬜ pending |
| 07-03-01 | 03 | 2 | CHRT-01 | manual | Browser QA: chart renders, animates, glow fires | ❌ manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/model/__tests__/marginBridge.test.ts` — RED stubs using beforeAll error-capture pattern; covers:
  - `buildMarginBridgeData` returns 6 bars in correct order
  - `selectBaselineEbitda` returns `baseInputs.baseEbitda`
  - `selectRevenueGrowthImpact` = 0 at `revenueGrowthPct = 0`
  - `selectFuelIndexImpact` = 0 at `fuelIndex = 100`
  - `selectGrossMarginImpact` = 0 when `grossMarginPct = baseGrossMarginPct`
  - Fuel shock scenario: `selectFuelIndexImpact < 0` (negative bar confirmed)
  - Positive revenue growth: `selectRevenueGrowthImpact > 0` (gold bar confirmed)
- [ ] `baseEbitda` and `baseGrossMarginPct` added to `BaseInputs` in `src/features/model/types.ts` (Zod schema + TypeScript type)
- [ ] `dataLoader.ts` computes and populates `baseEbitda` and `baseGrossMarginPct` from seed data

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chart renders in browser with gold/red/indigo bars at correct heights | CHRT-01 | Recharts visual rendering cannot be unit tested | Open localhost:3000, verify 6 bars visible with correct colors |
| Bars animate smoothly (~300ms) when Revenue Growth slider moves | CHRT-01 | Animation behavior is visual; cannot be unit tested | Drag Revenue Growth slider, observe bar height transitions |
| Card header live EBITDA value updates in real time | CHRT-01 | DOM value update confirmation; needs browser | Move any slider, confirm header shows updated currency value |
| Dark mode: total bars (Indigo) remain visible on dark card bg | CHRT-01 | Color contrast is visual judgment | Toggle dark mode, confirm Baseline and Adjusted EBITDA bars are visible |
| Amber glow fires on card border when values change | CHRT-01 | CSS animation; needs browser observation | Move any slider, confirm brief amber glow on card border |
| No other components flicker when Margin Bridge updates | CHRT-01 | Re-render isolation requires browser DevTools | Open React DevTools, move slider, confirm only MarginBridgeSection re-renders |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
