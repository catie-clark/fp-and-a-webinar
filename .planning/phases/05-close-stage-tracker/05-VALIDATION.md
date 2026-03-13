---
phase: 5
slug: close-stage-tracker
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 5 — Validation Strategy

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
| 05-01-01 | 01 | 0 | CLOS-01, CLOS-02 | unit RED stubs | `node node_modules/vitest/vitest.mjs run` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 0 | CLOS-01 | unit (dataLoader) | `node node_modules/vitest/vitest.mjs run` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | CLOS-01 | unit GREEN | `node node_modules/vitest/vitest.mjs run` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | CLOS-02, CLOS-03, CLOS-04 | unit GREEN | `node node_modules/vitest/vitest.mjs run` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | CLOS-01–04 | unit + human-verify | `node node_modules/vitest/vitest.mjs run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/model/__tests__/closeTracker.test.ts` — RED stubs for close stage progress computation and RAG classification
- [ ] `src/lib/__tests__/closeStageCompute.test.ts` — dataLoader computation tests (or extend existing dataLoader.test.ts)

*Existing test infrastructure covers all other needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RAG badge colors render correctly in browser | CLOS-02 | CSS color rendering requires visual inspection | Open browser, verify AP close shows green badge, Financial statement package shows red badge |
| Contextual note text is readable and FP&A-credible | CLOS-03 | Tone/readability judgment requires human | Inspect At Risk stage notes — verify they read like CFO-quality commentary |
| Progress bars fill to correct visual widths | CLOS-01 | Visual rendering requires human observation | Verify AP close bar (~78%) is noticeably fuller than Financial statement package (~47%) |
| Days-to-close card visible above stage list | CLOS-04 | Layout/position requires browser rendering | Verify calendar-icon mini card appears at section top before stage cards |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
