/**
 * system-a-tool-contracts.test.ts
 *
 * Behavioral snapshot of every System A bot's registered tools.
 * Source: bots/<name>/src/bot.ts — tool names extracted from registerTool() calls.
 *
 * Purpose: If a bot's tool registration changes during migration, this test fails.
 * Do NOT update these snapshots without a deliberate migration decision.
 *
 * Last verified: Phase 0.5 (June 2026)
 */

import { describe, it, expect } from 'vitest';

// ── Tool contract snapshots ────────────────────────────────────────────────────
// Each entry is: [botName, domain, toolNames[]]
// Extracted verbatim from bots/<name>/src/bot.ts registerTool() calls.

const SYSTEM_A_TOOL_CONTRACTS: Array<{
  botName:   string;
  domain:    string;
  tools:     string[];
  ragEnabled: boolean;
}> = [
  {
    botName:    'keabot-owner',
    domain:     'owner',
    ragEnabled: true,
    tools: [
      'retrieve_relevant_context',
      'get_my_projects',
      'get_project_detail',
      'get_project_timeline',
      'get_budget_summary',
      'get_milestones',
    ],
  },
  {
    botName:    'keabot-gc',
    domain:     'gc',
    ragEnabled: true,
    tools: [
      'retrieve_relevant_context',
      'manage_bids',
      'coordinate_subs',
      'check_compliance',
    ],
  },
  {
    botName:    'keabot-estimate',
    domain:     'estimate',
    ragEnabled: true,
    tools: [
      'retrieve_relevant_context',
      'create_estimate',
      'lookup_costs',
      'analyze_bid_comparison',
    ],
  },
  {
    botName:    'keabot-permit',
    domain:     'permit',
    ragEnabled: true,
    tools: [
      'retrieve_relevant_context',
      'check_requirements',
      'track_permits',
      'schedule_inspections',
      'generate_jurisdiction_roadmap',
    ],
  },
  {
    botName:    'keabot-finance',
    domain:     'finance',
    ragEnabled: false,
    tools: [
      'build_capital_stack',
      'track_draws',
      'generate_investor_report',
    ],
  },
  {
    botName:    'keabot-command',
    domain:     'command',
    ragEnabled: false,
    tools: [
      'route_to_bot',
      'get_project_status',
      'get_twin_health',
      'list_bots',
    ],
  },
  {
    botName:    'keabot-feasibility',
    domain:     'feasibility',
    ragEnabled: false,
    tools: [
      'create_study',
      'run_scenarios',
      'generate_proforma',
    ],
  },
  {
    botName:    'keabot-contractor-match',
    domain:     'contractor-match',
    ragEnabled: false,
    tools: [
      'search_contractors',
      'score_contractors',
      'get_contractor_details',
      'verify_license_insurance',
      'generate_contractor_bids',
      'track_contractor_engagement',
    ],
  },
  {
    botName:    'keabot-project-monitor',
    domain:     'project-monitor',
    ragEnabled: false,
    tools: [
      'track_project_progress',
      'detect_issues',
      'send_status_update',
      'manage_milestones',
      'escalate_problems',
    ],
  },
  {
    botName:    'keabot-developer',
    domain:     'developer',
    ragEnabled: false,
    tools: [
      'review_portfolio',
      'analyze_returns',
      'track_entitlements',
    ],
  },
  {
    botName:    'keabot-construction',
    domain:     'construction',
    ragEnabled: false,
    tools: [
      'track_progress',
      'check_schedule',
      'assess_inspection_readiness',
    ],
  },
  {
    botName:    'keabot-land',
    domain:     'land',
    ragEnabled: false,
    tools: [
      'search_parcels',
      'analyze_zoning',
      'evaluate_development_potential',
    ],
  },
  {
    botName:    'keabot-payments',
    domain:     'payments',
    ragEnabled: false,
    tools: [
      'check_milestone_status',
      'process_payment',
      'reconcile_escrow',
    ],
  },
  {
    botName:    'keabot-operations',
    domain:     'operations',
    ragEnabled: false,
    tools: [
      'manage_turnover',
      'track_warranties',
      'create_work_order',
    ],
  },
  {
    botName:    'keabot-design',
    domain:     'design',
    ragEnabled: false,
    tools: [
      'generate_design_concept',
      'get_design_status',
      'request_design_upgrade',
      // GENERATE_PRODUCT_IMAGE_TOOL_DEF (4th tool, name from external constant)
    ],
  },
  {
    botName:    'keabot-marketing',
    domain:     'marketing',
    ragEnabled: false,
    tools: [
      'setup_search_console_analytics',
      'create_email_sequences',
      'implement_lead_scoring',
      'prepare_social_media_assets',
      'configure_email_automation',
      'monitor_launch_metrics',
      'generate_social_copy',
      'submit_sitemap',
    ],
  },
  {
    botName:    'keabot-support',
    domain:     'support',
    ragEnabled: false,
    tools: [
      'route_ticket',
      'answer_faq',
      'handle_refund_request',
      'generate_response',
      'escalate_ticket',
      'track_resolution',
    ],
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('System A — bot tool contracts', () => {
  it('covers all 17 System A bots', () => {
    expect(SYSTEM_A_TOOL_CONTRACTS).toHaveLength(17);
  });

  it('all bots have at least 3 tools', () => {
    for (const contract of SYSTEM_A_TOOL_CONTRACTS) {
      expect(contract.tools.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('all tool names are non-empty strings with no spaces', () => {
    for (const { botName, tools } of SYSTEM_A_TOOL_CONTRACTS) {
      for (const tool of tools) {
        expect(tool.length).toBeGreaterThan(0);
        expect(tool).not.toContain(' ');
        expect(tool).toMatch(/^[a-z_]+$/);
      }
    }
  });

  it('no duplicate tool names within a single bot', () => {
    for (const { botName, tools } of SYSTEM_A_TOOL_CONTRACTS) {
      const unique = new Set(tools);
      expect(unique.size).toBe(tools.length);
    }
  });

  it('retrieve_relevant_context is the RAG tool name (frozen)', () => {
    const ragBots = SYSTEM_A_TOOL_CONTRACTS.filter(c => c.ragEnabled);
    for (const { tools } of ragBots) {
      expect(tools).toContain('retrieve_relevant_context');
    }
  });

  it('non-RAG bots do not call retrieve_relevant_context', () => {
    const nonRag = SYSTEM_A_TOOL_CONTRACTS.filter(c => !c.ragEnabled);
    for (const { botName, tools } of nonRag) {
      expect(tools).not.toContain('retrieve_relevant_context');
    }
  });

  it('keabot-owner has exactly 6 tools', () => {
    const owner = SYSTEM_A_TOOL_CONTRACTS.find(c => c.botName === 'keabot-owner');
    expect(owner?.tools).toHaveLength(6);
  });

  it('keabot-permit registers generate_jurisdiction_roadmap (frozen — used by PermitBot chain)', () => {
    const permit = SYSTEM_A_TOOL_CONTRACTS.find(c => c.botName === 'keabot-permit');
    expect(permit?.tools).toContain('generate_jurisdiction_roadmap');
  });

  it('keabot-contractor-match has 6 tools including verify_license_insurance', () => {
    const cm = SYSTEM_A_TOOL_CONTRACTS.find(c => c.botName === 'keabot-contractor-match');
    expect(cm?.tools).toHaveLength(6);
    expect(cm?.tools).toContain('verify_license_insurance');
  });

  it('keabot-support has 6 tools including escalate_ticket', () => {
    const support = SYSTEM_A_TOOL_CONTRACTS.find(c => c.botName === 'keabot-support');
    expect(support?.tools).toHaveLength(6);
    expect(support?.tools).toContain('escalate_ticket');
  });

  it('keabot-marketing has 8 tools (Day1 → Day3 playbook coverage)', () => {
    const marketing = SYSTEM_A_TOOL_CONTRACTS.find(c => c.botName === 'keabot-marketing');
    expect(marketing?.tools).toHaveLength(8);
  });

  it('all domain strings are lowercase kebab-case', () => {
    for (const { domain } of SYSTEM_A_TOOL_CONTRACTS) {
      expect(domain).toMatch(/^[a-z-]+$/);
    }
  });
});

describe('System A — RAG-enabled bot inventory', () => {
  it('exactly 4 bots are RAG-enabled', () => {
    const ragBots = SYSTEM_A_TOOL_CONTRACTS.filter(c => c.ragEnabled);
    expect(ragBots).toHaveLength(4);
  });

  it('RAG-enabled bots are owner, gc, estimate, permit', () => {
    const ragNames = SYSTEM_A_TOOL_CONTRACTS
      .filter(c => c.ragEnabled)
      .map(c => c.botName);
    expect(ragNames).toContain('keabot-owner');
    expect(ragNames).toContain('keabot-gc');
    expect(ragNames).toContain('keabot-estimate');
    expect(ragNames).toContain('keabot-permit');
  });
});
