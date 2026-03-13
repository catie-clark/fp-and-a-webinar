# Phase 2: Data Layer - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Create all 10 data files (`src/data/`) with internally consistent, FP&A-credible webinar data. Wire `page.tsx` to call `loadDashboardSeedData()` and pass `seedData` to `DashboardApp`. Set up `.env.local` with `OPENAI_API_KEY`. Phase ends when the dashboard header shows a real company name and derived period label, and `dataLoader.ts` returns without errors.

**What this phase does NOT do:** Compute KPIs from data (Phase 3), compute close stage progress from JEs (Phase 5), or implement the AI route (Phase 8). This phase makes the data available and validated — downstream phases compute from it.

</domain>

<decisions>
## Implementation Decisions

### Company identity
- **Company name:** "Summit Logistics Group" — fictional, sounds like a real mid-market regional distributor
- **Industry:** Distribution / logistics — makes fuel index a natural cost driver, inventory significant, AR aging meaningful for fleet/route customers
- **Annual revenue:** ~$100M (monthly net sales ~$9M range)
- **Reporting period:** Jan-2026 is the latest GL period (the "current close")
- **`closeTargetBusinessDays`:** 5 business days (standard mid-market close target)

### GL data shape (erp_gl_summary.csv)
The file needs at least 2 rows (Dec-2025 and Jan-2026) so the variancePct can be computed. `dataLoader.ts` takes the LAST row as the current period.

**Jan-2026 (current period — under pressure):**
- `net_sales`: 9,200,000 (slightly above plan, +3.4% vs Dec)
- `cogs`: 6,900,000 (75% of sales — fuel squeeze driving COGS up from typical 73%)
- `gross_profit`: 2,300,000 (25% margin — below target of ~27%)
- `ebitda`: 1,120,000 (~12.2% — compressed from target ~14%)
- `opex`: 1,180,000
- `cash`: 4,250,000 (tightish — AP timing)
- `ap_total`: 3,100,000
- `inventory_total`: 6,400,000
- `manual_je_count`: 47
- `close_adjustments_count`: 23

**Dec-2025 (prior period — healthier baseline for variance):**
- `net_sales`: 8,900,000
- `cogs`: 6,497,000 (73% — normal margin before fuel spike)
- `gross_profit`: 2,403,000 (27%)
- `ebitda`: 1,246,000 (14%)
- `opex`: 1,157,000
- `cash`: 4,680,000
- `ap_total`: 2,980,000
- `inventory_total`: 6,210,000
- `manual_je_count`: 38
- `close_adjustments_count`: 17

### company.json fields
```json
{
  "name": "Summit Logistics Group",
  "closeTargetBusinessDays": 5,
  "variancePct": 0.034,
  "defaultAssumptions": {
    "revenueGrowthPct": 0.03,
    "grossMarginPct": 0.25,
    "fuelIndex": 118,
    "collectionsRatePct": 0.97,
    "returnsPct": 0.012
  }
}
```
Note: `variancePct: 0.034` = (9.2M - 8.9M) / 8.9M ≈ 3.4% — derived from the GL rows, stored in company.json for Phase 3 to consume (DYNM-02 requirement).

### AR aging (ar_aging.csv)
- Elevated 61-90 and 90+ buckets — ~18% of total AR is past 60 days
- ~12-15 customer rows, total AR consistent with GL `ap_total`-scale (~$5.8M total)
- Buckets must sum to `ar_total` per row: ar_current + ar_1_30 + ar_31_60 + ar_61_90 + ar_90_plus = ar_total
- `ar90Ratio` computed by dataLoader: target ~0.10-0.12 (10-12% of total AR is 90+ days)
- Period column: "Jan-2026" for all rows

