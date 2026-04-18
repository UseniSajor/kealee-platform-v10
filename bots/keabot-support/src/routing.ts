import type { RoutingResult, SupportCategory } from './types.js';

interface RoutingRule {
  keywords: string[];
  category: SupportCategory;
  assignTo: string;
  confidence: number;
}

const ROUTING_RULES: RoutingRule[] = [
  { keywords: ['permit', 'zoning', 'approval', 'variance'], category: 'permit_support', assignTo: 'permit_specialist', confidence: 0.92 },
  { keywords: ['contractor', 'worker', 'crew', 'builder', 'subcontractor'], category: 'contractor_support', assignTo: 'contractor_manager', confidence: 0.90 },
  { keywords: ['payment', 'charge', 'invoice', 'billing', 'refund', 'stripe', 'price'], category: 'payment_support', assignTo: 'billing_team', confidence: 0.93 },
  { keywords: ['design', 'render', 'image', 'floor plan', 'blueprint', 'architect'], category: 'design_support', assignTo: 'design_team', confidence: 0.88 },
  { keywords: ['cost', 'estimate', 'budget', 'quote', 'pricing'], category: 'estimate_support', assignTo: 'estimation_team', confidence: 0.87 },
  { keywords: ['how', 'what', 'when', 'why', 'where', '?', 'help', 'explain'], category: 'faq_search', assignTo: 'ai_assistant', confidence: 0.75 },
];

export function classifyTicket(question: string): RoutingResult {
  const lower = question.toLowerCase();

  let bestMatch: RoutingRule | null = null;
  let bestScore = 0;
  const matchedKeywords: string[] = [];

  for (const rule of ROUTING_RULES) {
    const matched = rule.keywords.filter(kw => lower.includes(kw));
    const score = matched.length / rule.keywords.length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = rule;
      matchedKeywords.splice(0, matchedKeywords.length, ...matched);
    }
  }

  if (bestMatch && matchedKeywords.length > 0) {
    return {
      category: bestMatch.category,
      confidence: Math.min(0.99, bestMatch.confidence * (1 + bestScore * 0.1)),
      assignTo: bestMatch.assignTo,
      keywords: matchedKeywords,
    };
  }

  return {
    category: 'general_support',
    confidence: 0.60,
    assignTo: 'general_support',
    keywords: [],
  };
}
