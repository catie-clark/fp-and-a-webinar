import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';
import {
  calculateMarginBridgeImpacts,
  calculateScenarioMetrics,
} from './scenarioMath';

const selectBaseInputs = (state: RootState) => state.scenario.baseInputs;
const selectBaselineControls = (state: RootState) => state.scenario.baselineControls;
const selectControls = (state: RootState) => state.scenario.controls;
const selectScenarioHorizon = (state: RootState) => state.scenario.scenarioHorizon;

export const selectScenarioMetrics = createSelector(
  [selectBaseInputs, selectControls, selectBaselineControls, selectScenarioHorizon],
  (base, controls, baselineControls, scenarioHorizon) =>
    calculateScenarioMetrics(base, controls, baselineControls, scenarioHorizon)
);

export const selectScenarioBaselineMetrics = createSelector(
  [selectBaseInputs, selectBaselineControls, selectScenarioHorizon],
  (base, baselineControls, scenarioHorizon) =>
    calculateScenarioMetrics(base, baselineControls, baselineControls, scenarioHorizon)
);

export const selectNetSales = createSelector(
  [selectScenarioMetrics],
  (metrics) => metrics.netSales
);

export const selectCogs = createSelector(
  [selectScenarioMetrics],
  (metrics) => metrics.cogs
);

export const selectGrossProfit = createSelector(
  [selectScenarioMetrics],
  (metrics) => metrics.grossProfit
);

export const selectEbitda = createSelector(
  [selectScenarioMetrics],
  (metrics) => metrics.ebitda
);

export const selectCash = createSelector(
  [selectScenarioMetrics],
  (metrics) => metrics.cash
);

export const selectAr = createSelector(
  [selectScenarioMetrics],
  (metrics) => metrics.ar
);

export const selectAp = createSelector(
  [selectScenarioMetrics],
  (metrics) => metrics.ap
);

export const selectInventory = createSelector(
  [selectScenarioMetrics],
  (metrics) => metrics.inventory
);

export const selectMarginBridgeImpacts = createSelector(
  [selectBaseInputs, selectControls, selectBaselineControls, selectScenarioHorizon],
  (base, controls, baselineControls, scenarioHorizon) =>
    calculateMarginBridgeImpacts(base, controls, baselineControls, scenarioHorizon)
);

export const selectBaselineEbitda = createSelector(
  [selectMarginBridgeImpacts],
  (impacts) => impacts.baselineEbitda
);

export const selectRevenueGrowthImpact = createSelector(
  [selectMarginBridgeImpacts],
  (impacts) => impacts.revenueGrowthImpact
);

export const selectGrossMarginImpact = createSelector(
  [selectMarginBridgeImpacts],
  (impacts) => impacts.grossMarginImpact
);

export const selectFuelIndexImpact = createSelector(
  [selectMarginBridgeImpacts],
  (impacts) => impacts.fuelIndexImpact
);

export const selectOtherLeversImpact = createSelector(
  [selectMarginBridgeImpacts],
  (impacts) => impacts.otherLeversImpact
);
