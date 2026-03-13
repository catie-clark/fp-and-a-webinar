// src/components/dashboard/CloseTracker/StageCard.tsx
// Single horizontal stage row card: name + progress bar + RAG badge + optional note.
// No "use client" — runs inside DashboardApp client boundary.
import type { CloseStage } from '@/features/model/types';
import { TickCircle, Warning2, CloseCircle } from '@/components/ui/icons';

type RagStatus = 'on-track' | 'at-risk' | 'delayed';

function getRagStatus(progress: number): RagStatus {
  if (progress >= 75) return 'on-track';
  if (progress >= 50) return 'at-risk';
  return 'delayed';
}

const RAG_CONFIG = {
  'on-track': { label: 'On Track', color: 'var(--color-success)', Icon: TickCircle },
  'at-risk': { label: 'At Risk', color: 'var(--accent)', Icon: Warning2 },
  delayed: { label: 'Delayed', color: 'var(--color-error)', Icon: CloseCircle },
} as const;

function getContextualNote(stage: CloseStage): string | null {
  if (getRagStatus(stage.progress) === 'on-track') return null;
  return `${stage.posted} of ${stage.total} JEs complete \u00b7 ${stage.pendingApproval} pending approval`;
}

interface StageCardProps {
  stage: CloseStage;
}

export function StageCard({ stage }: StageCardProps) {
  const rag = getRagStatus(stage.progress);
  const config = RAG_CONFIG[rag];
  const note = getContextualNote(stage);
  const IconComponent = config.Icon;

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: '10px',
        padding: '0.875rem 1.25rem',
        boxShadow:
          '0 1px 3px rgba(1,30,65,0.04), 0 6px 16px rgba(1,30,65,0.04), 0 12px 32px rgba(1,30,65,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {/* Row 1: stage name + RAG badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--foreground)' }}>
          {stage.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <IconComponent color={config.color} variant="Bold" size={16} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: config.color }}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Row 2: progress bar track + fill */}
      <div
        style={{
          height: '8px',
          borderRadius: '4px',
          background: 'rgba(1,30,65,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${stage.progress}%`,
            borderRadius: '4px',
            background: config.color,
          }}
        />
      </div>

      {/* Row 3: progress % + contextual note */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>
          {stage.progress}% complete
        </span>
        {note && (
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: config.color }}>{note}</span>
        )}
      </div>
    </div>
  );
}
