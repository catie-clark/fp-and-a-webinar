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

const STAGE_DESCRIPTIONS: Record<string, string> = {
  'AP Close': 'Vendor invoices posted and payment runs approved for the period',
  'AR Close': 'Customer invoices matched, credit memos applied, collections reconciled',
  'Revenue recognition': 'Revenue deferred or recognized per ASC 606 contract performance obligations',
  'Inventory valuation': 'Physical count reconciled, costing method applied (FIFO), shrinkage accrued',
  'Accruals & JEs': 'Month-end accruals posted — payroll, depreciation, prepaid amortization, reclassifications',
  'Financial statement package': 'P&L, balance sheet, and cash flow statement reviewed and signed off by controller',
};

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
        background: 'var(--card-solid)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '0.875rem 1.25rem',
        boxShadow:
          '0 10px 24px rgba(1,30,65,0.06), 0 2px 8px rgba(1,30,65,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {/* Row 1: stage name + RAG badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--foreground)' }}>
            {stage.name}
          </span>
          {STAGE_DESCRIPTIONS[stage.name] && (
            <p style={{ fontSize: '0.7rem', color: 'var(--muted-color)', margin: '0.15rem 0 0', lineHeight: 1.4 }}>
              {STAGE_DESCRIPTIONS[stage.name]}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
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
          background: 'rgba(1,30,65,0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '8px',
            width: `${stage.progress}%`,
            borderRadius: '4px',
            background: config.color,
            display: 'block',
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
