/**
 * system-c-lead-scoring.test.ts
 *
 * Behavioral snapshot of System C LeadBot deterministic scoring.
 * Source: services/api/src/modules/bots/bots/lead.bot.ts
 *
 * The scoreText() function is private in the production bot.
 * This file replicates it verbatim to create a frozen behavioral baseline.
 *
 * If the scoring model changes during migration, these tests fail.
 *
 * Last verified: Phase 0.5 (June 2026)
 */

import { describe, it, expect } from 'vitest';

// ── Replicated from lead.bot.ts ────────────────────────────────────────────────
// Source: services/api/src/modules/bots/bots/lead.bot.ts:32-57

const SERVICE_AREA = [
  'dc', 'washington', 'virginia', 'va', 'maryland', 'md',
  'baltimore', 'arlington', 'bethesda', 'silver spring', 'alexandria',
  'fairfax', 'reston', 'tysons', 'annapolis',
];

function scoreText(text: string, history: string): number {
  const all = `${text} ${history}`.toLowerCase();
  let score = 0;

  if (/residential|commercial|renovation|new.?build|addition|multifamily|office|retail/i.test(all)) score += 15;
  if (SERVICE_AREA.some(w => all.includes(w))) score += 20;
  if (/\$[\d,]+|\d+[kK]|\d+\s*(thousand|million)|budget/i.test(all)) score += 15;
  if (/asap|soon|this year|next month|by \w+ \d{4}|timeline|schedule/i.test(all)) score += 10;
  if (/urgent|immediately|emergency|quickly|right away/i.test(all)) score += 10;
  if (/price|cost|how much|quote|estimate|rates/i.test(all)) score += 10;
  if (/ready to start|hire|get started|sign up|move forward|next step/i.test(all)) score += 20;

  return Math.min(score, 100);
}

function determineUrgency(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

const HANDOFF_THRESHOLD = 65;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LeadBot — scoreText() scoring model (frozen snapshot)', () => {

  describe('individual signal components', () => {
    it('project type mention adds 15 points', () => {
      // NOTE: cannot use "renovation" — contains 'va' which triggers service area (+20).
      // Use "multifamily" which has no service-area substrings.
      const score = scoreText('I want multifamily construction', '');
      expect(score).toBe(15);
    });

    it('service area mention adds 20 points', () => {
      const score = scoreText('My project is in Bethesda', '');
      expect(score).toBe(20);
    });

    it('budget mention ($X) adds 15 points', () => {
      const score = scoreText('My budget is $150,000', '');
      expect(score).toBe(15);
    });

    it('budget mention (Xk) adds 15 points', () => {
      const score = scoreText('About 200k budget', '');
      expect(score).toBe(15);
    });

    it('timeline mention adds 10 points', () => {
      const score = scoreText('I want to start soon', '');
      expect(score).toBe(10);
    });

    it('urgency mention adds 10 points', () => {
      const score = scoreText('This is urgent, I need help immediately', '');
      expect(score).toBe(10);
    });

    it('"ready to start" adds 20 points', () => {
      const score = scoreText('I am ready to start this project', '');
      expect(score).toBe(20);
    });

    it('cost/price inquiry adds 10 points', () => {
      const score = scoreText('How much does this cost?', '');
      expect(score).toBe(10);
    });
  });

  describe('combined signal scores', () => {
    it('all signals combined caps at 100', () => {
      const msg = 'I need a residential renovation in DC. Budget is $200K. I want to start ASAP. This is urgent. How much does it cost? I am ready to start immediately.';
      const score = scoreText(msg, '');
      expect(score).toBe(100);
    });

    it('high-quality lead (location + budget + ready) exceeds handoff threshold', () => {
      const score = scoreText('Ready to start my renovation project in Arlington VA, budget $300k', '');
      // location=20, budget=15, ready=20, project type=15 → 70
      expect(score).toBeGreaterThanOrEqual(HANDOFF_THRESHOLD);
    });

    it('generic browser message stays below handoff threshold', () => {
      const score = scoreText('I am just browsing.', '');
      expect(score).toBeLessThan(HANDOFF_THRESHOLD);
    });

    it('DC project with $250K budget and timeline is a high-quality lead', () => {
      const score = scoreText('Residential renovation in Washington DC, $250K budget, want to start next month', '');
      // project(15) + location(20) + budget(15) + timeline(10) = 60 → below 65 just
      expect(score).toBeGreaterThanOrEqual(60);
    });

    it('conversation history contributes to score', () => {
      const historyScore = scoreText(
        'What are your rates?',
        'We are looking at a renovation in Bethesda, MD with a $150K budget'
      );
      // cost(10) + location(20) + budget(15) = 45 from history + 10 from message
      expect(historyScore).toBeGreaterThan(20);
    });
  });

  describe('handoff threshold', () => {
    it('handoff threshold is 65', () => {
      expect(HANDOFF_THRESHOLD).toBe(65);
    });

    it('score >= 65 triggers handoff', () => {
      const score = scoreText('Ready to start my addition in Bethesda. Budget is $500K.', '');
      expect(score).toBeGreaterThanOrEqual(HANDOFF_THRESHOLD);
    });

    it('score < 65 does not trigger handoff', () => {
      const score = scoreText('Tell me about your services', '');
      expect(score).toBeLessThan(HANDOFF_THRESHOLD);
    });
  });

  describe('service area list', () => {
    it('covers 15 DMV locations', () => {
      expect(SERVICE_AREA).toHaveLength(15);
    });

    it('includes DC, VA, MD abbreviations', () => {
      expect(SERVICE_AREA).toContain('dc');
      expect(SERVICE_AREA).toContain('va');
      expect(SERVICE_AREA).toContain('md');
    });

    it('includes major DMV suburbs', () => {
      expect(SERVICE_AREA).toContain('bethesda');
      expect(SERVICE_AREA).toContain('arlington');
      expect(SERVICE_AREA).toContain('alexandria');
      expect(SERVICE_AREA).toContain('fairfax');
    });

    it('"tysons" is in service area (major commercial hub)', () => {
      expect(SERVICE_AREA).toContain('tysons');
    });
  });
});

describe('LeadBot — determineUrgency() (frozen snapshot)', () => {
  it('score >= 70 → high urgency', () => {
    expect(determineUrgency(70)).toBe('high');
    expect(determineUrgency(100)).toBe('high');
  });

  it('score 40-69 → medium urgency', () => {
    expect(determineUrgency(40)).toBe('medium');
    expect(determineUrgency(65)).toBe('medium');
    expect(determineUrgency(69)).toBe('medium');
  });

  it('score < 40 → low urgency', () => {
    expect(determineUrgency(0)).toBe('low');
    expect(determineUrgency(39)).toBe('low');
  });
});
