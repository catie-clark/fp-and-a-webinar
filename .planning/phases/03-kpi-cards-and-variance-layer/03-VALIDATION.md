---
phase: 3
slug: kpi-cards-and-variance-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `Catie/FP&A Application/fpa-close-efficiency-dashboard/vitest.config.ts` |
| **Quick run command** | `node "%USERPROFILE%/AppData/Roaming/npm/node_modules/vitest/vitest.mjs" run --reporter=verbose 2>&1` (from app dir) |
| **Full suite command** | Same — all tests in one run |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | KPIS-01,02 | unit | vitest run kpiSelectors.test.ts | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 0 | KPIS-01,02 | unit | vitest run kpiSelectors.test.ts | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | KPIS-01 | unit | vitest run kpiSelectors.test.ts | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | KPIS-01,02 | unit | vitest run kpiSelectors.test.ts | ❌ W0 | ⬜ pending |
| 3-02-03 | 02 | 1 | KPIS-03,04 | manual | Browser: open dashboard, observe counter animation | N/A | ⬜ pending |
| 3-03-01 | 03 | 2 | KPIS-01,02,03,04 | manual | Browser: verify 4×2 grid renders, counters animate, amber glow fires | N/A | ⬜ pending |
| 3-03-02 | 03 | 2 | DYNM-02 | unit | vitest run kpiSelectors.test.ts | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/model/__tests__/kpiSelectors.test.ts` — RED stubs for:
  - `selectNetSales` returns `baseNetSales * (1 + revenueGrowthPct)`
  - `selectCogs` reflects fuel index adjustment (fuelIndex=137 produces higher COGS)
  - `selectGrossProfit` = `selectNetSales - selectCogs`
  - `selectEbitda` = `selectGrossProfit - baseOpex`
  - `selectCash` increases when `collectionsRatePct` improves above 0.97
  - `selectAr` decreases when `collectionsRatePct` improves above 0.97
  - `selectAp` increases when `returnsPct` increases above 0.012
  - `selectInventory` increases by ~12% when `inventoryComplexity = true`
  - `variancePct` reads from `baseInputs.variancePct` (not hardcoded) — DYNM-02
  - Fuel shock preset: `selectEbitda` drops noticeably vs baseline (at least −$200K)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| React Bits CountUp animates 0→value on first load | KPIS-03 | DOM animation, not testable in Vitest/jsdom | Open localhost:3000, observe all 8 KPI values count up from 0 |
| React Bits CountUp re-animates on scenario state change | KPIS-03 | Requires Redux dispatch + DOM render cycle | Open localhost:3000, dispatch any `setControl` from browser DevTools Redux tab, observe counter re-animates |
| Amber glow fires on changed KPI cards only | KPIS-04 | CSS keyframe animation, not testable in jsdom | Open localhost:3000, change scenario via DevTools, observe amber glow appears only on affected cards |
| Cards render correct Iconsax icon per metric | KPIS-01 | Icon render requires browser SVG | Open localhost:3000, verify each of 8 cards shows correct icon without console errors |
| 4×2 grid layout renders correctly on 1080p | KPIS-01 | CSS Grid layout, viewport-dependent | Set browser to 1920×1080, verify 4 cards per row, no overflow |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
