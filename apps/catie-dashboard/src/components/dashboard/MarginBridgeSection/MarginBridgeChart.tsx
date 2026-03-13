// src/components/dashboard/MarginBridgeSection/MarginBridgeChart.tsx
// Recharts waterfall bar chart for the Margin Bridge.
// No 'use client' — rendered inside DashboardApp.tsx client boundary.
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LabelList,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { MarginBridgeBar } from '@/components/dashboard/ChartsSection/chartDataUtils';
import { formatCurrency } from '@/lib/formatters';

const BAR_COLORS = {
  totalLight: '#002E62', // Crowe Indigo — Baseline and Adjusted EBITDA, light mode
  totalDark: '#3B6DB5',  // Lighter indigo — visible on dark card background #17263b
  positive: '#F5A800',   // Crowe Amber — positive delta bars
  negative: '#E5376B',   // Crowe Coral — negative delta bars
} as const;

function getBarColor(entry: MarginBridgeBar, isDark: boolean): string {
  if (entry.isTotal) return isDark ? BAR_COLORS.totalDark : BAR_COLORS.totalLight;
  return entry.value >= 0 ? BAR_COLORS.positive : BAR_COLORS.negative;
}

function MarginBridgeTooltip({ active, payload }: TooltipProps<number, string> & { payload?: { payload: MarginBridgeBar }[] }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload as MarginBridgeBar;
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 13,
        color: 'var(--foreground)',
        boxShadow: '0 4px 12px rgba(1,30,65,0.10)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{entry.name}</div>
      <div style={{ color: 'var(--muted-foreground)' }}>
        {entry.isTotal
          ? formatCurrency(entry.value, false)
          : (entry.value >= 0 ? '+' : '\u2013') +
            formatCurrency(Math.abs(entry.value), false)}
      </div>
    </div>
  );
}

interface MarginBridgeChartProps {
  chartData: MarginBridgeBar[];
  isDark: boolean;
}

export default function MarginBridgeChart({ chartData, isDark }: MarginBridgeChartProps) {
  const values = chartData.map((entry) => entry.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);
  const yAxisDomain: [number, number] =
    minValue >= 0
      ? [0, maxValue === 0 ? 1 : maxValue * 1.12]
      : [minValue * 1.12, maxValue === 0 ? 1 : maxValue * 1.08];
  const yAxisTicks = Array.from(
    new Set([yAxisDomain[0], 0, yAxisDomain[1]].map((value) => Math.round(value)))
  ).sort((a, b) => a - b);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 28, right: 20, bottom: 18, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickMargin={12}
        />
        <YAxis
          tickFormatter={(v: number) => formatCurrency(v, true)}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={64}
          domain={yAxisDomain}
          ticks={yAxisTicks}
        />
        <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 2" />
        <Tooltip content={<MarginBridgeTooltip />} />
        <Bar
          dataKey="value"
          isAnimationActive={false}
          radius={[4, 4, 0, 0]}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry, isDark)} />
          ))}
          <LabelList
            dataKey="label"
            position="top"
            style={{ fontSize: 11, fill: 'var(--foreground)', fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
