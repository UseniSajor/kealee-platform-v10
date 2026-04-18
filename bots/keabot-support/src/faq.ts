import type { FAQMatch } from './types.js';

// Static FAQ knowledge base (in production: vector search via pgvector)
const FAQ_DATABASE: Array<{ question: string; answer: string; keywords: string[] }> = [
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

function similarity(a: string, b: string): number {
  const aWords = new Set(a.toLowerCase().split(/\s+/));
  const bWords = new Set(b.toLowerCase().split(/\s+/));
  const intersection = [...aWords].filter(w => bWords.has(w)).length;
  return intersection / Math.max(aWords.size, bWords.size);
}

export function searchFAQ(question: string): FAQMatch {
  let bestScore = 0;
  let bestEntry: (typeof FAQ_DATABASE)[0] | null = null;

  for (const entry of FAQ_DATABASE) {
    // Keyword match
    const kwScore = entry.keywords.filter(kw => question.toLowerCase().includes(kw)).length / entry.keywords.length;
    // Semantic similarity (simple word overlap)
    const simScore = similarity(question, entry.question);
    const score = kwScore * 0.6 + simScore * 0.4;

    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestScore >= 0.60) {
    return {
      found: true,
      answer: bestEntry.answer,
      confidence: Math.min(0.99, bestScore),
      autoRespond: bestScore >= 0.85,
      faqId: bestEntry.question.slice(0, 20),
    };
  }

  return { found: false, confidence: bestScore, autoRespond: false };
}
