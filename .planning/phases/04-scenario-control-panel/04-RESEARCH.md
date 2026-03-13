# Phase 4: Scenario Control Panel - Research

**Researched:** 2026-03-04
**Domain:** React UI wiring — Radix UI Slider/Switch/Select primitives + Redux dispatch + CSS layout
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Fixed left sidebar** — approximately 280px wide, always visible; no collapse/drawer
- **Two-column layout** — DashboardApp outer div becomes CSS Grid/flex: sidebar left, main content right
- `<div id="slot-scenario-panel" />` removed; ScenarioPanel becomes the left column
- **Control grouping:** Revenue Levers (revenueGrowthPct, grossMarginPct), Cost Levers (fuelIndex, returnsPct), Operations (collectionsRatePct, lateInvoiceHours, journalLoadMultiplier), Business Modes (4 toggles as a distinct final group)
- **Real-time dispatch on every drag** — `onChange` fires `dispatch(setControl({ field, value }))` with NO debounce or throttle
- **Preset header row** — `[Preset dropdown] [Reset]` at the very top of the sidebar; no description text
- **Slider value label formats**: revenueGrowthPct `+3.0%`, grossMarginPct `25.0%`, fuelIndex `118`, collectionsRatePct `97.0%`, returnsPct `1.2%`, lateInvoiceHours `4 hrs`, journalLoadMultiplier `1.00x`
- **Slider ranges**: Revenue Growth (−4% to +8%), Gross Margin (18%–28%), Fuel Index (80–140), Collections Rate (94%–100%), Returns (0.6%–2.5%), Late Invoice Hours (0–14), Journal Load (0.8×–1.3×)
- **Reset dispatches** `resetToDefaults(baselineControls)` — restores the `baseline` preset values
- **Preset selection dispatches** `loadPreset(preset.controls)` — all 11 controls jump at once
- CSS variables throughout — no hardcoded colors; use `var(--accent)`, `var(--card)`, `var(--background)`, `var(--foreground)`
- Slider thumbs use `var(--accent)` gold color

### Claude's Discretion
- Exact 21st.dev component selection (inspect each for SSR compatibility before use; fallback to styled native HTML if incompatible)
- Sidebar scrolling behavior if content overflows viewport height
- Exact padding, gap, and spacing within the sidebar
- Toggle switch visual style (pill shape, size, animation speed)
- Hover and focus states on sliders and toggles
- Whether to show slider min/max range labels beneath the track

### Deferred Ideas (OUT OF SCOPE)
- Collapsible/drawer sidebar
- Slider debouncing (explicitly rejected)
- Scenario description text in preset dropdown
- Side-by-side scenario comparison (INTV-01) — v2 backlog
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCEN-01 | User can adjust 7 financial levers — sliders for Revenue Growth (−4% to +8%), Gross Margin (18%–28%), Fuel Index (80–140), Collections Rate (94%–100%), Returns (0.6%–2.5%), Late Invoice Hours (0–14), Journal Load (0.8x–1.3x) using 21st.dev slider components, dispatching to Redux | Radix `@radix-ui/react-slider` already installed (^1.2.0); `onValueChange` fires on every drag; controlled via `value` array prop + Redux `useSelector` |
| SCEN-02 | User can activate 4 business mode switches — toggles for Prioritize Cash Mode, Conservative Forecast Bias, Tighten Credit Holds, and Inventory Complexity using 21st.dev toggle components, dispatching to Redux | Radix `@radix-ui/react-switch` already installed (^1.1.0); `checked`/`onCheckedChange` controlled by Redux state |
| SCEN-03 | User can load a named scenario in one click — a dropdown selector loads presets from `scenario-presets.json` with FP&A-framed names, immediately updating all controls | Radix `@radix-ui/react-select` already installed (^2.1.0); `value`/`onValueChange` dispatch `loadPreset(preset.controls)`; 6 presets in JSON |
| SCEN-04 | User can return to base scenario — Reset button restores all controls to the default scenario values from `scenario-presets.json` | Plain `<button>` dispatches `resetToDefaults(baselinePreset.controls)`; baseline preset id is `"baseline"` in scenario-presets.json |
</phase_requirements>

---

## Summary