### CRM pipeline (crm_pipeline.csv)
- Healthy top of funnel, conversion drop-off in middle, Invoiced ~65% of Closed Won
- 5 stages: Qualified, Proposal, Negotiation, Closed Won, Invoiced
- ~20-25 deals total
- Amounts: Qualified $3.8M, Proposal $2.9M, Negotiation $1.6M, Closed Won $2.1M, Invoiced $1.4M
- Probability by stage: Qualified 0.25, Proposal 0.45, Negotiation 0.70, Closed Won 0.95, Invoiced 1.0

### Journal entries (erp_journal_entries.csv)
- 80-120 rows across all 6 close stages
- Stages: "AP close", "AR close", "Revenue recognition", "Inventory valuation", "Accruals & JEs", "Financial statement package"
- Status values: "posted", "approved", "pending-approval", "draft"
- Mix designed so Phase 5 can compute progress percentages that land approximately at the hardcoded values (78%, 70%, 66%, 59%, 62%, 47%)
  - AP close: ~78% posted/approved
  - AR close: ~70%
  - Revenue recognition: ~66%
  - Inventory valuation: ~59%
  - Accruals & JEs: ~62%
  - Financial statement package: ~47%
- Period: "Jan-2026" for all rows
- Amounts: varied, realistic (accruals $5K-$80K, AP entries $10K-$200K)

### Inventory adjustments (inventory_adjustments.csv)
- ~15-20 rows, period "Jan-2026"
- Items: realistic distribution inventory (fuel, vehicle parts, warehouse equipment, office supplies)
- Adjustments: mix of positive (restocking) and negative (shrinkage, write-offs)
- Amounts: -$8,000 to +$45,000 range

### 13-week cash flow (cash_13_week.csv)
- 13 rows, weeks labeled "W1" through "W13"
- Weeks 1-6: `is_actual = "true"` (historical actuals)
- Weeks 7-13: `is_actual = "false"` (forecast)
- Pattern: near-term dip in weeks 4-5 (payables timing, ~$180K net outflow), recovering by week 7-8
- Inflows ~$2.1M-$2.4M/week, outflows ~$2.0M-$2.5M/week
- `net_cash` = inflow - outflow (can be negative in dip weeks)

### Fuel index (external_fuel_index.csv)
- 6 rows (Aug-2025 through Jan-2026) — 6-month lookback
- Uptrend: Aug 100 → Sep 103 → Oct 107 → Nov 112 → Dec 115 → Jan 118
- This justifies the COGS margin squeeze visible in Jan vs Dec GL

### Vendor price index (external_vendor_price_index.csv)
- 6 rows (Aug-2025 through Jan-2026)
- Uptrend: Aug 100 → Sep 101 → Oct 102 → Nov 103 → Dec 104 → Jan 104.5
- Modest but visible — ~4.5% cumulative increase

### Scenario presets (scenario-presets.json)
6 presets in this order for the dropdown:

1. **"Jan 2026 Baseline"** (id: "baseline") — current actuals
   ```
   revenueGrowthPct: 0.03, grossMarginPct: 0.25, fuelIndex: 118,
   collectionsRatePct: 0.97, returnsPct: 0.012, lateInvoiceHours: 4,
   journalLoadMultiplier: 1.0, all toggles: false
   ```

2. **"Conservative Close"** (id: "conservative") — CFO playing defense
   ```
   revenueGrowthPct: 0.00, grossMarginPct: 0.25, fuelIndex: 118,
   collectionsRatePct: 0.97, returnsPct: 0.012, lateInvoiceHours: 2,
   journalLoadMultiplier: 0.9, conservativeForecastBias: true, tightenCreditHolds: true,
   prioritizeCashMode: false, inventoryComplexity: false
   ```

3. **"Q4 Push for Target"** (id: "q4-push") — revenue acceleration, elevated close complexity
   ```
   revenueGrowthPct: 0.065, grossMarginPct: 0.24, fuelIndex: 118,
   collectionsRatePct: 0.96, returnsPct: 0.018, lateInvoiceHours: 11,
   journalLoadMultiplier: 1.25, all toggles: false
   ```

