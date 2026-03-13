import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { parseCsv } from "./csv";
import {
  arRowSchema,
  cash13WeekRowSchema,
  controlStateSchema,
  externalFuelIndexRowSchema,
  externalVendorPriceIndexRowSchema,
  glRowSchema,
  inventoryAdjustmentRowSchema,
  journalEntryRowSchema,
  pipelineRowSchema,
  type ARRow,
  type BaseInputs,
  type Cash13WeekRow,
  type CloseStage,
  type ControlState,
  type ExternalFuelIndexRow,
  type ExternalVendorPriceIndexRow,
  type GLRow,
  type InventoryAdjustmentRow,
  type JournalEntryRow,
  type PipelineRow,
  type ScenarioPreset,
} from "@/features/model/types";

type Company = {
  name: string;
  closeTargetBusinessDays: number;
  variancePct?: number;
  defaultAssumptions: Pick<ControlState, "revenueGrowthPct" | "grossMarginPct" | "fuelIndex" | "collectionsRatePct" | "returnsPct">;
};

export type DashboardSeedData = {
  company: Company;
  presets: ScenarioPreset[];
  baseInputs: BaseInputs;
  ar90Ratio: number;
  currentClosePeriod: string;
  arAging: ARRow[];
  crmPipeline: PipelineRow[];
  closeStages: CloseStage[];
  journalEntries: JournalEntryRow[];
  inventoryAdjustments: InventoryAdjustmentRow[];
  cash13Week: Cash13WeekRow[];
  externalFuelIndex: ExternalFuelIndexRow[];
  externalVendorPriceIndex: ExternalVendorPriceIndexRow[];
};

async function readDataFile(file: string): Promise<string> {
  const filePath = path.join(process.cwd(), "src", "data", file);
  return fs.readFile(filePath, "utf8");
}

export async function loadDashboardSeedData(): Promise<DashboardSeedData> {
  const companyRaw = await readDataFile("company.json");
  const presetsRaw = await readDataFile("scenario-presets.json");

  const company = z
    .object({
      name: z.string(),
      closeTargetBusinessDays: z.number(),
      variancePct: z.number().optional(),
      defaultAssumptions: z.object({
        revenueGrowthPct: z.number(),
        grossMarginPct: z.number(),
        fuelIndex: z.number(),
        collectionsRatePct: z.number(),
        returnsPct: z.number(),
      }),
    })
    .parse(JSON.parse(companyRaw));

  const presetSchema = z.object({
    id: z.string(),
    label: z.string(),
    controls: controlStateSchema,
  });
  const presets = z.array(presetSchema).parse(JSON.parse(presetsRaw));

  // Derive baseline preset for seed EBITDA computation (added for Phase 7)
  const baselinePreset = presets.find(p => p.id === 'baseline') ?? presets[0];
  const seedGrossMarginPct = baselinePreset.controls.grossMarginPct;

  const glRows = z.array(glRowSchema).parse(parseCsv(await readDataFile("erp_gl_summary.csv"))) as GLRow[];
  const arRows = z.array(arRowSchema).parse(parseCsv(await readDataFile("ar_aging.csv"))) as ARRow[];
  const pipelineRows = z.array(pipelineRowSchema).parse(parseCsv(await readDataFile("crm_pipeline.csv"))) as PipelineRow[];
  const journalEntries = z.array(journalEntryRowSchema).parse(parseCsv(await readDataFile("erp_journal_entries.csv"))) as JournalEntryRow[];
  const inventoryAdjustments = z
    .array(inventoryAdjustmentRowSchema)
    .parse(parseCsv(await readDataFile("inventory_adjustments.csv"))) as InventoryAdjustmentRow[];
  const cash13Week = z.array(cash13WeekRowSchema).parse(parseCsv(await readDataFile("cash_13_week.csv"))) as Cash13WeekRow[];
  const externalFuelIndex = z
    .array(externalFuelIndexRowSchema)
    .parse(parseCsv(await readDataFile("external_fuel_index.csv"))) as ExternalFuelIndexRow[];
  const externalVendorPriceIndex = z
    .array(externalVendorPriceIndexRowSchema)
    .parse(parseCsv(await readDataFile("external_vendor_price_index.csv"))) as ExternalVendorPriceIndexRow[];

  const latestGL = glRows[glRows.length - 1];
  const currentClosePeriod =
    Array.from(new Set(journalEntries.map((je) => je.period))).sort().at(-1) ?? latestGL.period;
  const arTotal = arRows.reduce((sum, row) => sum + row.ar_total, 0);
  const ar90 = arRows.reduce((sum, row) => sum + row.ar_90_plus, 0);
  const weightedPipeline = pipelineRows.reduce((sum, row) => sum + row.amount_usd * row.probability, 0);
  const pipelineTotal = pipelineRows.reduce((sum, row) => sum + row.amount_usd, 0);
  const pipelineExecutionRatio = pipelineTotal > 0 ? weightedPipeline / pipelineTotal : 0.9;

  const baseInputs: BaseInputs = {
    baseNetSales: latestGL.net_sales,
    baseOpex: latestGL.opex,
    baseCash: latestGL.cash,
    baseCashInWeekly: latestGL.net_sales / 4,
    arTotal,
    apTotal: latestGL.ap,
    inventoryTotal: latestGL.inventory,
    manualJeCount: latestGL.manual_je_count,
    closeAdjustmentsCount: latestGL.close_adjustments_count,
    pipelineExecutionRatio,
    variancePct: company.variancePct ?? 0.034,
    baseGrossMarginPct: seedGrossMarginPct,
    baseEbitda: latestGL.net_sales * seedGrossMarginPct - latestGL.opex,
    // Formula: baseNetSales * baseGrossMarginPct - baseOpex
    // fuelIndex=100 means no fuel delta (FUEL_COGS_SHARE * 0 = 0), so no fuel adjustment needed here.
  };

  // Map entry_type values to close stage names
  const ENTRY_TYPE_TO_STAGE: Record<string, string> = {
    'Reclass': 'AP close',
    'AR Reconciliation': 'AR close',
    'Accrual': 'Accruals & JEs',
    'Expense Accrual': 'Accruals & JEs',
    'Revenue Cutoff': 'Revenue recognition',
    'Valuation': 'Inventory valuation',
    'FS Package Review': 'Financial statement package',
  };

  const STAGE_NAMES = [
    'AP close',
    'AR close',
    'Revenue recognition',
    'Inventory valuation',
    'Accruals & JEs',
    'Financial statement package',
  ] as const;

  // Compute close stage progress from entry_type (requires_rework=0 → posted, 1 → pending)
  const closeStages: CloseStage[] = STAGE_NAMES.map(name => {
    const rows = journalEntries.filter(
      je => je.period === currentClosePeriod && ENTRY_TYPE_TO_STAGE[je.entry_type] === name
    );
    const total = rows.length;
    const posted = rows.filter(je => je.requires_rework === 0).length;
    const pendingApproval = rows.filter(je => je.requires_rework === 1).length;
    const progress = total > 0 ? Math.round((posted / total) * 100) : 0;
    return { name, progress, posted, pendingApproval, total };
  });

  return {
    company,
    presets,
    baseInputs,
    ar90Ratio: arTotal > 0 ? ar90 / arTotal : 0,
    currentClosePeriod,
    arAging: arRows,
    crmPipeline: pipelineRows,
    closeStages,
    journalEntries,
    inventoryAdjustments,
    cash13Week,
    externalFuelIndex,
    externalVendorPriceIndex,
  };
}
