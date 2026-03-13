# Stack Research: FP&A Close Efficiency Dashboard

**Domain:** Next.js 16 financial analytics / FP&A close dashboard
**Date:** 2026-03-03

---

## Confirmed Installed Versions (from on-disk node_modules)

| Package | Version | Source |
|---------|---------|--------|
| Next.js | **16.1.6** | `.next/diagnostics/framework.json` |
| Redux | **5.0.1** | on-disk package.json |
| react-redux | **9.2.0** | on-disk package.json |
| Tailwind CSS | **v4** | `@tailwindcss/oxide` presence |
| framer-motion | installed | version unclear |
| Vitest | **4.0.18** | `@vitest/utils` |

**NOT yet installed (must add):** recharts, zod, openai, iconsax-react, papaparse, Radix UI primitives

---

## Recommended Stack

### Framework
- **Next.js 16.1.6** — App Router, TypeScript. Already installed. ✓

### Charts
- **Recharts `^2.15.x`** (HIGH confidence)
  - Do NOT use 3.x — beta with breaking SVG API changes, wrong for a live webinar demo
  - Wrap in `dynamic(() => import(...), { ssr: false })` for RSC compatibility
  - `ResponsiveContainer` requires explicit height on parent when inside flex/grid

### State Management
- **Redux Toolkit (already installed)** (HIGH confidence)
  - 11 interdependent controls (7 sliders + 4 toggles) cascade to 4 charts
  - RTK's `createSelector` memoization prevents re-render storms on slider drag
  - Zustand would not memoize derived values — wrong choice here
  - Pattern: `controlsSlice` (raw slider values) + `computedSlice` (derived outputs)

### Data Validation
- **Zod `^3.24.x`** (HIGH confidence)
  - Do NOT use 4.x — beta, API breaking changes from 3.x, not production-ready as of March 2026
  - Already implied by existing `dataLoader.ts` — keep consistent

### AI Integration
- **OpenAI SDK `openai@^4`** (HIGH confidence)
  - Route handler: `src/app/api/enhance-summary/route.ts`
  - **Critical:** Add `export const runtime = 'nodejs'` — OpenAI SDK uses Node APIs incompatible with Edge Runtime
  - Use streaming response for better UX: `openai.chat.completions.create({ stream: true })`

### UI Components (21st.dev)
- **Copy-paste, NOT an npm package** (MEDIUM confidence)
  - Browse https://21st.dev/community/components → copy component code into `src/components/ui/`
  - Install Radix UI primitives as peer deps: `@radix-ui/react-slider`, `@radix-ui/react-switch`, `@radix-ui/react-select`
  - Tailwind v4 compatible (no shadcn init needed — conflicts with Tailwind v4 copy-paste approach)

### Animations (React Bits)
- **Copy-paste, NOT an npm package** (MEDIUM confidence)
  - framer-motion (already installed) is the peer dependency
  - Pattern for KPI number counters: framer-motion `animate()` from 0 to value on mount
  - Copy components from https://reactbits.dev into `src/components/animated/`

### Icons
- **iconsax-react** (HIGH confidence — actual npm package)
  - `npm install iconsax-react`
  - Use `variant="Bulk"` for KPI cards, `variant="Linear"` for body/nav
  - Import: `import { Chart, Wallet, TrendUp } from 'iconsax-react'`

### CSV Parsing
- **papaparse** (HIGH confidence)
  - `npm install papaparse && npm install -D @types/papaparse`
  - Server-side only (in dataLoader.ts) — no browser bundle impact

---

## What NOT to Install

| Package | Reason |
|---------|--------|
| Anime.js | framer-motion already installed and covers all animation needs |
| shadcn/ui (npx shadcn init) | Conflicts with Tailwind v4 + the copy-paste 21st.dev approach |
| Vercel AI SDK | Unnecessary abstraction over the OpenAI SDK |
| Recharts 3.x | Beta, breaking changes, wrong for a production webinar demo |
| Zod 4.x | Beta, API changes from 3.x |

---

## Install Commands

```bash
cd "Catie/FP&A Application/fpa-close-efficiency-dashboard"

# Core missing dependencies
npm install recharts@^2.15 zod@^3.24 openai@^4 iconsax-react papaparse

# Radix UI primitives (peer deps for 21st.dev copy-paste components)
npm install @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-select @radix-ui/react-tooltip @radix-ui/react-dropdown-menu

# Types
npm install -D @types/papaparse
```

---

## Critical Next.js 16 / App Router Integration Notes

1. **Recharts requires dynamic import** — all chart components must be Client Components with `'use client'` and should be wrapped in `dynamic(() => import('./Chart'), { ssr: false })`

2. **Redux StoreProvider pattern** — wrap `DashboardApp.tsx` in a Provider that initializes with server-fetched seed data as initial state; avoid serialization of non-plain objects

3. **Large data serialization** — passing full CSV data from Server → Client via props works but watch for Next.js prop size limits; the existing `DashboardApp.tsx` architecture (server passes pre-computed `DashboardSeedData`) is correct

4. **Tailwind v4 differences** — v4 uses `@import "tailwindcss"` not `@tailwind` directives; config is in CSS not `tailwind.config.ts`; this affects how 21st.dev components that use `cn()` are integrated

5. **OpenAI route must be Node runtime** — `export const runtime = 'nodejs'` is non-negotiable

---

## Confidence Summary

| Decision | Confidence | Notes |
|----------|-----------|-------|
| Next.js 16.1.6 | HIGH | Confirmed on-disk |
| Redux Toolkit (keep) | HIGH | Confirmed + correct architecture |
| Recharts 2.x | HIGH | 3.x confirmed unstable |
| Zod 3.x | HIGH | 4.x beta |
| OpenAI SDK 4.x | HIGH | Current major version |
| 21st.dev = copy-paste | MEDIUM | Verify before assuming npm install |
| React Bits = copy-paste | MEDIUM | Verify pattern on reactbits.dev |
| iconsax-react | HIGH | Real npm package |
| papaparse | HIGH | Standard for CSV in Node/browser |