Phase 4 is a pure UI wiring phase. The Redux store (`scenarioSlice`) and all 11 actions (`setControl`, `loadPreset`, `resetToDefaults`) are already implemented. All KPI selectors react to `state.scenario.controls` changes (Phase 3 complete). Phase 4 creates one new component — `ScenarioPanel` — and restructures `DashboardApp.tsx` from a single-column to a two-column layout.

The critical discovery is that all three required Radix UI primitives are **already installed** in `package.json`: `@radix-ui/react-slider` (^1.2.0), `@radix-ui/react-switch` (^1.1.0), and `@radix-ui/react-select` (^2.1.0). These run inside `DashboardApp`'s `"use client"` boundary — SSR is a non-issue. No new npm installs are needed.

The pattern for every slider is: `value={[controlsValue]}`, `onValueChange={([v]) => dispatch(setControl({ field, value: v }))}`. Radix Slider's `onValueChange` fires on every drag position change, which is exactly what the "webinar wow" real-time requirement demands. `onValueCommit` (fires on pointer-up) must NOT be used — this would break the continuous live update.

**Primary recommendation:** Build one `ScenarioPanel` component using Radix primitives (already installed), styled entirely with CSS variables. No new packages. Restructure `DashboardApp` to a two-column flex layout.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@radix-ui/react-slider` | ^1.2.0 (installed) | Range input for 7 numerical levers | Accessible, SSR-safe, unstyled — already in package.json |
| `@radix-ui/react-switch` | ^1.1.0 (installed) | Toggle for 4 boolean business modes | Accessible ARIA switch role, controlled via checked/onCheckedChange |
| `@radix-ui/react-select` | ^2.1.0 (installed) | Preset dropdown selector | Accessible combobox pattern, controlled via value/onValueChange |
| `react-redux` | ^9.2.0 (installed) | `useDispatch`, `useSelector` inside ScenarioPanel | Already the project's state management layer |
| `@reduxjs/toolkit` | ^2.0.0 (installed) | `setControl`, `loadPreset`, `resetToDefaults` action creators | Already in scenarioSlice.ts |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `iconsax-react` | ^0.0.8 (installed) | Icon for Reset button and group headers | Consistent with Phase 3 KPI card icon pattern |
| `src/lib/formatters.ts` | project file | `formatPercent()` for slider value labels | Already implemented; use for pct display |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Slider | Native `<input type="range">` | Native input is harder to style the thumb/track with CSS variables; Radix already installed |
| Radix Select | Native `<select>` | Fallback if Radix Select causes issues (CONTEXT permits this); native is simpler but less styled |
| Radix Switch | Native `<input type="checkbox">` | Switch ARIA role is semantically better for a toggle; Radix already installed |

**Installation:** No new installs needed. All primitives already in `package.json`.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── DashboardApp.tsx         # MODIFIED: two-column layout, imports ScenarioPanel
│   └── dashboard/
│       ├── KpiSection.tsx       # UNCHANGED
│       ├── KpiCard.tsx          # UNCHANGED
│       └── ScenarioPanel/
│           └── ScenarioPanel.tsx  # NEW: all 11 controls + preset row
```

### Pattern 1: Two-Column DashboardApp Layout

**What:** Replace the current single-column `<div style={{ minHeight: '100vh', padding: '1.5rem' }}>` with a flex row — sidebar left (fixed ~280px), main content right (flex-1).
**When to use:** Always. This is the locked layout decision.

```tsx
// DashboardApp.tsx — new outer layout
<Provider store={storeRef.current}>
  <div style={{
    display: 'flex',
    minHeight: '100vh',
    gap: 0,
  }}>
    {/* Left sidebar — fixed width, scrollable if needed */}
    <aside style={{
      width: '280px',
      flexShrink: 0,
      borderRight: '1px solid var(--border)',
      overflowY: 'auto',
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      {seedData && <ScenarioPanel presets={seedData.presets} />}
    </aside>

    {/* Main content area — flex-1, scrollable */}
    <main style={{ flex: 1, minWidth: 0, padding: '1.5rem', overflowY: 'auto' }}>
      {seedData ? <KpiSection seedData={seedData} /> : <div id="slot-kpi-section" />}
      <div id="slot-close-tracker" />
      <div id="slot-charts" />
      <div id="slot-ai-summary" />
    </main>
  </div>
</Provider>
```

