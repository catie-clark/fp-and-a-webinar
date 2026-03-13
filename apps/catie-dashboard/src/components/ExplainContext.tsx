// src/components/ExplainContext.tsx
// React Context for global explainMode toggle.
// Pattern: localStorage read on mount, same as DashboardHeader theme toggle.
// Provider wraps inside Redux <Provider> in DashboardApp (Plan 10-05).
// SectionHeader calls useExplainMode() directly — no prop threading needed.
'use client';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ExplainContextValue {
  explainMode: boolean;
  toggleExplainMode: () => void;
}

const ExplainContext = createContext<ExplainContextValue>({
  explainMode: false,
  toggleExplainMode: () => {},
});

export function ExplainProvider({ children }: { children: ReactNode }) {
  const [explainMode, setExplainMode] = useState(false);

  // Initialize from localStorage on mount — persists across page refreshes.
  // Silent catch: localStorage may be blocked in some environments (e.g., private mode).
  useEffect(() => {
    try {
      const stored = localStorage.getItem('explainMode');
      if (stored === 'true') setExplainMode(true);
    } catch (_) {}
  }, []);

  const toggleExplainMode = () => {
    setExplainMode(prev => {
      const next = !prev;
      try { localStorage.setItem('explainMode', String(next)); } catch (_) {}
      return next;
    });
  };

  return (
    <ExplainContext.Provider value={{ explainMode, toggleExplainMode }}>
      {children}
    </ExplainContext.Provider>
  );
}

// Hook used by SectionHeader and DashboardHeader to read/write explain mode.
export function useExplainMode(): ExplainContextValue {
  return useContext(ExplainContext);
}
