// src/components/dashboard/KpiCard.tsx
// Single KPI metric card — animated value, variance delta badge, amber glow on change.
// No "use client" — runs inside DashboardApp Provider boundary.
import { useEffect, useRef } from 'react';
import type { Icon } from 'iconsax-react';
import CountUp from '@/components/ui/CountUp';
import { formatPercent } from '@/lib/formatters';

interface KpiCardProps {
  label: string;
  icon: Icon;
  value: number;
  format?: 'currency' | 'percent' | 'number';
  delta: number; // fractional: 0.034 = 3.4% improvement
  deltaInverted?: boolean; // COGS: positive delta (cost up) is bad
  deltaNeutral?: boolean; // AP, Inventory: amber regardless of direction
}

export default function KpiCard({
  label,
  icon: Icon,
  value,
  format = 'currency',
  delta,
  deltaInverted = false,
  deltaNeutral = false,
}: KpiCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const prevValueRef = useRef<number | null>(null);

  useEffect(() => {
    // Amber glow: only fires when value changes (not on first render)
    if (prevValueRef.current !== null && prevValueRef.current !== value) {
      const el = cardRef.current;
      if (el) {
        el.classList.remove('kpi-glow');
        // Force reflow to restart animation if already glowing
        void el.offsetHeight;
        el.classList.add('kpi-glow');
        prevValueRef.current = value;
        const timer = setTimeout(() => el.classList.remove('kpi-glow'), 750);
        return () => clearTimeout(timer);
      }
    }
    prevValueRef.current = value;
  }, [value]);

  // Delta color logic
  const isPositive = delta >= 0;
  let deltaColor: string;
  if (deltaNeutral) {
    deltaColor = 'var(--accent)';
  } else if (deltaInverted) {
    deltaColor = isPositive ? '#E5376B' : '#05AB8C';
  } else {
    deltaColor = isPositive ? '#05AB8C' : '#E5376B';
  }

  const deltaArrow = delta >= 0 ? '▲' : '▼';
  const deltaText = `${deltaArrow} ${formatPercent(Math.abs(delta))}`;

  // Format the numeric value for the CountUp "to" prop
  // CountUp displays raw numbers — we let it count the raw number, not formatted string
  const displayValue = Math.round(Math.abs(value));

  return (
    <div
      ref={cardRef}
      style={{
        background: 'var(--card)',
        border: 'none',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        boxShadow:
          '0 1px 3px rgba(1,30,65,0.04), 0 6px 16px rgba(1,30,65,0.04), 0 12px 32px rgba(1,30,65,0.02)',
        transition: 'box-shadow 250ms ease-out, transform 250ms ease-out',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 2px 4px rgba(1,30,65,0.06), 0 8px 24px rgba(1,30,65,0.06), 0 16px 48px rgba(1,30,65,0.04)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 1px 3px rgba(1,30,65,0.04), 0 6px 16px rgba(1,30,65,0.04), 0 12px 32px rgba(1,30,65,0.02)';
      }}
    >
      {/* Header: icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon color="var(--accent)" variant="Bold" size={20} />
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </span>
      </div>

      {/* Value: CountUp animated counter */}
      <div
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--foreground)',
          lineHeight: 1.1,
        }}
      >
        {format === 'currency' && (
          <>
            <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>
              {value < 0 ? '-$' : '$'}
            </span>
            <CountUp
              key={displayValue}
              from={prevValueRef.current !== null ? Math.round(Math.abs(prevValueRef.current)) : 0}
              to={displayValue}
              duration={0.5}
              separator=","
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--muted)', marginLeft: '2px' }}>
              {displayValue >= 1_000_000 ? 'M' : displayValue >= 1_000 ? 'K' : ''}
            </span>
          </>
        )}
        {format === 'percent' && (
          <CountUp
            key={displayValue}
            from={prevValueRef.current !== null ? Math.round(Math.abs(prevValueRef.current)) : 0}
            to={displayValue}
            duration={0.5}
            separator=","
          />
        )}
        {format === 'number' && (
          <CountUp
            key={displayValue}
            from={prevValueRef.current !== null ? Math.round(Math.abs(prevValueRef.current)) : 0}
            to={displayValue}
            duration={0.5}
            separator=","
          />
        )}
      </div>

      {/* Delta badge */}
      <div
        style={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: deltaColor,
        }}
      >
        {deltaText}
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--muted)',
            fontWeight: 400,
            marginLeft: '0.35rem',
          }}
        >
          vs prior month
        </span>
      </div>
    </div>
  );
}
