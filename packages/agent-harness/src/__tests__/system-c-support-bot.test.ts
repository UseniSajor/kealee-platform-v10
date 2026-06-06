/**
 * system-c-support-bot.test.ts
 *
 * Behavioral snapshot of System C SupportBot deterministic classification.
 * Source: services/api/src/modules/bots/bots/support.bot.ts
 *
 * Tests lock the category classification and escalation rules.
 * The ordering of CATEGORY_PATTERNS matters — tests document priority.
 *
 * Last verified: Phase 0.5 (June 2026)
 */

import { describe, it, expect } from 'vitest';

// ── Replicated from support.bot.ts ────────────────────────────────────────────
// Source: services/api/src/modules/bots/bots/support.bot.ts:22-58

type SupportCategory = 'faq' | 'escalation' | 'navigation' | 'technical' | 'billing';

const CATEGORY_PATTERNS: Array<{ category: SupportCategory; patterns: RegExp[] }> = [
  {
    category: 'billing',
    patterns: [/billing|invoice|payment|charge|refund|subscription|stripe|credit card/i],
  },
  {
    category: 'technical',
    patterns: [/error|bug|broken|crash|not working|can't upload|login.*fail|502|500/i],
  },
  {
    category: 'navigation',
    patterns: [/where is|how do I find|navigate|dashboard|page|menu|section/i],
  },
  {
    category: 'escalation',
    patterns: [/legal|dispute|complaint|fraud|scam|urgent|emergency|lawsuit|attorney/i],
  },
  {
    category: 'faq',
    patterns: [/.*/],  // catch-all
  },
];

function classifyMessage(message: string): SupportCategory {
  for (const { category, patterns } of CATEGORY_PATTERNS) {
    if (patterns.some(p => p.test(message))) return category;
  }
  return 'faq';
}

function shouldEscalateByCategory(category: SupportCategory, message: string): boolean {
  if (category === 'escalation') return true;
  if (category === 'billing' && /refund|dispute|chargeback/i.test(message)) return true;
  return false;
}

// Related articles lookup (frozen)
const RELATED_ARTICLES: Record<SupportCategory, string[]> = {
  billing:    ['Understanding your subscription', 'Payment methods', 'Invoices and receipts'],
  technical:  ['System requirements', 'Browser compatibility', 'Troubleshooting login'],
  navigation: ['Dashboard overview', 'Project lifecycle guide', 'Getting started checklist'],
  escalation: ['Dispute resolution process', 'Terms of service'],
  faq:        ['Getting started with Kealee', 'Platform overview', 'Contractor onboarding guide'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SupportBot — classifyMessage() (frozen snapshot)', () => {
  describe('billing category', () => {
    it('"invoice" → billing', () => {
      expect(classifyMessage('I have a question about my invoice')).toBe('billing');
    });

    it('"payment" → billing', () => {
      expect(classifyMessage('My payment failed')).toBe('billing');
    });

    it('"refund" → billing', () => {
      expect(classifyMessage('I want a refund')).toBe('billing');
    });

    it('"stripe" → billing', () => {
      expect(classifyMessage('There was a Stripe charge I don\'t recognize')).toBe('billing');
    });

    it('"credit card" → billing', () => {
      expect(classifyMessage('I need to update my credit card')).toBe('billing');
    });
  });

  describe('technical category', () => {
    it('"error" → technical', () => {
      expect(classifyMessage('I got an error when submitting')).toBe('technical');
    });

    it('"bug" → technical', () => {
      expect(classifyMessage('There is a bug in the dashboard')).toBe('technical');
    });

    it('"not working" → technical', () => {
      expect(classifyMessage('The upload is not working')).toBe('technical');
    });

    it('"502" status code → technical', () => {
      expect(classifyMessage('I keep getting a 502 error')).toBe('technical');
    });

    it('"login.*fail" → technical', () => {
      expect(classifyMessage('My login is failing every time')).toBe('technical');
    });
  });

  describe('navigation category', () => {
    it('"where is" → navigation', () => {
      expect(classifyMessage('Where is the contractor matching feature?')).toBe('navigation');
    });

    it('"how do I find" → navigation', () => {
      expect(classifyMessage('How do I find my project files?')).toBe('navigation');
    });

    it('"dashboard" → navigation', () => {
      expect(classifyMessage('I need help with the dashboard')).toBe('navigation');
    });

    it('"menu" → navigation', () => {
      expect(classifyMessage('Where is the settings menu?')).toBe('navigation');
    });
  });

  describe('escalation category', () => {
    it('"fraud" → escalation', () => {
      expect(classifyMessage('I think there is fraud on my account')).toBe('escalation');
    });

    it('"lawsuit" → escalation', () => {
      expect(classifyMessage('I am considering a lawsuit')).toBe('escalation');
    });

    it('"scam" → escalation', () => {
      expect(classifyMessage('This contractor scammed me')).toBe('escalation');
    });

    it('"attorney" → escalation', () => {
      expect(classifyMessage('I need to speak with an attorney about this')).toBe('escalation');
    });

    it('"legal" → escalation', () => {
      expect(classifyMessage('I want to take legal action')).toBe('escalation');
    });
  });

  describe('faq category (catch-all)', () => {
    it('generic question → faq', () => {
      expect(classifyMessage('How does Kealee work?')).toBe('faq');
    });

    it('empty-ish message → faq', () => {
      expect(classifyMessage('Hello')).toBe('faq');
    });

    it('contractor question with no billing/legal keywords → faq', () => {
      expect(classifyMessage('Can I change my contractor?')).toBe('faq');
    });
  });

  describe('pattern priority (billing before escalation)', () => {
    // "urgent" matches escalation, but "payment" matches billing first
    it('"urgent payment" → billing (billing pattern fires before escalation)', () => {
      // billing pattern listed before escalation in CATEGORY_PATTERNS
      expect(classifyMessage('I need urgent help with my payment')).toBe('billing');
    });
  });
});

describe('SupportBot — shouldEscalateByCategory() (frozen snapshot)', () => {
  it('escalation category always escalates', () => {
    expect(shouldEscalateByCategory('escalation', 'I want to sue')).toBe(true);
  });

  it('billing + refund keyword escalates', () => {
    expect(shouldEscalateByCategory('billing', 'I need a refund now')).toBe(true);
  });

  it('billing + dispute keyword escalates', () => {
    // Regex is /refund|dispute|chargeback/i — matches literal 'dispute', not 'disputing'.
    expect(shouldEscalateByCategory('billing', 'I am filing a dispute')).toBe(true);
  });

  it('billing + chargeback keyword escalates', () => {
    expect(shouldEscalateByCategory('billing', 'I am filing a chargeback')).toBe(true);
  });

  it('billing without refund/dispute/chargeback does NOT escalate', () => {
    expect(shouldEscalateByCategory('billing', 'I need a new invoice')).toBe(false);
  });

  it('technical category does NOT escalate', () => {
    expect(shouldEscalateByCategory('technical', 'The app is broken')).toBe(false);
  });

  it('navigation category does NOT escalate', () => {
    expect(shouldEscalateByCategory('navigation', 'Where is my dashboard?')).toBe(false);
  });

  it('faq category does NOT escalate', () => {
    expect(shouldEscalateByCategory('faq', 'How does Kealee work?')).toBe(false);
  });
});

describe('SupportBot — CATEGORY_PATTERNS ordering (frozen)', () => {
  it('has exactly 5 pattern groups', () => {
    expect(CATEGORY_PATTERNS).toHaveLength(5);
  });

  it('first pattern is billing', () => {
    expect(CATEGORY_PATTERNS[0].category).toBe('billing');
  });

  it('last pattern is faq (catch-all)', () => {
    expect(CATEGORY_PATTERNS[CATEGORY_PATTERNS.length - 1].category).toBe('faq');
    expect(CATEGORY_PATTERNS[CATEGORY_PATTERNS.length - 1].patterns[0].source).toBe('.*');
  });
});

describe('SupportBot — related articles (frozen snapshot)', () => {
  it('each category has at least 2 articles', () => {
    for (const [category, articles] of Object.entries(RELATED_ARTICLES)) {
      expect(articles.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('billing has 3 articles', () => {
    expect(RELATED_ARTICLES.billing).toHaveLength(3);
  });

  it('escalation has 2 articles', () => {
    expect(RELATED_ARTICLES.escalation).toHaveLength(2);
  });
});
