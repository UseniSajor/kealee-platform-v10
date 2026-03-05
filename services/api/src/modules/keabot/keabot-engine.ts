/**
 * KeaBot Engine
 *
 * Claude-powered AI assistant for Kealee website chat.
 * - Answers questions about Kealee services using FAQ knowledge base
 * - Qualifies construction leads with a scoring system (0-100)
 * - Hands off high-scoring leads (65+) to human sales team
 * - Integrates with GHL for contact creation and lead tagging
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@kealee/database';

const p = prisma as any;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
const LEAD_HANDOFF_THRESHOLD = 65;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LeadScore {
  score: number; // 0-100
  signals: string[];
  readyForHandoff: boolean;
  projectType?: string;
  estimatedBudget?: string;
  timeline?: string;
  location?: string;
}

export interface KeaBotResponse {
  message: string;
  leadScore: LeadScore | null;
  suggestedActions?: string[];
  sessionId: string;
}

interface ConversationContext {
  messages: ChatMessage[];
  leadData: Record<string, string>;
  score: number;
  handedOff: boolean;
}

// ---------------------------------------------------------------------------
// In-memory session store (production would use Redis)
// ---------------------------------------------------------------------------

const sessions = new Map<string, ConversationContext>();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min

function cleanupSessions() {
  // Simple cleanup — in production use Redis with TTL
  if (sessions.size > 1000) {
    const entries = [...sessions.entries()];
    entries.slice(0, 500).forEach(([k]) => sessions.delete(k));
  }
}
setInterval(cleanupSessions, 10 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are KeaBot, the AI assistant for Kealee — an end-to-end design/build platform serving the DC-Baltimore corridor and beyond.

Your goals:
1. ANSWER questions about Kealee's services helpfully and accurately
2. QUALIFY leads by naturally gathering project details during conversation
3. RECOMMEND appropriate Kealee services based on their needs

Kealee Services:
- Architecture: AI concept generation, full architectural design ($2,500 - $35,000)
- Engineering: Structural, MEP, civil engineering
- Estimation: AI-powered construction cost estimation
- Permits & Inspections: Building permit management and tracking ($495 - $7,500)
- Project Management: Full PM packages for construction projects ($1,750 - $16,500/mo)
- Project Owner Portal: Dashboard for property owners to track their projects ($49 - $999/mo)
- Operations Services: Field operations, daily logs, site management
- Finance & Trust: Escrow, milestone payments, lien waiver management
- Marketplace: Vetted contractor network

Lead Qualification (gather naturally, don't interrogate):
- Project type (residential, commercial, renovation, new build)
- Location (city/state — DC-Baltimore corridor is our sweet spot)
- Budget range
- Timeline / urgency
- Current stage (planning, permits, ready to build)

Scoring Guide (assess internally, don't share scores):
- Has project type: +15
- Has location in service area (DC/MD/VA): +20
- Has budget range: +15
- Has timeline: +10
- Expressed urgency: +10
- Asked about pricing: +10
- Ready to start: +20

When score reaches 65+, suggest they schedule a free consultation or speak with a specialist.

Tone: Professional but friendly. You're a knowledgeable construction industry assistant.
Keep responses concise (2-4 sentences max unless explaining a service in detail).
Never make up pricing not listed above. Say "I can connect you with our team for a custom quote" for unlisted services.`;

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

function getOrCreateSession(sessionId: string): ConversationContext {
  let ctx = sessions.get(sessionId);
  if (!ctx) {
    ctx = { messages: [], leadData: {}, score: 0, handedOff: false };
    sessions.set(sessionId, ctx);
  }
  return ctx;
}

function calculateLeadScore(ctx: ConversationContext): LeadScore {
  const signals: string[] = [];
  let score = 0;

  const allText = ctx.messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.toLowerCase())
    .join(' ');

  // Project type
  const projectTypes = ['residential', 'commercial', 'renovation', 'new build', 'addition', 'remodel', 'multifamily'];
  const foundType = projectTypes.find((t) => allText.includes(t));
  if (foundType || ctx.leadData.projectType) {
    score += 15;
    signals.push(`Project type: ${foundType || ctx.leadData.projectType}`);
  }

  // Location in service area
  const serviceLocations = ['dc', 'washington', 'maryland', 'virginia', 'baltimore', 'bethesda', 'arlington', 'silver spring', 'rockville', 'alexandria'];
  const foundLocation = serviceLocations.find((l) => allText.includes(l));
  if (foundLocation || ctx.leadData.location) {
    score += 20;
    signals.push(`Location: ${foundLocation || ctx.leadData.location}`);
  }

  // Budget
  const budgetMatch = allText.match(/\$[\d,]+k?|\d+\s*(?:thousand|million|k)/i);
  if (budgetMatch || ctx.leadData.budget) {
    score += 15;
    signals.push(`Budget mentioned: ${budgetMatch?.[0] || ctx.leadData.budget}`);
  }

  // Timeline
  const timelineWords = ['asap', 'soon', 'this year', 'next month', 'this month', 'urgent', 'quickly', 'immediately', 'spring', 'summer', 'fall', 'winter'];
  const foundTimeline = timelineWords.find((t) => allText.includes(t));
  if (foundTimeline || ctx.leadData.timeline) {
    score += 10;
    signals.push(`Timeline: ${foundTimeline || ctx.leadData.timeline}`);
  }

  // Urgency
  if (allText.includes('urgent') || allText.includes('asap') || allText.includes('immediately')) {
    score += 10;
    signals.push('Expressed urgency');
  }

  // Pricing interest
  if (allText.includes('price') || allText.includes('cost') || allText.includes('how much') || allText.includes('quote')) {
    score += 10;
    signals.push('Asked about pricing');
  }

  // Ready to start
  if (allText.includes('ready to start') || allText.includes('want to begin') || allText.includes('hire') || allText.includes('get started') || allText.includes('sign up')) {
    score += 20;
    signals.push('Ready to start');
  }

  return {
    score: Math.min(score, 100),
    signals,
    readyForHandoff: score >= LEAD_HANDOFF_THRESHOLD,
    projectType: foundType || ctx.leadData.projectType,
    estimatedBudget: budgetMatch?.[0] || ctx.leadData.budget,
    timeline: foundTimeline || ctx.leadData.timeline,
    location: foundLocation || ctx.leadData.location,
  };
}

/**
 * Process a chat message and return KeaBot's response.
 */
