import { useState, useEffect, useCallback } from 'react';
import { Sun1, Moon } from '@/components/ui/icons';
import type { DashboardSeedData } from '@/lib/dataLoader';
import { useExplainMode } from '@/components/ExplainContext';

interface DashboardHeaderProps {
  seedData: DashboardSeedData;
}

export default function DashboardHeader({ seedData }: DashboardHeaderProps) {
  const [isDark, setIsDark] = useState(
    typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-theme') === 'dark'
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(() => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (_) {}
  }, []);

  const { explainMode, toggleExplainMode } = useExplainMode();
  const baselineLabel =
    (seedData.presets.find((p) => p.id === 'baseline') ?? seedData.presets[0])?.label;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0 1.5rem',
        background: 'var(--crowe-indigo-dark)',
        borderBottom: '2px solid var(--crowe-amber-core)',
        boxShadow: '0 12px 28px rgba(1, 30, 65, 0.18)',
        marginLeft: '-1.5rem',
        marginRight: '-1.5rem',
        marginTop: '-1.5rem',
        width: 'calc(100% + 3rem)',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
        <img
          src="/crowe-logo.svg"
          alt="Crowe"
          style={{
            display: 'block',
            width: '7rem',
            height: 'auto',
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: 'rgba(255, 255, 255, 0.76)',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.1rem',
            }}
          >
            FP and A close efficiency dashboard
          </div>
          <div
            style={{
              color: 'var(--crowe-white)',
              fontSize: '0.9rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {seedData.company.name} - {baselineLabel}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <button
          onClick={toggleExplainMode}
          aria-label={explainMode ? 'Hide explanation panels' : 'Show explanation panels'}
          aria-pressed={explainMode}
          style={{
            padding: '0.38rem 0.8rem',
            borderRadius: 6,
            border: explainMode
              ? '1px solid var(--crowe-amber-core)'
              : '1px solid rgba(255, 255, 255, 0.22)',
            background: explainMode ? 'var(--crowe-amber-core)' : 'transparent',
            color: explainMode ? 'var(--crowe-indigo-dark)' : 'var(--crowe-white)',
            fontWeight: 700,
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {explainMode ? 'Hide explanations' : 'Explain'}
        </button>

        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            cursor: 'pointer',
            color: 'var(--crowe-white)',
            padding: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
          }}
        >
          {isDark ? (
            <Sun1 size={18} color="var(--crowe-amber-core)" />
          ) : (
            <Moon size={18} color="var(--crowe-white)" />
          )}
        </button>
      </div>
    </header>
  );
}
