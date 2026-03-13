import type {
  BaseInputs,
  ControlState,
  ScenarioHorizon,
} from '@/features/model/types';

const FUEL_COGS_SHARE = 0.18;
const FUEL_BASE_INDEX = 100;

type HorizonWeights = {
  revenueGrowth: number;
  grossMargin: number;
  fuelIndex: number;
  collectionsRate: number;
  returnsPct: number;
  lateInvoiceHours: number;
  journalLoadMultiplier: number;
  prioritizeCashMode: number;
  conservativeForecastBias: number;
  tightenCreditHolds: number;
  inventoryComplexity: number;
};

export type ScenarioMetrics = {
  netSales: number;
  cogs: number;
  grossProfit: number;
  ebitda: number;
  cash: number;
  ar: number;
  ap: number;
  inventory: number;
};

export type MarginBridgeImpacts = {
  baselineEbitda: number;
  adjustedEbitda: number;
  revenueGrowthImpact: number;
  grossMarginImpact: number;
  fuelIndexImpact: number;
  otherLeversImpact: number;
};

const HORIZON_WEIGHTS: Record<ScenarioHorizon, HorizonWeights> = {
  short_term: {
    revenueGrowth: 0.25,
    grossMargin: 0.35,
    fuelIndex: 0.65,
    collectionsRate: 0.75,
    returnsPct: 0.45,
    lateInvoiceHours: 0.75,
    journalLoadMultiplier: 0.8,
    prioritizeCashMode: 0.7,
    conservativeForecastBias: 0.55,
    tightenCreditHolds: 0.65,
    inventoryComplexity: 0.45,
  },
  long_term: {
    revenueGrowth: 1,
    grossMargin: 1,
    fuelIndex: 1,
    collectionsRate: 1,
    returnsPct: 1,
    lateInvoiceHours: 1,
    journalLoadMultiplier: 1,
    prioritizeCashMode: 1,
    conservativeForecastBias: 1,
    tightenCreditHolds: 1,
    inventoryComplexity: 1,
  },
};

const flagDelta = (value: boolean, baseline: boolean) =>
  (value ? 1 : 0) - (baseline ? 1 : 0);

function normalizeBridgeImpact(value: number): number {
  const rounded = Math.round(value);
  return Math.abs(rounded) < 1 ? 0 : rounded;
}

export function getScenarioHorizonLabel(horizon: ScenarioHorizon): string {
  return horizon === 'long_term' ? 'Long Term (1 year)' : 'Short Term (13 weeks)';
}

export function calculateScenarioMetrics(
  base: BaseInputs,
  controls: ControlState,
  baselineControls: ControlState,
  scenarioHorizon: ScenarioHorizon
): ScenarioMetrics {
  const weights = HORIZON_WEIGHTS[scenarioHorizon];

  const revenueGrowthPct = controls.revenueGrowthPct * weights.revenueGrowth;
  const grossMarginPct =
    baselineControls.grossMarginPct +
    (controls.grossMarginPct - baselineControls.grossMarginPct) * weights.grossMargin;
  const fuelIndex =
    FUEL_BASE_INDEX + (controls.fuelIndex - FUEL_BASE_INDEX) * weights.fuelIndex;

  const netSales = base.baseNetSales * (1 + revenueGrowthPct);
  const cogsAtMargin = netSales * (1 - grossMarginPct);
  const fuelDelta =
    cogsAtMargin * FUEL_COGS_SHARE * (fuelIndex / FUEL_BASE_INDEX - 1);
  const cogs = cogsAtMargin + fuelDelta;
  const grossProfit = netSales - cogs;

  const collectionsDelta =
    (controls.collectionsRatePct - baselineControls.collectionsRatePct) *
    weights.collectionsRate;
  const lateInvoiceHoursDelta =
    (controls.lateInvoiceHours - baselineControls.lateInvoiceHours) *
    weights.lateInvoiceHours;
  const journalLoadDelta =
    (controls.journalLoadMultiplier - baselineControls.journalLoadMultiplier) *
    weights.journalLoadMultiplier;
  const prioritizeCashDelta =
    flagDelta(controls.prioritizeCashMode, baselineControls.prioritizeCashMode) *
    weights.prioritizeCashMode;
  const tightenCreditDelta =
    flagDelta(controls.tightenCreditHolds, baselineControls.tightenCreditHolds) *
    weights.tightenCreditHolds;
  const returnsDelta =
    (controls.returnsPct - baselineControls.returnsPct) * weights.returnsPct;
  const conservativeDelta =
    flagDelta(
      controls.conservativeForecastBias,
      baselineControls.conservativeForecastBias
    ) * weights.conservativeForecastBias;
  const inventoryDelta =
    flagDelta(controls.inventoryComplexity, baselineControls.inventoryComplexity) *
    weights.inventoryComplexity;

  // Roll operational scenario controls into EBITDA so the residual "All Other Levers"
  // bar reflects real close-friction and working-capital tradeoffs.
  const otherLeversOperationalImpact =
    collectionsDelta * base.arTotal * 0.035 -
    (controls.returnsPct - baselineControls.returnsPct) *
      weights.returnsPct *
      base.baseNetSales -
    lateInvoiceHoursDelta * base.manualJeCount * 220 -
    journalLoadDelta * base.closeAdjustmentsCount * 1600 -
    prioritizeCashDelta * base.baseNetSales * 0.0012 -
    tightenCreditDelta * base.baseNetSales * 0.0018 -
    conservativeDelta * base.baseNetSales * 0.0015 -
    inventoryDelta * base.inventoryTotal * 0.025;

  const ebitda = grossProfit - base.baseOpex + otherLeversOperationalImpact;

  const cash =
    base.baseCash +
    base.arTotal * collectionsDelta +
    prioritizeCashDelta * base.arTotal * 0.05;
  const ar =
    base.arTotal -
    base.arTotal * collectionsDelta * 2 -
    tightenCreditDelta * base.arTotal * 0.08;
  const ap =
    base.apTotal * (1 + returnsDelta * 5 + conservativeDelta * 0.04);
  const inventory = base.inventoryTotal * (1 + inventoryDelta * 0.12);

  return {
    netSales,
    cogs,
    grossProfit,
    ebitda,
    cash,
    ar,
    ap,
    inventory,
  };
}

