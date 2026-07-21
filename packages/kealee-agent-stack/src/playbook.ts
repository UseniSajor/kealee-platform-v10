import type { AgentRunStep, ReadinessArea, ReadinessFinding } from './types'

export interface ReadinessPlaybookAgent {
  name: string
  area: ReadinessArea
  goal: string
  checklist: string[]
}

export const READINESS_PLAYBOOK: ReadinessPlaybookAgent[] = [
  {
    name: 'Build/Types QA',
    area: 'build-types',
    goal: 'Verify install health, TypeScript, builds, imports, and launch-blocking tests.',
    checklist: [
      'Confirm ambient type packages resolve from the workspace root.',
      'Run web-main TypeScript and build checks.',
      'Flag broken imports, generated types drift, and package-manager inconsistencies.',
    ],
  },
  {
    name: 'Website Funnel QA',
    area: 'website-funnel',
    goal: 'Verify public sales pages and concept intake can move a user toward checkout.',
    checklist: [
      'Smoke home to concept selection to details/contact/confirm.',
      'Check desktop and mobile render health for CTA visibility and form usability.',
      'Flag checkout handoff, lead capture, and broken route blockers.',
    ],
  },
  {
    name: 'Sales Copy QA',
    area: 'sales-copy',
    goal: 'Audit sales clarity, pricing consistency, ICP fit, and objections.',
    checklist: [
      'Check hero promise, package names, price claims, delivery times, and next-step copy.',
      'Flag inconsistent markets, conflicting offers, or weak buyer proof.',
      'Recommend copy changes tied to conversion acceptance criteria.',
    ],
  },
  {
    name: 'Trust/Compliance QA',
    area: 'trust-compliance',
    goal: 'Find trust, privacy, payment, permit, and construction-disclaimer gaps.',
    checklist: [
      'Check trust signals, terms/privacy paths, claims, and refund/payment language.',
      'Flag legal/compliance risks that should block launch.',
      'Verify customer responsibility and human handoff expectations are visible.',
    ],
  },
  {
    name: 'Agent Ops QA',
    area: 'agent-ops',
    goal: 'Validate KeaBot inventory, orchestration contracts, logging, cost controls, and handoffs.',
    checklist: [
      'Inventory old and new KeaBot registries.',
      'Verify cost/rate-limit guardrails and traceability for internal runs.',
      'Flag missing contracts between Hermes, Orgo, Obsidian, and KeaBot execution.',
    ],
  },
]

export function createPlaybookSteps(): AgentRunStep[] {
  return READINESS_PLAYBOOK.map(agent => ({
    agent: agent.name,
    area: agent.area,
    status: 'planned',
    summary: agent.goal,
  }))
}

export function createBaselineFindings(args: {
  ambientTypesFixed: boolean
  keabotCount: number
  mode: 'dry-run' | 'live'
}): ReadinessFinding[] {
  const findings: ReadinessFinding[] = []

  if (!args.ambientTypesFixed) {
    findings.push({
      id: 'build-types-ambient-packages',
      area: 'build-types',
      severity: 'blocker',
      title: 'Ambient type packages are incomplete at the workspace root',
      evidence: 'TypeScript previously failed with TS2688 for request, serve-static, and three.',
      recommendation: 'Install and verify the root @types packages, then rerun web-main TypeScript.',
      owner: 'Platform Engineering',
      acceptanceCriteria: 'pnpm exec tsc --noEmit -p apps/web-main/tsconfig.json completes without TS2688.',
    })
  }

  if (args.keabotCount === 0) {
    findings.push({
      id: 'agent-ops-keabot-registry-empty',
      area: 'agent-ops',
      severity: 'high',
      title: 'No KeaBots were discovered for orchestration',
      evidence: 'KeaBotBridge returned zero descriptors.',
      recommendation: 'Wire services/keabots registry or services/api botRegistry into Agent Ops.',
      owner: 'Agent Platform',
      acceptanceCriteria: 'GET /agent-ops/readiness/latest includes at least the registered KeaBot inventory.',
    })
  }

  if (args.mode === 'dry-run') {
    findings.push({
      id: 'agent-ops-provider-env-missing',
      area: 'agent-ops',
      severity: 'medium',
      title: 'Readiness audit ran in dry-run mode',
      evidence: 'Hermes and Orgo provider URLs were not used for this run.',
      recommendation: 'Set HERMES_API_URL and ORGO_API_URL for live orchestration and browser/desktop audit execution.',
      owner: 'Agent Platform',
      acceptanceCriteria: 'A live readiness run records provider-backed Hermes and Orgo steps.',
    })
  }

  return findings
}
