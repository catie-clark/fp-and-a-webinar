# Phase 2: Data Layer - Research

**Researched:** 2026-03-04
**Domain:** Static data file authoring, Zod schema compliance, Next.js server-component data wiring
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Company identity:**
- Company name: "Summit Logistics Group"
- Industry: Distribution / logistics
- Annual revenue: ~$100M (monthly net sales ~$9M range)
- Reporting period: Jan-2026 is the latest GL period (the "current close")
- `closeTargetBusinessDays`: 5 business days

**GL data shape (erp_gl_summary.csv) — exact values locked:**
- Jan-2026 (current): net_sales 9,200,000 | cogs 6,900,000 | gross_profit 2,300,000 | ebitda 1,120,000 | opex 1,180,000 | cash 4,250,000 | ap_total 3,100,000 | inventory_total 6,400,000 | manual_je_count 47 | close_adjustments_count 23
- Dec-2025 (prior): net_sales 8,900,000 | cogs 6,497,000 | gross_profit 2,403,000 | ebitda 1,246,000 | opex 1,157,000 | cash 4,680,000 | ap_total 2,980,000 | inventory_total 6,210,000 | manual_je_count 38 | close_adjustments_count 17

**company.json fields — locked:**
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

**AR aging (ar_aging.csv):** ~12-15 rows, period "Jan-2026", total AR ~$5.8M, ~18% past 60 days, ar90Ratio ~0.10-0.12

**CRM pipeline (crm_pipeline.csv):** 5 stages, ~20-25 deals, amounts: Qualified $3.8M | Proposal $2.9M | Negotiation $1.6M | Closed Won $2.1M | Invoiced $1.4M; probabilities: 0.25/0.45/0.70/0.95/1.0

**Journal entries (erp_journal_entries.csv):** 80-120 rows, 6 stages, 4 status values, mix achieving ~78%/70%/66%/59%/62%/47% progress per stage

**Inventory adjustments (inventory_adjustments.csv):** ~15-20 rows, period "Jan-2026", amounts -$8,000 to +$45,000

**13-week cash flow (cash_13_week.csv):** 13 rows, W1-W13, weeks 1-6 is_actual="true", weeks 7-13 is_actual="false"

**Fuel index (external_fuel_index.csv):** 6 rows Aug-2025 to Jan-2026, values 100/103/107/112/115/118

**Vendor price index (external_vendor_price_index.csv):** 6 rows Aug-2025 to Jan-2026, values 100/101/102/103/104/104.5

**Scenario presets (scenario-presets.json):** 6 presets with exact values as specified in CONTEXT.md

**page.tsx wiring:** `await loadDashboardSeedData()` → pass as `seedData` prop to `<DashboardApp>`

**.env.local:** Create with `OPENAI_API_KEY=your-key-here` placeholder

