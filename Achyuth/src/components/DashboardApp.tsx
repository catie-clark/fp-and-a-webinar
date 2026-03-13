// src/components/DashboardApp.tsx
// "use client" — single client boundary for the entire dashboard.
// Uses makeStore + useRef pattern (NOT module-level singleton) to prevent
// Redux state leaking between SSR requests in Next.js App Router.
'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/store';
import type { AppStore } from '@/store';
import type { DashboardSeedData } from '@/lib/dataLoader';

interface DashboardAppProps {
  seedData?: DashboardSeedData; // optional in Phase 1; required from Phase 2+
}

export default function DashboardApp({ seedData }: DashboardAppProps) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <div style={{ minHeight: '100vh', padding: '1.5rem' }}>
        {/* Phase 1: placeholder shell — functional sections added in later phases */}
        <div id="slot-header" />
        <div id="slot-kpi-section" />
        <div id="slot-close-tracker" />
        <div id="slot-scenario-panel" />
        <div id="slot-charts" />
        <div id="slot-ai-summary" />
        <p style={{ color: 'var(--foreground)', fontFamily: 'var(--font-sans)', margin: 0 }}>
          FP&amp;A Close Efficiency Dashboard — Phase 1 boot confirmed
        </p>
      </div>
    </Provider>
  );
}
