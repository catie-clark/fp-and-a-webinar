import { beforeAll, describe, expect, it } from 'vitest';

function makeState(
  overrides: Partial<{
    baseEbitda: number;
    baseGrossMarginPct: number;
    baseNetSales: number;
    baseOpex: number;
    revenueGrowthPct: number;
    grossMarginPct: number;
    fuelIndex: number;
    scenarioHorizon: 'short_term' | 'long_term';
  }> = {}
): unknown {
  const baselineControls = {
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

  return {
    scenario: {
      baseInputs: {
        baseNetSales: 9_200_000,
        baseOpex: 1_800_000,
        baseEbitda: 500_000,
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
        ...(overrides.baseEbitda !== undefined ? { baseEbitda: overrides.baseEbitda } : {}),
        ...(overrides.baseGrossMarginPct !== undefined ? { baseGrossMarginPct: overrides.baseGrossMarginPct } : {}),
        ...(overrides.baseNetSales !== undefined ? { baseNetSales: overrides.baseNetSales } : {}),
        ...(overrides.baseOpex !== undefined ? { baseOpex: overrides.baseOpex } : {}),
      },
      baselineControls,
      controls: {
        ...baselineControls,
        ...(overrides.revenueGrowthPct !== undefined ? { revenueGrowthPct: overrides.revenueGrowthPct } : {}),
        ...(overrides.grossMarginPct !== undefined ? { grossMarginPct: overrides.grossMarginPct } : {}),
        ...(overrides.fuelIndex !== undefined ? { fuelIndex: overrides.fuelIndex } : {}),
      },
      scenarioHorizon: overrides.scenarioHorizon ?? 'long_term',
    },
  };
}

let buildMarginBridgeData: (baseEbitda: number, adjustedEbitda: number, state: unknown) => unknown[];
let chartUtilsError: unknown;

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

describe('buildMarginBridgeData', () => {
  it('returns six waterfall bars', () => {
    if (chartUtilsError) throw chartUtilsError;
    const state = makeState();
    const result = buildMarginBridgeData(500_000, 600_000, state) as unknown[];
    expect(result).toHaveLength(6);
  });

  it('keeps the expected waterfall bar ordering', () => {
    if (chartUtilsError) throw chartUtilsError;
    const state = makeState();
    const result = buildMarginBridgeData(500_000, 600_000, state) as Array<{ name: string }>;
    expect(result.map((entry) => entry.name)).toEqual([
      'Baseline EBITDA',
      'Revenue Growth',
      'Gross Margin',
      'Fuel Index',
      'All Other Levers',
      'Adjusted EBITDA',
    ]);
  });
});

describe('margin bridge selectors', () => {
  it('selectBaselineEbitda returns a positive baseline value', () => {
    if (selectorError) throw selectorError;
    const state = makeState({ baseEbitda: 500_000 });
    expect(selectBaselineEbitda(state)).toBeGreaterThan(0);
  });

  it('selectRevenueGrowthImpact is zero when controls match the baseline', () => {
    if (selectorError) throw selectorError;
    const state = makeState({ revenueGrowthPct: 0.03 });
    expect(selectRevenueGrowthImpact(state)).toBe(0);
  });

  it('selectFuelIndexImpact is zero when fuelIndex matches the baseline control', () => {
    if (selectorError) throw selectorError;
    const state = makeState({ fuelIndex: 118 });
    expect(selectFuelIndexImpact(state)).toBe(0);
  });

  it('selectFuelIndexImpact is negative when fuelIndex rises above the baseline control', () => {
    if (selectorError) throw selectorError;
    const state = makeState({ fuelIndex: 137 });
    expect(selectFuelIndexImpact(state)).toBeLessThan(0);
  });

  it('selectGrossMarginImpact is zero when grossMarginPct matches the baseline control', () => {
    if (selectorError) throw selectorError;
    const state = makeState({ grossMarginPct: 0.25, baseGrossMarginPct: 0.25 });
    expect(selectGrossMarginImpact(state)).toBe(0);
  });

  it('short-term horizon reduces the revenue growth contribution vs long-term', () => {
    if (selectorError) throw selectorError;
    const shortTermState = makeState({ revenueGrowthPct: 0.08, scenarioHorizon: 'short_term' });
    const longTermState = makeState({ revenueGrowthPct: 0.08, scenarioHorizon: 'long_term' });
    expect(selectRevenueGrowthImpact(shortTermState)).toBeLessThan(
      selectRevenueGrowthImpact(longTermState)
    );
  });

  it('other levers resolve close to zero when only EBITDA levers move', () => {
    if (selectorError) throw selectorError;
    const state = makeState({
      revenueGrowthPct: 0.05,
      grossMarginPct: 0.27,
      fuelIndex: 120,
    });
    expect(Math.abs(selectOtherLeversImpact(state))).toBeLessThan(5);
  });
});
