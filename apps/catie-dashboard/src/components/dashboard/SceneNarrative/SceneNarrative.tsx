// src/components/dashboard/SceneNarrative/SceneNarrative.tsx
// No 'use client' — runs inside DashboardApp client boundary.
// Banner card shown at the top of every tab: tab label + callout badges + italic narrative text.
// Self-manages narrative state: fires /api/scene-narrative on named preset change, uses cache on repeat visits.

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/index';
import {
  selectNetSales,
  selectEbitda,
  selectCash,
  selectAr,
} from '@/store/kpiSelectors';
import { CALLOUT_RULES, BASELINE_NARRATIVES } from '@/lib/calloutRules';
import type { CalloutRule } from '@/lib/calloutRules';
import { CalloutBadge } from './CalloutBadge';
import type { DashboardSeedData } from '@/lib/dataLoader';
import { sceneNarrativeCache, getCacheKey } from '@/lib/scenarioNarrativeCache';
import { formatCurrency } from '@/lib/formatters';
import type { KpiPayload } from '@/features/model/aiPromptUtils';

type TabId = 'overview' | 'close-tracker' | 'charts' | 'ai-summary' | 'scenario';

export interface SceneNarrativeProps {
  tabId: TabId;
  presetName: string;
  seedData: DashboardSeedData;
}

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  'close-tracker': 'Close Tracker',
  charts: 'Charts',
  'ai-summary': 'AI Summary',
  scenario: 'Scenario',
};

// ─── Metric resolvers: map rule.metric → (kpis, seedData, controls) => number ─

type KpiBundle = {
  netSales: number;
  ebitda: number;
  cash: number;
};
type ControlsBundle = {
  revenueGrowthPct: number;
  grossMarginPct: number;
};

type MetricResolver = (
  kpis: KpiBundle,
  seedData: DashboardSeedData,
  controls: ControlsBundle
) => number;

const METRIC_RESOLVERS: Record<string, MetricResolver> = {
  ebitdaMargin: ({ netSales, ebitda }) => (netSales > 0 ? ebitda / netSales : 0),
  netSalesGrowth: (_kpis, seedData) => seedData.baseInputs.variancePct ?? 0,
  closeProgress: (_kpis, seedData) => {
    const stages = seedData.closeStages;
    if (stages.length === 0) return 0;
    return stages.reduce((sum, s) => sum + s.progress, 0) / stages.length;
  },
  daysRemaining: (_kpis, seedData) => {
    // Use closeTargetBusinessDays from company as proxy for days remaining
    return seedData.company?.closeTargetBusinessDays ?? 5;
  },
  ar90Ratio: (_kpis, seedData) => seedData.ar90Ratio,
  cashCoverage: ({ cash, netSales }) => (netSales > 0 ? cash / netSales : 0),
  revenueGrowth: (_kpis, _seedData, controls) => controls.revenueGrowthPct,
  grossMargin: (_kpis, _seedData, controls) => controls.grossMarginPct,
};

export function SceneNarrative({ tabId, presetName, seedData }: SceneNarrativeProps) {
  const netSales = useSelector(selectNetSales);
  const ebitda = useSelector(selectEbitda);
  const cash = useSelector(selectCash);
  const ar = useSelector(selectAr);
  const controls = useSelector((state: RootState) => state.scenario.controls);

  // Self-managed narrative state — DashboardApp does NOT hold text.
  const [narrativeText, setNarrativeText] = useState<string>(BASELINE_NARRATIVES[tabId]);
  const [isLoading, setIsLoading] = useState(false);

  // Build KpiPayload from current Redux state for the API call.
  function buildKpiPayload(): KpiPayload {
    const cogs = netSales - (ebitda + seedData.baseInputs.baseOpex);
    const grossProfit = netSales - cogs;
    return {
      netSales: formatCurrency(netSales),
      cogs: formatCurrency(cogs),
      grossProfit: formatCurrency(grossProfit),
      ebitda: formatCurrency(ebitda),
      cash: formatCurrency(cash),
      ar: formatCurrency(ar),
      ap: formatCurrency(seedData.baseInputs.apTotal),
      inventory: formatCurrency(seedData.baseInputs.inventoryTotal),
    };
  }

  // Auto-regeneration: fires when presetName or tabId changes.
  // Custom Scenario skips API (no meaningful preset context).
  // Cache hit: use stored text immediately. Cache miss: fire API call.
  // Stale-on-mount: since tabs conditionally render, SceneNarrative remounts on every
  // tab switch — this useEffect fires on mount if preset changed while tab was unmounted.
  useEffect(() => {
    if (presetName === 'Custom Scenario') {
      // Reset to baseline text for custom scenario
      setNarrativeText(BASELINE_NARRATIVES[tabId]);
      return;
    }

    const cacheKey = getCacheKey(presetName, tabId);
    if (sceneNarrativeCache.has(cacheKey)) {
      // Cache hit — use cached text immediately, no API call
      setNarrativeText(sceneNarrativeCache.get(cacheKey)!);
      return;
    }

    // Cache miss — fire API call
    setIsLoading(true);
    fetch('/api/scene-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kpis: buildKpiPayload(), presetName, tabId }),
    })
      .then(r => r.json())
      .then((data: { text?: string }) => {
        if (data.text) {
          setNarrativeText(data.text);
          sceneNarrativeCache.set(cacheKey, data.text);
        }
      })
      .catch(() => {
        // Keep baseline text on error — silent degradation
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetName, tabId]);

  const kpis: KpiBundle = { netSales, ebitda, cash };
  const controlsBundle: ControlsBundle = {
    revenueGrowthPct: controls.revenueGrowthPct,
    grossMarginPct: controls.grossMarginPct,
  };

  // Filter rules to this tab (max 2 badges)
  const tabRules: CalloutRule[] = CALLOUT_RULES.filter(r => r.tab === tabId).slice(0, 2);

  return (
    <div
      style={{
        background: 'var(--card-solid)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--crowe-amber-core)',
        borderRadius: 12,
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 10px 24px rgba(1, 30, 65, 0.06)',
      }}
    >
      {/* Top row: tab label left, badges right */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: '0.75rem',
            color: 'var(--foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {TAB_LABELS[tabId]}
        </span>

        {tabRules.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tabRules.map(rule => {
              const resolver = METRIC_RESOLVERS[rule.metric];
              const value = resolver ? resolver(kpis, seedData, controlsBundle) : 0;
              return <CalloutBadge key={rule.metric} rule={rule} value={value} />;
            })}
          </div>
        )}
      </div>

      {/* Narrative text or loading placeholder */}
      {isLoading ? (
        <div
          style={{
            height: '1rem',
            width: '80%',
            borderRadius: 4,
            background:
              'linear-gradient(90deg, rgba(1,30,65,0.06) 25%, rgba(1,30,65,0.12) 50%, rgba(1,30,65,0.06) 75%)',
            backgroundSize: '200% 100%',
            animation: 'scene-narrative-pulse 1.5s ease-in-out infinite',
          }}
        />
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: '0.875rem',
            color: 'var(--muted-foreground, var(--muted-color))',
            lineHeight: 1.6,
          }}
        >
          {narrativeText}
        </p>
      )}

      {/* Keyframe for pulse animation */}
      <style>{`
        @keyframes scene-narrative-pulse {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
