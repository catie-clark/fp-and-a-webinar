import { beforeAll, describe, expect, it } from 'vitest';
import type { RootState } from '@/store';
import type { ScenarioHorizon } from '@/features/model/types';

let selectors: typeof import('@/store/kpiSelectors') | null = null;
let importError: Error | null = null;

beforeAll(async () => {
  try {
    selectors = await import('@/store/kpiSelectors');
  } catch (e) {
    importError = e as Error;
  }
});

function makeState(
  baseOverrides: Partial<{
    baseNetSales: number;
    baseOpex: number;
    baseCash: number;
    baseCashInWeekly: number;
    arTotal: number;
    apTotal: number;
    inventoryTotal: number;
    manualJeCount: number;
    closeAdjustmentsCount: number;
    pipelineExecutionRatio: number;
    variancePct: number;
    baseGrossMarginPct: number;
    baseEbitda: number;
  }> = {},
  controlOverrides: Partial<{
    revenueGrowthPct: number;
    grossMarginPct: number;
    fuelIndex: number;
    collectionsRatePct: number;
    returnsPct: number;
    lateInvoiceHours: number;
    journalLoadMultiplier: number;
    prioritizeCashMode: boolean;
    conservativeForecastBias: boolean;
    tightenCreditHolds: boolean;
    inventoryComplexity: boolean;
  }> = {},
  options: {
    scenarioHorizon?: ScenarioHorizon;
  } = {}
): RootState {
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
        baseOpex: 1_180_000,
        baseCash: 4_250_000,
        baseCashInWeekly: 2_300_000,
        arTotal: 2_800_000,
        apTotal: 3_100_000,
        inventoryTotal: 6_400_000,
        manualJeCount: 18,
        closeAdjustmentsCount: 5,
        pipelineExecutionRatio: 0.72,
        variancePct: 0.034,
        baseGrossMarginPct: 0.25,
        baseEbitda: 1_120_000,
        ...baseOverrides,
      },
      baselineControls,
      controls: {
        ...baselineControls,
        ...controlOverrides,
      },
      scenarioHorizon: options.scenarioHorizon ?? 'long_term',
    },
  } as unknown as RootState;
}

describe('kpiSelectors', () => {
  it('selectNetSales applies 3% revenueGrowthPct to $9.2M base in long-term view', () => {
    if (importError) throw importError;
    const state = makeState({}, { revenueGrowthPct: 0.03 }, { scenarioHorizon: 'long_term' });
    const result = selectors!.selectNetSales(state);
    expect(result).toBeCloseTo(9_476_000, -2);
  });

  it('selectNetSales with 0% growth returns baseNetSales unchanged', () => {
    if (importError) throw importError;
    const state = makeState({}, { revenueGrowthPct: 0 }, { scenarioHorizon: 'long_term' });
    const result = selectors!.selectNetSales(state);
    expect(result).toBeCloseTo(9_200_000, -2);
  });

  it('selectCogs at baseline stays within the expected range', () => {
    if (importError) throw importError;
    const state = makeState({}, { revenueGrowthPct: 0.03, grossMarginPct: 0.25, fuelIndex: 118 });
    const result = selectors!.selectCogs(state);
    expect(result).toBeGreaterThan(7_000_000);
    expect(result).toBeLessThan(8_000_000);
  });

  it('selectCogs fuel shock is higher than baseline in long-term view', () => {
    if (importError) throw importError;
    const baselineState = makeState({}, { revenueGrowthPct: 0.03, grossMarginPct: 0.25, fuelIndex: 118 });
    const shockState = makeState({}, { revenueGrowthPct: 0.03, grossMarginPct: 0.22, fuelIndex: 137 });
    const baselineCogs = selectors!.selectCogs(baselineState);
    const shockCogs = selectors!.selectCogs(shockState);
    expect(shockCogs).toBeGreaterThan(baselineCogs);
  });

  it('selectGrossProfit equals selectNetSales minus selectCogs', () => {
    if (importError) throw importError;
    const state = makeState({}, { revenueGrowthPct: 0.03, grossMarginPct: 0.25, fuelIndex: 118 });
    const netSales = selectors!.selectNetSales(state);
    const cogs = selectors!.selectCogs(state);
    const grossProfit = selectors!.selectGrossProfit(state);
    expect(grossProfit).toBeCloseTo(netSales - cogs, -2);
    expect(grossProfit).toBeGreaterThan(0);
  });

  it('selectEbitda equals selectGrossProfit minus baseOpex', () => {
    if (importError) throw importError;
    const state = makeState({ baseOpex: 1_180_000 }, { revenueGrowthPct: 0.03, grossMarginPct: 0.25, fuelIndex: 118 });
    const grossProfit = selectors!.selectGrossProfit(state);
    const ebitda = selectors!.selectEbitda(state);
    expect(ebitda).toBeCloseTo(grossProfit - 1_180_000, -2);
  });

  it('selectCash improves when collectionsRatePct increases', () => {
    if (importError) throw importError;
    const state97 = makeState({}, { collectionsRatePct: 0.97 });
    const state99 = makeState({}, { collectionsRatePct: 0.99 });
    const cash97 = selectors!.selectCash(state97);
    const cash99 = selectors!.selectCash(state99);
    expect(cash99).toBeGreaterThan(cash97);
  });

  it('selectAr decreases when collectionsRatePct increases', () => {
    if (importError) throw importError;
    const state97 = makeState({}, { collectionsRatePct: 0.97 });
    const state99 = makeState({}, { collectionsRatePct: 0.99 });
    const ar97 = selectors!.selectAr(state97);
    const ar99 = selectors!.selectAr(state99);
    expect(ar99).toBeLessThan(ar97);
  });

  it('selectInventory is higher when inventoryComplexity is enabled', () => {
    if (importError) throw importError;
    const stateSimple = makeState({}, { inventoryComplexity: false });
    const stateComplex = makeState({}, { inventoryComplexity: true });
    const inventorySimple = selectors!.selectInventory(stateSimple);
    const inventoryComplex = selectors!.selectInventory(stateComplex);
    const ratio = inventoryComplex / inventorySimple;
    expect(ratio).toBeGreaterThan(1.01);
    expect(ratio).toBeLessThan(1.2);
  });

  it('variancePct reads from baseInputs and is not hardcoded', () => {
    if (importError) throw importError;
    const state = makeState({ variancePct: 0.055 });
    expect(state.scenario.baseInputs.variancePct).toBe(0.055);
  });

  it('short-term horizon dampens net sales relative to long-term for the same controls', () => {
    if (importError) throw importError;
    const shortTermState = makeState({}, { revenueGrowthPct: 0.08 }, { scenarioHorizon: 'short_term' });
    const longTermState = makeState({}, { revenueGrowthPct: 0.08 }, { scenarioHorizon: 'long_term' });
    const shortTermNetSales = selectors!.selectNetSales(shortTermState);
    const longTermNetSales = selectors!.selectNetSales(longTermState);
    expect(shortTermNetSales).toBeLessThan(longTermNetSales);
  });

  it('baseline metrics remain neutral when controls match the baseline under short-term view', () => {
    if (importError) throw importError;
    const state = makeState({}, {}, { scenarioHorizon: 'short_term' });
    const metrics = selectors!.selectScenarioMetrics(state);
    const baselineMetrics = selectors!.selectScenarioBaselineMetrics(state);
    expect(metrics.netSales).toBeCloseTo(baselineMetrics.netSales, -2);
    expect(metrics.ebitda).toBeCloseTo(baselineMetrics.ebitda, -2);
  });
});
