// Wave 1 RED stubs — functions and selectors imported here do NOT exist yet.
// Uses beforeAll error-capture pattern so tests show as FAILED not SKIPPED.
// Wave 2 will implement the production code and turn these GREEN.

import { describe, it, expect, beforeAll } from 'vitest';

// ─── Inline makeState helper ────────────────────────────────────────────────
// DO NOT import from store — import fails at test parse time.
function makeState(overrides: Partial<{
  baseEbitda: number;
  baseGrossMarginPct: number;
  baseNetSales: number;
  baseOpex: number;
  revenueGrowthPct: number;
  grossMarginPct: number;
  fuelIndex: number;
}> = {}): unknown {
  const base = {
    baseNetSales: 9_200_000,
    baseOpex: 1_800_000,
    baseEbitda: 500_000,       // baseline: 9.2M * 0.25 - 1.8M
    baseGrossMarginPct: 0.25,
    baseCash: 0,
    arTotal: 0,
    apTotal: 0,
    inventoryTotal: 0,
    manualJeCount: 0,
    closeAdjustmentsCount: 0,
    pipelineExecutionRatio: 0.9,
    variancePct: 0.034,
    baseCashInWeekly: 0,
  };
  const controls = {
    revenueGrowthPct: 0,
    grossMarginPct: 0.25,
    fuelIndex: 100,
    collectionsRatePct: 0.97,
    returnsPct: 0.012,
    lateInvoiceHours: 0,
    journalLoadMultiplier: 1.0,
    prioritizeCashMode: false,
    conservativeForecastBias: false,
    tightenCreditHolds: false,
    inventoryComplexity: false,
  };
  return {
    scenario: {
      baseInputs: {
        ...base,
        ...(overrides.baseEbitda !== undefined ? { baseEbitda: overrides.baseEbitda } : {}),
        ...(overrides.baseGrossMarginPct !== undefined ? { baseGrossMarginPct: overrides.baseGrossMarginPct } : {}),
        ...(overrides.baseNetSales !== undefined ? { baseNetSales: overrides.baseNetSales } : {}),
        ...(overrides.baseOpex !== undefined ? { baseOpex: overrides.baseOpex } : {}),
      },
      controls: {
        ...controls,
        ...(overrides.revenueGrowthPct !== undefined ? { revenueGrowthPct: overrides.revenueGrowthPct } : {}),
        ...(overrides.grossMarginPct !== undefined ? { grossMarginPct: overrides.grossMarginPct } : {}),
        ...(overrides.fuelIndex !== undefined ? { fuelIndex: overrides.fuelIndex } : {}),
      },
    },
  };
}

// ─── Deferred imports — will fail until Wave 2 creates them ─────────────────
// chartDataUtils import (buildMarginBridgeData not yet exported)
let buildMarginBridgeData: (baseEbitda: number, adjustedEbitda: number, state: unknown) => unknown[];
let chartUtilsError: unknown;

// kpiSelectors import (5 selectors not yet added)
let selectBaselineEbitda: (state: unknown) => number;
let selectRevenueGrowthImpact: (state: unknown) => number;
let selectGrossMarginImpact: (state: unknown) => number;
let selectFuelIndexImpact: (state: unknown) => number;
let selectOtherLeversImpact: (state: unknown) => number;
let selectorError: unknown;

beforeAll(async () => {
  try {
    const mod = await import('@/components/dashboard/ChartsSection/chartDataUtils');
    buildMarginBridgeData = (mod as Record<string, unknown>).buildMarginBridgeData as typeof buildMarginBridgeData;
  } catch (err) {
    chartUtilsError = err;
  }
});

beforeAll(async () => {
  try {
    const mod = await import('@/store/kpiSelectors');
    selectBaselineEbitda = (mod as Record<string, unknown>).selectBaselineEbitda as typeof selectBaselineEbitda;
    selectRevenueGrowthImpact = (mod as Record<string, unknown>).selectRevenueGrowthImpact as typeof selectRevenueGrowthImpact;
    selectGrossMarginImpact = (mod as Record<string, unknown>).selectGrossMarginImpact as typeof selectGrossMarginImpact;
    selectFuelIndexImpact = (mod as Record<string, unknown>).selectFuelIndexImpact as typeof selectFuelIndexImpact;
    selectOtherLeversImpact = (mod as Record<string, unknown>).selectOtherLeversImpact as typeof selectOtherLeversImpact;
  } catch (err) {
    selectorError = err;
  }
});

// ─── buildMarginBridgeData tests (CHRT-01) ───────────────────────────────────

describe('buildMarginBridgeData (CHRT-01)', () => {
  it('Test 1: returns array of length 6 (6 waterfall bars)', () => {
    if (chartUtilsError) throw chartUtilsError;
    const state = makeState();
    const result = buildMarginBridgeData(500_000, 600_000, state) as unknown[];
    expect(result).toHaveLength(6);
  });

  it('Test 2: bars are in order: Baseline EBITDA, Revenue Growth, Gross Margin, Fuel Index, All Other Levers, Adjusted EBITDA', () => {
    if (chartUtilsError) throw chartUtilsError;
    const state = makeState();
    const result = buildMarginBridgeData(500_000, 600_000, state) as Array<{ name: string }>;
    expect(result[0].name).toBe('Baseline EBITDA');
    expect(result[1].name).toBe('Revenue Growth');
    expect(result[2].name).toBe('Gross Margin');
    expect(result[3].name).toBe('Fuel Index');
    expect(result[4].name).toBe('All Other Levers');
    expect(result[5].name).toBe('Adjusted EBITDA');
  });
});

// ─── Selector tests (CHRT-01 / margin bridge selectors) ──────────────────────

describe('selectBaselineEbitda (CHRT-01)', () => {
  it('Test 3: returns state.scenario.baseInputs.baseEbitda', () => {
    if (selectorError) throw selectorError;
    const state = makeState({ baseEbitda: 500_000 });
    expect(selectBaselineEbitda(state)).toBe(500_000);
  });
});

describe('selectRevenueGrowthImpact (CHRT-01)', () => {
  it('Test 4: equals 0 when revenueGrowthPct = 0', () => {
    if (selectorError) throw selectorError;
    const state = makeState({ revenueGrowthPct: 0 });
    expect(selectRevenueGrowthImpact(state)).toBe(0);
  });
});

describe('selectFuelIndexImpact (CHRT-01)', () => {
  it('Test 5: equals 0 when fuelIndex = 100', () => {
    if (selectorError) throw selectorError;
    const state = makeState({ fuelIndex: 100 });
    expect(selectFuelIndexImpact(state)).toBe(0);
  });

  it('Test 7: is negative (< 0) when fuelIndex = 137 (Fuel Cost Shock preset)', () => {
    if (selectorError) throw selectorError;
    const state = makeState({ fuelIndex: 137 });
    expect(selectFuelIndexImpact(state)).toBeLessThan(0);
  });
});

describe('selectGrossMarginImpact (CHRT-01)', () => {
  it('Test 6: equals 0 when grossMarginPct === baseGrossMarginPct', () => {
    if (selectorError) throw selectorError;
    const state = makeState({ grossMarginPct: 0.25, baseGrossMarginPct: 0.25 });
    expect(selectGrossMarginImpact(state)).toBe(0);
  });
});
