// src/app/api/scene-narrative/route.ts
// Non-streaming OpenAI route for tab-scoped scene narrative text.
// Returns Response.json({ text }) — 2-3 sentences per tab, max_tokens: 80.
// CRITICAL: runtime = 'nodejs' must be top-level export — edge runtime lacks Node.js built-ins.
export const runtime = 'nodejs';

import OpenAI from 'openai';
import { NextRequest } from 'next/server';
import type { KpiPayload } from '@/features/model/aiPromptUtils';

type TabId = 'overview' | 'close-tracker' | 'charts' | 'ai-summary' | 'scenario';

// Lazily instantiated inside POST so that module-level import does not throw
// when OPENAI_API_KEY is absent (e.g., in Vitest test environment).
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

function buildSceneSystemPrompt(tabId: TabId): string {
  switch (tabId) {
    case 'overview':
      return "You are an FP&A analyst at Crowe LLP. Write exactly 2-3 sentences describing Summit Logistics Group's current period performance overview. Plain prose only, no bullets, no markdown. Use the KPI data and scenario name provided.";
    case 'close-tracker':
      return "You are an FP&A analyst at Crowe LLP. Write exactly 2-3 sentences about Summit Logistics Group's month-end close progress. Focus on close health and critical-path risks. Plain prose, no bullets.";
    case 'charts':
      return "You are an FP&A analyst at Crowe LLP. Write exactly 2-3 sentences interpreting Summit Logistics Group's AR aging, sales pipeline, and cash flow data. Plain prose, no bullets.";
    case 'ai-summary':
      return "You are an FP&A analyst at Crowe LLP. Write exactly 2-3 sentences introducing the AI executive summary tab — what it shows and how to use it. Plain prose, no bullets.";
    case 'scenario':
      return "You are an FP&A analyst at Crowe LLP. Write exactly 2-3 sentences describing the current scenario settings and their most significant impact on KPIs. Plain prose, no bullets.";
    default:
      return "You are an FP&A analyst at Crowe LLP. Write exactly 2-3 sentences summarizing the current financial data. Plain prose, no bullets.";
  }
}

function buildSceneUserPrompt(kpis: KpiPayload, presetName: string, tabId: string): string {
  return [
    `Scenario: ${presetName}`,
    `Net Sales: ${kpis.netSales}, EBITDA: ${kpis.ebitda}, Cash: ${kpis.cash}`,
    `Tab: ${tabId}`,
    'Write the 2-3 sentence scene narrative.',
  ].join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const { kpis, presetName, tabId } = (await req.json()) as {
      kpis: KpiPayload;
      presetName: string;
      tabId: TabId;
    };

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 80,
      temperature: 0.3,
      stream: false,
      messages: [
        {
          role: 'system',
          content: buildSceneSystemPrompt(tabId),
        },
        {
          role: 'user',
          content: buildSceneUserPrompt(kpis, presetName, tabId),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? '';
    return Response.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