### Claude's Discretion
- Exact customer IDs in AR aging (format doesn't matter to Phase 3-9)
- Deal IDs in CRM pipeline
- Specific item names in inventory adjustments
- JE ID format and account names
- Whether to add 3 months or 6 months of GL history (minimum 2 rows, more is fine)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within Phase 2 scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOND-02 | Application validates all data on load — `features/model/types.ts` contains all Zod schemas and TypeScript types for every data file | Schemas already exist; data files must match column names exactly |
| FOND-04 | Dashboard loads real data — all 10 files exist in `src/data/` with internally consistent, realistic webinar-quality sample data | 9 files missing (1 exists but needs replacement); exact values specified in CONTEXT |
| FOND-08 | OpenAI API key available securely — `.env.local` contains `OPENAI_API_KEY`, excluded via `.gitignore` | `.env*.local` already gitignored; just create the file |
| DYNM-01 | Dashboard header shows correct reporting period — `periodLabel` derived from latest period in `erp_gl_summary.csv`, not hardcoded | `dataLoader.ts` reads `glRows[glRows.length - 1]` — GL file's last row determines period; `page.tsx` must pass `seedData` |
| DYNM-02 | Variance calculations use configurable or computed rates — `variancePct` not hardcoded | CRITICAL: `dataLoader.ts` currently hardcodes `variancePct: 0.037`; must be changed to read from `company.json` (value: 0.034) |
| DYNM-03 | Close stage target days configurable — reads `closeTargetBusinessDays` from `company.json` | `company.json` must have this field; `dataLoader.ts` already parses and exposes it via `company` object |
| DYNM-04 | Dashboard header shows correct company name — loaded from `company.json`, not hardcoded | `company.json` must exist; `dataLoader.ts` already parses `name` field and exposes via `company` object |
</phase_requirements>

---

## Summary

Phase 2 is a data authoring and wiring phase, not an infrastructure phase. All the consuming infrastructure (`dataLoader.ts`, `parseCsv()`, all 9 Zod schemas) is already written and tested. The task is to create 9 missing data files (8 CSVs + 1 JSON, plus replacing the 1 existing CSV), activate the wiring in `page.tsx`, fix one hardcoded value in `dataLoader.ts`, and create `.env.local`.

The most critical constraint is **column name exactness**: PapaParse returns CSV headers as object keys and Zod validates them by name. Every CSV column name must exactly match the field names in the corresponding schema in `src/features/model/types.ts`. Any mismatch silently fails with Zod's `.default(0)` fallbacks, producing all-zero data that looks valid but is wrong.

The second critical constraint is **internal consistency**: the GL rows, AR totals, and cash flow numbers must be coherent as a business story. The CONTEXT.md has pre-solved all the numbers — use them exactly. Do not invent alternative values.

**Primary recommendation:** Author all 10 data files using the exact values from CONTEXT.md, verify column names against `types.ts` schemas before writing, fix `variancePct` in `dataLoader.ts` to read from `company.json`, then wire `page.tsx`.

---

## Standard Stack

### Core (already installed — no new installs needed for Phase 2)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| zod | ^3.24.0 | Runtime validation of all data files | Already installed; schemas written |
| papaparse | ^5.4.1 | CSV parsing (string → Record[]) | Already installed; `parseCsv()` written |
| next | 16.1.6 | `fs` access in Server Components | Already installed |

### No New Dependencies Required
Phase 2 creates static files (JSON, CSV) and wires existing code. No new npm packages are needed.

---

## Architecture Patterns

### Recommended Project Structure (Phase 2 additions)
```
src/data/                            # Target state after Phase 2
├── company.json                     # MISSING — create
├── scenario-presets.json            # MISSING — create
├── erp_gl_summary.csv               # MISSING — create (2+ rows, Dec-2025 first, Jan-2026 last)
├── ar_aging.csv                     # MISSING — create
├── crm_pipeline.csv                 # MISSING — create
├── erp_journal_entries.csv          # MISSING — create
├── inventory_adjustments.csv        # MISSING — create
├── cash_13_week.csv                 # MISSING — create
├── external_fuel_index.csv          # MISSING — create
└── external_vendor_price_index.csv  # EXISTS but needs replacement (wrong values, 5 rows not 6)
```

### Pattern 1: CSV Column Names Must Match Schema Field Names
**What:** PapaParse `header: true` returns `{ [headerName]: string }[]`. Zod validates by field name. Column headers in CSVs must be identical to the schema field names.
**When to use:** Every CSV file created in this phase.

Schema-to-CSV column mappings (from `src/features/model/types.ts`):

```
glRowSchema fields:
  period, net_sales, cogs, gross_profit, ebitda, opex, cash, ap_total,
  inventory_total, manual_je_count, close_adjustments_count

arRowSchema fields:
  period, customer_id, ar_total, ar_current, ar_1_30, ar_31_60, ar_61_90, ar_90_plus

pipelineRowSchema fields:
  deal_id, stage, amount_usd, probability, close_date

journalEntryRowSchema fields:
  je_id, period, account, description, amount, stage, status
  (description is optional — may be empty, still include column)

inventoryAdjustmentRowSchema fields:
  adj_id, period, item, quantity, amount

cash13WeekRowSchema fields:
  week, is_actual, inflow, outflow, net_cash

externalFuelIndexRowSchema fields:
  period, fuel_index

externalVendorPriceIndexRowSchema fields:
  period, vendor_price_index
```

### Pattern 2: is_actual Must Be String, Not Boolean
**What:** `cash13WeekRowSchema` uses `z.string()` for `is_actual`, not `z.boolean()`. PapaParse returns CSV values as strings. The file must contain the literal text `true` or `false` (without JSON boolean syntax).
**When to use:** `cash_13_week.csv` — weeks 1-6 use `true`, weeks 7-13 use `false`.

```csv
week,is_actual,inflow,outflow,net_cash
W1,true,2350000,2180000,170000
W7,false,2200000,2150000,50000
```

### Pattern 3: dataLoader Reads Last GL Row as Current Period
**What:** `dataLoader.ts` uses `glRows[glRows.length - 1]` for `latestGL`. The LAST row of the CSV is the current period.
**When to use:** `erp_gl_summary.csv` — Dec-2025 must be first row, Jan-2026 must be last row.

```csv
period,net_sales,...
Dec-2025,8900000,...   ← prior period (first row)
Jan-2026,9200000,...   ← current period (last row) — drives all baseInputs
```

### Pattern 4: JSON Files Use Real JSON Booleans
**What:** `controlStateSchema` uses `z.boolean()` (not `z.string()`). JSON files can have real `true`/`false`. Unlike CSVs, JSON parsing preserves types.
**When to use:** `scenario-presets.json` toggle fields (`prioritizeCashMode`, `conservativeForecastBias`, `tightenCreditHolds`, `inventoryComplexity`) must be JSON booleans.

### Pattern 5: page.tsx Must Be Async
**What:** `loadDashboardSeedData()` is async. `page.tsx` must be declared `async` to use `await`.
**Current state:** `page.tsx` currently exports a sync function. The Phase 2 wiring changes it to async.

```typescript
// src/app/page.tsx — Phase 2 wiring
import DashboardApp from '@/components/DashboardApp';
import { loadDashboardSeedData } from '@/lib/dataLoader';

export default async function Page() {
  const seedData = await loadDashboardSeedData();
  return <DashboardApp seedData={seedData} />;
}
```

### Anti-Patterns to Avoid
- **Wrong column names:** Writing `ar_1to30` instead of `ar_1_30` — Zod parses as 0, looks valid
- **Arithmetic inconsistency in AR rows:** `ar_total !== ar_current + ar_1_30 + ar_31_60 + ar_61_90 + ar_90_plus` — confuses Phase 6 chart
- **is_actual as JSON boolean in CSV:** Writing `true` is correct; writing `TRUE` fails `z.string()` match in downstream consumers
- **GL rows out of order:** Jan-2026 first, Dec-2025 last — `dataLoader` takes LAST row as current, reads wrong period
- **JSON with trailing commas:** Causes `JSON.parse()` to throw, crashing `loadDashboardSeedData()`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing | Custom string.split() | PapaParse via `parseCsv()` | Already written; handles edge cases |
| Schema validation | Manual type checks | Existing Zod schemas in `types.ts` | Already written; column names locked |
| File reading | Direct `require()` | `readDataFile()` in `dataLoader.ts` | Already written; handles cwd correctly |
| Data loading | New loader function | `loadDashboardSeedData()` | Already written; only data files are missing |

**Key insight:** Phase 2 is a data content problem, not a code problem. The implementation is already done. Writing code when the problem is data authoring wastes time and introduces bugs.

---

## Common Pitfalls

### Pitfall 1: Column Name Case/Underscore Mismatch
**What goes wrong:** Zod silently returns `0` for any numeric field it can't find (due to `.default(0)`). A misnamed column like `net-sales` or `netSales` causes all values in that column to be 0. The loader doesn't throw — it silently produces wrong data.
**Why it happens:** PapaParse uses CSV headers verbatim as object keys. Zod matches by field name.
**How to avoid:** Cross-reference every column header against the corresponding schema in `types.ts` before writing the file. Use the schema field list from the Architecture Patterns section above as a checklist.
**Warning signs:** `baseNetSales: 0` in the JSON.stringify output, or `ar90Ratio: 0`.

### Pitfall 2: variancePct Is Hardcoded in dataLoader.ts
**What goes wrong:** `dataLoader.ts` line 108 has `variancePct: 0.037` hardcoded. Even after creating `company.json` with `variancePct: 0.034`, the loader ignores it. DYNM-02 requires this to NOT be hardcoded.
**Why it happens:** The dataLoader was written before Phase 2 data existed — it used a placeholder.
**How to avoid:** In the Phase 2 plan, include a task to update `dataLoader.ts` to read `variancePct` from the parsed `company` object: `variancePct: company.variancePct ?? 0.034`.
**Warning signs:** The variance badge in Phase 3 shows 3.7% instead of 3.4%.

### Pitfall 3: Existing vendor_price_index.csv Has Wrong Values
**What goes wrong:** `src/data/external_vendor_price_index.csv` already exists but uses a ~116-121 scale starting Sep-2025 (5 rows), not the Aug-2025-baseline scale (100→104.5, 6 rows) specified in CONTEXT.
**Why it happens:** A prior developer created a placeholder file with different values.
**How to avoid:** The Phase 2 plan must explicitly REPLACE (overwrite) this file with the correct content, not skip it as "already done."
**Warning signs:** Fuel index story doesn't align with vendor index narrative if scales differ.

### Pitfall 4: AR Bucket Arithmetic Must Balance
**What goes wrong:** `dataLoader.ts` computes `ar90Ratio` as `ar90 / arTotal` where both are summed across all customer rows. If `ar_current + ar_1_30 + ar_31_60 + ar_61_90 + ar_90_plus !== ar_total` per row, the computed ratio is wrong.
**Why it happens:** Manual data entry error when the buckets don't add up.
**How to avoid:** For each AR row, verify: `ar_current + ar_1_30 + ar_31_60 + ar_61_90 + ar_90_plus = ar_total`. The total AR across all rows should be ~$5.8M. Target `ar90Ratio` of 0.10-0.12 means 90+ days bucket ≈ $580K-$696K total.
**Warning signs:** `ar90Ratio` outside 0.10-0.12 range in console.log verification.

### Pitfall 5: JE Stage Names Must Match Exactly
**What goes wrong:** Phase 5 groups JEs by `stage` field to compute close progress. If the stage names in the CSV differ from what Phase 5 code expects, progress computes as 0%.
**Why it happens:** Inconsistent naming ("AP Close" vs "AP close").
**How to avoid:** Use exactly these stage values (case-sensitive): `"AP close"`, `"AR close"`, `"Revenue recognition"`, `"Inventory valuation"`, `"Accruals & JEs"`, `"Financial statement package"`. Note: CONTEXT.md lists "Accruals & JEs" — use this exact string.
**Warning signs:** Close tracker in Phase 5 shows 0% for any stage.

### Pitfall 6: console.log Verification Must Show No undefined
**What goes wrong:** Nested `undefined` values in the seedData object cause React serialization errors when passing from Server Component to Client Component.
**Why it happens:** Missing optional fields, undefined JSON values, or schema mismatches that don't throw but produce undefined.
**How to avoid:** Add `console.log(JSON.stringify(seedData))` temporarily in `page.tsx` after wiring. If ANY field shows as undefined or is omitted from the JSON (JSON.stringify skips undefined), find and fix it before removing the log.
**Warning signs:** JSON output missing expected keys, or Next.js throwing serialization errors about non-serializable data.

---

## Code Examples

### company.json (exact content)
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

### erp_gl_summary.csv (minimum structure — 2 rows)
```csv
period,net_sales,cogs,gross_profit,ebitda,opex,cash,ap_total,inventory_total,manual_je_count,close_adjustments_count
Dec-2025,8900000,6497000,2403000,1246000,1157000,4680000,2980000,6210000,38,17
Jan-2026,9200000,6900000,2300000,1120000,1180000,4250000,3100000,6400000,47,23
```

### external_fuel_index.csv (6 rows, Aug-2025 baseline)
```csv
period,fuel_index
Aug-2025,100
Sep-2025,103
Oct-2025,107
Nov-2025,112
Dec-2025,115
Jan-2026,118
```

### external_vendor_price_index.csv (6 rows — REPLACES existing file)
```csv
period,vendor_price_index
Aug-2025,100
Sep-2025,101
Oct-2025,102
Nov-2025,103
Dec-2025,104
Jan-2026,104.5
```

### cash_13_week.csv (is_actual is string "true"/"false")
```csv
week,is_actual,inflow,outflow,net_cash
W1,true,2350000,2180000,170000
W2,true,2280000,2200000,80000
W3,true,2410000,2300000,110000
W4,true,2150000,2330000,-180000
W5,true,2100000,2280000,-180000
W6,true,2300000,2250000,50000
W7,false,2200000,2150000,50000
W8,false,2350000,2200000,150000
W9,false,2400000,2250000,150000
W10,false,2300000,2200000,100000
W11,false,2250000,2180000,70000
W12,false,2380000,2200000,180000
W13,false,2420000,2220000,200000
```

### dataLoader.ts fix for variancePct (DYNM-02)
```typescript
// BEFORE (line ~108 in dataLoader.ts) — hardcoded, violates DYNM-02:
variancePct: 0.037,

// AFTER — reads from company.json:
variancePct: company.variancePct ?? 0.034,
```

Note: `company.json` now includes the `variancePct` field, so the dataLoader must parse it. The existing `Company` type in `dataLoader.ts` does NOT include `variancePct` — it must be added to the type definition.

### Updated Company type in dataLoader.ts
```typescript
// Current (missing variancePct):
type Company = {
  name: string;
  closeTargetBusinessDays: number;
  defaultAssumptions: Pick<ControlState, ...>;
};

// Required after Phase 2:
type Company = {
  name: string;
  closeTargetBusinessDays: number;
  variancePct: number;
  defaultAssumptions: Pick<ControlState, ...>;
};
```

And the inline Zod schema inside `loadDashboardSeedData` must also include `variancePct: z.number()`.

### scenario-presets.json structure (controls must match controlStateSchema exactly)
```json
[
  {
    "id": "baseline",
    "label": "Jan 2026 Baseline",
    "controls": {
      "revenueGrowthPct": 0.03,
      "grossMarginPct": 0.25,
      "fuelIndex": 118,
      "collectionsRatePct": 0.97,
      "returnsPct": 0.012,
      "lateInvoiceHours": 4,
      "journalLoadMultiplier": 1.0,
      "prioritizeCashMode": false,
      "conservativeForecastBias": false,
      "tightenCreditHolds": false,
      "inventoryComplexity": false
    }
  }
]
```

All 11 `controlStateSchema` fields must be present in every preset's `controls` object. Missing fields cause Zod to throw at load time.

### page.tsx wiring (exact pattern from CONTEXT)
```typescript
// src/app/page.tsx
import DashboardApp from '@/components/DashboardApp';
import { loadDashboardSeedData } from '@/lib/dataLoader';

export default async function Page() {
  const seedData = await loadDashboardSeedData();
  // Temporary verification — remove before committing:
  // console.log(JSON.stringify(seedData));
  return <DashboardApp seedData={seedData} />;
}
```

---

## State of the Art (What's Already Done vs What's Needed)

| Component | Status | Phase 2 Action |
|-----------|--------|----------------|
| `parseCsv()` in `src/lib/csv.ts` | Done | None — use as-is |
| All 9 Zod schemas in `types.ts` | Done | None — column names are locked |
| `loadDashboardSeedData()` in `dataLoader.ts` | Done but has 2 issues | Fix `variancePct` hardcode; fix `Company` type |
| `DashboardApp.tsx` | Done — accepts `seedData?` | None |
| `page.tsx` | Done but not wired | Add `async`, add `loadDashboardSeedData()`, pass prop |
| `.gitignore` | Done — `.env*.local` already excluded | None |
| `company.json` | MISSING | Create |
| `scenario-presets.json` | MISSING | Create |
| `erp_gl_summary.csv` | MISSING | Create |
| `ar_aging.csv` | MISSING | Create |
| `crm_pipeline.csv` | MISSING | Create |
| `erp_journal_entries.csv` | MISSING | Create |
| `inventory_adjustments.csv` | MISSING | Create |
| `cash_13_week.csv` | MISSING | Create |
| `external_fuel_index.csv` | MISSING | Create |
| `external_vendor_price_index.csv` | EXISTS but wrong values | Replace entirely |
| `.env.local` | MISSING | Create with `OPENAI_API_KEY=your-key-here` |

---

## Open Questions

1. **JE stage name "Accruals & JEs" vs "Accruals and manual JEs"**
   - What we know: CONTEXT.md uses "Accruals & JEs" in the stage values list but "Accruals and manual JEs" in the broader description
   - What's unclear: Which exact string Phase 5 code will use for grouping
   - Recommendation: Use `"Accruals & JEs"` in the CSV (shorter, consistent with the CONTEXT bullet on stage values). Flag for Phase 5 planning to confirm grouping key.

2. **GL rows: use exactly 2, or add Dec-2024 for fuller history?**
   - What we know: Minimum is 2 rows; CONTEXT says "more is fine"
   - What's unclear: Whether Phase 3 or 9 benefits from 3+ months of history
   - Recommendation: Use exactly 2 rows (Dec-2025, Jan-2026) — minimum required, avoids creating numbers that aren't needed and aren't specified.

3. **AR customer naming format**
   - What we know: Claude's discretion; format doesn't matter to Phase 3-9
   - Recommendation: Use `CUST-001` through `CUST-013` format for customer_id. Close_date in pipeline: use `2026-02-28` format for all (schema uses `z.string()`, any format works).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.0 |
| Config file | `vitest.config.ts` (app root) |
| Quick run command | `node ./node_modules/vitest/vitest.mjs run` (run from app root — see STATE.md note on ampersand path issue) |
| Full suite command | `node ./node_modules/vitest/vitest.mjs run` |
| Test location pattern | `src/**/__tests__/**/*.test.ts` |

**Important:** Per STATE.md, `npx vitest` fails due to the `&` ampersand in the path `FP&A Webinar`. Use direct node invocation: `node "./node_modules/vitest/vitest.mjs" run` from the app root.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOND-02 | Zod schemas parse all data files without errors | unit | `node ./node_modules/vitest/vitest.mjs run` | ❌ Wave 0 |
| FOND-04 | All 10 data files exist and are non-empty | unit (file existence) | `node ./node_modules/vitest/vitest.mjs run` | ❌ Wave 0 |
| FOND-08 | `.env.local` exists and is gitignored | manual-only | N/A | N/A |
| DYNM-01 | `seedData.company.name` equals "Summit Logistics Group" | unit | `node ./node_modules/vitest/vitest.mjs run` | ❌ Wave 0 |
| DYNM-02 | `seedData.baseInputs.variancePct` equals 0.034 (not 0.037) | unit | `node ./node_modules/vitest/vitest.mjs run` | ❌ Wave 0 |
| DYNM-03 | `seedData.company.closeTargetBusinessDays` equals 5 | unit | `node ./node_modules/vitest/vitest.mjs run` | ❌ Wave 0 |
| DYNM-04 | `seedData.company.name` is non-empty string | unit | `node ./node_modules/vitest/vitest.mjs run` | ❌ Wave 0 |

**Note on FOND-08:** `.env.local` file existence and gitignore status is a manual verification step — it cannot be tested automatically without filesystem inspection that varies per environment.

### Sampling Rate
- **Per task commit:** `node "./node_modules/vitest/vitest.mjs" run` from app root
- **Per wave merge:** Same command
- **Phase gate:** Full suite green + `console.log(JSON.stringify(seedData))` shows valid JSON before removing log

### Wave 0 Gaps

- [ ] `src/features/model/__tests__/dataLoader.test.ts` — covers FOND-02, FOND-04, DYNM-01, DYNM-02, DYNM-03, DYNM-04

The test should:
1. Call `loadDashboardSeedData()` (needs data files to exist first — Wave 1+ task)
2. Assert `seedData.company.name === "Summit Logistics Group"`
3. Assert `seedData.baseInputs.variancePct === 0.034`
4. Assert `seedData.company.closeTargetBusinessDays === 5`
5. Assert `seedData.baseInputs.baseNetSales === 9200000`
6. Assert `seedData.ar90Ratio >= 0.10 && seedData.ar90Ratio <= 0.12`
7. Assert `seedData.presets.length === 6`
8. Assert `seedData.cash13Week.length === 13`

**Ordering constraint:** The Wave 0 test stub should import and describe the tests but the data files must be created before the tests can pass. Create the test file in Wave 0 with `vi.mock` or skip it as integration test to run after Wave 1 data files exist.

---

## Sources

### Primary (HIGH confidence)
- Direct source code read: `src/features/model/types.ts` — all 9 Zod schemas and field names confirmed
- Direct source code read: `src/lib/dataLoader.ts` — loader logic, `variancePct` hardcode, `Company` type confirmed
- Direct source code read: `src/app/page.tsx` — current Phase 1 state, Phase 2 wiring pattern confirmed
- Direct source code read: `src/components/DashboardApp.tsx` — `seedData?` prop confirmed
- Direct source code read: `.gitignore` — `.env*.local` exclusion confirmed
- Direct source code read: `src/data/external_vendor_price_index.csv` — existing wrong values confirmed
- Direct source code read: `vitest.config.ts` — test discovery pattern confirmed
- `.planning/phases/02-data-layer/02-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- `package.json` — confirmed versions: zod ^3.24.0, papaparse ^5.4.1, vitest ^4.0.0
- `STATE.md` — confirmed vitest ampersand path issue and workaround

### Tertiary (LOW confidence)
- None — all findings from direct source inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from `package.json` and `node_modules`
- Architecture: HIGH — all patterns derived from reading existing source code directly
- Pitfalls: HIGH — `variancePct` hardcode and wrong existing CSV confirmed by direct file read; column name trap confirmed from `types.ts` and `csv.ts` logic
- Data content: HIGH — all values locked by CONTEXT.md decisions

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable — no external dependencies; all findings from local source files)
