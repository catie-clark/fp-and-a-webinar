// src/store/__tests__/scenarioSlice.test.ts
// Phase 04 Wave 0 — Redux reducer contract tests for scenarioSlice.
// Covers SCEN-01 through SCEN-04. Tests run in node environment (no DOM needed).
import { describe, it, expect } from 'vitest';
import scenarioSlice, {
  setControl,
  loadPreset,
  resetToDefaults,
} from '@/store/scenarioSlice';
import type { ControlState } from '@/features/model/types';

const reducer = scenarioSlice.reducer;

// Initial state as returned by the reducer with no action
const initialState = reducer(undefined, { type: '@@INIT' });

describe('scenarioSlice reducer', () => {
  // SCEN-01: setControl updates a numeric field
  it('SCEN-01: setControl updates a numeric control field', () => {
    const action = setControl({ field: 'revenueGrowthPct', value: 0.05 });
    const nextState = reducer(initialState, action);
    expect(nextState.controls.revenueGrowthPct).toBe(0.05);
  });

  // SCEN-02: setControl updates a boolean field
  it('SCEN-02: setControl updates a boolean control field', () => {
    const action = setControl({ field: 'prioritizeCashMode', value: true });
    const nextState = reducer(initialState, action);
    expect(nextState.controls.prioritizeCashMode).toBe(true);
  });

  // SCEN-03: loadPreset replaces all 11 ControlState fields with fuel-shock preset
  it('SCEN-03: loadPreset replaces all controls with the provided preset', () => {
    const fuelShockControls: ControlState = {
      revenueGrowthPct: 0.03,
      grossMarginPct: 0.22,
      fuelIndex: 137,
      collectionsRatePct: 0.97,
      returnsPct: 0.012,
      lateInvoiceHours: 4,
      journalLoadMultiplier: 1.0,
      prioritizeCashMode: false,
      conservativeForecastBias: false,
      tightenCreditHolds: false,
      inventoryComplexity: false,
    };

    const action = loadPreset(fuelShockControls);
    const nextState = reducer(initialState, action);

    expect(nextState.controls).toEqual(fuelShockControls);
  });

  // SCEN-04: resetToDefaults restores baseline controls after modification
  it('SCEN-04: resetToDefaults restores all controls to the baseline preset', () => {
    const baselineControls: ControlState = {
      revenueGrowthPct: 0.03,
      grossMarginPct: 0.25,
      fuelIndex: 118,
      collectionsRatePct: 0.97,
      returnsPct: 0.012,
      lateInvoiceHours: 4,
      journalLoadMultiplier: 1.0,
      prioritizeCashMode: false,
      conservativeForecastBias: false,
      tightenCreditHolds: false,
      inventoryComplexity: false,
    };

    // Modify state first to verify that resetToDefaults actually changes something
    const modifiedState = reducer(
      initialState,
      setControl({ field: 'fuelIndex', value: 200 })
    );
    expect(modifiedState.controls.fuelIndex).toBe(200);

    // Now reset
    const resetAction = resetToDefaults(baselineControls);
    const nextState = reducer(modifiedState, resetAction);

    expect(nextState.controls).toEqual(baselineControls);
  });
});
