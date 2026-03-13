// src/features/model/__tests__/aiSummary.test.ts
// Wave 0 RED stubs — all tests must FAIL until Plan 08-02 implements the real code.
// AIFMT-01/AIFMT-02 tests appended in Plan 12-01 — target FUTURE signature with audience/focus params.
import { describe, it, expect, beforeAll } from 'vitest';
import type { KpiPayload } from '@/features/model/aiPromptUtils';

// NOTE: AIFMT tests call buildUserPrompt with 4 params (audience, focus) — current signature has 2.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let buildUserPrompt: (kpis: KpiPayload, presetName: string, audience?: string, focus?: string) => string;
let BASELINE_SUMMARY: string;
let routeImportError: unknown;
let cacheImportError: unknown;

beforeAll(async () => {
  try {
    const routeMod = await import('@/features/model/aiPromptUtils');
    buildUserPrompt = routeMod.buildUserPrompt;
  } catch (err) {
    routeImportError = err;
  }
});

beforeAll(async () => {
  try {
    const cacheMod = await import('@/lib/aiSummaryCache');
    BASELINE_SUMMARY = (cacheMod as unknown as Record<string, unknown>).BASELINE_SUMMARY as string;
  } catch (err) {
    cacheImportError = err;
  }
});

describe('buildUserPrompt (AISU-01)', () => {
  it('Test 1: includes all 8 KPI labels in output', () => {
    if (routeImportError) throw routeImportError;
    const kpis: KpiPayload = {
      netSales: '$9,476,000',
      cogs: '$7,337,267',
      grossProfit: '$2,138,733',
      ebitda: '$958,733',
      cash: '$4,250,000',
      ar: '$2,800,000',
      ap: '$3,100,000',
      inventory: '$6,400,000',
    };
    const result = buildUserPrompt(kpis, 'Jan 2026 Baseline');
    expect(result).toContain('Net Sales');
    expect(result).toContain('COGS');
    expect(result).toContain('Gross Profit');
    expect(result).toContain('EBITDA');
    expect(result).toContain('Cash');
    expect(result).toContain('Accounts Receivable');
    expect(result).toContain('Accounts Payable');
    expect(result).toContain('Inventory');
  });

  it('Test 2: includes presetName in output', () => {
    if (routeImportError) throw routeImportError;
    const kpis: KpiPayload = {
      netSales: '$9,476,000',
      cogs: '$7,337,267',
      grossProfit: '$2,138,733',
      ebitda: '$958,733',
      cash: '$4,250,000',
      ar: '$2,800,000',
      ap: '$3,100,000',
      inventory: '$6,400,000',
    };
    const result = buildUserPrompt(kpis, 'Fuel Cost Shock');
    expect(result).toContain('Fuel Cost Shock');
  });

  it('Test 3: includes the instruction to write the summary', () => {
    if (routeImportError) throw routeImportError;
    const kpis: KpiPayload = {
      netSales: '$9,476,000',
      cogs: '$7,337,267',
      grossProfit: '$2,138,733',
      ebitda: '$958,733',
      cash: '$4,250,000',
      ar: '$2,800,000',
      ap: '$3,100,000',
      inventory: '$6,400,000',
    };
    const result = buildUserPrompt(kpis, 'Jan 2026 Baseline');
    expect(result).toContain('executive summary');
  });
});

describe('BASELINE_SUMMARY (AISU-04)', () => {
  it('Test 4: exports a non-empty string', () => {
    if (cacheImportError) throw cacheImportError;
    expect(typeof BASELINE_SUMMARY).toBe('string');
    expect(BASELINE_SUMMARY.length).toBeGreaterThan(100);
  });

  it('Test 5: contains CFO-relevant financial reference ($9.5M area)', () => {
    if (cacheImportError) throw cacheImportError;
    const hasFinancialContent =
      BASELINE_SUMMARY.includes('9.5') ||
      BASELINE_SUMMARY.includes('$9') ||
      BASELINE_SUMMARY.includes('959');
    expect(hasFinancialContent).toBe(true);
  });

  it('Test 6: contains two paragraphs (double newline separator)', () => {
    if (cacheImportError) throw cacheImportError;
    expect(BASELINE_SUMMARY).toContain('\n\n');
  });
});

// ─── AIFMT-01 / AIFMT-02: buildUserPrompt with audience/focus params ──────────
// These tests target a FUTURE signature: buildUserPrompt(kpis, presetName, audience, focus)
// They WILL FAIL now because the current implementation has no audience/focus params.
// Plan 12-03 extends buildUserPrompt to accept and embed audience/focus in the prompt.

const SAMPLE_KPIS: KpiPayload = {
  netSales: '$9,200,000',
  cogs: '$7,176,000',
  grossProfit: '$2,024,000',
  ebitda: '$959,000',
  cash: '$4,250,000',
  ar: '$2,800,000',
  ap: '$3,100,000',
  inventory: '$6,400,000',
};

describe('buildUserPrompt with audience/focus (AIFMT-01, AIFMT-02)', () => {
  it('AIFMT-01: buildUserPrompt with audience="CFO" includes the audience modifier string in output', () => {
    if (routeImportError) throw routeImportError;
    const result = buildUserPrompt(SAMPLE_KPIS, 'Baseline', 'CFO', undefined);
    // Expects the output to reference CFO audience in some form
    expect(result.toLowerCase()).toContain('cfo');
  });

  it('AIFMT-02: buildUserPrompt with focus="Cash & Working Capital" includes focus instruction in output', () => {
    if (routeImportError) throw routeImportError;
    const result = buildUserPrompt(SAMPLE_KPIS, 'Baseline', undefined, 'Cash & Working Capital');
    // Expects the output to reference cash/working capital focus instruction
    expect(result.toLowerCase()).toContain('cash');
    expect(result).toContain('Cash & Working Capital');
  });
});
