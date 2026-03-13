// src/app/page.tsx
// Root page — Server Component (no "use client")
// Phase 2: async — calls loadDashboardSeedData() and passes seedData to DashboardApp.
import DashboardApp from '@/components/DashboardApp';
import { loadDashboardSeedData } from '@/lib/dataLoader';

export default async function Page() {
  const seedData = await loadDashboardSeedData();
  return <DashboardApp seedData={seedData} />;
}
