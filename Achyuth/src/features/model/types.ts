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
  ap_total: z.coerce.number().default(0),
  inventory_total: z.coerce.number().default(0),
  manual_je_count: z.coerce.number().default(0),
  close_adjustments_count: z.coerce.number().default(0),
});
export type GLRow = z.infer<typeof glRowSchema>;

export const arRowSchema = z.object({
  period: z.string(),
  customer_id: z.string(),
  ar_total: z.coerce.number().default(0),
  ar_current: z.coerce.number().default(0),
  ar_1_30: z.coerce.number().default(0),
  ar_31_60: z.coerce.number().default(0),
  ar_61_90: z.coerce.number().default(0),
  ar_90_plus: z.coerce.number().default(0),
});
export type ARRow = z.infer<typeof arRowSchema>;

export const pipelineRowSchema = z.object({
  deal_id: z.string(),
  stage: z.string(),
  amount_usd: z.coerce.number().default(0),
  probability: z.coerce.number().default(0),
  close_date: z.string(),
});
export type PipelineRow = z.infer<typeof pipelineRowSchema>;

export const journalEntryRowSchema = z.object({
  je_id: z.string(),
  period: z.string(),
  account: z.string(),
  description: z.string().optional(),
  amount: z.coerce.number().default(0),
  stage: z.string(),
  status: z.string(),
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
  period: z.string(),
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

// ─── Derived / Composite Types ────────────────────────────────────────────────

export interface BaseInputs {
  baseNetSales: number;
  baseOpex: number;
  baseCash: number;
  baseCashInWeekly: number;
  arTotal: number;
  manualJeCount: number;
  closeAdjustmentsCount: number;
  pipelineExecutionRatio: number;
  variancePct: number;
}

export interface ScenarioPreset {
  id: string;
  label: string;
  controls: ControlState;
}
