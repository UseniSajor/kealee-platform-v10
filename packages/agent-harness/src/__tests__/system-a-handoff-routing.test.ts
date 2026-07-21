/**
 * system-a-handoff-routing.test.ts
 *
 * Behavioral snapshot of System A handoff (shouldHandoff) patterns.
 * Source: bots/<name>/src/bot.ts — shouldHandoff() method extracted verbatim.
 *
 * These tests verify that:
 *   1. Each routing rule fires on the correct keywords
 *   2. Each rule targets the correct destination bot
 *   3. Generic messages return null (no handoff)
 *
 * Last verified: Phase 0.5 (June 2026)
 */

import { describe, it, expect } from 'vitest';

// ── Replicated routing logic from keabot-owner/src/bot.ts ─────────────────────
// Source: shouldHandoff() method — verbatim regex patterns

function ownerHandoff(message: string): { toBot: string; reason: string } | null {
  const lower = message.toLowerCase();
  if (/\b(bid|subcontractor|crew|compliance)\b/.test(lower))
    return { toBot: 'keabot-gc', reason: 'GC operations topic detected' };
  if (/\b(payment|escrow|lien waiver|retainage)\b/.test(lower))
    return { toBot: 'keabot-payments', reason: 'Payments topic detected' };
  if (/\b(permit|inspection schedule|building department)\b/.test(lower))
    return { toBot: 'keabot-permit', reason: 'Permit topic detected' };
  if (/\b(estimate|takeoff|cost lookup|rsmeans)\b/.test(lower))
    return { toBot: 'keabot-estimate', reason: 'Estimation topic detected' };
  return null;
}

// ── Replicated routing logic from keabot-gc/src/bot.ts ────────────────────────

function gcHandoff(message: string): { toBot: string; reason: string } | null {
  const lower = message.toLowerCase();
  if (/\b(daily log|progress track|inspection readiness|weather impact)\b/.test(lower))
    return { toBot: 'keabot-construction', reason: 'Construction execution topic detected' };
  if (/\b(payment|escrow|lien waiver|draw request)\b/.test(lower))
    return { toBot: 'keabot-payments', reason: 'Payments topic detected' };
  if (/\b(estimate|takeoff|rsmeans|cost lookup)\b/.test(lower))
    return { toBot: 'keabot-estimate', reason: 'Estimation topic detected' };
  if (/\b(find contractor|marketplace|match skills)\b/.test(lower))
    return { toBot: 'keabot-marketplace', reason: 'Marketplace topic detected' };
  return null;
}

// ── Replicated routing logic from keabot-command/src/bot.ts ──────────────────
// keabot-command uses COMMAND_DOMAIN_KEYWORDS — replicated from agent-prompts
// Source: packages/agent-prompts/src/command.ts
import { COMMAND_DOMAIN_KEYWORDS } from '@kealee/agent-prompts';