export function calculateMarginBridgeImpacts(
  base: BaseInputs,
  controls: ControlState,
  baselineControls: ControlState,
  scenarioHorizon: ScenarioHorizon
): MarginBridgeImpacts {
  const weights = HORIZON_WEIGHTS[scenarioHorizon];
  const baselineMetrics = calculateScenarioMetrics(
    base,
    baselineControls,
    baselineControls,
    scenarioHorizon
  );
  const adjustedMetrics = calculateScenarioMetrics(
    base,
    controls,
    baselineControls,
    scenarioHorizon
  );

  const adjustedGrossMarginPct =
    baselineControls.grossMarginPct +
    (controls.grossMarginPct - baselineControls.grossMarginPct) * weights.grossMargin;
  const adjustedNetSales = adjustedMetrics.netSales;
  const revenueGrowthImpact =
    base.baseNetSales *
    (controls.revenueGrowthPct - baselineControls.revenueGrowthPct) *
    weights.revenueGrowth *
    adjustedGrossMarginPct;
  const grossMarginImpact =
    adjustedNetSales *
    (controls.grossMarginPct - baselineControls.grossMarginPct) *
    weights.grossMargin;

  const baselineFuelIndex =
    FUEL_BASE_INDEX +
    (baselineControls.fuelIndex - FUEL_BASE_INDEX) * weights.fuelIndex;
  const adjustedFuelIndex =
    FUEL_BASE_INDEX + (controls.fuelIndex - FUEL_BASE_INDEX) * weights.fuelIndex;
  const cogsAtMargin = adjustedNetSales * (1 - adjustedGrossMarginPct);
  const fuelIndexImpact =
    -(
      cogsAtMargin *
      FUEL_COGS_SHARE *
      ((adjustedFuelIndex - baselineFuelIndex) / FUEL_BASE_INDEX)
    ) || 0;

  const revenueGrowthImpactNormalized = normalizeBridgeImpact(revenueGrowthImpact);
  const grossMarginImpactNormalized = normalizeBridgeImpact(grossMarginImpact);
  const fuelIndexImpactNormalized = normalizeBridgeImpact(fuelIndexImpact);
  const otherLeversImpact =
    adjustedMetrics.ebitda -
    baselineMetrics.ebitda -
    revenueGrowthImpactNormalized -
    grossMarginImpactNormalized -
    fuelIndexImpactNormalized;
  const otherLeversImpactNormalized = normalizeBridgeImpact(otherLeversImpact);

  return {
    baselineEbitda: normalizeBridgeImpact(baselineMetrics.ebitda),
    adjustedEbitda: normalizeBridgeImpact(adjustedMetrics.ebitda),
    revenueGrowthImpact: revenueGrowthImpactNormalized,
    grossMarginImpact: grossMarginImpactNormalized,
    fuelIndexImpact: fuelIndexImpactNormalized,
    otherLeversImpact: otherLeversImpactNormalized,
  };
}
