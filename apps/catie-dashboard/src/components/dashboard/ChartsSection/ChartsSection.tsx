import type { DashboardSeedData } from '@/lib/dataLoader';
import PipelineChart from './PipelineChart';
import ArAgingChart from './ArAgingChart';
import CashFlowChart from './CashFlowChart';
import SectionHeader from '@/components/dashboard/SectionHeader';

interface ChartsSectionProps {
  seedData: DashboardSeedData;
}

export default function ChartsSection({ seedData }: ChartsSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
      <SectionHeader
        title="Pipeline & Collections Health"
        subtitle="AR aging risk, CRM pipeline funnel, and 13-week cash outlook"
        explanation="The Pipeline to Invoiced chart shows the CRM funnel from Qualified leads to Invoiced revenue. AR Aging breaks the $2.8M receivables balance into aging buckets — the 90-plus-day ratio is the key watch metric for collection risk. The 13-Week Cash Flow distinguishes actuals (solid) from forecast (dashed)."
      />
      {/* Top row: Pipeline (left ~50%) + AR Aging (right ~50%) */}
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <PipelineChart data={seedData.crmPipeline} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ArAgingChart data={seedData.arAging} ar90Ratio={seedData.ar90Ratio} />
        </div>
      </div>
      {/* Bottom row: full-width Cash Flow */}
      <CashFlowChart data={seedData.cash13Week} />
    </div>
  );
}
