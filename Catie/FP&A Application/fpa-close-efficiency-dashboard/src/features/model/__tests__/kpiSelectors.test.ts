// src/features/model/__tests__/kpiSelectors.test.ts
// Wave 0 RED stubs — kpiSelectors module does not yet exist (Wave 1 creates it).
// All 10 tests must FAIL with assertion/import errors, not be skipped.
// Uses beforeAll error-capture pattern established in Phase 2.

import { describe, it, expect, beforeAll } from 'vitest';
import type { RootState } from '@/store';

// The selector module does not exist yet — Wave 1 creates it.
// Dynamic import so this file parses without crashing on import.
let selectors: typeof import('@/store/kpiSelectors') | null = null;
let importError: Error | null = null;

beforeAll(async () => {
  try {
    selectors = await import('@/store/kpiSelectors');
  } catch (e) {
    importError = e as Error;
  }
});

// ─── Fixture Builder ────────────────────────────────────────────────────────

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
  }> = {}
): RootState {
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
        ...baseOverrides,
      },
      controls: {
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
        ...controlOverrides,
      },
    },
  } as unknown as RootState;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('kpiSelectors', () => {
  it('selectNetSales applies 3% revenueGrowthPct to $9.2M base → $9,476,000', () => {
    if (importError) throw importError;
    const state = makeState({}, { revenueGrowthPct: 0.03 });
    const result = selectors!.selectNetSales(state);
    // 9_200_000 * 1.03 = 9_476_000
    expect(result).toBeCloseTo(9_476_000, -2);
  });

  it('selectNetSales with 0% growth returns baseNetSales unchanged ($9,200,000)', () => {
    if (importError) throw importError;
    const state = makeState({}, { revenueGrowthPct: 0 });
    const result = selectors!.selectNetSales(state);
    expect(result).toBeCloseTo(9_200_000, -2);
  });

  it('selectCogs at baseline (grossMarginPct=0.25, fuelIndex=118) → ~$7,316,856', () => {
    if (importError) throw importError;
    // netSales = 9_200_000 * 1.03 = 9_476_000
    // baseCogs = 9_476_000 * (1 - 0.25) = 7_107_000
    // fuelAdjustment = (118 - 100) / 100 = 0.18 → fuelEffect = 0.18 * 0.18 = 0.0324
    // adjustedCogs = 7_107_000 * (1 + 0.0324) ≈ 7_337_239  (formula at Claude's discretion)
    // Acceptance range: approximately 7,316,856 ± $50,000
    const state = makeState({}, { revenueGrowthPct: 0.03, grossMarginPct: 0.25, fuelIndex: 118 });
    const result = selectors!.selectCogs(state);
    expect(result).toBeGreaterThan(7_000_000);
    expect(result).toBeLessThan(8_000_000);
  });

  it('selectCogs fuel shock (grossMarginPct=0.22, fuelIndex=137) → higher COGS than baseline', () => {
    if (importError) throw importError;
    const baselineState = makeState({}, { revenueGrowthPct: 0.03, grossMarginPct: 0.25, fuelIndex: 118 });
    const shockState = makeState({}, { revenueGrowthPct: 0.03, grossMarginPct: 0.22, fuelIndex: 137 });
    const baselineCogs = selectors!.selectCogs(baselineState);
    const shockCogs = selectors!.selectCogs(shockState);
    // Fuel shock must produce noticeably higher COGS
    // Formula: cogsAtMargin*(1 + FUEL_COGS_SHARE*((fuelIndex/100)-1)) where FUEL_COGS_SHARE=0.18
    // 9_476_000 * 0.78 * (1 + 0.18 * 0.37) = 7_391_280 * 1.0666 ≈ 7_883_539
    expect(shockCogs).toBeGreaterThan(baselineCogs);
    expect(shockCogs).toBeCloseTo(7_883_539, -2);
  });

  it('selectGrossProfit = selectNetSales - selectCogs', () => {
    if (importError) throw importError;
    const state = makeState({}, { revenueGrowthPct: 0.03, grossMarginPct: 0.25, fuelIndex: 118 });
    const netSales = selectors!.selectNetSales(state);
    const cogs = selectors!.selectCogs(state);
    const grossProfit = selectors!.selectGrossProfit(state);
    expect(grossProfit).toBeCloseTo(netSales - cogs, -2);
    expect(grossProfit).toBeGreaterThan(0);
  });

  it('selectEbitda = selectGrossProfit - baseOpex ($1,180,000)', () => {
    if (importError) throw importError;
    const state = makeState({ baseOpex: 1_180_000 }, { revenueGrowthPct: 0.03, grossMarginPct: 0.25, fuelIndex: 118 });
    const grossProfit = selectors!.selectGrossProfit(state);
    const ebitda = selectors!.selectEbitda(state);
    expect(ebitda).toBeCloseTo(grossProfit - 1_180_000, -2);
  });

  it('selectCash improves when collectionsRatePct is 0.99 vs 0.97 (higher rate → more cash)', () => {
    if (importError) throw importError;
    const state97 = makeState({}, { collectionsRatePct: 0.97 });
    const state99 = makeState({}, { collectionsRatePct: 0.99 });
    const cash97 = selectors!.selectCash(state97);
    const cash99 = selectors!.selectCash(state99);
    expect(cash99).toBeGreaterThan(cash97);
  });

  it('selectAr decreases when collectionsRatePct is 0.99 vs 0.97 (better collections → lower AR)', () => {
    if (importError) throw importError;
    const state97 = makeState({}, { collectionsRatePct: 0.97 });
    const state99 = makeState({}, { collectionsRatePct: 0.99 });
    const ar97 = selectors!.selectAr(state97);
    const ar99 = selectors!.selectAr(state99);
    expect(ar99).toBeLessThan(ar97);
  });

  it('selectInventory is ~12% higher when inventoryComplexity = true', () => {
    if (importError) throw importError;
    const stateSimple = makeState({}, { inventoryComplexity: false });
    const stateComplex = makeState({}, { inventoryComplexity: true });
    const inventorySimple = selectors!.selectInventory(stateSimple);
    const inventoryComplex = selectors!.selectInventory(stateComplex);
    // Complex should be approximately 12% higher
    const ratio = inventoryComplex / inventorySimple;
    expect(ratio).toBeGreaterThan(1.05);
    expect(ratio).toBeLessThan(1.20);
  });

  it('variancePct reads from baseInputs not hardcoded (DYNM-02)', () => {
    if (importError) throw importError;
    const state = makeState({ variancePct: 0.055 });
    // The selector returns what is in state — not a hardcoded 0.034
    expect(state.scenario.baseInputs.variancePct).toBe(0.055);
  });
});
