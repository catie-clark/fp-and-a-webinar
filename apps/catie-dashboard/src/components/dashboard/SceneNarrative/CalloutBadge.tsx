// src/components/dashboard/SceneNarrative/CalloutBadge.tsx
// No 'use client' — runs inside DashboardApp client boundary.
// Single badge pill displaying metric value + status label with color coding.

import React from 'react';
import { getCalloutStatus } from '@/lib/calloutRules';
import type { CalloutRule } from '@/lib/calloutRules';

interface CalloutBadgeProps {
  rule: CalloutRule;
  value: number;
  formatValue?: (v: number) => string;
}

// Default formatter: shows percentage for values <= 1, otherwise plain number (1dp)
function defaultFormat(value: number, rule: CalloutRule): string {
  // Heuristic: if goodThreshold <= 1 and watchThreshold <= 1, treat as ratio/percentage
  if (Math.abs(rule.goodThreshold) <= 1 && Math.abs(rule.watchThreshold) <= 1) {
    return `${(value * 100).toFixed(1)}%`;
  }
  return value.toFixed(1);
}

export function CalloutBadge({ rule, value, formatValue }: CalloutBadgeProps) {
  const status = getCalloutStatus(value, rule);
  const formatted = formatValue ? formatValue(value) : defaultFormat(value, rule);

  const styleMap = {
    good: {
      color: 'var(--color-success)',
      background: 'rgba(5, 171, 140, 0.12)',
    },
    watch: {
      color: 'var(--accent)',
      background: 'rgba(245, 168, 0, 0.12)',
    },
    concern: {
      color: 'var(--color-error)',
      background: 'rgba(229, 55, 107, 0.12)',
    },
  } as const;

  const { color, background } = styleMap[status];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.1875rem 0.625rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        lineHeight: 1.4,
        color,
        background,
        whiteSpace: 'nowrap',
      }}
    >
      {formatted} · {rule.labels[status]}
    </span>
  );
}
