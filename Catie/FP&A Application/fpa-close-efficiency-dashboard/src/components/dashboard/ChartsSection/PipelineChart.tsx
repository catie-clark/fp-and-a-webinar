import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PipelineRow } from '@/features/model/types';
import { formatCurrency } from '@/lib/formatters';
import { buildPipelineChartData } from './chartDataUtils';

interface PipelineChartProps {
  data: PipelineRow[];
}

interface PipelineTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { stage: string; total: number; weighted: number } }>;
}

function PipelineTooltip({ active, payload }: PipelineTooltipProps) {
  if (!active || !payload?.length) return null;
  const { stage, total, weighted } = payload[0].payload;
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
      <p style={{ fontWeight: 600, color: 'var(--foreground)', margin: '0 0 4px' }}>{stage}</p>
      <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '0 0 2px' }}>
        Total: {formatCurrency(total)}
      </p>
      <p style={{ color: '#05AB8C', fontSize: 13, margin: 0 }}>
        Weighted: {formatCurrency(weighted)}
      </p>
    </div>
  );
}

export default function PipelineChart({ data }: PipelineChartProps) {
  const chartData = buildPipelineChartData(data);
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
      <p
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--muted-foreground)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '0 0 1rem',
        }}
      >
        Pipeline to Invoiced
      </p>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="stage"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
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
            <Tooltip content={<PipelineTooltip />} />
            <Bar dataKey="total" fill="#05AB8C" radius={[4, 4, 0, 0]} name="Pipeline Total" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