### Pattern 2: ScenarioPanel Component Structure

**What:** One component file with all 11 controls, sectioned into 4 groups. Reads controls from Redux, dispatches on every change.

```tsx
// src/components/dashboard/ScenarioPanel/ScenarioPanel.tsx
// No "use client" — runs inside DashboardApp client boundary
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store';
import type { ScenarioPreset } from '@/features/model/types';
import { setControl, loadPreset, resetToDefaults } from '@/store/scenarioSlice';
import * as RadixSlider from '@radix-ui/react-slider';
import * as RadixSwitch from '@radix-ui/react-switch';
import * as RadixSelect from '@radix-ui/react-select';

interface ScenarioPanelProps {
  presets: ScenarioPreset[];
}

export default function ScenarioPanel({ presets }: ScenarioPanelProps) {
  const controls = useSelector((s: RootState) => s.scenario.controls);
  const dispatch = useDispatch();

  const baseline = presets.find(p => p.id === 'baseline') ?? presets[0];

  return (
    <div style={{ padding: '1rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Preset row */}
      <PresetRow
        presets={presets}
        onSelect={(preset) => dispatch(loadPreset(preset.controls))}
        onReset={() => dispatch(resetToDefaults(baseline.controls))}
      />
      {/* Control groups */}
      <ControlGroup label="Revenue Levers">
        <SliderControl
          label="Revenue Growth"
          field="revenueGrowthPct"
          value={controls.revenueGrowthPct}
          min={-0.04} max={0.08} step={0.001}
          format={(v) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`}
          dispatch={dispatch}
        />
        {/* ... */}
      </ControlGroup>
    </div>
  );
}
```

### Pattern 3: Radix Slider — Controlled, Real-Time Dispatch

**What:** Radix Slider's `onValueChange` fires on every drag position change. Use this (not `onValueCommit`) for real-time KPI updates.

```tsx
// Radix Slider pattern — fires on every drag
import * as SliderPrimitive from '@radix-ui/react-slider';

function SliderControl({
  label, field, value, min, max, step, format, dispatch
}: SliderControlProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {/* Label row: name + live value */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--foreground)', fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--accent)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {format(value)}
        </span>
      </div>

      {/* Radix Slider */}
      <SliderPrimitive.Root
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => dispatch(setControl({ field, value: v }))}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', userSelect: 'none', touchAction: 'none', height: '20px' }}
      >
        <SliderPrimitive.Track
          style={{
            background: 'var(--track)',
            position: 'relative',
            flexGrow: 1,
            borderRadius: '9999px',
            height: '4px',
          }}
        >
          <SliderPrimitive.Range
            style={{
              position: 'absolute',
              background: 'var(--accent)',
              borderRadius: '9999px',
              height: '100%',
            }}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          style={{
            display: 'block',
            width: '16px',
            height: '16px',
            background: 'var(--accent)',
            borderRadius: '50%',
            boxShadow: '0 2px 6px rgba(245,168,0,0.40)',
            cursor: 'pointer',
            outline: 'none',
          }}
          onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-soft), 0 2px 6px rgba(245,168,0,0.40)')}
          onBlur={e => (e.currentTarget.style.boxShadow = '0 2px 6px rgba(245,168,0,0.40)')}
        />
      </SliderPrimitive.Root>
    </div>
  );
}
```

### Pattern 4: Radix Switch — Controlled Boolean Toggle

**What:** `checked` prop + `onCheckedChange` callback. Pill-shaped, amber when checked.

```tsx
import * as SwitchPrimitive from '@radix-ui/react-switch';

