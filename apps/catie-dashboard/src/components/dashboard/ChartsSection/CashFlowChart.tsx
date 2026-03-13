import { useState } from 'react';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { Cash13WeekRow } from '@/features/model/types';
import { formatCurrency } from '@/lib/formatters';
import { buildCashFlowData, type CashFlowPoint } from './chartDataUtils';

interface CashFlowChartProps {
  data: Cash13WeekRow[];
}

interface CashTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: CashFlowPoint }>;
  label?: string;
}

function CashFlowTooltip({ active, payload }: CashTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 13,
        boxShadow: '0 4px 12px rgba(1,30,65,0.10)',
      }}
    >
      <p
        style={{
          fontWeight: 600,
          marginBottom: 4,
          margin: '0 0 4px',
          color: 'var(--foreground)',
        }}
      >
        {row.week} — {row.isActual ? 'Actual' : 'Forecast'}
      </p>
      <p style={{ color: '#05AB8C', margin: '0 0 2px' }}>Inflow: {formatCurrency(row.inflow)}</p>
      <p style={{ color: '#E5376B', margin: '0 0 2px' }}>Outflow: {formatCurrency(row.outflow)}</p>
      <p style={{ fontWeight: 600, margin: 0, color: 'var(--foreground)' }}>
        Net: {formatCurrency(row.net_cash)}
      </p>
    </div>
  );
}

export default function CashFlowChart({ data }: CashFlowChartProps) {
  const [visible, setVisible] = useState(true);
  const chartData = buildCashFlowData(data);

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: 12,
        padding: '1.25rem',
        boxShadow:
          '0 1px 3px rgba(1,30,65,0.04), 0 6px 16px rgba(1,30,65,0.04), 0 12px 32px rgba(1,30,65,0.02)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: visible ? '1rem' : 0,
        }}
      >
        <p
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--muted-foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
          }}
        >
          13-Week Cash Flow
        </p>
        <button
          onClick={() => setVisible(v => !v)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--muted-foreground)',
            borderRadius: 4,
            transition: 'color 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-foreground)')}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {visible && (
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
              <defs>
                <linearGradient id="cashActualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#003F9F" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#003F9F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => formatCurrency(v, true)}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
              <Tooltip content={<CashFlowTooltip />} />
              <Area
                dataKey="actualNetCash"
                name="Actuals"
                stroke="#002E62"
                strokeWidth={2.5}
                fill="url(#cashActualGradient)"
                connectNulls={false}
                dot={{ fill: '#002E62', r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Area
                dataKey="forecastNetCash"
                name="Forecast"
                stroke="#002E62"
                strokeWidth={2}
                strokeDasharray="6 3"
                fill="none"
                connectNulls={false}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
