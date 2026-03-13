---
phase: 07-reactive-margin-bridge
plan: 04
subsystem: ui
tags: [browser-qa, vercel, build-fixes, visual-verification, margin-bridge, dark-mode, recharts]

# Dependency graph
requires:
  - phase: 07-reactive-margin-bridge-plan-03
    provides: MarginBridgeChart.tsx + MarginBridgeSection.tsx wired into DashboardApp — chart renders, amber glow, dark mode detection
provides:
  - Human sign-off on CHRT-01: Margin Bridge chart confirmed working in Vercel production — bars animate, glow fires, dark mode correct, no flicker
  - 3 Vercel production build fixes: BOM in globals.css, missing tailwindcss devDependency, missing DEFAULT_BASE_INPUTS fields
affects:
  - phase-08-ai-executive-summary (Vercel production URL is confirmed live and working; all phases 1-7 verified on production)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Vercel production QA: browser verification done on production URL rather than localhost — catches build issues that local dev server masks (BOM chars, missing devDependencies)"

key-files:
  created: []
  modified:
    - src/app/globals.css (BOM stripped — 3 zero-width BOM bytes removed from file start)
    - package.json (tailwindcss added to devDependencies for Vercel build)
    - src/store/scenarioSlice.ts (baseEbitda + baseGrossMarginPct added to DEFAULT_BASE_INPUTS)

key-decisions:
  - "Vercel production QA used instead of localhost — the '&' in the FP&A path name causes Turbopack's SQLite persistence layer to crash when started from bash, making automated localhost verification impossible in this environment. Vercel production deployment serves as the equivalent verification surface."
  - "3 build fixes applied during deployment: (1) UTF-8 BOM in globals.css rejected by Turbopack CSS parser, (2) tailwindcss not in devDependencies causing Vercel build failure, (3) DEFAULT_BASE_INPUTS missing baseEbitda/baseGrossMarginPct causing runtime ReferenceError on store init"

patterns-established:
  - "Build-time vs dev-time gap: Vercel production build catches issues that Next.js dev server (with HMR tolerance) masks — always verify on production build before phase sign-off"

requirements-completed: [CHRT-01]

# Metrics
duration: 15min
completed: 2026-03-05
---

# Phase 7 Plan 04: Browser QA and Phase 7 Sign-off Summary

**Margin Bridge chart confirmed working on Vercel production — all 10 visual QA items passed: bars animate, amber glow fires, dark mode renders correctly, Fuel Cost Shock preset shows red below-zero bar, no flicker on slider movement**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-05T02:40:59Z
- **Completed:** 2026-03-05
- **Tasks:** 2
- **Files modified:** 3 (build fixes applied during deployment)

## Accomplishments

- Human visual QA approved on Vercel production URL — all 10 checkpoint items confirmed passing
- 3 Vercel production build fixes applied and committed before QA: BOM in globals.css, missing tailwindcss devDep, missing DEFAULT_BASE_INPUTS fields
- Phase 7 (Reactive Margin Bridge) fully complete — all 4 plans done, CHRT-01 requirement met
- Full test suite remains 80/80 GREEN; TypeScript clean (pre-existing aria-query TS2688 unrelated to our code)

## Task Commits

Each task was committed atomically:

1. **Task 1: TypeScript check + full test suite verification** — no commit (verification only — 80/80 tests GREEN confirmed)
2. **Task 2: Human browser QA on Vercel production** — approved (no code commit — checkpoint approval)

