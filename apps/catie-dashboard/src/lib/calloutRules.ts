// src/lib/calloutRules.ts
// Pure config — no React, no 'use client'.
// Exports CALLOUT_RULES array (10 rules across 5 tabs), getCalloutStatus threshold function,
// and BASELINE_NARRATIVES constant (locked baseline text for each tab).

type TabId = 'overview' | 'close-tracker' | 'charts' | 'ai-summary' | 'scenario';

export type CalloutStatus = 'good' | 'watch' | 'concern';

export interface CalloutRule {
  tab: TabId;
  metric: string;
  goodThreshold: number;
  watchThreshold: number;
  labels: { good: string; watch: string; concern: string };
  /** true = higher value is better (e.g. EBITDA margin); false = lower value is better (e.g. AR 90+ ratio) */
  higherIsBetter: boolean;
}

/**
 * Returns the callout status for a given metric value against a CalloutRule.
 *
 * higherIsBetter = true:
 *   value >= goodThreshold  → 'good'
 *   value >= watchThreshold → 'watch'
 *   else                    → 'concern'
 *
 * higherIsBetter = false:
 *   value <= goodThreshold  → 'good'
 *   value <= watchThreshold → 'watch'
 *   else                    → 'concern'
 */
export function getCalloutStatus(value: number, rule: CalloutRule): CalloutStatus {
  if (rule.higherIsBetter) {
    if (value >= rule.goodThreshold) return 'good';
    if (value >= rule.watchThreshold) return 'watch';
    return 'concern';
  } else {
    // Lower is better (e.g. AR 90+ ratio, days remaining when urgency is concern)
    if (value <= rule.goodThreshold) return 'good';
    if (value <= rule.watchThreshold) return 'watch';
    return 'concern';
  }
}

// ─── Callout Rules: 2 per tab, 10 total ──────────────────────────────────────

export const CALLOUT_RULES: CalloutRule[] = [
  // ── Overview (EBITDA margin + net sales growth) ───────────────────────────
  {
    tab: 'overview',
    metric: 'ebitdaMargin',
    goodThreshold: 0.14,
    watchThreshold: 0.10,
    labels: {
      good: 'On target',
      watch: 'Below target',
      concern: 'Critical',
    },
    higherIsBetter: true,
  },
  {
    tab: 'overview',
    metric: 'netSalesGrowth',
    goodThreshold: 0.02,
    watchThreshold: 0.00,
    labels: {
      good: 'Growing',
      watch: 'Flat',
      concern: 'Declining',
    },
    higherIsBetter: true,
  },

  // ── Close Tracker (avg stage progress + days remaining to target) ─────────
  {
    tab: 'close-tracker',
    metric: 'closeProgress',
    goodThreshold: 70,
    watchThreshold: 50,
    labels: {
      good: 'On track',
      watch: 'At risk',
      concern: 'Delayed',
    },
    higherIsBetter: true,
  },
  {
    tab: 'close-tracker',
    metric: 'daysRemaining',
    // More days remaining = more runway = comfortable; fewer days = urgency
    goodThreshold: 7,
    watchThreshold: 3,
    labels: {
      good: 'On schedule',
      watch: 'Tight',
      concern: 'Urgent',
    },
    higherIsBetter: true,
  },

  // ── Charts (AR 90+ ratio + cash coverage ratio) ───────────────────────────
  {
    tab: 'charts',
    metric: 'ar90Ratio',
    goodThreshold: 0.10,
    watchThreshold: 0.15,
    labels: {
      good: 'Healthy',
      watch: 'Elevated',
      concern: 'High risk',
    },
    higherIsBetter: false,
  },
  {
    tab: 'charts',
    metric: 'cashCoverage',
    goodThreshold: 0.40,
    watchThreshold: 0.25,
    labels: {
      good: 'Strong',
      watch: 'Adequate',
      concern: 'Low',
    },
    higherIsBetter: true,
  },

  // ── AI Summary (EBITDA margin + AR 90+ ratio — mirrors Overview/Charts) ───
  {
    tab: 'ai-summary',
    metric: 'ebitdaMargin',
    goodThreshold: 0.14,
    watchThreshold: 0.10,
    labels: {
      good: 'On target',
      watch: 'Below target',
      concern: 'Critical',
    },
    higherIsBetter: true,
  },
  {
    tab: 'ai-summary',
    metric: 'ar90Ratio',
    goodThreshold: 0.10,
    watchThreshold: 0.15,
    labels: {
      good: 'Healthy',
      watch: 'Elevated',
      concern: 'High risk',
    },
    higherIsBetter: false,
  },

  // ── Scenario (revenue growth + gross margin target) ───────────────────────
  {
    tab: 'scenario',
    metric: 'revenueGrowth',
    goodThreshold: 0.01,
    watchThreshold: -0.01,
    labels: {
      good: 'Positive',
      watch: 'Flat',
      concern: 'Negative',
    },
    higherIsBetter: true,
  },
  {
    tab: 'scenario',
    metric: 'grossMargin',
    goodThreshold: 0.22,
    watchThreshold: 0.18,
    labels: {
      good: 'On target',
      watch: 'Compressed',
      concern: 'Below floor',
    },
    higherIsBetter: true,
  },
];

// ─── Baseline Narratives (locked text until API regenerates on preset change) ─

export const BASELINE_NARRATIVES: Record<TabId, string> = {
  overview:
    "Summit Logistics Group's January close is tracking ahead of the prior month, with net sales reaching $9.2M and gross margin holding near target. KPI cards update in real time as scenario controls change — the Margin Bridge below shows how each lever flows through to adjusted EBITDA.",
  'close-tracker':
    'Month-end close is progressing through six stages with mixed health signals across the team. Revenue recognition and Financial Statement Package are on the critical path — delays here compress the reporting timeline. RAG indicators are computed live from journal entry completion counts in the GL data.',
  charts:
    'The Pipeline to Invoiced funnel shows $4.8M in Qualified opportunities converting through to invoiced revenue. AR Aging flags 10.9% of receivables in the 90-plus-day bucket — a key collection risk heading into February. The 13-week cash flow separates actuals from the forward forecast.',
  'ai-summary':
    'The narrative below synthesizes current scenario conditions into an executive-ready briefing. Use the Audience and Focus dropdowns to tailor tone and emphasis for your intended reader — then click Regenerate to produce a fresh analysis. On first load the baseline summary is served from cache for instant display.',
  scenario:
    'Scenario controls let you model alternative close conditions in real time. Adjust revenue growth, margin assumptions, and operational factors — KPIs and the Margin Bridge update immediately. Use the preset selector to jump to named scenarios, or reset to the baseline with one click.',
};
