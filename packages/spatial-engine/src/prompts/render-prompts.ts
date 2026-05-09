/**
 * Render + AI image-generation prompts.
 *
 * These produce text-to-image / image-to-image briefs that downstream
 * services (Midjourney, OpenAI Images, Stable Diffusion XL/XL-Turbo, etc.)
 * can consume. Each prompt returns a structured "brief" rather than a final
 * image URL. The actual rendering is the worker's job.
 */

import type { PromptTemplate } from './types';

export const STYLE_RENDER_BRIEF_PROMPT: PromptTemplate = {
  id: 'render.style_brief',
  version: 1,
  description:
    'Build an image-generation brief for a stylised render (modern, farmhouse, etc.).',
  model: 'anthropic-claude',
  acceptsImages: true,
  jsonOnly: true,
  maxOutputTokens: 800,
  system: [
    'You are Kealee Render-Brief-Agent. You write structured image-generation',
    'briefs. You DO NOT call the image API yourself. You output JSON only.',
    '',
    'Shape:',
    '{',
    '  "positivePrompt": string,',
    '  "negativePrompt": string,',
    '  "aspectRatio": "16:9" | "4:3" | "3:2" | "1:1",',
    '  "renderMode": "sketch" | "standard" | "realistic" | "cinematic",',
    '  "lighting": string,',
    '  "cameraNotes": string,',
    '  "materialFocus": string[]',
    '}',
  ].join('\n'),
  user: [
    'Project type: {{projectType}}',
    'Style direction: {{style}}',
    'Scene summary: {{sceneSummary}}',
    'Reference image URLs: {{imageList}}',
    'Time of day: {{timeOfDay}}',
    '',
    'Return JSON only.',
  ].join('\n'),
  responseJsonSchema: JSON.stringify({
    type: 'object',
    required: [
      'positivePrompt',
      'negativePrompt',
      'aspectRatio',
      'renderMode',
      'lighting',
      'cameraNotes',
      'materialFocus',
    ],
    properties: {
      positivePrompt: { type: 'string' },
      negativePrompt: { type: 'string' },
      aspectRatio: { enum: ['16:9', '4:3', '3:2', '1:1'] },
      renderMode: { enum: ['sketch', 'standard', 'realistic', 'cinematic'] },
      lighting: { type: 'string' },
      cameraNotes: { type: 'string' },
      materialFocus: { type: 'array', items: { type: 'string' } },
    },
  }),
};

export const BEFORE_AFTER_BRIEF_PROMPT: PromptTemplate = {
  id: 'render.before_after_brief',
  version: 1,
  description:
    'Build an image-to-image brief that produces a credible after-render from a real before photo.',
  model: 'anthropic-claude',
  acceptsImages: true,
  jsonOnly: true,
  maxOutputTokens: 700,
  system: [
    'You are Kealee Before-After-Agent. You produce a constrained',
    'image-to-image brief. The "after" must keep the geometry of the',
    '"before" recognisable.',
    '',
    'Shape:',
    '{',
    '  "positivePrompt": string,',
    '  "negativePrompt": string,',
    '  "preserveGeometry": true,',
    '  "denoiseStrength": number,    // 0..1, recommend 0.45-0.65',
    '  "controlNet": "canny" | "depth" | "mlsd",',
    '  "materialChanges": [',
    '    { "area": string, "from": string, "to": string }',
    '  ]',
    '}',
  ].join('\n'),
  user: [
    'Before image URL: {{beforeImage}}',
    'Style target: {{style}}',
    'Scope of change: {{scope}}',
    '',
    'Return JSON only.',
  ].join('\n'),
  responseJsonSchema: JSON.stringify({
    type: 'object',
    required: [
      'positivePrompt',
      'negativePrompt',
      'preserveGeometry',
      'denoiseStrength',
      'controlNet',
      'materialChanges',
    ],
    properties: {
      positivePrompt: { type: 'string' },
      negativePrompt: { type: 'string' },
      preserveGeometry: { type: 'boolean' },
      denoiseStrength: { type: 'number' },
      controlNet: { enum: ['canny', 'depth', 'mlsd'] },
      materialChanges: { type: 'array' },
    },
  }),
};

export const MOODBOARD_BRIEF_PROMPT: PromptTemplate = {
  id: 'render.moodboard_brief',
  version: 1,
  description: 'Generate a 6-tile moodboard brief from a style direction.',
  model: 'anthropic-claude',
  acceptsImages: false,
  jsonOnly: true,
  maxOutputTokens: 900,
  system: [
    'You are Kealee Moodboard-Agent. You build a 6-image brief — one prompt',
    'per tile — that conveys a coherent style. Output JSON only.',
    '',
    'Shape:',
    '{',
    '  "tiles": [',
    '    { "label": string, "positivePrompt": string, "aspectRatio": "1:1" }',
    '  ]',
    '}',
    '',
    'Tiles must total exactly 6.',
  ].join('\n'),
  user: [
    'Style: {{style}}',
    'Project type: {{projectType}}',
    'Mood keywords: {{moodKeywords}}',
    '',
    'Return JSON only.',
  ].join('\n'),
  responseJsonSchema: JSON.stringify({
    type: 'object',
    required: ['tiles'],
    properties: {
      tiles: { type: 'array', minItems: 6, maxItems: 6 },
    },
  }),
};

export const RENDER_PROMPTS = {
  styleBrief: STYLE_RENDER_BRIEF_PROMPT,
  beforeAfterBrief: BEFORE_AFTER_BRIEF_PROMPT,
  moodboardBrief: MOODBOARD_BRIEF_PROMPT,
} as const;
