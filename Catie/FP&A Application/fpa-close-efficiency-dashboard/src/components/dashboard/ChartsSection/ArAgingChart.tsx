import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ARRow } from '@/features/model/types';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { buildArAgingData } from './chartDataUtils';

interface ArAgingChartProps {
  data: ARRow[];
  ar90Ratio: number;
}

// Use hardcoded hex for SVG fill — CSS variables are not reliably resolved inside SVG attributes.
const AGING_COLORS = {
  current: '#05AB8C',  // teal — healthy
  d1_30: '#F5A800',    // amber
  d31_60: '#D7761D',   // amber-dark
  d61_90: '#FF526F',   // coral-bright
  d90plus: '#E5376B',  // coral — at risk
};

const AGING_LABELS = [
  { key: 'current', label: 'Current', color: AGING_COLORS.current },
  { key: 'd1_30', label: '1–30 days', color: AGING_COLORS.d1_30 },
  { key: 'd31_60', label: '31–60 days', color: AGING_COLORS.d31_60 },
  { key: 'd61_90', label: '61–90 days', color: AGING_COLORS.d61_90 },
  { key: 'd90plus', label: '90+ days', color: AGING_COLORS.d90plus },
];

interface AgingTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
}

function AgingTooltip({ active, payload }: AgingTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(1,30,65,0.10)',
      }}
    >
      <p style={{ fontWeight: 600, color: entry.fill, margin: '0 0 2px', fontSize: 13 }}>
        {entry.name}
      </p>
      <p style={{ color: 'var(--foreground)', margin: 0, fontSize: 13 }}>
        {formatCurrency(entry.value)}
      </p>
    </div>
  );
}

export default function ArAgingChart({ data, ar90Ratio }: ArAgingChartProps) {
  const chartData = buildArAgingData(data);
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
          alignItems: 'baseline',
          marginBottom: '1rem',
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
          AR Aging
        </p>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#E5376B' }}>
          {formatPercent(ar90Ratio)} aged 90+ days
        </span>
      </div>
      <div style={{ height: 52 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis type="category" hide />
            <Tooltip content={<AgingTooltip />} />
            <Bar dataKey="current" stackId="a" fill={AGING_COLORS.current} name="Current" />
            <Bar dataKey="d1_30" stackId="a" fill={AGING_COLORS.d1_30} name="1–30 days" />
            <Bar dataKey="d31_60" stackId="a" fill={AGING_COLORS.d31_60} name="31–60 days" />
            <Bar dataKey="d61_90" stackId="a" fill={AGING_COLORS.d61_90} name="61–90 days" />
            <Bar
              dataKey="d90plus"
              stackId="a"
              fill={AGING_COLORS.d90plus}
              name="90+ days"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Color legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem 1rem',
          marginTop: '0.75rem',
        }}
      >
        {AGING_LABELS.map(({ key, label, color }) => (
          <span
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.75rem',
              color: 'var(--muted-foreground)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: color,
                flexShrink: 0,
              }}
            />
            {label}
          </span>
        ))}
      </div>
      {/* Bucket totals for at-a-glance context */}
      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
        {AGING_LABELS.map(({ key, label, color }) => {
          const value = chartData[0][key as keyof (typeof chartData)[0]] as number;
          return (
            <span key={key} style={{ marginRight: '1rem' }}>
              <span style={{ color }}>{label}:</span> {formatCurrency(value)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