4. **"Fuel Cost Shock"** (id: "fuel-shock") — external cost spike hits margins
   ```
   revenueGrowthPct: 0.03, grossMarginPct: 0.22, fuelIndex: 137,
   collectionsRatePct: 0.97, returnsPct: 0.012, lateInvoiceHours: 4,
   journalLoadMultiplier: 1.0, all toggles: false
   ```

5. **"Cash Preservation Mode"** (id: "cash-mode") — lock down liquidity
   ```
   revenueGrowthPct: 0.01, grossMarginPct: 0.25, fuelIndex: 118,
   collectionsRatePct: 0.99, returnsPct: 0.010, lateInvoiceHours: 2,
   journalLoadMultiplier: 0.9, prioritizeCashMode: true, tightenCreditHolds: true,
   conservativeForecastBias: false, inventoryComplexity: false
   ```

6. **"Optimistic Recovery"** (id: "optimistic") — fuel normalizes, collections improve
   ```
   revenueGrowthPct: 0.06, grossMarginPct: 0.27, fuelIndex: 105,
   collectionsRatePct: 0.99, returnsPct: 0.009, lateInvoiceHours: 2,
   journalLoadMultiplier: 0.9, all toggles: false
   ```

### page.tsx wiring
- Add `const seedData = await loadDashboardSeedData()` to `page.tsx`
- Pass `seedData` as a prop to `<DashboardApp seedData={seedData} />`
- Add validation: `console.log(JSON.stringify(seedData))` temporarily during development to verify no `undefined` values (per success criteria)
- Remove the console.log before committing

### .env.local setup
- Create `.env.local` in the app root with `OPENAI_API_KEY=your-key-here` placeholder
- Confirm `.env.local` is in `.gitignore` (it already is from Phase 1)
- Success criteria: file exists, is gitignored, contains the key name

### Claude's Discretion
- Exact customer IDs in AR aging (format doesn't matter to Phase 3-9)
- Deal IDs in CRM pipeline
- Specific item names in inventory adjustments
- JE ID format and account names
- Whether to add 3 months or 6 months of GL history (minimum 2 rows, more is fine)

</decisions>

<specifics>
## Specific Ideas

- The "Fuel Cost Shock" preset is the intended demo showstopper — EBITDA should drop visibly (not just change by 0.1%) when this preset is loaded. The `grossMarginPct` drop from 25% to 22% on a $9.2M base is a ~$276K EBITDA hit — should be clearly visible on the KPI card.
- Company name "Summit Logistics Group" must appear in the dashboard header (DYNM-04). It should sound like a real Crowe client.
- The `variancePct` in `company.json` (0.034) represents the month-over-month revenue growth from Dec-2025 to Jan-2026 — this is what Phase 3 uses for the variance KPI badge on Net Sales.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/csv.ts` — `parseCsv()` already works and all 8 CSV files use it via `dataLoader.ts`
- `src/features/model/types.ts` — all 9 Zod schemas already defined; column names in CSVs **must match schema field names exactly** (PapaParse returns header strings as keys)
- `src/lib/dataLoader.ts` — fully written; reads files, parses, computes `baseInputs`. Phase 2 creates the data files it expects, then wires `page.tsx` to call it

### Established Patterns
- All numeric CSV fields use `z.coerce.number()` — PapaParse returns strings, coercion handles this automatically
- `is_actual` in `cash_13_week.csv` must be the string `"true"` or `"false"` (not JSON booleans — it's a CSV)
- `dataLoader.ts` reads the LAST row of `erp_gl_summary.csv` as the current period (`glRows[glRows.length - 1]`)

### Integration Points
- `page.tsx` currently renders `<DashboardApp />` with no props — Phase 2 adds `await loadDashboardSeedData()` and passes result as `seedData` prop
- `DashboardApp.tsx` already accepts `seedData?: DashboardSeedData` as an optional prop
- The `DashboardSeedData` type is exported from `dataLoader.ts` — importing it in `page.tsx` is straightforward

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 2 scope

</deferred>

---

*Phase: 02-data-layer*
*Context gathered: 2026-03-04*
