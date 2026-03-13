// src/features/model/__tests__/sceneStorytelling.test.ts
// Wave 0 RED stubs — STORY-01 and STORY-02
// All tests must FAIL until Plan 12-01/12-02 implements the real code.
import { describe, it, expect, beforeAll } from 'vitest';

// ─── Module handles for calloutRules ─────────────────────────────────────────
let CALLOUT_RULES: unknown[];
let getCalloutStatus: (value: number, rule: unknown) => string;
let BASELINE_NARRATIVES: Record<string, string>;
let calloutError: unknown;

// ─── Module handle for scene-narrative route ──────────────────────────────────
let POST: unknown;
let routeError: unknown;

beforeAll(async () => {
  try {
    const mod = await import('@/lib/calloutRules');
    CALLOUT_RULES = (mod as unknown as Record<string, unknown[]>).CALLOUT_RULES as unknown[];
    getCalloutStatus = (mod as unknown as Record<string, (v: number, r: unknown) => string>).getCalloutStatus;
    BASELINE_NARRATIVES = (mod as unknown as Record<string, Record<string, string>>).BASELINE_NARRATIVES as Record<string, string>;
  } catch (err) {
    calloutError = err;
  }
});

beforeAll(async () => {
  try {
    const routeMod = await import('@/app/api/scene-narrative/route');
    POST = (routeMod as unknown as Record<string, unknown>).POST;
  } catch (err) {
    routeError = err;
  }
});

// ─── STORY-01: BASELINE_NARRATIVES ───────────────────────────────────────────

describe('BASELINE_NARRATIVES (STORY-01)', () => {
  it('Test 1: exports an object with a non-empty string for each of the 5 tabs', () => {
    if (calloutError) throw calloutError;
    const tabs = ['overview', 'close-tracker', 'charts', 'ai-summary', 'scenario'];
    expect(typeof BASELINE_NARRATIVES).toBe('object');
    expect(
      tabs.every(
        tab =>
          typeof (BASELINE_NARRATIVES as Record<string, string>)[tab] === 'string' &&
          (BASELINE_NARRATIVES as Record<string, string>)[tab].length > 20
      )
    ).toBe(true);
  });

  it('Test 2: /api/scene-narrative route exports a POST function', () => {
    if (routeError) throw routeError;
    expect(typeof POST).toBe('function');
  });
});

// ─── STORY-02: CALLOUT_RULES + getCalloutStatus ───────────────────────────────

describe('CALLOUT_RULES (STORY-02)', () => {
  it('Test 3: CALLOUT_RULES is an array with length >= 5', () => {
    if (calloutError) throw calloutError;
    expect(Array.isArray(CALLOUT_RULES)).toBe(true);
    expect((CALLOUT_RULES as unknown[]).length).toBeGreaterThanOrEqual(5);
  });

  it('Test 4: every rule has tab, metric, goodThreshold, watchThreshold, labels.good, labels.watch, labels.concern', () => {
    if (calloutError) throw calloutError;
    for (const rule of CALLOUT_RULES as Record<string, unknown>[]) {
      expect(typeof rule.tab).toBe('string');
      expect(typeof rule.metric).toBe('string');
      expect(typeof rule.goodThreshold).toBe('number');
      expect(typeof rule.watchThreshold).toBe('number');
      expect(rule.labels).toBeTruthy();
      const labels = rule.labels as Record<string, unknown>;
      expect(typeof labels.good).toBe('string');
      expect(typeof labels.watch).toBe('string');
      expect(typeof labels.concern).toBe('string');
    }
  });

  it('Test 5: CALLOUT_RULES covers all 5 TabId values (at least one rule per tab)', () => {
    if (calloutError) throw calloutError;
    const tabs = ['overview', 'close-tracker', 'charts', 'ai-summary', 'scenario'];
    const coveredTabs = new Set((CALLOUT_RULES as Record<string, unknown>[]).map(r => r.tab as string));
    expect(tabs.every(tab => coveredTabs.has(tab))).toBe(true);
  });

  it('Test 6: getCalloutStatus(0.20, ebitdaMargin rule) returns "good" when value > goodThreshold (0.14)', () => {
    if (calloutError) throw calloutError;
    const sampleRule = {
      tab: 'overview',
      metric: 'ebitdaMargin',
      goodThreshold: 0.14,
      watchThreshold: 0.10,
      labels: { good: 'On target', watch: 'Watch', concern: 'Below target' },
      higherIsBetter: true,
    };
    expect(getCalloutStatus(0.20, sampleRule)).toBe('good');
  });

  it('Test 7: getCalloutStatus(0.12, ebitdaMargin rule) returns "watch" when goodThreshold > value > watchThreshold', () => {
    if (calloutError) throw calloutError;
    const sampleRule = {
      tab: 'overview',
      metric: 'ebitdaMargin',
      goodThreshold: 0.14,
      watchThreshold: 0.10,
      labels: { good: 'On target', watch: 'Watch', concern: 'Below target' },
      higherIsBetter: true,
    };
    expect(getCalloutStatus(0.12, sampleRule)).toBe('watch');
  });

  it('Test 8: getCalloutStatus(0.08, ebitdaMargin rule) returns "concern" when value < watchThreshold', () => {
    if (calloutError) throw calloutError;
    const sampleRule = {
      tab: 'overview',
      metric: 'ebitdaMargin',
      goodThreshold: 0.14,
      watchThreshold: 0.10,
      labels: { good: 'On target', watch: 'Watch', concern: 'Below target' },
      higherIsBetter: true,
    };
    expect(getCalloutStatus(0.08, sampleRule)).toBe('concern');
  });
});
