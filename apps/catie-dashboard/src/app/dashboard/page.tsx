// src/app/dashboard/page.tsx
// Dashboard route — moved from src/app/page.tsx.
// Server Component, async. Calls loadDashboardSeedData() and renders DashboardApp.
import DashboardApp from '@/components/DashboardApp';
import { loadDashboardSeedData } from '@/lib/dataLoader';

export default async function DashboardPage() {
  const seedData = await loadDashboardSeedData();
  return <DashboardApp seedData={seedData} />;
}
