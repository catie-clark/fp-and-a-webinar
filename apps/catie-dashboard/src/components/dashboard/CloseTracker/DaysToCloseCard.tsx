// src/components/dashboard/CloseTracker/DaysToCloseCard.tsx
// Mini KPI card: calendar icon + days count + label.
// No "use client" — runs inside DashboardApp client boundary.
import { Calendar } from '@/components/ui/icons';

interface DaysToCloseCardProps {
  days: number;
}

export function DaysToCloseCard({ days }: DaysToCloseCardProps) {
  return (
    <div
      style={{
        background: 'var(--card-solid)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        boxShadow:
          '0 10px 24px rgba(1,30,65,0.06), 0 2px 8px rgba(1,30,65,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <Calendar color="var(--accent)" variant="Bold" size={28} />
      <div>
        <div
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--foreground)',
            lineHeight: 1.1,
          }}
        >
          {days}
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--muted-foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginTop: '0.125rem',
          }}
        >
          Days to Close Target
        </div>
      </div>
    </div>
  );
}
