// src/lib/scenarioNarrativeCache.ts
// In-memory session cache for scene narrative text — resets on page refresh (acceptable per CONTEXT.md).
// Keyed by "presetName:tabId" — switching back to same preset+tab uses cache, no API call.

export const sceneNarrativeCache = new Map<string, string>();

export function getCacheKey(presetName: string, tabId: string): string {
  return `${presetName}:${tabId}`;
}
