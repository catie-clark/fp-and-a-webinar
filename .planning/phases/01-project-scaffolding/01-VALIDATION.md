---
phase: 1
slug: project-scaffolding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-03
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 (confirmed installed in node_modules) |
| **Config file** | `vitest.config.ts` — does NOT exist, must be created in Wave 0 |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx vitest run` + `npx tsc --noEmit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| config files | TBD | 1 | FOND-01 | smoke | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| csv.ts | TBD | 1 | FOND-03 | unit | `npx vitest run src/features/model/__tests__/csv.test.ts` | ❌ Wave 0 | ⬜ pending |
| formatters.ts | TBD | 1 | FOND-05 | unit | `npx vitest run src/features/model/__tests__/formatters.test.ts` | ❌ Wave 0 | ⬜ pending |
| icons.tsx | TBD | 1 | FOND-06 | unit (static) | `npx vitest run src/features/model/__tests__/icons.test.ts` | ❌ Wave 0 | ⬜ pending |
| layout.tsx | TBD | 1 | FOND-07 | unit (static) | `npx vitest run src/features/model/__tests__/layout.test.ts` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest config with `node` environment (server-side utilities) and `@` path alias
- [ ] `src/features/model/__tests__/csv.test.ts` — stubs for FOND-03: parseCsv returns correct structure
- [ ] `src/features/model/__tests__/formatters.test.ts` — stubs for FOND-05: formatCurrency and formatPercent
- [ ] `src/features/model/__tests__/icons.test.ts` — stubs for FOND-06: "use client" directive present
- [ ] `src/features/model/__tests__/layout.test.ts` — stubs for FOND-07: blocking script string present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `npm run dev` shows page at localhost:3000 | FOND-01 | Requires running dev server | Run `npm run dev`, open browser, verify page renders without errors |
| Dark mode activates without flash | FOND-07 | Requires browser + localStorage | Open page, set localStorage theme="dark", hard refresh, verify no light→dark flash |
| Iconsax icon renders without SSR error | FOND-06 | Requires dev server check | Run `npm run dev`, verify no `window is not defined` in terminal output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
