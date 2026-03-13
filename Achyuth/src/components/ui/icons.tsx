// src/components/ui/icons.tsx
// "use client" boundary for all Iconsax icon imports.
// NEVER import from 'iconsax-react' directly — always import from this file.
// iconsax-react accesses browser globals at module load time; the "use client"
// directive here prevents Next.js from evaluating it during SSR.
'use client';

export {
  // KPI cards & trends
  TrendUp,
  TrendDown,
  DollarCircle,
  Wallet,
  ArrowUp2,
  ArrowDown2,
  // Close stage tracker status badges
  TickCircle,
  CloseCircle,
  Warning2,
  Clock,
  // Charts
  Chart,
  Chart2,
  ChartSquare,
  // Scenario panel
  Setting2,
  Refresh2,
  // AI summary panel
  Cpu,
  MessageText,
  // Theme toggle
  Moon,
  Sun1,
  // General / supplementary
  ReceiptItem,
  DocumentText,
  Calendar,
  Building,
} from 'iconsax-react';
