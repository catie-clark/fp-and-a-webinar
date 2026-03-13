---
phase: 2
slug: data-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.0 |
| **Config file** | `vitest.config.ts` (app root) |
| **Quick run command** | `node "./node_modules/vitest/vitest.mjs" run` (from app root — `npx vitest` fails due to `&` in path) |
| **Full suite command** | `node "./node_modules/vitest/vitest.mjs" run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node "./node_modules/vitest/vitest.mjs" run`
- **After every plan wave:** Run `node "./node_modules/vitest/vitest.mjs" run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | FOND-02, FOND-04, DYNM-01-04 | unit stub | `node "./node_modules/vitest/vitest.mjs" run` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | FOND-04 | unit | `node "./node_modules/vitest/vitest.mjs" run` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | FOND-02, DYNM-01, DYNM-03, DYNM-04 | unit | `node "./node_modules/vitest/vitest.mjs" run` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | DYNM-02 | unit | `node "./node_modules/vitest/vitest.mjs" run` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | DYNM-01 | integration | `node "./node_modules/vitest/vitest.mjs" run` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 2 | FOND-08 | manual | N/A — file existence + gitignore check | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/model/__tests__/dataLoader.test.ts` — stubs for FOND-02, FOND-04, DYNM-01, DYNM-02, DYNM-03, DYNM-04

The stub must be RED (failing with a meaningful assertion) before Wave 1 data files exist, then GREEN after Wave 1+2+3 complete. Tests must call `loadDashboardSeedData()` and assert specific values.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `.env.local` exists with `OPENAI_API_KEY` | FOND-08 | File content is a secret; cannot be committed or auto-tested | Check file exists at app root, contains `OPENAI_API_KEY=`, and `git status` shows it as untracked/ignored |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