function commandHandoff(message: string): { toBot: string } | null {
  const lower = message.toLowerCase();
  for (const [domain, pattern] of Object.entries(COMMAND_DOMAIN_KEYWORDS)) {
    if (new RegExp(pattern, 'i').test(lower)) {
      return { toBot: `keabot-${domain}` };
    }
  }
  return null;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('keabot-owner — shouldHandoff patterns', () => {
  it('routes "bid" to keabot-gc', () => {
    const result = ownerHandoff('I need to review the bid from the GC');
    expect(result?.toBot).toBe('keabot-gc');
  });

  it('routes "subcontractor" to keabot-gc', () => {
    const result = ownerHandoff('How do I manage the subcontractor for plumbing?');
    expect(result?.toBot).toBe('keabot-gc');
  });

  it('routes "compliance" to keabot-gc', () => {
    const result = ownerHandoff('What compliance checks are needed on site?');
    expect(result?.toBot).toBe('keabot-gc');
  });

  it('routes "payment" to keabot-payments', () => {
    const result = ownerHandoff('When is my next payment due?');
    expect(result?.toBot).toBe('keabot-payments');
  });

  it('routes "escrow" to keabot-payments', () => {
    const result = ownerHandoff('How does the escrow release work?');
    expect(result?.toBot).toBe('keabot-payments');
  });

  it('routes "lien waiver" to keabot-payments', () => {
    const result = ownerHandoff('I need to get a lien waiver signed');
    expect(result?.toBot).toBe('keabot-payments');
  });

  it('routes "permit" to keabot-permit', () => {
    const result = ownerHandoff('My permit got denied, what do I do?');
    expect(result?.toBot).toBe('keabot-permit');
  });

  it('routes "building department" to keabot-permit', () => {
    const result = ownerHandoff('The building department needs more documents');
    expect(result?.toBot).toBe('keabot-permit');
  });

  it('routes "estimate" to keabot-estimate', () => {
    const result = ownerHandoff('I need an estimate for the kitchen addition');
    expect(result?.toBot).toBe('keabot-estimate');
  });

  it('routes "rsmeans" to keabot-estimate', () => {
    const result = ownerHandoff('What are RSMeans prices for framing in DC?');
    expect(result?.toBot).toBe('keabot-estimate');
  });

  it('returns null for project status question (owner handles this)', () => {
    const result = ownerHandoff('What is the current status of my project?');
    expect(result).toBeNull();
  });

  it('returns null for generic greeting', () => {
    const result = ownerHandoff('Hello, how are you?');
    expect(result).toBeNull();
  });

  it('is case-insensitive', () => {
    const result = ownerHandoff('I need to discuss PAYMENT terms');
    expect(result?.toBot).toBe('keabot-payments');
  });
});

describe('keabot-gc — shouldHandoff patterns', () => {
  it('routes "daily log" to keabot-construction', () => {
    const result = gcHandoff('Can you help me with the daily log?');
    expect(result?.toBot).toBe('keabot-construction');
  });

  it('routes "progress track" to keabot-construction', () => {
    // NOTE: "progress tracking" does NOT match — "tracking" has no word boundary after "track".
    // The exact two-word phrase "progress track" (with trailing boundary) must appear.
    const result = gcHandoff('I need to update the progress track document');
    expect(result?.toBot).toBe('keabot-construction');
  });

  it('routes "draw request" to keabot-payments', () => {
    const result = gcHandoff('I need to submit a draw request this week');
    expect(result?.toBot).toBe('keabot-payments');
  });

  it('routes "find contractor" to keabot-marketplace', () => {
    const result = gcHandoff('Can you help me find contractor for electrical?');
    expect(result?.toBot).toBe('keabot-marketplace');
  });

  it('routes "rsmeans" to keabot-estimate', () => {
    const result = gcHandoff('What are RSMeans rates for MEP?');
    expect(result?.toBot).toBe('keabot-estimate');
  });

  it('returns null for bid management (GC handles this)', () => {
    const result = gcHandoff('Show me all my open bids');
    expect(result).toBeNull();
  });
});

describe('keabot-command — COMMAND_DOMAIN_KEYWORDS routing', () => {
  it('routes permit-related messages to permit domain', () => {
    const result = commandHandoff('I need to file my building permit');
    expect(result?.toBot).toBe('keabot-permit');
  });

  it('routes estimate-related messages to estimate domain', () => {
    const result = commandHandoff('Can I get an estimate for my renovation?');
    expect(result?.toBot).toBe('keabot-estimate');
  });

  it('routes payment messages to payments domain', () => {
    const result = commandHandoff('How does the escrow payment release work?');
    expect(result?.toBot).toBe('keabot-payments');
  });

  it('routes contractor-related messages to marketplace domain', () => {
    // NOTE: COMMAND_DOMAIN_KEYWORDS has no 'contractor-match' key — it uses 'marketplace'.
    // The marketplace pattern is: \b(find contractor|match|marketplace|hiring|trade)\b
    // "Help me find a contractor" fails because "help" fires the 'support' pattern first.
    // Using "find contractor" without a leading "help" avoids the earlier match.
    const result = commandHandoff('I want to find contractor for the electrical work');
    expect(result?.toBot).toBe('keabot-marketplace');
  });

  it('routes finance-related messages', () => {
    const result = commandHandoff('I need help with my capital stack and loan');
    expect(result?.toBot).toMatch(/finance|feasibility/);
  });

  it('COMMAND_DOMAIN_KEYWORDS covers at least 12 domains', () => {
    expect(Object.keys(COMMAND_DOMAIN_KEYWORDS).length).toBeGreaterThanOrEqual(12);
  });
});

describe('Handoff routing — cross-system invariants', () => {
  it('owner and GC both route estimate keywords to keabot-estimate', () => {
    const ownerResult = ownerHandoff('I need an estimate for this project');
    const gcResult    = gcHandoff('I need an estimate for this project');
    expect(ownerResult?.toBot).toBe('keabot-estimate');
    expect(gcResult?.toBot).toBe('keabot-estimate');
  });

  it('owner and GC both route payment keywords to keabot-payments', () => {
    const ownerResult = ownerHandoff('The payment is due tomorrow');
    const gcResult    = gcHandoff('The payment is due tomorrow');
    expect(ownerResult?.toBot).toBe('keabot-payments');
    expect(gcResult?.toBot).toBe('keabot-payments');
  });
});