function ToggleControl({ label, field, checked, dispatch }: ToggleControlProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>
        {label}
      </span>
      <SwitchPrimitive.Root
        checked={checked}
        onCheckedChange={(v: boolean) => dispatch(setControl({ field, value: v }))}
        style={{
          width: '40px',
          height: '22px',
          background: checked ? 'var(--accent)' : 'var(--track)',
          borderRadius: '9999px',
          position: 'relative',
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
          transition: 'background 150ms ease',
          flexShrink: 0,
        }}
      >
        <SwitchPrimitive.Thumb
          style={{
            display: 'block',
            width: '16px',
            height: '16px',
            background: 'white',
            borderRadius: '50%',
            position: 'absolute',
            top: '3px',
            left: checked ? '21px' : '3px',
            transition: 'left 150ms ease',
            boxShadow: '0 1px 3px rgba(1,30,65,0.2)',
          }}
        />
      </SwitchPrimitive.Root>
    </div>
  );
}
```

**Important:** Radix Switch `Thumb` uses CSS transform internally when `data-state` attribute transitions. Relying on `checked` prop to position `left` in inline styles is valid but note: Radix also sets `data-state="checked"|"unchecked"` on the Root and Thumb — prefer CSS attribute selectors or Tailwind `data-[state=checked]:` for cleaner toggle animation.

### Pattern 5: Radix Select — Preset Dropdown

**What:** Controlled select — `value` is the current preset id, `onValueChange` dispatches `loadPreset`.

```tsx
import * as SelectPrimitive from '@radix-ui/react-select';

