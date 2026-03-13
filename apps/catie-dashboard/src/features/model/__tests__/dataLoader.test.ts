// Wave 0: RED until Wave 1 data files and Wave 2 code fixes are in place
import { loadDashboardSeedData } from '@/lib/dataLoader';

describe('loadDashboardSeedData integration', () => {
  let seedData: Awaited<ReturnType<typeof loadDashboardSeedData>> | undefined;
  let loadError: unknown;

  beforeAll(async () => {
    try {
      seedData = await loadDashboardSeedData();
    } catch (err) {
      loadError = err;
    }
  });

  it('company name is Summit Logistics Group', () => {
    if (loadError) throw loadError;
    expect(seedData!.company.name).toBe('Summit Logistics Group');
  });

  it('closeTargetBusinessDays is 5', () => {
    if (loadError) throw loadError;
    expect(seedData!.company.closeTargetBusinessDays).toBe(5);
  });

  it('variancePct is 0.034 not the hardcoded 0.037', () => {
    if (loadError) throw loadError;
    expect(seedData!.baseInputs.variancePct).toBe(0.034);
  });

  it('baseNetSales is 9200000 (Jan-2026 latest GL row)', () => {
    if (loadError) throw loadError;
    expect(seedData!.baseInputs.baseNetSales).toBe(9200000);
  });

  it('presets array has exactly 6 entries', () => {
    if (loadError) throw loadError;
    expect(seedData!.presets).toHaveLength(6);
  });

  it('cash13Week has exactly 13 rows', () => {
    if (loadError) throw loadError;
    expect(seedData!.cash13Week).toHaveLength(13);
  });

  it('ar90Ratio is between 0.10 and 0.12', () => {
    if (loadError) throw loadError;
    expect(seedData!.ar90Ratio).toBeGreaterThanOrEqual(0.10);
    expect(seedData!.ar90Ratio).toBeLessThanOrEqual(0.12);
  });

  it('journalEntries has at least 80 rows', () => {
    if (loadError) throw loadError;
    expect(seedData!.journalEntries.length).toBeGreaterThanOrEqual(80);
  });

  it('externalFuelIndex has 6 rows (Aug-2025 to Jan-2026)', () => {
    if (loadError) throw loadError;
    expect(seedData!.externalFuelIndex).toHaveLength(6);
  });

  it('externalVendorPriceIndex has 6 rows (Aug-2025 to Jan-2026)', () => {
    if (loadError) throw loadError;
    expect(seedData!.externalVendorPriceIndex).toHaveLength(6);
  });

  it('seedData includes arAging array with at least 1 row', () => {
    if (loadError) throw loadError;
    expect(Array.isArray(seedData!.arAging)).toBe(true);
    expect(seedData!.arAging.length).toBeGreaterThan(0);
  });

  it('seedData includes crmPipeline array with at least 1 row', () => {
    if (loadError) throw loadError;
    expect(Array.isArray(seedData!.crmPipeline)).toBe(true);
    expect(seedData!.crmPipeline.length).toBeGreaterThan(0);
  });
});
