// src/components/DashboardApp.tsx
// "use client" — single client boundary for the entire dashboard.
// Uses makeStore + useRef pattern (NOT module-level singleton) to prevent
// Redux state leaking between SSR requests in Next.js App Router.
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Provider, useSelector } from 'react-redux';
import { makeStore } from '@/store';
import type { AppStore, RootState } from '@/store';
import type { DashboardSeedData } from '@/lib/dataLoader';
import { initializeFromSeedData } from '@/store/scenarioSlice';
import KpiSection from '@/components/dashboard/KpiSection';
import ScenarioPanel from '@/components/dashboard/ScenarioPanel/ScenarioPanel';
import { CloseTracker } from '@/components/dashboard/CloseTracker/CloseTracker';
import ChartsSection from '@/components/dashboard/ChartsSection/ChartsSection';
import MarginBridgeSection from '@/components/dashboard/MarginBridgeSection/MarginBridgeSection';
import AiSummarySection from '@/components/dashboard/AiSummarySection/AiSummarySection';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { ExplainProvider } from '@/components/ExplainContext';
import { SceneNarrative } from '@/components/dashboard/SceneNarrative/SceneNarrative';
import { getActivePresetName } from '@/features/model/aiPromptUtils';

interface DashboardAppProps {
  seedData?: DashboardSeedData;
}

type TabId = 'overview' | 'close-tracker' | 'charts' | 'ai-summary' | 'scenario';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'close-tracker', label: 'Close Tracker' },
  { id: 'charts', label: 'Charts' },
  { id: 'ai-summary', label: 'AI Summary' },
  { id: 'scenario', label: 'Scenario' },
];

// Section-level entrance animation — fade + slide up 20px
const SECTION_ANIM = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
} as const;

// ─── TabContent: inner component rendered inside Provider ─────────────────────
// useSelector is only valid inside the Provider tree. DashboardApp IS the Provider,
// so all useSelector calls must be in child components like this one.
interface TabContentProps {
  seedData: DashboardSeedData;
  activeTab: TabId;
  storeInitialized: boolean;
  reducedMotion: boolean;
}

