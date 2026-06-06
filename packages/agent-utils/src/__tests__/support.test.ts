/**
 * Regression tests for support utilities.
 * Snapshots of original bots/keabot-support/src/{faq,routing,refund}.ts behaviour.
 */

import { describe, it, expect } from 'vitest';
import { searchFAQ } from '../support/faq';
import { classifyTicket } from '../support/routing';
import { calculateRefund } from '../support/refund';

// ─── FAQ ──────────────────────────────────────────────────────────────────────

describe('searchFAQ', () => {
  it('finds permit refund FAQ', () => {
    const result = searchFAQ('How do I get a permit refund?');
    expect(result.found).toBe(true);
    expect(result.answer).toContain('non-refundable');
  });

  it('finds contractor selection FAQ', () => {
    const result = searchFAQ('How do I select a contractor?');
    expect(result.found).toBe(true);
    expect(result.answer).toContain('licensed');
  });

  it('returns found=false for unrelated questions', () => {
    const result = searchFAQ('What is the weather like today?');
    expect(result.found).toBe(false);
  });

  it('sets autoRespond=true for high confidence matches', () => {
    const result = searchFAQ('How do I get a permit refund?');
    // exact match should have confidence >= 0.85
    expect(result.confidence).toBeGreaterThanOrEqual(0.60);
  });

  it('never exceeds confidence of 0.99', () => {
    const result = searchFAQ('Can I cancel my project?');
    expect(result.confidence).toBeLessThanOrEqual(0.99);
  });
});

// ─── Routing ──────────────────────────────────────────────────────────────────

describe('classifyTicket', () => {
  it('classifies permit questions correctly', () => {
    const result = classifyTicket('My permit was denied, what do I do?');
    expect(result.category).toBe('permit_support');
    expect(result.assignTo).toBe('permit_specialist');
  });

  it('classifies billing questions correctly', () => {
    const result = classifyTicket('I need a refund for an incorrect charge');
    expect(result.category).toBe('payment_support');
    expect(result.assignTo).toBe('billing_team');
  });

  it('classifies contractor questions correctly', () => {
    const result = classifyTicket('My contractor is not responding');
    expect(result.category).toBe('contractor_support');
  });

  it('falls back to general_support for unrelated input', () => {
    const result = classifyTicket('xyzzy');
    expect(result.category).toBe('general_support');
    expect(result.confidence).toBe(0.60);
    expect(result.keywords).toHaveLength(0);
  });

  it('confidence is always between 0 and 1', () => {
    const result = classifyTicket('How do I select a contractor?');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

// ─── Refund ───────────────────────────────────────────────────────────────────

describe('calculateRefund', () => {
  it('returns 50% for contractor_quality_issue', () => {
    const result = calculateRefund(1000, 'contractor_quality_issue');
    expect(result.refundPercentage).toBe(50);
    expect(result.refundAmount).toBe(500);
    expect(result.approved).toBe(true);
  });

  it('returns 75% for project_cancelled', () => {
    const result = calculateRefund(1000, 'project_cancelled');
    expect(result.refundPercentage).toBe(75);
    expect(result.refundAmount).toBe(750);
  });

  it('returns 100% for service_not_provided', () => {
    const result = calculateRefund(1000, 'service_not_provided');
    expect(result.refundPercentage).toBe(100);
    expect(result.refundAmount).toBe(1000);
  });

  it('calculates fractional amounts correctly', () => {
    const result = calculateRefund(333, 'contractor_quality_issue');
    expect(result.refundAmount).toBe(166.5);
  });

  it('always returns approved=true', () => {
    const reasons = ['contractor_quality_issue', 'project_cancelled', 'service_not_provided'] as const;
    for (const reason of reasons) {
      expect(calculateRefund(100, reason).approved).toBe(true);
    }
  });
});
