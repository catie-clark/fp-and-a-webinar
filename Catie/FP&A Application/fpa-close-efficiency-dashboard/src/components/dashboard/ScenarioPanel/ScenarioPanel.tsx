// src/components/dashboard/ScenarioPanel/ScenarioPanel.tsx
// No "use client" — ScenarioPanel renders inside DashboardApp's existing client boundary.
// All 11 controls: 7 sliders + 4 toggles wired to Redux scenarioSlice via setControl.
// PresetRow: Radix Select dropdown + Reset button (Plan 03).

import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store';
import type { ControlState, ScenarioPreset } from '@/features/model/types';
import { setControl, loadPreset, resetToDefaults } from '@/store/scenarioSlice';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as SelectPrimitive from '@radix-ui/react-select';

// ─── Prop Types ───────────────────────────────────────────────────────────────

interface ScenarioPanelProps {
  presets: ScenarioPreset[];
}

// ─── Value Formatter ─────────────────────────────────────────────────────────

const formatSliderValue = (field: keyof ControlState, v: number): string => {
  switch (field) {
    case 'revenueGrowthPct':
      return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
    case 'grossMarginPct':
    case 'collectionsRatePct':
    case 'returnsPct':
      return `${(v * 100).toFixed(1)}%`;
    case 'fuelIndex':
      return `${Math.round(v)}`;
    case 'lateInvoiceHours':
      return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} hrs`;
    case 'journalLoadMultiplier':
      return `${v.toFixed(2)}x`;
    default:
      return String(v);
  }
};

// ─── Slider Config ────────────────────────────────────────────────────────────

const SLIDER_CONFIG = [
  // Revenue Levers group
  { field: 'revenueGrowthPct', label: 'Revenue Growth', min: -0.04, max: 0.08, step: 0.001, group: 'Revenue Levers' },
  { field: 'grossMarginPct', label: 'Gross Margin', min: 0.18, max: 0.28, step: 0.001, group: 'Revenue Levers' },
  // Cost Levers group
  { field: 'fuelIndex', label: 'Fuel Index', min: 80, max: 140, step: 1, group: 'Cost Levers' },
  { field: 'returnsPct', label: 'Returns', min: 0.006, max: 0.025, step: 0.0001, group: 'Cost Levers' },
  // Operations group
  { field: 'collectionsRatePct', label: 'Collections Rate', min: 0.94, max: 1.00, step: 0.001, group: 'Operations' },
  { field: 'lateInvoiceHours', label: 'Late Invoice Hours', min: 0, max: 14, step: 0.5, group: 'Operations' },
  { field: 'journalLoadMultiplier', label: 'Journal Load', min: 0.8, max: 1.3, step: 0.01, group: 'Operations' },
] as const;

// ─── Toggle Config ────────────────────────────────────────────────────────────

const TOGGLE_CONFIG = [
  { field: 'prioritizeCashMode', label: 'Prioritize Cash Mode' },
  { field: 'conservativeForecastBias', label: 'Conservative Forecast Bias' },
  { field: 'tightenCreditHolds', label: 'Tighten Credit Holds' },
  { field: 'inventoryComplexity', label: 'Inventory Complexity' },
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ControlGroupProps {
  label: string;
  children: React.ReactNode;
}

function ControlGroup({ label, children }: ControlGroupProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <span
        style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--muted)',
          paddingBottom: '0.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'block',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

interface SliderControlProps {
  field: keyof ControlState;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onValueChange: (value: number) => void;
}

function SliderControl({ field, label, min, max, step, value, onValueChange }: SliderControlProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {/* Label + Value row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '0.8125rem',
            color: 'var(--foreground)',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: '0.8125rem',
            color: 'var(--accent)',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatSliderValue(field, value)}
        </span>
      </div>
      {/* Radix Slider — onValueChange fires on every drag position (not just pointer-up) */}
      <SliderPrimitive.Root
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]: number[]) => onValueChange(v)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          userSelect: 'none',
          touchAction: 'none',
          width: '100%',
          height: '20px',
        }}
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
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '0 2px 6px rgba(245,168,0,0.40)',
            transition: 'box-shadow 150ms ease',
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 0 0 3px var(--accent-soft), 0 2px 6px rgba(245,168,0,0.40)';
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 6px rgba(245,168,0,0.40)';
          }}
        />
      </SliderPrimitive.Root>
    </div>
  );
}

interface ToggleControlProps {
  field: keyof ControlState;
  label: string;
  value: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ToggleControl({ label, value, onCheckedChange }: ToggleControlProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.25rem 0',
      }}
    >
      <span
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--foreground)',
        }}
      >
        {label}
      </span>
      <SwitchPrimitive.Root
        checked={value}
        onCheckedChange={(v: boolean) => onCheckedChange(v)}
        style={{
          position: 'relative',
          width: '40px',
          height: '22px',
          background: value ? 'var(--accent)' : 'var(--track)',
          borderRadius: '9999px',
          border: 'none',
          cursor: 'pointer',
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
          }}
        />
      </SwitchPrimitive.Root>
    </div>
  );
}

// ─── PresetRow ────────────────────────────────────────────────────────────────

interface PresetRowProps {
  presets: ScenarioPreset[];
  controls: ControlState;
  onSelect: (preset: ScenarioPreset) => void;
  onReset: () => void;
}

// Field-by-field comparison (not JSON.stringify — key order is not guaranteed)
const isMatch = (a: ControlState, b: ControlState): boolean =>
  (Object.keys(a) as (keyof ControlState)[]).every((k) => a[k] === b[k]);

function PresetRow({ presets, controls, onSelect, onReset }: PresetRowProps) {
  const activePresetId = presets.find((p) => isMatch(p.controls, controls))?.id ?? 'custom';

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
      {/* Radix Select hover highlight style */}
      <style>{`
        [data-radix-select-item][data-highlighted] {
          background: var(--accent-soft);
          outline: none;
        }
      `}</style>

      <SelectPrimitive.Root
        value={activePresetId}
        onValueChange={(id) => {
          const p = presets.find((preset) => preset.id === id);
          if (p) onSelect(p);
        }}
      >
        <SelectPrimitive.Trigger
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
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
          <SelectPrimitive.Icon style={{ marginLeft: '0.25rem' }}>▾</SelectPrimitive.Icon>
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
              {/* "Custom" placeholder shown when no preset matches */}
              <SelectPrimitive.Item
                value="custom"
                style={{
                  padding: '0.375rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  outline: 'none',
                  fontStyle: 'italic',
                }}
              >
                <SelectPrimitive.ItemText>— Custom —</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>

              {presets.map((preset) => (
                <SelectPrimitive.Item
                  key={preset.id}
                  value={preset.id}
                  style={{
                    padding: '0.375rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    color: 'var(--foreground)',
                    outline: 'none',
                  }}
                >
                  <SelectPrimitive.ItemText>{preset.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {/* Reset button */}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ScenarioPanel({ presets }: ScenarioPanelProps) {
  const controls = useSelector((s: RootState) => s.scenario.controls);
  const dispatch = useDispatch();

  const baseline = presets.find((p) => p.id === 'baseline') ?? presets[0];

  const handleSliderChange = (field: keyof ControlState) => (value: number) => {
    dispatch(setControl({ field, value }));
  };

  const handleToggleChange = (field: keyof ControlState) => (checked: boolean) => {
    dispatch(setControl({ field, value: checked }));
  };

  const revenueSliders = SLIDER_CONFIG.filter((c) => c.group === 'Revenue Levers');
  const costSliders = SLIDER_CONFIG.filter((c) => c.group === 'Cost Levers');
  const operationsSliders = SLIDER_CONFIG.filter((c) => c.group === 'Operations');

  return (
    <div
      style={{
        padding: '1rem 0.875rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* Switch thumb CSS — uses data-state selectors for smooth animation without re-render jank */}
      <style>{`
        [data-radix-switch-thumb] { left: 3px; transition: transform 150ms ease; }
        [data-radix-switch-thumb][data-state="checked"] { transform: translateX(18px); }
      `}</style>

      {/* PresetRow: dropdown + reset button */}
      <PresetRow
        presets={presets}
        controls={controls}
        onSelect={(preset) => dispatch(loadPreset(preset.controls))}
        onReset={() => dispatch(resetToDefaults(baseline.controls))}
      />

      {/* Revenue Levers */}
      <ControlGroup label="Revenue Levers">
        {revenueSliders.map((cfg) => (
          <SliderControl
            key={cfg.field}
            field={cfg.field as keyof ControlState}
            label={cfg.label}
            min={cfg.min}
            max={cfg.max}
            step={cfg.step}
            value={controls[cfg.field as keyof typeof controls] as number}
            onValueChange={handleSliderChange(cfg.field as keyof ControlState)}
          />
        ))}
      </ControlGroup>

      {/* Cost Levers */}
      <ControlGroup label="Cost Levers">
        {costSliders.map((cfg) => (
          <SliderControl
            key={cfg.field}
            field={cfg.field as keyof ControlState}
            label={cfg.label}
            min={cfg.min}
            max={cfg.max}
            step={cfg.step}
            value={controls[cfg.field as keyof typeof controls] as number}
            onValueChange={handleSliderChange(cfg.field as keyof ControlState)}
          />
        ))}
      </ControlGroup>

      {/* Operations */}
      <ControlGroup label="Operations">
        {operationsSliders.map((cfg) => (
          <SliderControl
            key={cfg.field}
            field={cfg.field as keyof ControlState}
            label={cfg.label}
            min={cfg.min}
            max={cfg.max}
            step={cfg.step}
            value={controls[cfg.field as keyof typeof controls] as number}
            onValueChange={handleSliderChange(cfg.field as keyof ControlState)}
          />
        ))}
      </ControlGroup>

      {/* Business Modes */}
      <ControlGroup label="Business Modes">
        {TOGGLE_CONFIG.map((cfg) => (
          <ToggleControl
            key={cfg.field}
            field={cfg.field as keyof ControlState}
            label={cfg.label}
            value={controls[cfg.field as keyof typeof controls] as boolean}
            onCheckedChange={handleToggleChange(cfg.field as keyof ControlState)}
          />
        ))}
      </ControlGroup>
    </div>
  );
}
