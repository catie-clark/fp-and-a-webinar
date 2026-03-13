// src/components/DashboardApp.tsx
// "use client" — single client boundary for the entire dashboard.
// Uses makeStore + useRef pattern (NOT module-level singleton) to prevent
// Redux state leaking between SSR requests in Next.js App Router.
'use client';

import { useRef, useEffect } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/store';
import type { AppStore } from '@/store';
import type { DashboardSeedData } from '@/lib/dataLoader';
import { initializeFromSeedData } from '@/store/scenarioSlice';
import KpiSection from '@/components/dashboard/KpiSection';
import ScenarioPanel from '@/components/dashboard/ScenarioPanel/ScenarioPanel';
import { CloseTracker } from '@/components/dashboard/CloseTracker/CloseTracker';
import ChartsSection from '@/components/dashboard/ChartsSection/ChartsSection';
import MarginBridgeSection from '@/components/dashboard/MarginBridgeSection/MarginBridgeSection';

interface DashboardAppProps {
  seedData?: DashboardSeedData;
}

export default function DashboardApp({ seedData }: DashboardAppProps) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  // Seed Redux store with real financial data from the server.
  // Finds the 'baseline' preset (or first preset) to initialize controls.
  useEffect(() => {
    if (seedData && storeRef.current) {
      const defaultPreset =
        seedData.presets.find(p => p.id === 'baseline') ?? seedData.presets[0];
      storeRef.current.dispatch(
        initializeFromSeedData({
          baseInputs: seedData.baseInputs,
          defaultControls: defaultPreset.controls,
        })
      );
    }
  }, [seedData]);

  return (
    <Provider store={storeRef.current}>
      {/* Two-column layout: 280px sticky sidebar + flex-1 main content.
          alignItems: flex-start ensures sidebar height is its own content height,
          not stretched to match the (much taller) main column. */}
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'flex-start' }}>

        {/* Left sidebar: fixed 280px, sticky, scrollable */}
        <aside
          style={{
            width: '280px',
            flexShrink: 0,
            borderRight: '1px solid var(--border)',
            overflowY: 'auto',
            position: 'sticky',
            top: 0,
            height: '100vh',
            background: 'var(--card)',
          }}
        >
          {seedData && <ScenarioPanel presets={seedData.presets} />}
        </aside>

        {/* Main content area: flex-1, scrollable */}
        <main style={{ flex: 1, minWidth: 0, padding: '1.5rem', overflowY: 'auto' }}>
          <div id="slot-header" />
          {seedData ? (
            <KpiSection seedData={seedData} />
          ) : (
            <div id="slot-kpi-section" />
          )}
          {seedData && <CloseTracker seedData={seedData} />}
          <MarginBridgeSection />
          {seedData && <ChartsSection seedData={seedData} />}
          <div id="slot-ai-summary" />
          <p
            style={{
              color: 'var(--foreground)',
              fontFamily: 'var(--font-sans)',
              margin: 0,
              fontSize: '0.75rem',
              opacity: 0.4,
            }}
          >
            FP&amp;A Close Efficiency Dashboard — Phase 7 Reactive Margin Bridge active
          </p>
        </main>
      </div>
    </Provider>
  );
}
