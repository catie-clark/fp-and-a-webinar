// src/components/dashboard/KpiSection.tsx
// 4x2 KPI card grid. No "use client" — runs inside DashboardApp Provider.
// Row 1 (P&L narrative): Net Sales → Gross Profit → EBITDA → Cash
// Row 2 (Balance sheet): COGS → AR → AP → Inventory
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import type { DashboardSeedData } from '@/lib/dataLoader';
import {
  selectNetSales,
  selectCogs,
  selectGrossProfit,
  selectEbitda,
  selectCash,
  selectAr,
  selectAp,
  selectInventory,
} from '@/store/kpiSelectors';
import {
  TrendUp,
  MoneyRecive,
  DollarCircle,
  ChartSquare,
  Wallet,
  ReceiptItem,
  ReceiptText,
  Box,
} from '@/components/ui/icons';
import KpiCard from './KpiCard';
import SectionHeader from '@/components/dashboard/SectionHeader';

interface KpiSectionProps {
  seedData: DashboardSeedData;
}

// Stagger container — orchestrates 60ms delay between each card
const kpiContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
} as const;

// Individual card variant — fade + slide up 20px
const kpiItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
} as const;

export default function KpiSection({ seedData }: KpiSectionProps) {
  const netSales = useSelector((state: RootState) => selectNetSales(state));
  const cogs = useSelector((state: RootState) => selectCogs(state));
  const grossProfit = useSelector((state: RootState) => selectGrossProfit(state));
  const ebitda = useSelector((state: RootState) => selectEbitda(state));
  const cash = useSelector((state: RootState) => selectCash(state));
  const ar = useSelector((state: RootState) => selectAr(state));
  const ap = useSelector((state: RootState) => selectAp(state));
  const inventory = useSelector((state: RootState) => selectInventory(state));

  // prefers-reduced-motion check — JS-level (CSS media query doesn't disable Framer Motion)
  const reducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const bi = seedData.baseInputs;
  const baseNetSales = bi.baseNetSales * 1.03;
  const baseCogs = baseNetSales * 0.75 * (1 + 0.18 * (118 / 100 - 1));
  const baseGrossProfit = baseNetSales - baseCogs;
  const baseEbitda = baseGrossProfit - bi.baseOpex;
  const safeDiv = (cur: number, base: number) =>
    base !== 0 ? (cur - base) / Math.abs(base) : 0;

  return (
    <>
      <SectionHeader
        title="KPI Cards"
        subtitle="January 2026 Performance Snapshot — Key financials against prior month and scenario adjustments"
        explanation="These 8 metrics reflect Summit Logistics Group's January 2026 GL data, adjusted in real time for the active scenario. Net Sales and EBITDA update immediately as sliders move — the variance delta shows movement against the December prior period."
      />
      {/* motion.section: stagger container — each KpiCard child animates with 60ms offset */}
      <motion.section
        aria-label="KPI Metrics"
        variants={kpiContainerVariants}
        initial={reducedMotion ? false : 'hidden'}
        whileInView={reducedMotion ? undefined : 'visible'}
        viewport={{ once: true, margin: '-40px' }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          padding: '0 0 1.5rem 0',
        }}
      >
        {/* Row 1: P&L narrative (Net Sales → Gross Profit → EBITDA → Cash) */}
        <motion.div variants={kpiItemVariants}>
          <KpiCard
            label="Net Sales"
            icon={TrendUp}
            value={netSales}
            delta={bi.variancePct}
          />
        </motion.div>
        <motion.div variants={kpiItemVariants}>
          <KpiCard
            label="Gross Profit"
            icon={DollarCircle}
            value={grossProfit}
            delta={safeDiv(grossProfit, baseGrossProfit)}
          />
        </motion.div>
        <motion.div variants={kpiItemVariants}>
          <KpiCard
            label="EBITDA"
            icon={ChartSquare}
            value={ebitda}
            delta={safeDiv(ebitda, baseEbitda)}
          />
        </motion.div>
        <motion.div variants={kpiItemVariants}>
          <KpiCard
            label="Cash"
            icon={Wallet}
            value={cash}
            delta={safeDiv(cash, bi.baseCash)}
          />
        </motion.div>

        {/* Row 2: Balance sheet (COGS, AR, AP, Inventory) */}
        <motion.div variants={kpiItemVariants}>
          <KpiCard
            label="COGS"
            icon={MoneyRecive}
            value={cogs}
            delta={safeDiv(cogs, baseCogs)}
            deltaInverted
          />
        </motion.div>
        <motion.div variants={kpiItemVariants}>
          <KpiCard
            label="Accounts Receivable"
            icon={ReceiptItem}
            value={ar}
            delta={safeDiv(ar, bi.arTotal)}
          />
        </motion.div>
        <motion.div variants={kpiItemVariants}>
          <KpiCard
            label="Accounts Payable"
            icon={ReceiptText}
            value={ap}
            delta={safeDiv(ap, bi.apTotal)}
            deltaNeutral
          />
        </motion.div>
        <motion.div variants={kpiItemVariants}>
          <KpiCard
            label="Inventory"
            icon={Box}
            value={inventory}
            delta={safeDiv(inventory, bi.inventoryTotal)}
            deltaNeutral
          />
        </motion.div>
      </motion.section>
    </>
  );
}
