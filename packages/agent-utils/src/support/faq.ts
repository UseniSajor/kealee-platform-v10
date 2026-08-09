/**
 * @kealee/agent-utils/support/faq
 *
 * Keyword + word-overlap FAQ search over a static knowledge base.
 *
 * Scoring:  keyword match (60%) + word similarity (40%)
 * Threshold: >= 0.60 to return a match; >= 0.85 to auto-respond without human review
 *
 * NOTE: In production, replace FAQ_DATABASE with a pgvector similarity query
 * against the rag_chunks table for richer semantic matching.
 *
 * Source: extracted from bots/keabot-support/src/faq.ts
 * Pure function — no I/O, no LLM, no database.
 */

import type { FAQMatch } from './types';

interface FAQEntry {
  question: string;
  answer: string;
  keywords: string[];
}

export const FAQ_DATABASE: FAQEntry[] = [
  {
    question: 'How do I get a permit refund?',
    answer: 'Permit research fees are non-refundable once the research has been conducted, as we have already invested time in researching your specific project requirements. However, if no research has been started, please contact support within 24 hours of purchase.',
    keywords: ['permit', 'refund'],
  },
  {
    question: 'How long does permitting take?',
    answer: 'Permit timelines vary by jurisdiction. Residential permits typically take 2–6 weeks. Commercial permits can take 4–12 weeks. We track your permit status and notify you of any updates.',
    keywords: ['permit', 'time', 'long', 'how long'],
  },
  {
    question: 'How do I select a contractor?',
    answer: 'Our platform matches you with licensed, insured contractors based on trade expertise, proximity, experience, and rating. You will receive 3-5 ranked matches with bids. You choose who to hire.',
    keywords: ['contractor', 'select', 'choose', 'hire'],
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards (Visa, Mastercard, Amex), ACH bank transfers, and wire transfers for larger projects. All payments are processed securely via Stripe.',
    keywords: ['payment', 'pay', 'credit', 'card', 'accept'],
  },
  {
    question: 'How does the cost estimate work?',
    answer: 'Our AI estimation tool uses RSMeans cost data adjusted for your location and project scope. Estimates include material costs, labor, overhead, and a contingency buffer. Final costs may vary based on site conditions.',
    keywords: ['estimate', 'cost', 'price', 'how'],
  },
  {
    question: 'Can I cancel my project?',
    answer: 'You can cancel a project before a contractor is hired for a full refund. After contractor engagement, a 25% cancellation fee applies to cover setup costs. Contact support to initiate cancellation.',
    keywords: ['cancel', 'cancellation', 'stop'],
  },
];

function wordSimilarity(a: string, b: string): number {
  const aWords = new Set(a.toLowerCase().split(/\s+/));
  const bWords = new Set(b.toLowerCase().split(/\s+/));
  const intersection = [...aWords].filter(w => bWords.has(w)).length;
  return intersection / Math.max(aWords.size, bWords.size);
}

const FAQ_MATCH_THRESHOLD      = 0.60;
const FAQ_AUTO_RESPOND_THRESHOLD = 0.85;

export function searchFAQ(question: string): FAQMatch {
  let bestScore = 0;
  let bestEntry: FAQEntry | null = null;

  for (const entry of FAQ_DATABASE) {
    const kwScore =
      entry.keywords.filter(kw => question.toLowerCase().includes(kw)).length /
      entry.keywords.length;
    const simScore = wordSimilarity(question, entry.question);
    const score = kwScore * 0.6 + simScore * 0.4;

    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestScore >= FAQ_MATCH_THRESHOLD) {
    return {
      found:       true,
      answer:      bestEntry.answer,
      confidence:  Math.min(0.99, bestScore),
      autoRespond: bestScore >= FAQ_AUTO_RESPOND_THRESHOLD,
      faqId:       bestEntry.question.slice(0, 20),
    };
  }

  return { found: false, confidence: bestScore, autoRespond: false };
}
