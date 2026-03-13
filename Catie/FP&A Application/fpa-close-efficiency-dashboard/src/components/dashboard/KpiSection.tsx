// src/components/dashboard/KpiSection.tsx
// 4x2 KPI card grid. No "use client" — runs inside DashboardApp Provider.
// Row 1 (P&L narrative): Net Sales → Gross Profit → EBITDA → Cash
// Row 2 (Balance sheet): COGS → AR → AP → Inventory
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

interface KpiSectionProps {
  seedData: DashboardSeedData;
}

export default function KpiSection({ seedData }: KpiSectionProps) {
  const netSales = useSelector((state: RootState) => selectNetSales(state));
  const cogs = useSelector((state: RootState) => selectCogs(state));
  const grossProfit = useSelector((state: RootState) => selectGrossProfit(state));
  const ebitda = useSelector((state: RootState) => selectEbitda(state));
  const cash = useSelector((state: RootState) => selectCash(state));
  const ar = useSelector((state: RootState) => selectAr(state));
  const ap = useSelector((state: RootState) => selectAp(state));
  const inventory = useSelector((state: RootState) => selectInventory(state));

  // Base values for delta computation (default controls: 3% growth, 25% margin, fuel=118, etc.)
  const bi = seedData.baseInputs;
  const baseNetSales = bi.baseNetSales * 1.03;
  const baseCogs = baseNetSales * 0.75 * (1 + 0.18 * (118 / 100 - 1));
  const baseGrossProfit = baseNetSales - baseCogs;
  const baseEbitda = baseGrossProfit - bi.baseOpex;
  const safeDiv = (cur: number, base: number) =>
    base !== 0 ? (cur - base) / Math.abs(base) : 0;

  return (
    <section
      aria-label="KPI Metrics"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
        padding: '0 0 1.5rem 0',
      }}
    >
      {/* Row 1: P&L narrative (Net Sales → Gross Profit → EBITDA → Cash) */}
      <KpiCard
        label="Net Sales"
        icon={TrendUp}
        value={netSales}
        delta={bi.variancePct}
      />
      <KpiCard
        label="Gross Profit"
        icon={DollarCircle}
        value={grossProfit}
        delta={safeDiv(grossProfit, baseGrossProfit)}
      />
      <KpiCard
        label="EBITDA"
        icon={ChartSquare}
        value={ebitda}
        delta={safeDiv(ebitda, baseEbitda)}
      />
      <KpiCard
        label="Cash"
        icon={Wallet}
        value={cash}
        delta={safeDiv(cash, bi.baseCash)}
      />

      {/* Row 2: Balance sheet (COGS, AR, AP, Inventory) */}
      <KpiCard
        label="COGS"
        icon={MoneyRecive}
        value={cogs}
        delta={safeDiv(cogs, baseCogs)}
        deltaInverted
      />
      <KpiCard
        label="Accounts Receivable"
        icon={ReceiptItem}
        value={ar}
        delta={safeDiv(ar, bi.arTotal)}
      />
      <KpiCard
        label="Accounts Payable"
        icon={ReceiptText}
        value={ap}
        delta={safeDiv(ap, bi.apTotal)}
        deltaNeutral
      />
      <KpiCard
        label="Inventory"
        icon={Box}
        value={inventory}
        delta={safeDiv(inventory, bi.inventoryTotal)}
        deltaNeutral
      />
    </section>
  );
}
