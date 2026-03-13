// src/components/dashboard/CloseTracker/CloseTracker.tsx
// Section container: renders header + DaysToCloseCard + 6x StageCard from seedData.
// No "use client" — runs inside DashboardApp client boundary.
import type { DashboardSeedData } from '@/lib/dataLoader';
import { DaysToCloseCard } from './DaysToCloseCard';
import { StageCard } from './StageCard';

interface CloseTrackerProps {
  seedData: DashboardSeedData;
}

export function CloseTracker({ seedData }: CloseTrackerProps) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--muted-foreground)',
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        Month-End Close Tracker
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <DaysToCloseCard days={seedData.company.closeTargetBusinessDays} />
        {seedData.closeStages.map((stage) => (
          <StageCard key={stage.name} stage={stage} />
        ))}
      </div>
    </section>
  );
}
