// src/app/api/enhance-summary/route.ts
// OpenAI GPT-4o streaming route handler for AI executive narrative.
// CRITICAL: runtime = 'nodejs' must be top-level export — edge runtime lacks Node.js built-ins
// required by the OpenAI SDK (node:stream, node:http).
export const runtime = 'nodejs';

import OpenAI from 'openai';
import { NextRequest } from 'next/server';
import {
  type KpiPayload,
  type AudienceOption,
  type FocusOption,
  buildUserPrompt,
  AUDIENCE_SYSTEM_MODIFIERS,
} from '@/features/model/aiPromptUtils';

// Re-export KpiPayload type so existing imports from this route still work.
export type { KpiPayload };

// Lazily instantiated inside POST so that module-level import does not throw
// when OPENAI_API_KEY is absent (e.g., in Vitest test environment).
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export async function POST(req: NextRequest) {
  try {
    const { kpis, presetName, audience, focus } = (await req.json()) as {
      kpis: KpiPayload;
      presetName: string;
      audience?: AudienceOption;
      focus?: FocusOption;
    };

    const baseSystemPrompt =
      'You are a senior FP&A analyst at Crowe LLP preparing a structured executive briefing for your client Summit Logistics Group. Generate a comprehensive, structured executive summary about Summit Logistics Group\'s month-end close results. Always refer to the company as "Summit Logistics Group".\n\nFormat your response with exactly these two sections:\n\n## Current Period Performance\nWrite 2-3 sentences summarizing overall financial performance, then provide 3-4 specific bullet points with key metrics and variances.\n\n## Close & Forward Outlook\nWrite 2-3 sentences about close progress and risks, then provide 3-4 specific action-focused bullet points with owners and thresholds.\n\nUse ## for section headers, • for bullet points, **bold** for key figures, dollar amounts, and percentages. Be specific and quantitative. Do not use any other markdown.';
    const systemPrompt = audience
      ? `${baseSystemPrompt} ${AUDIENCE_SYSTEM_MODIFIERS[audience]}`
      : baseSystemPrompt;

    const stream = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 600,
      temperature: 0.3,
      stream: true,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: buildUserPrompt(kpis, presetName, audience, focus),
        },
      ],
    });

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
