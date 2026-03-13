// src/app/page.tsx
// Root page — Server Component (no "use client")
// Phase 1: renders DashboardApp with no props (data files don't exist yet).
// Phase 2: will call loadDashboardSeedData() and pass seedData as props.
import DashboardApp from '@/components/DashboardApp';

export default function Page() {
  // Phase 2 will add:
  // const seedData = await loadDashboardSeedData();
  // return <DashboardApp seedData={seedData} />;
  return <DashboardApp />;
}
