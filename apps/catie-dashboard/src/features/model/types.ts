// src/features/model/types.ts
// Zod schemas and TypeScript types for all data files.
// CRITICAL: Use z.coerce.number() for ALL numeric CSV fields — PapaParse returns strings.
// Use z.boolean() for ControlState booleans — scenario-presets.json has real JSON booleans.

import { z } from 'zod';

// ─── CSV Row Schemas ──────────────────────────────────────────────────────────

export const glRowSchema = z.object({
  period: z.string(),
  net_sales: z.coerce.number().default(0),
  cogs: z.coerce.number().default(0),
  gross_profit: z.coerce.number().default(0),
  ebitda: z.coerce.number().default(0),
  opex: z.coerce.number().default(0),
  cash: z.coerce.number().default(0),
  ar: z.coerce.number().default(0),
  ap: z.coerce.number().default(0),
  inventory: z.coerce.number().default(0),
  manual_je_count: z.coerce.number().default(0),
  close_adjustments_count: z.coerce.number().default(0),
});
export type GLRow = z.infer<typeof glRowSchema>;

export const arRowSchema = z.object({
  as_of_date: z.string(),
  segment: z.string(),
  ar_total: z.coerce.number().default(0),
  ar_current: z.coerce.number().default(0),
  ar_1_30: z.coerce.number().default(0),
  ar_31_60: z.coerce.number().default(0),
  ar_61_90: z.coerce.number().default(0),
  ar_90_plus: z.coerce.number().default(0),
  collections_rate: z.coerce.number().default(0),
});
export type ARRow = z.infer<typeof arRowSchema>;

export const pipelineRowSchema = z.object({
  opp_id: z.string(),
  stage: z.string(),
  expected_close_date: z.string(),
  probability: z.coerce.number().default(0),
  amount_usd: z.coerce.number().default(0),
  segment: z.string(),
});
export type PipelineRow = z.infer<typeof pipelineRowSchema>;

export const journalEntryRowSchema = z.object({
  journal_id: z.string(),
  period: z.string(),
  business_unit: z.string(),
  entry_type: z.string(),
  hours_to_post: z.coerce.number().default(0),
  requires_rework: z.coerce.number().default(0),
});
export type JournalEntryRow = z.infer<typeof journalEntryRowSchema>;

export const inventoryAdjustmentRowSchema = z.object({
  adj_id: z.string(),
  period: z.string(),
  item: z.string(),
  quantity: z.coerce.number().default(0),
  amount: z.coerce.number().default(0),
});
export type InventoryAdjustmentRow = z.infer<typeof inventoryAdjustmentRowSchema>;

export const cash13WeekRowSchema = z.object({
  week: z.string(),
  is_actual: z.string(), // "true" or "false" — PapaParse returns strings from CSV
  inflow: z.coerce.number().default(0),
  outflow: z.coerce.number().default(0),
  net_cash: z.coerce.number().default(0),
});
export type Cash13WeekRow = z.infer<typeof cash13WeekRowSchema>;

export const externalFuelIndexRowSchema = z.object({
  week: z.string(),
  fuel_index: z.coerce.number().default(0),
});
export type ExternalFuelIndexRow = z.infer<typeof externalFuelIndexRowSchema>;

export const externalVendorPriceIndexRowSchema = z.object({
  period: z.string(),
  vendor_price_index: z.coerce.number().default(0),
});
export type ExternalVendorPriceIndexRow = z.infer<typeof externalVendorPriceIndexRowSchema>;

// ─── Control State (sliders + toggles) ───────────────────────────────────────

export const controlStateSchema = z.object({
  revenueGrowthPct: z.number(),
  grossMarginPct: z.number(),
  fuelIndex: z.number(),
  collectionsRatePct: z.number(),
  returnsPct: z.number(),
  lateInvoiceHours: z.number(),
  journalLoadMultiplier: z.number(),
  prioritizeCashMode: z.boolean(),
  conservativeForecastBias: z.boolean(),
  tightenCreditHolds: z.boolean(),
  inventoryComplexity: z.boolean(),
});
export type ControlState = z.infer<typeof controlStateSchema>;

export const scenarioHorizonSchema = z.enum(['short_term', 'long_term']);
export type ScenarioHorizon = z.infer<typeof scenarioHorizonSchema>;

// ─── Derived Metrics (computed by kpiSelectors from controls + baseInputs) ───

export interface DerivedMetrics {
  projNetSales: number;
  projGrossProfit: number;
  projOpex: number;
  returnsDollars: number;
  cashCoverageWeeks: number;
  arDso: number;
  forecastConfidence: number;
  closeEtaBusinessDays: number;
  journalLoad: number;
  pipelineExecutionRatio: number;
  variancePct: number;
}

// ─── Derived / Composite Types ────────────────────────────────────────────────

export interface BaseInputs {
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
  baseEbitda: number;         // Seed EBITDA: baseNetSales * baseGrossMarginPct - baseOpex (at fuelIndex=100)
  baseGrossMarginPct: number; // Seed gross margin from baseline preset controls.grossMarginPct
}

export interface ScenarioPreset {
  id: string;
  label: string;
  controls: ControlState;
}

export interface CloseStage {
  name: string;
  progress: number;        // 0–100
  posted: number;          // count of JE rows where requires_rework === 0
  pendingApproval: number; // count of JE rows where requires_rework === 1
  total: number;           // total JE row count for this stage
}

export type RiskSeverity = 'info' | 'yellow' | 'red';

export interface RiskFlag {
  id: string;
  severity: RiskSeverity;
  title: string;
  whatChanged: string;
  whyItMatters: string;
  suggestedAction: string;
}

export interface ExecutiveSummary {
  bullets: string[];
  changedVsBaseline: string[];
  risksAndMitigations: string[];
  assumptionsUsed: string[];
  generatedAt: string;
  enhancedByLlm: boolean;
}
