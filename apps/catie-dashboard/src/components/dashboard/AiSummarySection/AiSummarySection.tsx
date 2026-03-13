// src/components/dashboard/AiSummarySection/AiSummarySection.tsx
// No 'use client' — runs inside DashboardApp client boundary.
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import type { DashboardSeedData } from '@/lib/dataLoader';
import type { ControlState } from '@/features/model/types';
import { BASELINE_SUMMARY } from '@/lib/aiSummaryCache';
import type { KpiPayload } from '@/app/api/enhance-summary/route';
import {
  selectNetSales,
  selectCogs,
  selectGrossProfit,
  selectEbitda,
  selectCash,
  selectAr,
  selectAp,
  selectInventory,
} from '@/store/kpiSelectors';
import { formatCurrency } from '@/lib/formatters';
import SectionHeader from '@/components/dashboard/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import type { AudienceOption, FocusOption } from '@/features/model/aiPromptUtils';
import { AUDIENCE_SYSTEM_MODIFIERS, FOCUS_USER_ADDITIONS } from '@/features/model/aiPromptUtils';

// Dynamic import — InfinityLoader uses browser APIs; ssr: false prevents SSR crash.
const InfinityLoader = dynamic(
  () => import('@/components/ui/InfinityLoader'),
  { ssr: false, loading: () => <div style={{ height: 64 }} /> }
);

interface AiSummarySectionProps {
  seedData: DashboardSeedData;
}

// Compare two ControlState objects field by field.
// JSON.stringify risks false negatives on key-order — use field iteration (Phase 4 pattern).
function controlsMatch(a: ControlState, b: ControlState): boolean {
  return (Object.keys(a) as Array<keyof ControlState>).every(k => a[k] === b[k]);
}

