// src/lib/aiSummaryCache.ts
// Pre-cached AI executive narrative for the Jan 2026 Baseline scenario.
// Displayed immediately on page load when controls match the baseline preset.
// Avoids an API call on first render — zero latency, zero cost for the primary demo scenario.
// Computed KPI basis: Net Sales $9.5M, Gross Margin 22.6% (post-fuel), EBITDA $959K,
//   Cash $4.3M, AR $2.8M, Fuel Index 118 vs 100 baseline.
export const BASELINE_SUMMARY: string = `## Current Period Performance

Summit Logistics Group closed January 2026 with **$9.5M in net sales**, reflecting **3% sequential growth** against the December baseline. Post-fuel gross margin settled at **22.6%** — below the 25% target — as the elevated fuel index added approximately **$230K in excess logistics COGS** above plan. EBITDA reached **$959K** with operating expenses holding firm at $1.18M.

• **Net Sales:** $9.5M (+3.0% vs. December) — growth ahead of the conservative close scenario
• **Gross Margin:** 22.6% (target: 25.0%) — 240bps compression driven by fuel index at 118 vs. 100 baseline
• **EBITDA:** $959K — collections performance at the 97% rate supported cash generation
• **Cash Position:** $4.3M — adequate coverage; no liquidity concerns this period

## Close & Forward Outlook

With five business days remaining to the close target, 47 manual journal entries are in progress (up from 38 in December), making the Accruals & JEs stage the primary execution risk. AR aging shows **10.9% of the $2.8M balance in the 90-plus-day bucket**, approaching the 11% watch threshold and requiring collectability review before the financial statement package is finalized.

• **JE Clearance (Critical):** 47 manual JEs in progress — prioritize pending-approval items to avoid close delay
• **AR 90+ Monitoring:** $306K in aged receivables approaches watch threshold — assess collectability adjustments
• **Revenue Recognition:** Stage at 67% completion — 3 entries pending; on the critical path to close
• **Financial Statement Package:** Dependent on JE and revenue recognition completion — monitor daily`;
