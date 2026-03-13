// chartDataUtils.ts
// Pure data transformation functions for static chart components.
// No React imports — these are plain functions usable in Vitest (node env).

import type {
  ARRow,
  PipelineRow,
  Cash13WeekRow,
  ScenarioHorizon,
} from '@/features/model/types';
import { formatCurrency } from '@/lib/formatters';
import { calculateMarginBridgeImpacts } from '@/store/scenarioMath';

// ─── Pipeline to Invoiced (CHRT-02) ──────────────────────────────────────────

export const STAGE_ORDER = [
  'Qualified',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Invoiced',
] as const;

const STAGE_ALIASES: Record<(typeof STAGE_ORDER)[number], string[]> = {
  Qualified: ['Qualified', 'Pipeline'],
  Proposal: ['Proposal', 'BestCase'],
  Negotiation: ['Negotiation', 'Commit'],
  'Closed Won': ['Closed Won'],
  Invoiced: ['Invoiced'],
};

export interface PipelineChartPoint {
  stage: string;
  total: number;
  weighted: number;
}

export function buildPipelineChartData(rows: PipelineRow[]): PipelineChartPoint[] {
  return STAGE_ORDER.map(stage => {
    const stageRows = rows.filter(r => STAGE_ALIASES[stage].includes(r.stage));
    const total = stageRows.reduce((s, r) => s + r.amount_usd, 0);
    const weighted = stageRows.reduce((s, r) => s + r.amount_usd * r.probability, 0);
    return { stage, total, weighted };
  });
}

// ─── AR Aging (CHRT-03) ──────────────────────────────────────────────────────

export interface ArAgingPoint {
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90plus: number;
}

export function buildArAgingData(rows: ARRow[]): ArAgingPoint[] {
  const totals = rows.reduce<ArAgingPoint>(
    (acc, r) => ({
      current: acc.current + r.ar_current,
      d1_30: acc.d1_30 + r.ar_1_30,
      d31_60: acc.d31_60 + r.ar_31_60,
      d61_90: acc.d61_90 + r.ar_61_90,
      d90plus: acc.d90plus + r.ar_90_plus,
    }),
    { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 }
  );
  return [totals];
}

// ─── 13-Week Cash Flow (CHRT-04) ─────────────────────────────────────────────

export interface CashFlowPoint {
  week: string;
  isActual: boolean;
  actualNetCash: number | null;
  forecastNetCash: number | null;
  inflow: number;
  outflow: number;
  net_cash: number;
}

export function buildCashFlowData(rows: Cash13WeekRow[]): CashFlowPoint[] {
  return rows.map(r => {
    const isActual = r.is_actual === 'true';
    return {
      week: r.week,
      isActual,
      actualNetCash: isActual ? r.net_cash : null,
      forecastNetCash: !isActual ? r.net_cash : null,
      inflow: r.inflow,
      outflow: r.outflow,
      net_cash: r.net_cash,
    };
  });
}

// ─── Margin Bridge (CHRT-01) ──────────────────────────────────────────────────

export interface MarginBridgeBar {
  name: string;        // X-axis display label
  value: number;       // Bar height: positive = above zero line, negative = below
  label: string | null; // Formatted label shown above bar; null omits the label
  isTotal: boolean;    // true for Baseline EBITDA and Adjusted EBITDA bars
}

/** Returns '+$340K' for positive, '–$420K' for negative, null for zero. */
function formatBridgeLabel(value: number): string | null {
  if (Math.abs(value) < 1000) return null;
  const formatted = formatCurrency(Math.abs(value), true);
  return value > 0 ? `+${formatted}` : `\u2013${formatted}`; // \u2013 = en dash
}

/**
 * Build the 6-bar waterfall data for the Margin Bridge chart.
 * @param baselineEbitda  - Baseline EBITDA value (from selectBaselineEbitda)
 * @param adjustedEbitda  - Adjusted EBITDA value (from selectEbitda)
 * @param state           - Redux state (used to derive lever-level bridge values via selectors)
 */
export function buildMarginBridgeData(
  baselineEbitda: number,
  adjustedEbitda: number,
  state: unknown
): MarginBridgeBar[] {
  // Derive per-lever deltas from state using the margin bridge selectors.
  // Inline computation mirrors the selector formulas to keep chartDataUtils free
  // of a direct @/store import (avoids circular dep risk and keeps tests fast).
  const s = state as {
    scenario: {
      baseInputs: {
        baseNetSales: number;
        baseGrossMarginPct: number;
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
        baseEbitda: number;
      };
      baselineControls: {
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
      };
      controls: {
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
      };
      scenarioHorizon: ScenarioHorizon;
    };
  };

  const impacts = calculateMarginBridgeImpacts(
    s.scenario.baseInputs,
    s.scenario.controls,
    s.scenario.baselineControls,
    s.scenario.scenarioHorizon
  );

  return [
    {
      name: 'Baseline EBITDA',
      value: baselineEbitda,
      label: formatCurrency(baselineEbitda, true),
      isTotal: true,
    },
    {
      name: 'Revenue Growth',
      value: impacts.revenueGrowthImpact,
      label: formatBridgeLabel(impacts.revenueGrowthImpact),
      isTotal: false,
    },
    {
      name: 'Gross Margin',
      value: impacts.grossMarginImpact,
      label: formatBridgeLabel(impacts.grossMarginImpact),
      isTotal: false,
    },
    {
      name: 'Fuel Index',
      value: impacts.fuelIndexImpact,
      label: formatBridgeLabel(impacts.fuelIndexImpact),
      isTotal: false,
    },
    {
      name: 'All Other Levers',
      value: impacts.otherLeversImpact,
      label: formatBridgeLabel(impacts.otherLeversImpact),
      isTotal: false,
    },
    {
      name: 'Adjusted EBITDA',
      value: adjustedEbitda,
      label: formatCurrency(adjustedEbitda, true),
      isTotal: true,
    },
  ];
}