export default function AiSummarySection({ seedData }: AiSummarySectionProps) {
  const controls = useSelector((state: RootState) => state.scenario.controls);
  const netSales = useSelector(selectNetSales);
  const cogs = useSelector(selectCogs);
  const grossProfit = useSelector(selectGrossProfit);
  const ebitda = useSelector(selectEbitda);
  const cash = useSelector(selectCash);
  const ar = useSelector(selectAr);
  const ap = useSelector(selectAp);
  const inventory = useSelector(selectInventory);

  const [summaryText, setSummaryText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<AudienceOption>('CFO');
  const [focus, setFocus] = useState<FocusOption>('Full Dashboard Overview');

  // Track controls snapshot at last generation to detect drift.
  const summaryControlsRef = useRef<ControlState | null>(null);
  // Track audience/focus at last generation to detect dropdown drift.
  const summaryAudienceRef = useRef<AudienceOption>('CFO');
  const summaryFocusRef = useRef<FocusOption>('Full Dashboard Overview');

  // ── MOUNT EFFECT: display cached baseline if controls match baseline preset ──
  useEffect(() => {
    const baselinePreset = seedData.presets.find(p => p.id === 'baseline');
    if (!baselinePreset) return;
    if (controlsMatch(controls, baselinePreset.controls)) {
      setSummaryText(BASELINE_SUMMARY);
      setIsStale(false);
      summaryControlsRef.current = baselinePreset.controls;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only

  // ── STALE DETECTION: mark summary stale when controls, audience, or focus drift from generation snapshot ──
  useEffect(() => {
    if (!summaryText || !summaryControlsRef.current) return;
    const controlsDrifted = !controlsMatch(controls, summaryControlsRef.current);
    const audienceDrifted = audience !== summaryAudienceRef.current;
    const focusDrifted = focus !== summaryFocusRef.current;
    if (controlsDrifted || audienceDrifted || focusDrifted) setIsStale(true);
  }, [controls, audience, focus, summaryText]);

  // Derive active preset name for the prompt payload.
  function getPresetName(): string {
    const match = seedData.presets.find(p => controlsMatch(controls, p.controls));
    return match ? match.label : 'Custom Scenario';
  }

  function buildKpiPayload(): KpiPayload {
    return {
      netSales: formatCurrency(netSales, false),
      cogs: formatCurrency(cogs, false),
      grossProfit: formatCurrency(grossProfit, false),
      ebitda: formatCurrency(ebitda, false),
      cash: formatCurrency(cash, false),
      ar: formatCurrency(ar, false),
      ap: formatCurrency(ap, false),
      inventory: formatCurrency(inventory, false),
    };
  }

  async function handleGenerate() {
    setIsStreaming(true);
    setSummaryText('');
    setError(null);
    setIsStale(false);
    // Snapshot controls, audience, and focus at generation time for drift detection.
    summaryControlsRef.current = { ...controls };
    summaryAudienceRef.current = audience;
    summaryFocusRef.current = focus;

    try {
      const response = await fetch('/api/enhance-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kpis: buildKpiPayload(), presetName: getPresetName(), audience, focus }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // Functional updater prevents stale closure — captures prev not initial state.
          setSummaryText(prev => prev + chunk);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      setError('Unable to generate summary. Check your connection and try again.');
      summaryControlsRef.current = null;
    } finally {
      setIsStreaming(false);
    }
  }

  const hasContent = summaryText.length > 0;
  const buttonLabel = hasContent ? 'Regenerate' : 'Generate Summary';

  // ── Lightweight markdown renderer ──────────────────────────────────────────
  // Handles: ## headings, • / - bullets (grouped into <ul>), **bold** inline, plain paragraphs.
  function renderInline(text: string): React.ReactNode {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    if (parts.length === 1) return text;
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} style={{ fontWeight: 700 }}>{part}</strong>
        : part
    );
  }

  function renderMarkdown(text: string): React.ReactNode[] {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    const bulletBuffer: string[] = [];
    let k = 0;

    const flushBullets = () => {
      if (bulletBuffer.length === 0) return;
      elements.push(
        <ul key={k++} style={{ margin: '0.625rem 0 0.875rem', paddingLeft: '1.375rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {bulletBuffer.map((b, i) => (
            <li key={i} style={{ fontSize: '0.9375rem', lineHeight: 1.65, color: 'var(--foreground)' }}>
              {renderInline(b)}
            </li>
          ))}
        </ul>
      );
      bulletBuffer.length = 0;
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { flushBullets(); continue; }

      if (line.startsWith('## ')) {
        flushBullets();
        const isFirst = elements.length === 0;
        elements.push(
          <p key={k++} style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', margin: isFirst ? '0 0 0.5rem' : '1.5rem 0 0.5rem' }}>
            {line.slice(3)}
          </p>
        );
      } else if (line.startsWith('• ') || line.startsWith('- ')) {
        bulletBuffer.push(line.startsWith('• ') ? line.slice(2) : line.slice(2));
      } else {
        flushBullets();
        elements.push(
          <p key={k++} style={{ margin: elements.length === 0 ? 0 : '0.625rem 0 0', lineHeight: 1.75, fontSize: '0.9375rem', color: 'var(--foreground)' }}>
            {renderInline(line)}
          </p>
        );
      }
    }
    flushBullets();
    return elements;
  }

  const renderedContent = summaryText ? renderMarkdown(summaryText) : [];
  const isRendering = renderedContent.length > 0;

  return (
    <>
      <SectionHeader
        title="AI Executive Summary"
        subtitle="Structured executive narrative synthesized by GPT-4o from current scenario KPIs — tailored by audience and focus"
        explanation="This narrative is generated by OpenAI GPT-4o from the current scenario's KPI values. On page load it shows a pre-cached baseline summary. Select your audience and focus area, then click Regenerate to produce a fresh AI-generated analysis."
      />

      {/* ── Control panel: Audience + Focus + Generate ── */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '0.875rem 1rem',
          margin: '1rem 0 1.25rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: '0.875rem',
          alignItems: 'end',
        }}
      >
        {/* Audience */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-color)' }}>
            Audience
          </span>
          <Select value={audience} onValueChange={(v) => setAudience(v as AudienceOption)}>
            <SelectTrigger style={{ height: 36, fontSize: '0.875rem' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(AUDIENCE_SYSTEM_MODIFIERS) as AudienceOption[]).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Focus */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-color)' }}>
            Focus
          </span>
          <Select value={focus} onValueChange={(v) => setFocus(v as FocusOption)}>
            <SelectTrigger style={{ height: 36, fontSize: '0.875rem' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FOCUS_USER_ADDITIONS) as FocusOption[]).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Generate + stale indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'flex-end' }}>
          {hasContent && isStale && !isStreaming ? (
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
              Settings changed
            </span>
          ) : (
            <span style={{ fontSize: '0.6875rem', color: 'transparent', userSelect: 'none' }}>—</span>
          )}
          <Button onClick={handleGenerate} disabled={isStreaming} variant="default" size="sm" style={{ height: 36, whiteSpace: 'nowrap', background: 'var(--accent)', color: '#011E41', border: 'none', borderRadius: 6, padding: '0 0.875rem', fontSize: '0.8125rem', fontWeight: 600, cursor: isStreaming ? 'not-allowed' : 'pointer', opacity: isStreaming ? 0.6 : 1 }}>
            {isStreaming ? 'Generating\u2026' : buttonLabel}
          </Button>
        </div>
      </div>

      {/* ── Narrative card ── */}
      <section
        style={{
          background: 'var(--card)',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(1,30,65,0.04), 0 6px 16px rgba(1,30,65,0.04), 0 12px 32px rgba(1,30,65,0.02)',
          overflow: 'hidden',
        }}
      >
        {/* Card body */}
        <div style={{ padding: '1.375rem 1.5rem', minHeight: '6rem' }}>
          {/* Loading animation */}
          {isStreaming && summaryText === '' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 0' }}>
              <InfinityLoader size={48} color="var(--accent)" />
            </div>
          )}

          {/* Error state */}
          {error && !isStreaming && (
            <p style={{ color: 'var(--destructive, #E5376B)', fontSize: '0.875rem', margin: 0 }}>
              {error}
            </p>
          )}

          {/* Rendered markdown narrative */}
          {isRendering && (
            <div>
              {renderedContent}
              {isStreaming && (
                <span className="streaming-cursor" aria-hidden="true" />
              )}
            </div>
          )}

          {/* Empty state */}
          {!hasContent && !isStreaming && !error && (
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0, fontStyle: 'italic' }}>
              Select your audience and focus above, then click &ldquo;Generate Summary&rdquo; to produce a structured AI-generated executive narrative.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