export async function chat(sessionId: string, userMessage: string): Promise<KeaBotResponse> {
  if (!ANTHROPIC_API_KEY) {
    return {
      message: "I'm currently unavailable. Please contact us at info@kealee.com or call (202) 555-KEALEE.",
      leadScore: null,
      sessionId,
    };
  }

  const ctx = getOrCreateSession(sessionId);
  ctx.messages.push({ role: 'user', content: userMessage });

  // Load FAQ knowledge for context
  let faqContext = '';
  try {
    const faqs = await p.faq.findMany({ take: 50, orderBy: { number: 'asc' } });
    if (faqs.length > 0) {
      faqContext = '\n\nFAQ Knowledge Base:\n' + faqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    }
  } catch {
    // FAQ lookup failure is non-critical
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 500,
    system: SYSTEM_PROMPT + faqContext,
    messages: ctx.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const assistantMessage =
    (response.content[0].type === 'text' ? response.content[0].text : '') || 'I apologize, I had trouble processing that.';

  ctx.messages.push({ role: 'assistant', content: assistantMessage ?? '' });

  // Calculate lead score
  const leadScore = calculateLeadScore(ctx);
  ctx.score = leadScore.score;

  // Determine suggested actions
  const suggestedActions: string[] = [];
  if (leadScore.readyForHandoff && !ctx.handedOff) {
    suggestedActions.push('schedule_consultation');
    suggestedActions.push('connect_specialist');
    ctx.handedOff = true;
  }

  return {
    message: assistantMessage ?? '',
    leadScore,
    suggestedActions,
    sessionId,
  };
}

/**
 * Get conversation history for a session.
 */
export function getConversation(sessionId: string): ChatMessage[] {
  return sessions.get(sessionId)?.messages ?? [];
}

/**
 * End a session and return final lead score.
 */
export function endSession(sessionId: string): LeadScore | null {
  const ctx = sessions.get(sessionId);
  if (!ctx) return null;
  const score = calculateLeadScore(ctx);
  sessions.delete(sessionId);
  return score;
}
