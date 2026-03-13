// src/components/dashboard/SectionHeader.tsx
// Reusable two-line section heading used across all 6 dashboard sections.
// No 'use client' — runs inside DashboardApp client boundary.
// Phase 10: extended with optional explanation prop + AnimatePresence panel.
// Phase 11: PLSH-01 title 1.5rem + amber left border; PLSH-03 two-layer spring animation.
import { motion, AnimatePresence } from 'framer-motion';
import { useExplainMode } from '@/components/ExplainContext';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  explanation?: string; // Optional locked text per section — shown when explainMode is ON
}

export default function SectionHeader({ title, subtitle, explanation }: SectionHeaderProps) {
  const { explainMode } = useExplainMode();

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {/* PLSH-01: amber left border wrapper + 1.5rem title */}
      <div style={{ paddingLeft: '0.875rem', borderLeft: '4px solid var(--crowe-amber-core)' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--foreground)',
            margin: 0,
            lineHeight: 1.3,
            fontFamily: '"Helvetica Now Display", "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {title}
        </h2>
      </div>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--muted-color)',
          margin: '0.45rem 0 0',
          lineHeight: 1.5,
          maxWidth: '60rem',
        }}
      >
        {subtitle}
      </p>

      {/* PLSH-03: Two-layer spring animation — outer: height spring, inner: text opacity with 80ms delay */}
      <AnimatePresence>
        {explainMode && explanation && (
          <motion.div
            key="explanation"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{ overflow: 'hidden' }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, delay: 0.08 }}
            >
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.875rem 1rem',
                  background: 'var(--card-solid)',
                  borderLeft: '3px solid var(--crowe-amber-core)',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '0.875rem',
                  color: 'var(--muted-color)',
                  lineHeight: 1.65,
                  boxShadow: '0 8px 18px rgba(1, 30, 65, 0.06)',
                }}
              >
                {explanation}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
