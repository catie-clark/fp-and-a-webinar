// src/components/dashboard/KpiCard.tsx
// Single KPI metric card — animated value, variance delta badge, amber glow on change.
// No "use client" — runs inside DashboardApp Provider boundary.
import { useEffect, useRef } from 'react';
import type { Icon } from 'iconsax-react';
import CountUp from '@/components/ui/CountUp';
import { formatPercent } from '@/lib/formatters';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';

// Brief descriptions shown in the tooltip when hovering over a KPI label.
const KPI_DESCRIPTIONS: Record<string, string> = {
  'Net Sales': 'Revenue after returns and discounts for the period',
  'Gross Profit': 'Net Sales minus Cost of Goods Sold',
  'EBITDA': 'Earnings before interest, taxes, depreciation, and amortization',
  'Cash': '13-week cash position from cash flow statement',
  'COGS': 'Cost of Goods Sold — decreases indicate margin improvement',
  'Accounts Receivable': 'Outstanding customer invoices — aging tracked separately',
  'Accounts Payable': 'Outstanding vendor invoices due for payment',
  'Inventory': 'On-hand inventory value at period end',
};

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
        background: 'var(--card-solid)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        boxShadow:
          '0 10px 24px rgba(1,30,65,0.06), 0 2px 8px rgba(1,30,65,0.04)',
        transition: 'box-shadow 250ms ease-out, transform 250ms ease-out, border-color 250ms ease-out',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(245, 168, 0, 0.55)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 14px 30px rgba(1,30,65,0.1), 0 4px 12px rgba(1,30,65,0.05)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 10px 24px rgba(1,30,65,0.06), 0 2px 8px rgba(1,30,65,0.04)';
      }}
    >
      {/* Header: icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon color="var(--accent)" variant="Bold" size={20} />
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'help',
              }}
            >
              {label}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {KPI_DESCRIPTIONS[label] ?? label}
          </TooltipContent>
        </Tooltip>
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
            <span>
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

      {/* Explanation — always visible, small muted text below delta badge */}
      {KPI_DESCRIPTIONS[label] && (
        <p
          style={{
            fontSize: '0.7rem',
            color: 'var(--muted-color)',
            margin: 0,
            lineHeight: 1.4,
            opacity: 0.8,
          }}
        >
          {KPI_DESCRIPTIONS[label]}
        </p>
      )}
    </div>
  );
}
