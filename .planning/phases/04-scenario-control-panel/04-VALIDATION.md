---
phase: 4
slug: scenario-control-panel
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + React Testing Library |
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
| 04-01-01 | 01 | 0 | SCEN-01, SCEN-02 | unit (RED stubs) | `node node_modules/vitest/vitest.mjs run` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | SCEN-01 | unit (GREEN) | `node node_modules/vitest/vitest.mjs run` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | SCEN-02 | unit (GREEN) | `node node_modules/vitest/vitest.mjs run` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | SCEN-03, SCEN-04 | unit + human-verify | `node node_modules/vitest/vitest.mjs run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/model/__tests__/scenarioPanel.test.ts` — RED stubs for slider dispatch, toggle dispatch, preset load, reset

*Existing infrastructure covers TypeScript and build checks — only new test file needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Slider thumb moves smoothly in real-time as dragged | SCEN-01 | Animation/drag smoothness requires human observation | Open browser, drag Revenue Growth slider end-to-end, verify no jank and KPI numbers update continuously |
| KPI amber glow fires on slider move | SCEN-01, KPIS-04 | Visual animation effect requires human observation | Drag any slider, verify affected KPI cards pulse amber |
| Preset applies all 11 controls simultaneously | SCEN-03 | Requires visual confirmation that all sliders jump at once | Select "Fuel Cost Shock" preset, verify fuelIndex jumps to 137 and EBITDA drops visibly |
| Layout: sidebar left, KPIs right (two-column) | SCEN-01 | Visual layout requires human observation | Open browser at 1080p, verify sidebar is fixed left and KPI grid fills remaining width |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