**Vercel build fixes (applied before QA, committed separately):**
- `5523c59` — fix(build): strip UTF-8 BOM from globals.css
- `98a6477` — fix(build): add tailwindcss v4 to devDependencies
- `6872524` — fix(build): add baseEbitda and baseGrossMarginPct to DEFAULT_BASE_INPUTS

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/app/globals.css` — UTF-8 BOM (3 zero-width bytes at file start) stripped; Turbopack rejects BOM in CSS files during production build
- `package.json` — tailwindcss added to devDependencies; Vercel's clean-install build environment requires it explicitly whereas local dev has it cached
- `src/store/scenarioSlice.ts` — baseEbitda and baseGrossMarginPct added to DEFAULT_BASE_INPUTS constant; their absence caused a runtime ReferenceError when the store initialized before dataLoader hydration

## Decisions Made

- Vercel production QA used in place of localhost dev server verification. The `&` character in the project's directory path (`FP&A Application`) causes Turbopack's native SQLite persistence layer to fail with `invalid digit found in string` when the dev server is started from bash. The agent cannot work around this at the process level. Vercel production deployment is equivalent (and more rigorous — it catches build-time issues that local dev masks).
- 3 build fixes treated as Rule 3 auto-fixes (blocking issues preventing plan completion) — none required architectural changes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Strip UTF-8 BOM from globals.css**
- **Found during:** Task 2 (Vercel production build attempt)
- **Issue:** globals.css had a 3-byte UTF-8 BOM (`EF BB BF`) prepended, likely from an editor save. Turbopack's CSS parser rejected the BOM during production build with a parse error.
- **Fix:** Removed the 3 BOM bytes from the start of globals.css.
- **Files modified:** src/app/globals.css
- **Verification:** Vercel build succeeded after fix.
- **Committed in:** 5523c59

**2. [Rule 3 - Blocking] Add tailwindcss to devDependencies**
- **Found during:** Task 2 (Vercel production build attempt)
- **Issue:** tailwindcss was not listed in devDependencies in package.json. Vercel's clean-install build environment runs `npm ci` from scratch — without tailwindcss declared, the Tailwind v4 PostCSS/CSS pipeline failed with a module-not-found error.
- **Fix:** Added `"tailwindcss": "^4.0.0"` to devDependencies.
- **Files modified:** package.json
- **Verification:** Vercel build succeeded after fix.
- **Committed in:** 98a6477

**3. [Rule 3 - Blocking] Add baseEbitda and baseGrossMarginPct to DEFAULT_BASE_INPUTS**
- **Found during:** Task 2 (Vercel production runtime)
- **Issue:** DEFAULT_BASE_INPUTS in scenarioSlice.ts was missing the two new fields added to BaseInputs in Plan 01 (baseEbitda, baseGrossMarginPct). The Redux store initialized with undefined for these fields before dataLoader hydration, causing a runtime ReferenceError when kpiSelectors tried to read them.
- **Fix:** Added `baseEbitda: 0` and `baseGrossMarginPct: 0` as safe zero defaults to DEFAULT_BASE_INPUTS. The dataLoader hydration via `loadSeedData` action then replaces them with computed values.
- **Files modified:** src/store/scenarioSlice.ts
- **Verification:** Runtime ReferenceError resolved; Margin Bridge chart renders correctly on page load.
- **Committed in:** 6872524

---

**Total deviations:** 3 auto-fixed (all Rule 3 — blocking build/runtime issues discovered during Vercel production deployment)
**Impact on plan:** All 3 fixes were necessary for production correctness. None required architectural changes. The local dev server masked issues 1 and 2 (BOM tolerance, cached node_modules). Issue 3 was a genuine gap in Plan 01 implementation — DEFAULT_BASE_INPUTS should have been updated when BaseInputs was extended.

## Issues Encountered

- Dev server cannot be started by the automated agent from bash due to the `&` in the FP&A directory path causing Turbopack's native SQLite persistence layer (`Failed to open database — invalid digit found in string`) to crash. This is a known environment constraint in this project — the same issue affected Phase 06 QA. Workaround: user starts dev server from their own terminal, or verification is done on Vercel production URL (which is what happened here, and is more rigorous).

## User Setup Required

None - no external service configuration required beyond what is already in place.

## Next Phase Readiness

- Phase 7 fully complete — all 4 plans done, CHRT-01 requirement met and human-verified on Vercel production
- Vercel production URL is live with a clean build (all 3 build fixes in place)
- MarginBridgeSection confirmed working: bars animate, amber glow fires, dark mode correct, Fuel Cost Shock preset shows red below-zero bar, no flicker on other components
- Ready for Phase 8 (AI Executive Summary) — existing blocker note: OpenAI streaming with Next.js 16.1.6 App Router needs validation; `export const runtime = 'nodejs'` behavior on Vercel must be confirmed before AI phase begins

---
*Phase: 07-reactive-margin-bridge*
*Completed: 2026-03-05*
