// Wave 0 RED stubs — tests must FAIL until Plan 02 computes closeStages from JE data.
// Uses beforeAll error-capture pattern (Phase 2 convention).

import { describe, it, expect, beforeAll } from 'vitest';
import { loadDashboardSeedData } from '@/lib/dataLoader';
import type { CloseStage } from '@/features/model/types';

// ─── Pure function contracts (tested independently of dataLoader) ─────────────
// These are defined inline here. Plan 03 implements them in the component file.
type RagStatus = 'on-track' | 'at-risk' | 'delayed';

function getRagStatus(progress: number): RagStatus {
  if (progress >= 75) return 'on-track';
  if (progress >= 50) return 'at-risk';
  return 'delayed';
}

function getContextualNote(stage: CloseStage): string | null {
  if (getRagStatus(stage.progress) === 'on-track') return null;
  return `${stage.posted} of ${stage.total} JEs complete · ${stage.pendingApproval} pending approval`;
}

// ─── dataLoader integration (FAILS RED until Plan 02) ─────────────────────────
let seedData: Awaited<ReturnType<typeof loadDashboardSeedData>> | undefined;
let loadError: unknown;

beforeAll(async () => {
  try {
    seedData = await loadDashboardSeedData();
  } catch (err) {
    loadError = err;
  }
});

// ─── Pure function tests (GREEN — locally defined, no dataLoader dependency) ──

describe('getRagStatus', () => {
  it('getRagStatus(78) === "on-track" (≥75%)', () => {
    expect(getRagStatus(78)).toBe('on-track');
  });

  it('getRagStatus(70) === "at-risk" (50–74%)', () => {
    expect(getRagStatus(70)).toBe('at-risk');
  });

  it('getRagStatus(47) === "delayed" (<50%)', () => {
    expect(getRagStatus(47)).toBe('delayed');
  });
});

describe('getContextualNote', () => {
  it('returns null for on-track stage (progress ≥75)', () => {
    const stage: CloseStage = { name: 'AP close', progress: 78, posted: 14, pendingApproval: 2, total: 18 };
    expect(getContextualNote(stage)).toBeNull();
  });

  it('returns non-empty string for at-risk stage containing posted and pendingApproval counts', () => {
    const stage: CloseStage = { name: 'AR close', progress: 70, posted: 14, pendingApproval: 3, total: 20 };
    const note = getContextualNote(stage);
    expect(note).not.toBeNull();
    expect(typeof note).toBe('string');
    expect(note!.length).toBeGreaterThan(0);
    // Must include posted count and pendingApproval count in the message
    expect(note).toContain('14');
    expect(note).toContain('3');
  });
});

// ─── dataLoader integration tests (RED until Plan 02) ────────────────────────

describe('closeStages from dataLoader', () => {
  it('closeStages array has exactly 6 entries', () => {
    if (loadError) throw loadError;
    expect(seedData!.closeStages).toHaveLength(6);
  });

  it('AP close progress is 78', () => {
    if (loadError) throw loadError;
    const stage = seedData!.closeStages.find((s: CloseStage) => s.name === 'AP close');
    expect(stage).toBeDefined();
    expect(stage!.progress).toBe(78);
  });

  it('AR close progress is 70', () => {
    if (loadError) throw loadError;
    const stage = seedData!.closeStages.find((s: CloseStage) => s.name === 'AR close');
    expect(stage).toBeDefined();
    expect(stage!.progress).toBe(70);
  });

  it('Revenue recognition progress is 67', () => {
    if (loadError) throw loadError;
    const stage = seedData!.closeStages.find((s: CloseStage) => s.name === 'Revenue recognition');
    expect(stage).toBeDefined();
    expect(stage!.progress).toBe(67);
  });

  it('Inventory valuation progress is 59', () => {
    if (loadError) throw loadError;
    const stage = seedData!.closeStages.find((s: CloseStage) => s.name === 'Inventory valuation');
    expect(stage).toBeDefined();
    expect(stage!.progress).toBe(59);
  });

  it('Accruals & JEs progress is 62', () => {
    if (loadError) throw loadError;
    const stage = seedData!.closeStages.find((s: CloseStage) => s.name === 'Accruals & JEs');
    expect(stage).toBeDefined();
    expect(stage!.progress).toBe(62);
  });

  it('Financial statement package progress is 47', () => {
    if (loadError) throw loadError;
    const stage = seedData!.closeStages.find((s: CloseStage) => s.name === 'Financial statement package');
    expect(stage).toBeDefined();
    expect(stage!.progress).toBe(47);
  });

  it('each CloseStage has posted, pendingApproval, total fields', () => {
    if (loadError) throw loadError;
    for (const stage of seedData!.closeStages as CloseStage[]) {
      expect(stage).toHaveProperty('posted');
      expect(stage).toHaveProperty('pendingApproval');
      expect(stage).toHaveProperty('total');
      expect(typeof stage.posted).toBe('number');
      expect(typeof stage.pendingApproval).toBe('number');
      expect(typeof stage.total).toBe('number');
    }
  });

  it('AP close posted count is 14 (9 posted + 5 approved), total is 18', () => {
    if (loadError) throw loadError;
    const stage = seedData!.closeStages.find((s: CloseStage) => s.name === 'AP close');
    expect(stage).toBeDefined();
    expect(stage!.posted).toBe(14);
    expect(stage!.total).toBe(18);
  });

  it('Financial statement package posted is 7, pendingApproval is 5, total is 15', () => {
    if (loadError) throw loadError;
    // pending-approval status uses hyphen in erp_journal_entries.csv
    const stage = seedData!.closeStages.find((s: CloseStage) => s.name === 'Financial statement package');
    expect(stage).toBeDefined();
    expect(stage!.posted).toBe(7);
    expect(stage!.pendingApproval).toBe(5);
    expect(stage!.total).toBe(15);
  });
});
