// src/components/dashboard/MarginBridgeSection/MarginBridgeSection.tsx
// Margin Bridge card wrapper — card header with live EBITDA + the chart.
// No 'use client' — runs inside DashboardApp.tsx client boundary.
import { useSelector, useStore } from 'react-redux';
import { useRef, useEffect, useState } from 'react';
import {
  selectEbitda,
  selectBaselineEbitda,
} from '@/store/kpiSelectors';
import { buildMarginBridgeData } from '@/components/dashboard/ChartsSection/chartDataUtils';
import { formatCurrency } from '@/lib/formatters';
import MarginBridgeChart from './MarginBridgeChart';

export default function MarginBridgeSection() {
  const adjustedEbitda = useSelector(selectEbitda);
  const baselineEbitda = useSelector(selectBaselineEbitda);

  // Use store.getState() to pass full state to buildMarginBridgeData
  // (3-param signature: baselineEbitda, adjustedEbitda, state)
  const store = useStore();

  // Dark mode detection — reacts to data-theme attribute changes
  const [isDark, setIsDark] = useState(
    typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-theme') === 'dark'
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  // Amber glow on card border when Adjusted EBITDA changes — same pattern as KpiCard.tsx
  const cardRef = useRef<HTMLDivElement>(null);
  const prevEbitdaRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevEbitdaRef.current !== null && prevEbitdaRef.current !== adjustedEbitda) {
      const el = cardRef.current;
      if (el) {
        el.classList.remove('kpi-glow');
        void el.offsetHeight; // force reflow to restart animation
        el.classList.add('kpi-glow');
        const timer = setTimeout(() => el.classList.remove('kpi-glow'), 750);
        return () => clearTimeout(timer);
      }
    }
    prevEbitdaRef.current = adjustedEbitda;
  }, [adjustedEbitda]);

  const chartData = buildMarginBridgeData(baselineEbitda, adjustedEbitda, store.getState());

  return (
    <div
      ref={cardRef}
      style={{
        background: 'var(--card)',
        borderRadius: 12,
        boxShadow:
          '0 1px 3px rgba(1,30,65,0.04), 0 6px 16px rgba(1,30,65,0.04), 0 12px 32px rgba(1,30,65,0.02)',
        marginBottom: '1.5rem',
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem 0.5rem',
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--foreground)',
            letterSpacing: '-0.01em',
          }}
        >
          Margin Bridge
        </span>
        <span
          style={{
            fontSize: 13,
            color: 'var(--muted-foreground)',
          }}
        >
          Adjusted EBITDA:{' '}
          <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>
            {formatCurrency(adjustedEbitda, true)}
          </span>
        </span>
      </div>

      {/* Chart */}
      <div style={{ padding: '0 0.5rem 1rem' }}>
        <MarginBridgeChart chartData={chartData} isDark={isDark} />
      </div>
    </div>
  );
}
