'use client';

// src/components/dashboard/CloseTracker/CloseTracker.tsx
// Section container: renders header + DaysToCloseCard + 6x StageCard from seedData.
// No "use client" — runs inside DashboardApp client boundary.
import type { DashboardSeedData } from '@/lib/dataLoader';
import { DaysToCloseCard } from './DaysToCloseCard';
import { StageCard } from './StageCard';
import SectionHeader from '@/components/dashboard/SectionHeader';
import { Button } from '@/components/ui/Button';

interface CloseTrackerProps {
  seedData: DashboardSeedData;
}

export function CloseTracker({ seedData }: CloseTrackerProps) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <SectionHeader
        title="Close Tracker"
        subtitle={`Month-End Close Progress — ${seedData.currentClosePeriod} journal entry completion rates and days remaining to close target`}
        explanation={`Progress bars are computed from actual journal entry counts in erp_journal_entries.csv for ${seedData.currentClosePeriod}. RAG status (On Track / At Risk / Delayed) is determined by completion percentage thresholds. The days-to-close metric reads from company.json.`}
      />
      <div style={{ marginBottom: '0.875rem' }}>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => window.open('https://ai-close-demo.vercel.app/', '_blank', 'noopener,noreferrer')}
          style={{
            borderRadius: 12,
            minHeight: '2.5rem',
            paddingInline: '1rem',
            fontSize: '0.75rem',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}
        >
          Launch Close Tracker
        </Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <DaysToCloseCard days={seedData.company.closeTargetBusinessDays} />
        {seedData.closeStages.map((stage) => (
          <StageCard key={stage.name} stage={stage} />
        ))}
      </div>
    </section>
  );
}