function TabContent({ seedData, activeTab, storeInitialized, reducedMotion }: TabContentProps) {
  const controls = useSelector((state: RootState) => state.scenario.controls);
  const activePresetName = getActivePresetName(controls, seedData.presets);

  const SectionWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      variants={SECTION_ANIM}
      initial={reducedMotion ? false : 'hidden'}
      whileInView={reducedMotion ? undefined : 'visible'}
      viewport={{ once: true, margin: '-60px' }}
    >
      {children}
    </motion.div>
  );

  return (
    <>
      {/* Overview: SceneNarrative + KPI cards + close tracker + margin bridge */}
      {activeTab === 'overview' && (
        <div>
          <SceneNarrative tabId="overview" presetName={activePresetName} seedData={seedData} />
          <KpiSection seedData={seedData} />
          <SectionWrapper>
            <CloseTracker seedData={seedData} />
          </SectionWrapper>
          {storeInitialized && <MarginBridgeSection />}
        </div>
      )}

      {/* Close Tracker: SceneNarrative + full close tracker */}
      {activeTab === 'close-tracker' && (
        <div>
          <SceneNarrative tabId="close-tracker" presetName={activePresetName} seedData={seedData} />
          <CloseTracker seedData={seedData} />
        </div>
      )}

      {/* Charts: SceneNarrative + static charts + margin bridge */}
      {activeTab === 'charts' && (
        <div>
          <SceneNarrative tabId="charts" presetName={activePresetName} seedData={seedData} />
          <ChartsSection seedData={seedData} />
          {storeInitialized && (
            <div style={{ marginTop: '2rem' }}>
              <MarginBridgeSection />
            </div>
          )}
        </div>
      )}

      {/* AI Summary: SceneNarrative + AI summary section */}
      {activeTab === 'ai-summary' && (
        <div>
          <SceneNarrative tabId="ai-summary" presetName={activePresetName} seedData={seedData} />
          <AiSummarySection seedData={seedData} />
        </div>
      )}

      {/* Scenario: SceneNarrative full-width + two-column layout (controls left, live KPIs + margin bridge right) */}
      {activeTab === 'scenario' && (
        <div>
          <SceneNarrative tabId="scenario" presetName={activePresetName} seedData={seedData} />
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            {/* LEFT: scenario controls — fixed width */}
            <div style={{ width: '380px', flexShrink: 0 }}>
              <ScenarioPanel presets={seedData.presets} />
            </div>
            {/* RIGHT: live KPIs + Margin Bridge — flex-1 */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <KpiSection seedData={seedData} />
              {storeInitialized && <MarginBridgeSection />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function DashboardApp({ seedData }: DashboardAppProps) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

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

  // prefers-reduced-motion check — JS-level (CSS media query doesn't disable Framer Motion)
  // Evaluated inside component body (not module scope) to avoid SSR window access
  const reducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  // initialized: becomes true after initializeFromSeedData dispatch fires.
  // Guards MarginBridgeSection (and Scenario tab KPIs) from rendering with zero default store values.
  const [storeInitialized, setStoreInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('activeTab') as TabId | null;
      const valid: TabId[] = ['overview', 'close-tracker', 'charts', 'ai-summary', 'scenario'];
      if (stored && valid.includes(stored)) setActiveTab(stored);
    } catch (_) {}
  }, []);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    window.scrollTo(0, 0);
    try { localStorage.setItem('activeTab', tab); } catch (_) {}
  };

  // Seed Redux store with real financial data from the server.
  // Finds the 'baseline' preset (or first preset) to initialize controls.
  // Sets storeInitialized = true after dispatch so dependent components
  // (MarginBridgeSection, Scenario tab KPIs) don't render with zero defaults.
  useEffect(() => {
    if (seedData && storeRef.current) {
      const defaultPreset =
        seedData.presets.find(p => p.id === 'baseline') ?? seedData.presets[0];
      storeRef.current.dispatch(
        initializeFromSeedData({
          baseInputs: seedData.baseInputs,
          baselineControls: seedData.company.defaultAssumptions,
          initialControls: defaultPreset.controls,
        })
      );
      setStoreInitialized(true);
    }
  }, [seedData]);

  return (
    <Provider store={storeRef.current}>
      <ExplainProvider>
      <TooltipProvider delayDuration={300}>
      {/* Full-width layout — sidebar removed, tab row added */}
      <main style={{ minHeight: '100vh', padding: '1.5rem' }}>

        {/* DashboardHeader — sticky, top: 0, height: 56px (unchanged) */}
        {seedData && <DashboardHeader seedData={seedData} />}

        {/* Tab row — sticky, top: 56px (below header), height: 48px */}
        <nav
          style={{
            position: 'sticky',
            top: 64,
            zIndex: 40,
            height: 54,
            display: 'flex',
            alignItems: 'center',
            background: isDark ? 'rgba(255, 255, 255, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            borderBottom: '1px solid var(--border)',
            boxShadow: '0 8px 20px rgba(1, 30, 65, 0.06)',
            marginLeft: '-1.5rem',
            marginRight: '-1.5rem',
            width: 'calc(100% + 3rem)',
            padding: '0 1.5rem',
            marginBottom: '1.5rem',
            gap: '0.35rem',
          }}
          aria-label="Dashboard navigation"
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              aria-selected={activeTab === tab.id}
              style={{
                height: '2.3rem',
                padding: '0 0.95rem',
                background: activeTab === tab.id ? 'var(--crowe-indigo-dark)' : 'transparent',
                border: activeTab === tab.id
                  ? '1px solid var(--crowe-indigo-dark)'
                  : '1px solid transparent',
                borderRadius: 999,
                color: activeTab === tab.id
                  ? 'var(--crowe-white)'
                  : isDark
                    ? 'var(--crowe-indigo-dark)'
                    : 'var(--foreground)',
                fontWeight: activeTab === tab.id ? 700 : 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab content — AnimatePresence fade on tab switch */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {seedData && storeInitialized && (
              <TabContent
                seedData={seedData}
                activeTab={activeTab}
                storeInitialized={storeInitialized}
                reducedMotion={reducedMotion}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <p
          style={{
            color: 'var(--muted-color)',
            margin: '2rem 0 0',
            fontSize: '0.75rem',
            opacity: 0.9,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          FP and A Close Efficiency Dashboard - Phase 12 scene storytelling
        </p>
      </main>
      </TooltipProvider>
      </ExplainProvider>
    </Provider>
  );
}
