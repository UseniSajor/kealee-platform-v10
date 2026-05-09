/**
 * Kealee spatial-engine seed prompt library.
 *
 * Layout:
 *   - types.ts             → PromptTemplate type + renderPrompt()
 *   - vision-prompts.ts    → photo / plan / sketch → SceneSchema geometry
 *   - agent-prompts.ts     → one per orchestrator agent
 *   - render-prompts.ts    → image-generation briefs
 *   - orchestrator-prompt  → master router prompt
 *
 * All prompts are versioned. Bump the version when you change semantics so
 * caches and analytics can pivot on `id@version`.
 */

export * from './types';
export * from './vision-prompts';
export * from './agent-prompts';
export * from './render-prompts';
export * from './orchestrator-prompt';

import { VISION_PROMPTS } from './vision-prompts';
import { AGENT_PROMPTS } from './agent-prompts';
import { RENDER_PROMPTS } from './render-prompts';
import { ORCHESTRATOR_PROMPT } from './orchestrator-prompt';
import type { PromptTemplate } from './types';

/** Catalog of all prompts, keyed by their stable id. */
export const PROMPT_CATALOG: Record<string, PromptTemplate> = {
  [VISION_PROMPTS.photoToGeometry.id]: VISION_PROMPTS.photoToGeometry,
  [VISION_PROMPTS.planPdfToGeometry.id]: VISION_PROMPTS.planPdfToGeometry,
  [VISION_PROMPTS.sketchToGeometry.id]: VISION_PROMPTS.sketchToGeometry,
  [AGENT_PROMPTS.layout.id]: AGENT_PROMPTS.layout,
  [AGENT_PROMPTS.estimating.id]: AGENT_PROMPTS.estimating,
  [AGENT_PROMPTS.permit.id]: AGENT_PROMPTS.permit,
  [AGENT_PROMPTS.designStyle.id]: AGENT_PROMPTS.designStyle,
  [AGENT_PROMPTS.material.id]: AGENT_PROMPTS.material,
  [AGENT_PROMPTS.sequencing.id]: AGENT_PROMPTS.sequencing,
  [AGENT_PROMPTS.budget.id]: AGENT_PROMPTS.budget,
  [RENDER_PROMPTS.styleBrief.id]: RENDER_PROMPTS.styleBrief,
  [RENDER_PROMPTS.beforeAfterBrief.id]: RENDER_PROMPTS.beforeAfterBrief,
  [RENDER_PROMPTS.moodboardBrief.id]: RENDER_PROMPTS.moodboardBrief,
  [ORCHESTRATOR_PROMPT.id]: ORCHESTRATOR_PROMPT,
};

export function getPrompt(id: string): PromptTemplate {
  const p = PROMPT_CATALOG[id];
  if (!p) throw new Error(`Unknown prompt id: ${id}`);
  return p;
}

export function listPromptIds(): string[] {
  return Object.keys(PROMPT_CATALOG);
}
