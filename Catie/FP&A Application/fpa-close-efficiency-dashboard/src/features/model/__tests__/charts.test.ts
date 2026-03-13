// Wave 0: RED tests — functions imported from ChartsSection do not exist yet.
// Uses beforeAll error-capture pattern so tests show as FAILED not SKIPPED.
// Wave 1 will implement the functions and turn these GREEN.

import { describe, it, expect, beforeAll } from 'vitest';

// --- Inline minimal test fixtures (mirrors actual CSV data shapes) ---
const SAMPLE_AR_ROWS = [
  { period: 'Jan-2026', customer_id: 'C001', ar_total: 1000000, ar_current: 700000, ar_1_30: 150000, ar_31_60: 80000, ar_61_90: 40000, ar_90_plus: 30000 },
  { period: 'Jan-2026', customer_id: 'C002', ar_total: 500000, ar_current: 300000, ar_1_30: 100000, ar_31_60: 60000, ar_61_90: 20000, ar_90_plus: 20000 },
];

const SAMPLE_PIPELINE_ROWS = [
  { deal_id: 'D001', stage: 'Qualified', amount_usd: 500000, probability: 0.25, close_date: '2026-02-28' },
  { deal_id: 'D002', stage: 'Qualified', amount_usd: 300000, probability: 0.25, close_date: '2026-02-28' },
  { deal_id: 'D003', stage: 'Proposal', amount_usd: 400000, probability: 0.45, close_date: '2026-02-28' },
  { deal_id: 'D004', stage: 'Negotiation', amount_usd: 600000, probability: 0.70, close_date: '2026-02-28' },
  { deal_id: 'D005', stage: 'Closed Won', amount_usd: 450000, probability: 0.95, close_date: '2026-02-28' },
  { deal_id: 'D006', stage: 'Invoiced', amount_usd: 350000, probability: 1.0, close_date: '2026-02-28' },
];

const SAMPLE_CASH_ROWS = [
  { week: 'W1', is_actual: 'true', inflow: 2100000, outflow: 1800000, net_cash: 300000 },
  { week: 'W2', is_actual: 'true', inflow: 1900000, outflow: 1700000, net_cash: 200000 },
  { week: 'W6', is_actual: 'true', inflow: 2000000, outflow: 1850000, net_cash: 150000 },
  { week: 'W7', is_actual: 'false', inflow: 2200000, outflow: 1950000, net_cash: 250000 },
  { week: 'W13', is_actual: 'false', inflow: 2400000, outflow: 2100000, net_cash: 300000 },
];

// Functions imported from their eventual location — will fail until Wave 1 creates them.
let buildPipelineChartData: (rows: typeof SAMPLE_PIPELINE_ROWS) => unknown;
let buildArAgingData: (rows: typeof SAMPLE_AR_ROWS) => unknown;
let buildCashFlowData: (rows: typeof SAMPLE_CASH_ROWS) => unknown;
let importError: unknown;

beforeAll(async () => {
  try {
    const mod = await import('@/components/dashboard/ChartsSection/chartDataUtils');
    buildPipelineChartData = mod.buildPipelineChartData;
    buildArAgingData = mod.buildArAgingData;
    buildCashFlowData = mod.buildCashFlowData;
  } catch (err) {
    importError = err;
  }
});

describe('buildPipelineChartData (CHRT-02)', () => {
  it('returns 5 stage entries in order: Qualified → Proposal → Negotiation → Closed Won → Invoiced', () => {
    if (importError) throw importError;
    const result = buildPipelineChartData(SAMPLE_PIPELINE_ROWS) as Array<{ stage: string; total: number; weighted: number }>;
    expect(result).toHaveLength(5);
    expect(result[0].stage).toBe('Qualified');
    expect(result[4].stage).toBe('Invoiced');
  });

  it('aggregates total amount_usd per stage', () => {
    if (importError) throw importError;
    const result = buildPipelineChartData(SAMPLE_PIPELINE_ROWS) as Array<{ stage: string; total: number; weighted: number }>;
    const qualified = result.find(r => r.stage === 'Qualified')!;
    expect(qualified.total).toBe(800000); // 500K + 300K
  });

  it('computes probability-weighted amount per stage', () => {
    if (importError) throw importError;
    const result = buildPipelineChartData(SAMPLE_PIPELINE_ROWS) as Array<{ stage: string; total: number; weighted: number }>;
    const qualified = result.find(r => r.stage === 'Qualified')!;
    expect(qualified.weighted).toBeCloseTo(200000); // (500K + 300K) * 0.25
  });
});

describe('buildArAgingData (CHRT-03)', () => {
  it('returns a single-element array (one stacked bar record)', () => {
    if (importError) throw importError;
    const result = buildArAgingData(SAMPLE_AR_ROWS) as unknown[];
    expect(result).toHaveLength(1);
  });

  it('sums ar_current across all customer rows', () => {
    if (importError) throw importError;
    const result = buildArAgingData(SAMPLE_AR_ROWS) as Array<{ current: number }>;
    expect(result[0].current).toBe(1000000); // 700K + 300K
  });

  it('sums ar_90_plus across all customer rows', () => {
    if (importError) throw importError;
    const result = buildArAgingData(SAMPLE_AR_ROWS) as Array<{ d90plus: number }>;
    expect(result[0].d90plus).toBe(50000); // 30K + 20K
  });

  it('bucket totals balance: current + d1_30 + d31_60 + d61_90 + d90plus = sum of ar_total', () => {
    if (importError) throw importError;
    const result = buildArAgingData(SAMPLE_AR_ROWS) as Array<Record<string, number>>;
    const r = result[0];
    const bucketSum = r.current + r.d1_30 + r.d31_60 + r.d61_90 + r.d90plus;
    const arTotalSum = SAMPLE_AR_ROWS.reduce((s, row) => s + row.ar_total, 0);
    expect(bucketSum).toBeCloseTo(arTotalSum);
  });
});

describe('buildCashFlowData (CHRT-04)', () => {
  it('returns same number of entries as input rows', () => {
    if (importError) throw importError;
    const result = buildCashFlowData(SAMPLE_CASH_ROWS) as unknown[];
    expect(result).toHaveLength(SAMPLE_CASH_ROWS.length);
  });

  it('actualNetCash is set for is_actual=true rows', () => {
    if (importError) throw importError;
    const result = buildCashFlowData(SAMPLE_CASH_ROWS) as Array<{ week: string; actualNetCash: number | null; forecastNetCash: number | null }>;
    const w1 = result.find(r => r.week === 'W1')!;
    expect(w1.actualNetCash).toBe(300000);
    expect(w1.forecastNetCash).toBeNull();
  });

  it('forecastNetCash is set for is_actual=false rows, actualNetCash is null', () => {
    if (importError) throw importError;
    const result = buildCashFlowData(SAMPLE_CASH_ROWS) as Array<{ week: string; actualNetCash: number | null; forecastNetCash: number | null }>;
    const w13 = result.find(r => r.week === 'W13')!;
    expect(w13.forecastNetCash).toBe(300000);
    expect(w13.actualNetCash).toBeNull();
  });

  it('uses string comparison for is_actual (not boolean)', () => {
    if (importError) throw importError;
    const result = buildCashFlowData(SAMPLE_CASH_ROWS) as Array<{ week: string; isActual: boolean }>;
    const w1 = result.find(r => r.week === 'W1')!;
    const w7 = result.find(r => r.week === 'W7')!;
    expect(w1.isActual).toBe(true);
    expect(w7.isActual).toBe(false);
  });
});
