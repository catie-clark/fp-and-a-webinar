// src/store/scenarioSlice.ts
// Redux slice: scenario controls + base financial inputs.
// Phase 4 dispatches setControl/loadPreset/resetToDefaults.
// Phase 3 dispatches initializeFromSeedData from DashboardApp.
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  BaseInputs,
  ControlState,
  ScenarioHorizon,
} from '@/features/model/types';

interface ScenarioState {
  baseInputs: BaseInputs;
  baselineControls: ControlState;
  controls: ControlState;
  scenarioHorizon: ScenarioHorizon;
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
    baselineControls: DEFAULT_CONTROLS,
    controls: DEFAULT_CONTROLS,
    scenarioHorizon: 'short_term',
  } as ScenarioState,
  reducers: {
    initializeFromSeedData(
      state,
      action: PayloadAction<{ baseInputs: BaseInputs; defaultControls: ControlState }>
    ) {
      state.baseInputs = action.payload.baseInputs;
      state.baselineControls = action.payload.defaultControls;
      state.controls = action.payload.defaultControls;
      state.scenarioHorizon = 'short_term';
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
    resetToDefaults(state) {
      state.controls = state.baselineControls;
      state.scenarioHorizon = 'short_term';
    },
    setScenarioHorizon(state, action: PayloadAction<ScenarioHorizon>) {
      state.scenarioHorizon = action.payload;
    },
  },
});

export const {
  initializeFromSeedData,
  setControl,
  loadPreset,
  resetToDefaults,
  setScenarioHorizon,
} = scenarioSlice.actions;
export default scenarioSlice;
