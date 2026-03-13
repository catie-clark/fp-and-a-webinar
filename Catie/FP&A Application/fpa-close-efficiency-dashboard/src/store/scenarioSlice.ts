// src/store/scenarioSlice.ts
// Redux slice: scenario controls + base financial inputs.
// Phase 4 dispatches setControl/loadPreset/resetToDefaults.
// Phase 3 dispatches initializeFromSeedData from DashboardApp.
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { BaseInputs, ControlState } from '@/features/model/types';

interface ScenarioState {
  baseInputs: BaseInputs;
  controls: ControlState;
}

const DEFAULT_BASE_INPUTS: BaseInputs = {
  baseNetSales: 0,
  baseOpex: 0,
  baseCash: 0,
  baseCashInWeekly: 0,
  arTotal: 0,
  apTotal: 0,
  inventoryTotal: 0,
  manualJeCount: 0,
  closeAdjustmentsCount: 0,
  pipelineExecutionRatio: 0,
  variancePct: 0.034,
  baseEbitda: 0,
  baseGrossMarginPct: 0.25,
};

const DEFAULT_CONTROLS: ControlState = {
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

const scenarioSlice = createSlice({
  name: 'scenario',
  initialState: {
    baseInputs: DEFAULT_BASE_INPUTS,
    controls: DEFAULT_CONTROLS,
  } as ScenarioState,
  reducers: {
    initializeFromSeedData(
      state,
      action: PayloadAction<{ baseInputs: BaseInputs; defaultControls: ControlState }>
    ) {
      state.baseInputs = action.payload.baseInputs;
      state.controls = action.payload.defaultControls;
    },
    setControl(
      state,
      action: PayloadAction<{ field: keyof ControlState; value: number | boolean }>
    ) {
      (state.controls as Record<string, number | boolean>)[action.payload.field] =
        action.payload.value;
    },
    loadPreset(state, action: PayloadAction<ControlState>) {
      state.controls = action.payload;
    },
    resetToDefaults(state, action: PayloadAction<ControlState>) {
      state.controls = action.payload;
    },
  },
});

export const { initializeFromSeedData, setControl, loadPreset, resetToDefaults } =
  scenarioSlice.actions;
export default scenarioSlice;
