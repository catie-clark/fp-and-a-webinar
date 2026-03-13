// src/features/model/aiPromptUtils.ts
// Pure utility functions for AI summary prompt construction.
// Separated from the route handler so they can be imported in tests
// without triggering Next.js route-export type constraints.

import type { ControlState, ScenarioPreset } from '@/features/model/types';

export interface KpiPayload {
  netSales: string;
  cogs: string;
  grossProfit: string;
  ebitda: string;
  cash: string;
  ar: string;
  ap: string;
  inventory: string;
}

// ─── Audience + Focus types ────────────────────────────────────────────────
export type AudienceOption =
  | 'CFO'
  | 'Board of Directors'
  | 'Operations Team'
  | 'External Stakeholders'
  | 'Internal FP&A';

export type FocusOption =
  | 'Full Dashboard Overview'
  | 'Revenue & Profitability'
  | 'Cash & Working Capital'
  | 'Close Efficiency'
  | 'Scenario Impact';

// Append to system prompt based on selected audience.
export const AUDIENCE_SYSTEM_MODIFIERS: Record<AudienceOption, string> = {
  'CFO':
    '...write in a strategic, bottom-line-first tone. CFOs want: risk headline, financial impact, recommended actions.',
  'Board of Directors':
    '...write with a governance lens. Board members want: risk appetite, fiduciary context, and strategic implications.',
  'Operations Team':
    "...write with operational detail. Ops teams want: what's late, who owns it, what needs to happen next.",
  'External Stakeholders':
    '...write in accessible, non-technical language. Stakeholders want: plain English summary, no jargon, clear outcomes.',
  'Internal FP&A':
    '...write for a technical FP&A audience. Include formula-level context, variance drivers, and close process flags.',
};

// Append to user prompt based on selected focus area.
export const FOCUS_USER_ADDITIONS: Record<FocusOption, string> = {
  'Full Dashboard Overview': '',
  'Revenue & Profitability':
    'Emphasize net sales, gross margin, and EBITDA. Minimize discussion of cash, AR, and close operations.',
  'Cash & Working Capital':
    'Focus on cash position, AR aging risk, and AP exposure. Minimize discussion of revenue and margin commentary.',
  'Close Efficiency':
    'Focus on month-end close progress, journal entry completion, and days-to-close metric. Minimize P&L commentary.',
  'Scenario Impact':
    'Focus on how the active scenario differs from baseline. Highlight which levers drove the biggest KPI changes.',
};

// Pure function — exported for Vitest testability (no React, no fetch).
// Produces the user message sent to GPT-4o. Contains all 8 KPI labels
// plus the preset name so the AI can reference scenario context.
// Optional audience/focus params extend the prompt; backward-compatible with 2-param callers.
export function buildUserPrompt(
  kpis: KpiPayload,
  presetName: string,
  audience?: AudienceOption,
  focus?: FocusOption
): string {
  const lines = [
    `Scenario: ${presetName}`,
    `Net Sales: ${kpis.netSales}`,
    `COGS: ${kpis.cogs}`,
    `Gross Profit: ${kpis.grossProfit}`,
    `EBITDA: ${kpis.ebitda}`,
    `Cash: ${kpis.cash}`,
    `Accounts Receivable: ${kpis.ar}`,
    `Accounts Payable: ${kpis.ap}`,
    `Inventory: ${kpis.inventory}`,
    '',
    'Write the two-paragraph executive summary.',
  ];
  if (focus && focus !== 'Full Dashboard Overview') {
    lines.push(`Focus Area: ${focus}`);
    lines.push(FOCUS_USER_ADDITIONS[focus]);
  }
  if (audience) {
    lines.push(`Audience: ${AUDIENCE_SYSTEM_MODIFIERS[audience]}`);
  }
  return lines.join('\n');
}

// Pure function — shared by DashboardApp (via TabContent) and AiSummarySection.
// Compares all ControlState fields against each preset's controls to find a named match.
// Falls back to 'Custom Scenario' when controls do not match any preset exactly.
export function getActivePresetName(controls: ControlState, presets: ScenarioPreset[]): string {
  const match = presets.find(p =>
    (Object.keys(controls) as Array<keyof ControlState>).every(k => controls[k] === p.controls[k])
  );
  return match ? match.label : 'Custom Scenario';
}
