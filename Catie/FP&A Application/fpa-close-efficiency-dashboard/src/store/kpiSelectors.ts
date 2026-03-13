// src/store/kpiSelectors.ts
// Memoized KPI selectors for all 8 financial metrics.
// Formula constants: FUEL_COGS_SHARE=0.18 (logistics co.), FUEL_BASE_INDEX=100
// Fuel delta applies ONLY to the 18% fuel-sensitive share of COGS — NOT total COGS.
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';

const selectBaseInputs = (state: RootState) => state.scenario.baseInputs;
const selectControls = (state: RootState) => state.scenario.controls;

const FUEL_COGS_SHARE = 0.18;
const FUEL_BASE_INDEX = 100;

export const selectNetSales = createSelector(
  [selectBaseInputs, selectControls],
  (base, controls) => base.baseNetSales * (1 + controls.revenueGrowthPct)
);

export const selectCogs = createSelector(
  [selectBaseInputs, selectControls, selectNetSales],
  (base, controls, netSales) => {
    const cogsAtMargin = netSales * (1 - controls.grossMarginPct);
    // Fuel delta: only the fuel-sensitive 18% of COGS adjusts with fuel index
    const fuelDelta =
      cogsAtMargin * FUEL_COGS_SHARE * (controls.fuelIndex / FUEL_BASE_INDEX - 1);
    return cogsAtMargin + fuelDelta;
  }
);

export const selectGrossProfit = createSelector(
  [selectNetSales, selectCogs],
  (netSales, cogs) => netSales - cogs
);

export const selectEbitda = createSelector(
  [selectBaseInputs, selectGrossProfit],
  (base, grossProfit) => grossProfit - base.baseOpex
);

export const selectCash = createSelector(
  [selectBaseInputs, selectControls],
  (base, controls) => {
    const cashFromCollections = base.arTotal * (controls.collectionsRatePct - 0.97);
    const modeBoost = controls.prioritizeCashMode ? base.arTotal * 0.05 : 0;
    return base.baseCash + cashFromCollections + modeBoost;
  }
);

export const selectAr = createSelector(
  [selectBaseInputs, selectControls],
  (base, controls) => {
    const collectionsDelta = base.arTotal * (controls.collectionsRatePct - 0.97) * 2;
    const holdReduction = controls.tightenCreditHolds ? base.arTotal * 0.08 : 0;
    return base.arTotal - collectionsDelta - holdReduction;
  }
);

export const selectAp = createSelector(
  [selectBaseInputs, selectControls],
  (base, controls) => {
    const returnsDelta = (controls.returnsPct - 0.012) * 5;
    const conservativeDelta = controls.conservativeForecastBias ? 0.04 : 0;
    return base.apTotal * (1 + returnsDelta + conservativeDelta);
  }
);

export const selectInventory = createSelector(
  [selectBaseInputs, selectControls],
  (base, controls) => base.inventoryTotal * (controls.inventoryComplexity ? 1.12 : 1.0)
);

// ─── MARGIN BRIDGE SELECTORS (Phase 7 — CHRT-01) ───────────────────────────
// These selectors decompose EBITDA change into 4 lever-attributed deltas.
// selectOtherLeversImpact is a residual and is always ~0 with current formulas
// because collections/returns/toggles only affect Cash/AR/AP (not EBITDA).

export const selectBaselineEbitda = (state: RootState): number =>
  state.scenario.baseInputs.baseEbitda;

export const selectRevenueGrowthImpact = createSelector(
  [selectBaseInputs, selectControls],
  (base, controls) =>
    base.baseNetSales * controls.revenueGrowthPct * controls.grossMarginPct
);

export const selectGrossMarginImpact = createSelector(
  [selectBaseInputs, selectControls, selectNetSales],
  (base, controls, netSales) =>
    netSales * (controls.grossMarginPct - base.baseGrossMarginPct)
);

export const selectFuelIndexImpact = createSelector(
  [selectControls, selectNetSales],
  (controls, netSales) => {
    const cogsAtMargin = netSales * (1 - controls.grossMarginPct);
    const fuelDelta =
      cogsAtMargin * FUEL_COGS_SHARE * (controls.fuelIndex / FUEL_BASE_INDEX - 1);
    return -fuelDelta || 0; // avoid -0 floating point artefact
  }
);

export const selectOtherLeversImpact = createSelector(
  [
    selectEbitda,
    selectBaselineEbitda,
    selectRevenueGrowthImpact,
    selectGrossMarginImpact,
    selectFuelIndexImpact,
  ],
  (adjusted, baseline, revGrowth, grossMargin, fuel) =>
    adjusted - baseline - revGrowth - grossMargin - fuel
);