function PresetRow({ presets, onSelect, onReset }: PresetRowProps) {
  const controls = useSelector((s: RootState) => s.scenario.controls);
  // Determine which preset is currently active (or "custom" if none match)
  const activePresetId = presets.find(
    p => JSON.stringify(p.controls) === JSON.stringify(controls)
  )?.id ?? 'custom';

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <SelectPrimitive.Root
        value={activePresetId}
        onValueChange={(id) => {
          const preset = presets.find(p => p.id === id);
          if (preset) onSelect(preset);
        }}
      >
        <SelectPrimitive.Trigger
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.375rem 0.625rem',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            color: 'var(--foreground)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <SelectPrimitive.Value />
          <SelectPrimitive.Icon />
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.25rem',
              boxShadow: '0 4px 16px rgba(1,30,65,0.12)',
              zIndex: 50,
              minWidth: 'var(--radix-select-trigger-width)',
            }}
          >
            <SelectPrimitive.Viewport>
              {presets.map(p => (
                <SelectPrimitive.Item key={p.id} value={p.id}
                  style={{
                    padding: '0.375rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    outline: 'none',
                    color: 'var(--foreground)',
                  }}
                >
                  <SelectPrimitive.ItemText>{p.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      <button
        onClick={onReset}
        style={{
          padding: '0.375rem 0.625rem',
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: '0.8125rem',
          color: 'var(--muted)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Reset
      </button>
    </div>
  );
}
```

### Pattern 6: Control Group Section Header

**What:** Labeled section divider separating slider groups from toggle group.

```tsx
function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <span style={{
        fontSize: '0.6875rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--muted)',
        paddingBottom: '0.25rem',
        borderBottom: '1px solid var(--border)',
      }}>
        {label}
      </span>
      {children}
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Using `onValueCommit` instead of `onValueChange` on sliders:** `onValueCommit` only fires on pointer-up/keyboard commit — breaks continuous live update requirement. Always use `onValueChange`.
- **Hardcoding colors:** Use `var(--accent)`, `var(--track)`, `var(--border)`, `var(--card)`, `var(--foreground)`, `var(--muted)` — dark mode must work.
- **Adding `"use client"` to ScenarioPanel:** It renders inside DashboardApp's `"use client"` boundary. Adding another directive is harmless but unnecessary.
- **Positioning Radix Select Portal in a stacking context below a sticky sidebar:** The `position="popper"` + `<SelectPrimitive.Portal>` renders to `document.body` — no z-index issues.
- **JSON.stringify for preset comparison in PresetRow:** Fine for 11 controls but object key order must match. Consider `Object.keys(controlStateSchema.shape)` ordering for reliable comparison.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible range input | Custom `<div>` drag handler | `@radix-ui/react-slider` | Keyboard nav (arrow keys), ARIA `role="slider"`, touch events — 100+ edge cases |
| Accessible toggle | Styled `<div onClick>` | `@radix-ui/react-switch` | `role="switch"`, keyboard Space/Enter, focus management |
| Accessible dropdown | Custom `<ul>` with click-outside | `@radix-ui/react-select` | Arrow key navigation, Escape to close, portal rendering, ARIA combobox |
| Slider value formatting | Ad-hoc per-slider string ops | Formatter functions using existing `formatPercent()` | Consistent locale formatting already established |

**Key insight:** All three Radix primitives are already installed. The only work is styling them with CSS variables, not building them.

---

## Common Pitfalls

### Pitfall 1: Using onValueCommit Breaks Real-Time Updates

**What goes wrong:** Selecting `onValueCommit` (fires on pointer-up) instead of `onValueChange` (fires on every drag position). The audience sees the slider thumb move but KPI values only update when they release.
**Why it happens:** `onValueCommit` is described in docs as "fires when the value changes at the end of interaction" — sounds like what you'd want for performance. But here, continuous update IS the requirement.
**How to avoid:** Always wire `onValueChange`. Redux selectors are memoized with `createSelector` — unnecessary re-renders are suppressed.
**Warning signs:** KPI numbers jump only on thumb release, not during drag.

### Pitfall 2: Slider value Array Destructuring

**What goes wrong:** Radix Slider `onValueChange` and `value` use arrays (supports range/multi-thumb). Forgetting to destructure `([v])` or passing `value` as a number instead of `[value]` causes TypeScript errors or silent bugs.
**How to avoid:** Always: `value={[controls.fieldName]}` and `onValueChange={([v]) => dispatch(...)}`.

### Pitfall 3: Slider Step Precision for Decimal Fields

**What goes wrong:** `revenueGrowthPct` runs −0.04 to +0.08 in decimal (not percent). If `step={0.01}` the slider only has 12 positions. Need `step={0.001}` for smooth dragging.
**How to avoid:** Set step at the decimal level matching the range. Ranges:
  - `revenueGrowthPct`: step=0.001 (range: 0.12, 120 positions)
  - `grossMarginPct`: step=0.001 (range: 0.10, 100 positions)
  - `fuelIndex`: step=1 (integer, range: 60)
  - `collectionsRatePct`: step=0.001 (range: 0.06, 60 positions)
  - `returnsPct`: step=0.001 (range: 0.019, ~19 positions) — or 0.0001 for finer
  - `lateInvoiceHours`: step=0.5 or 1 (range: 14)
  - `journalLoadMultiplier`: step=0.01 (range: 0.5, 50 positions)

### Pitfall 4: Radix Select Portal Hydration Warning

**What goes wrong:** Radix Select renders its dropdown via a Portal to `document.body`. In Next.js, if the Select is rendered server-side, the Portal may cause a hydration mismatch.
**Why it happens:** ScenarioPanel lives inside `"use client"` DashboardApp — it's fully client-rendered. This pitfall does NOT apply here.
**How to avoid:** Confirmed non-issue because DashboardApp is the single client boundary; all children are client-rendered.

### Pitfall 5: Sticky Sidebar + Overflow-Y

**What goes wrong:** If sidebar uses `position: sticky` on the outer wrapper, child `overflow-y: auto` may not scroll correctly unless the parent has a defined height.
**How to avoid:** Set sidebar to `position: sticky; top: 0; height: 100vh; overflow-y: auto`. The flex parent (`DashboardApp`) should have `align-items: flex-start` or use `min-height: 100vh` on the main content, not `height: 100vh`.

### Pitfall 6: Radix Switch Thumb Animation via Inline Style

**What goes wrong:** Positioning the Thumb with `left: checked ? '21px' : '3px'` in inline styles works for initial render but the transition may stutter because React re-renders on each `checked` prop change.
**How to avoid:** Use Radix's built-in `data-state="checked"|"unchecked"` attribute. Add a `<style>` block or CSS class:
```css
[data-radix-switch-thumb][data-state="checked"] { transform: translateX(18px); }
[data-radix-switch-thumb][data-state="unchecked"] { transform: translateX(0); }
```
Or rely on Radix's built-in CSS variable `--radix-switch-thumb-x` (available in newer versions). The safest pattern: set `left: 3px; transition: transform 150ms ease;` and use `data-state` selectors for `transform: translateX(18px)`.

### Pitfall 7: Preset Matching — activePresetId

**What goes wrong:** Comparing Redux `controls` to preset controls with `JSON.stringify` may fail if object key order differs between the stored controls and the preset JSON.
**How to avoid:** Compare field by field:
```ts
const isMatch = (a: ControlState, b: ControlState) =>
  (Object.keys(a) as (keyof ControlState)[]).every(k => a[k] === b[k]);
const activePresetId = presets.find(p => isMatch(p.controls, controls))?.id ?? 'custom';
```

---

## Code Examples

Verified patterns from the existing codebase:

### Redux Dispatch Pattern (from scenarioSlice.ts)

```typescript
// Dispatch a slider change — field must be keyof ControlState
dispatch(setControl({ field: 'revenueGrowthPct', value: 0.045 }));

// Dispatch a toggle change
dispatch(setControl({ field: 'prioritizeCashMode', value: true }));

// Load an entire preset at once
dispatch(loadPreset(preset.controls)); // preset.controls is a full ControlState

// Reset to defaults
dispatch(resetToDefaults(baselinePreset.controls));
```

### Reading Controls from Redux (from Phase 3 KpiSection pattern)

```typescript
const controls = useSelector((s: RootState) => s.scenario.controls);
// controls.revenueGrowthPct, controls.fuelIndex, etc.
```

### Slider Value Formatter Functions

```typescript
// All formatters for the 7 sliders
const sliderFormatters: Record<keyof Pick<ControlState,
  'revenueGrowthPct' | 'grossMarginPct' | 'fuelIndex' |
  'collectionsRatePct' | 'returnsPct' | 'lateInvoiceHours' | 'journalLoadMultiplier'
>, (v: number) => string> = {
  revenueGrowthPct: (v) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`,
  grossMarginPct: (v) => `${(v * 100).toFixed(1)}%`,
  fuelIndex: (v) => `${Math.round(v)}`,
  collectionsRatePct: (v) => `${(v * 100).toFixed(1)}%`,
  returnsPct: (v) => `${(v * 100).toFixed(1)}%`,
  lateInvoiceHours: (v) => `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} hrs`,
  journalLoadMultiplier: (v) => `${v.toFixed(2)}x`,
};
```

### globals.css — Existing CSS Variables for Reference

```css
/* Light mode — used by sidebar styling */
--background: #f7f3ea;
--foreground: #1c2d47;
--card: #fffaf2cc;
--accent: #f5a800;      /* Slider thumb + active range + toggle checked */
--accent-soft: #ffd23126; /* Focus ring */
--muted: #5e6b80;
--border: #d7dce5;
--track: #d7deea;       /* Slider track background (unselected portion) */

/* Dark mode equivalents are already defined — using var() inherits correctly */
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom range input with `window` event listeners | Radix Slider with `onValueChange` | 2021+ | Accessible, keyboard-navigable, no manual event cleanup |
| Controlled state in component | Redux `useSelector` + `useDispatch` | Already established in Phase 3 | KPI cards react automatically — no prop drilling |
| Separate client boundary per interactive component | Single `"use client"` boundary in DashboardApp | Established in Phase 1 | All children can use hooks without extra directives |

**Deprecated/outdated:**
- `onValueCommit` for continuous sliders: Wrong for live-update use case; only use for fire-once-on-release scenarios

---

## Open Questions

1. **Radix Select "custom" state display**
   - What we know: Selecting a preset sets `activePresetId` from the matched preset. If the user moves a slider after selecting a preset, no preset matches anymore.
   - What's unclear: Should the dropdown show a "Custom" item, or just display the last-selected preset label?
   - Recommendation: Add a `"custom"` item in the select with label "Custom" as the first option, value `"custom"`. Set `value={activePresetId}` — it shows "Custom" automatically when no preset matches. Or simplest: track `selectedPresetId` in local component state separate from the Redux controls comparison — update it on preset selection, clear it to `undefined` on any `setControl` dispatch. Display "Select Preset..." placeholder.

2. **Sidebar overflow on small 1080p screens with many controls**
   - What we know: 7 sliders + 4 toggles + 4 group headers + 1 preset row = significant vertical content in 280px width.
   - What's unclear: Exact pixel height required.
   - Recommendation: Set sidebar `overflow-y: auto` with `height: 100vh`. Use compact spacing (`gap: 0.75rem` within groups, `padding: 0.75rem`). At ~14px base font, the panel fits in 1080px height with 1rem outer padding.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @vitejs/plugin-react |
| Config file | `Catie/FP&A Application/fpa-close-efficiency-dashboard/vitest.config.ts` |
| Quick run command | `node .../vitest.mjs run src/components/dashboard/ScenarioPanel/__tests__/` |
| Full suite command | `node .../vitest.mjs run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCEN-01 | `setControl` dispatched with correct field/value when slider changes | unit (Redux action) | `node .../vitest.mjs run src/store/__tests__/scenarioSlice.test.ts` | ❌ Wave 0 |
| SCEN-02 | `setControl` dispatched with boolean when toggle changes | unit (Redux action) | same file | ❌ Wave 0 |
| SCEN-03 | `loadPreset` dispatched with correct controls when preset selected | unit (Redux action) | `node .../vitest.mjs run src/store/__tests__/scenarioSlice.test.ts` | ❌ Wave 0 |
| SCEN-04 | `resetToDefaults` restores baseline controls in Redux state | unit (Redux reducer) | same file | ❌ Wave 0 |

**Note:** Phase 4 is pure UI wiring. The visual rendering (Radix components, slider drag) cannot be meaningfully tested without a DOM environment (`environment: 'jsdom'`). The current Vitest config uses `environment: 'node'`. Tests for Phase 4 should focus on the **Redux reducer behavior** (already exercisable in node env) rather than component rendering.

### Sampling Rate

- **Per task commit:** `node "$(dirname $(which vitest 2>/dev/null || echo '.../vitest.mjs'))/vitest.mjs" run src/store/__tests__/scenarioSlice.test.ts`
- **Per wave merge:** Full suite: `node .../vitest.mjs run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/store/__tests__/scenarioSlice.test.ts` — covers SCEN-01 through SCEN-04 Redux reducer behavior
  - Test: `setControl` updates `controls.revenueGrowthPct`
  - Test: `setControl` updates `controls.prioritizeCashMode`
  - Test: `loadPreset` replaces all 11 controls at once (use fuel-shock preset)
  - Test: `resetToDefaults` restores baseline controls
- [ ] No new test infrastructure needed — vitest.config.ts already covers `src/**/__tests__/**/*.test.ts`

---

## Sources

### Primary (HIGH confidence)

- Existing codebase — `package.json` confirms @radix-ui/react-slider ^1.2.0, @radix-ui/react-switch ^1.1.0, @radix-ui/react-select ^2.1.0 already installed
- Existing codebase — `scenarioSlice.ts` confirms `setControl`, `loadPreset`, `resetToDefaults` action signatures
- Existing codebase — `types.ts` confirms `ControlState` interface (7 numbers + 4 booleans)
- Existing codebase — `scenario-presets.json` confirms 6 presets with `id`, `label`, `controls` shape
- Existing codebase — `globals.css` confirms `--track`, `--accent`, `--card`, `--border`, `--muted` CSS variables for styling

### Secondary (MEDIUM confidence)

- [Radix UI Slider GitHub Discussion #2169](https://github.com/radix-ui/primitives/discussions/2169) — confirms `onValueChange` fires on every drag position, `onValueCommit` fires on pointer-up only
- [Radix UI Slider PR #1696](https://github.com/radix-ui/primitives/pull/1696) — confirms `onValueCommit` was added specifically for discrete changes; continuous updates use `onValueChange`
- WebSearch cross-verified: Radix Switch controlled via `checked`/`onCheckedChange`; Radix Select controlled via `value`/`onValueChange`

### Tertiary (LOW confidence)

- None — all claims verified from installed package.json and official Radix documentation patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — packages confirmed installed in package.json
- Architecture: HIGH — existing DashboardApp.tsx structure fully read; layout change is surgical
- Redux patterns: HIGH — scenarioSlice.ts read directly; all actions confirmed
- Radix API: MEDIUM-HIGH — API confirmed from official documentation and GitHub discussions
- Pitfalls: MEDIUM — derived from Radix UI known behaviors and existing project patterns

**Research date:** 2026-03-04
**Valid until:** 2026-06-04 (Radix UI stable APIs; Redux patterns project-locked)
