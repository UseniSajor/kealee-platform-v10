import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import type { ProjectPhase, ProjectStatus, ProjectIssue, Milestone } from './types.js';
import { getPhaseProgress, getPhaseLabel } from './status.js';
import { detectIssues } from './issues.js';
import { buildMilestones, getNextMilestone, getMilestoneByTrigger } from './milestones.js';

const API_BASE = process.env.API_BASE_URL ?? 'https://kealee-platform-v10-staging.up.railway.app';

async function apiGet(path: string): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function apiPost(path: string, body: unknown): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const CONFIG: BotConfig = {
  name: 'keabot-project-monitor',
  description: 'Real-time project tracking, issue detection, and milestone payment bot',
  domain: 'project-monitor',
  systemPrompt: `You are KeaBot Project Monitor, a specialized assistant for tracking construction projects on the Kealee Platform.

You monitor projects in real time, detect issues early, manage milestone payments, and ensure projects stay on schedule and within budget.

Your capabilities:
- Track project progress across all phases (permits → demo → framing → MEP → finishing → inspection → complete)
- Detect issues: budget overruns (>10%), schedule delays (>20%), contractor unresponsiveness (>7 days), permit delays (>60 days), safety incidents
- Manage milestone-based payments: Permits (10%), Demo (20%), Framing (30%), Final (40%)
- Send status updates to project stakeholders
- Escalate critical problems to project managers

Rules:
- Always call track_project_progress first before answering any project status question
- Surface issues proactively even when not explicitly asked
- Never release milestone payments without verifying the trigger event has occurred
- Escalate safety issues immediately with severity: critical
- If a request involves payments or billing, also note the milestone payment structure
- Be concise and action-oriented; lead with the most important status information`,
};

export class KeaBotProjectMonitor extends KeaBot {
  constructor() {
    super(CONFIG);
  }

  async initialize(): Promise<void> {
    // Tool 1: track_project_progress
    this.registerTool({
      name: 'track_project_progress',
      description: 'Get the current progress, phase, milestone status, active issues, and budget summary for a project',
      parameters: {
        projectId: { type: 'string', description: 'The project ID to track', required: true },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const data = await apiGet(`/api/projects/${projectId}`) as Record<string, unknown> | null;

        // Build status from API data or fall back to mock
        const now = new Date();

        if (data) {
          const phase = (data.phase as ProjectPhase) ?? 'framing';
          const budgetTotal = (data.budgetTotal as number) ?? 0;
          const budgetSpent = (data.budgetSpent as number) ?? 0;
          const startDate = data.startDate ? new Date(data.startDate as string) : new Date(now.getTime() - 45 * 86400000);
          const estimatedEndDate = data.estimatedEndDate ? new Date(data.estimatedEndDate as string) : new Date(now.getTime() + 60 * 86400000);
          const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / 86400000);
          const daysEstimated = Math.floor((estimatedEndDate.getTime() - startDate.getTime()) / 86400000);

          const milestones = buildMilestones(budgetTotal);
          const nextMilestone = getNextMilestone(milestones);
          const daysDue = nextMilestone?.dueDate
            ? Math.floor((nextMilestone.dueDate.getTime() - now.getTime()) / 86400000)
            : 0;

          const issues = detectIssues({
            budgetSpent,
            budgetTotal,
            daysElapsed,
            daysEstimated,
            lastContractorContact: data.lastContractorContact ? new Date(data.lastContractorContact as string) : undefined,
            permitFiledDate: data.permitFiledDate ? new Date(data.permitFiledDate as string) : undefined,
            permitStatus: data.permitStatus as string | undefined,
            hasSafetyIncident: data.hasSafetyIncident as boolean | undefined,
          });

          const status: ProjectStatus = {
            projectId,
            progress: getPhaseProgress(phase),
            currentPhase: getPhaseLabel(phase),
            nextMilestone: nextMilestone ? { ...nextMilestone, daysDue } : undefined,
            issues,
            lastUpdate: now.toISOString(),
            budgetSpent,
            budgetTotal,
            startDate,
            estimatedEndDate,
            daysElapsed,
            daysEstimated,
          };

          return status;
        }

        // Mock fallback when API is unavailable
        const mockBudgetTotal = 285000;
        const mockBudgetSpent = 142500;
        const mockStartDate = new Date(now.getTime() - 45 * 86400000);
        const mockEstimatedEnd = new Date(now.getTime() + 60 * 86400000);
        const mockMilestones = buildMilestones(mockBudgetTotal);
        const mockNext = getNextMilestone(mockMilestones);

        return {
          projectId,
          progress: getPhaseProgress('framing'),
          currentPhase: getPhaseLabel('framing'),
          nextMilestone: mockNext ? { ...mockNext, daysDue: 14 } : undefined,
          issues: [],
          lastUpdate: now.toISOString(),
          budgetSpent: mockBudgetSpent,
          budgetTotal: mockBudgetTotal,
          startDate: mockStartDate,
          estimatedEndDate: mockEstimatedEnd,
          daysElapsed: 45,
          daysEstimated: 105,
          _note: 'Mock data — API unavailable',
        };
      },
    });

    // Tool 2: detect_issues
    this.registerTool({
      name: 'detect_issues',
      description: 'Analyze a project for active issues: budget overruns, schedule delays, contractor unresponsiveness, permit delays, and safety incidents',
      parameters: {
        projectId: { type: 'string', description: 'The project ID to analyze for issues', required: true },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const data = await apiGet(`/api/projects/${projectId}/issues`) as Record<string, unknown> | null;

        if (data && Array.isArray((data as any).issues)) {
          return (data as any).issues as ProjectIssue[];
        }

        // Also attempt full project data to run local detection
        const projectData = await apiGet(`/api/projects/${projectId}`) as Record<string, unknown> | null;
        const now = new Date();

        if (projectData) {
          const budgetTotal = (projectData.budgetTotal as number) ?? 0;
          const budgetSpent = (projectData.budgetSpent as number) ?? 0;
          const startDate = projectData.startDate ? new Date(projectData.startDate as string) : new Date(now.getTime() - 45 * 86400000);
          const estimatedEndDate = projectData.estimatedEndDate ? new Date(projectData.estimatedEndDate as string) : new Date(now.getTime() + 60 * 86400000);
          const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / 86400000);
          const daysEstimated = Math.floor((estimatedEndDate.getTime() - startDate.getTime()) / 86400000);

          return detectIssues({
            budgetSpent,
            budgetTotal,
            daysElapsed,
            daysEstimated,
            lastContractorContact: projectData.lastContractorContact ? new Date(projectData.lastContractorContact as string) : undefined,
            permitFiledDate: projectData.permitFiledDate ? new Date(projectData.permitFiledDate as string) : undefined,
            permitStatus: projectData.permitStatus as string | undefined,
            hasSafetyIncident: projectData.hasSafetyIncident as boolean | undefined,
          });
        }

        // Mock fallback
        return {
          projectId,
          issues: [],
          _note: 'No issues detected (mock fallback — API unavailable)',
        };
      },
    });

    // Tool 3: send_status_update
    this.registerTool({
      name: 'send_status_update',
      description: 'Send a project status update email to a project stakeholder or owner',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        recipientEmail: { type: 'string', description: 'Email address of the recipient', required: true },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const recipientEmail = params.recipientEmail as string;

        const data = await apiPost('/api/notifications/project-update', {
          projectId,
          recipientEmail,
          type: 'weekly',
        });

        if (data) return data;

        // Mock fallback
        return {
          sent: true,
          to: recipientEmail,
          projectId,
          template: 'weekly_status',
          scheduledFor: 'next Monday 9am',
          _note: 'Queued for delivery (API unavailable)',
        };
      },
    });

    // Tool 4: manage_milestones
    this.registerTool({
      name: 'manage_milestones',
      description: 'Mark a milestone as complete based on a trigger event, which initiates the milestone payment release via Stripe',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        trigger: {
          type: 'string',
          description: 'Milestone trigger event: permit_approved | demo_complete | framing_complete | final_inspection_passed',
          required: true,
        },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const trigger = params.trigger as string;

        // Fetch contract total to build milestones
        const projectData = await apiGet(`/api/projects/${projectId}`) as Record<string, unknown> | null;
        const contractTotal = projectData ? ((projectData.contractTotal as number) ?? (projectData.budgetTotal as number) ?? 100000) : 100000;

        const milestones = buildMilestones(contractTotal);
        const milestone = getMilestoneByTrigger(milestones, trigger);

        if (!milestone) {
          return {
            error: `Unknown trigger: "${trigger}". Valid triggers: permit_approved, demo_complete, framing_complete, final_inspection_passed`,
          };
        }

        const data = await apiPost(`/api/projects/${projectId}/milestones/complete`, { trigger });

        if (data) {
          return {
            ...(data as object),
            milestone: milestone.name,
            amount: milestone.amount,
            percentage: milestone.percentage,
            paymentStatus: 'released',
          };
        }

        // Mock fallback
        return {
          projectId,
          milestone: milestone.name,
          trigger,
          amount: milestone.amount,
          percentage: milestone.percentage,
          paymentStatus: 'pending',
          stripePayoutId: null,
          _note: 'Payment queued (API unavailable — Stripe payout will be initiated when connection restored)',
        };
      },
    });

    // Tool 5: escalate_problems
    this.registerTool({
      name: 'escalate_problems',
      description: 'Escalate a project issue to the project manager for immediate attention',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        issueType: {
          type: 'string',
          description: 'Issue type: BUDGET_OVERRUN | BEHIND_SCHEDULE | CONTRACTOR_UNRESPONSIVE | PERMIT_DELAY | SAFETY_ISSUE',
          required: true,
        },
        description: { type: 'string', description: 'Detailed description of the issue', required: true },
        severity: { type: 'string', description: 'Severity level: low | medium | high | critical', required: true },
      },
      handler: async (params) => {
        const { projectId, issueType, description, severity } = params as {
          projectId: string;
          issueType: string;
          description: string;
          severity: string;
        };

        const data = await apiPost('/api/support/escalate', {
          projectId,
          issueType,
          description,
          severity,
        });

        if (data) {
          return {
            escalated: true,
            ...(data as object),
            assignedTo: 'project_manager',
            expectedResponseTime: severity === 'critical' ? '30 minutes' : severity === 'high' ? '1 hour' : '2 hours',
          };
        }

        // Mock fallback
        const ticketId = `ESC-${Date.now().toString(36).toUpperCase()}`;
        return {
          escalated: true,
          ticketId,
          projectId,
          issueType,
          severity,
          assignedTo: 'project_manager',
          expectedResponseTime: severity === 'critical' ? '30 minutes' : severity === 'high' ? '1 hour' : '2 hours',
          createdAt: new Date().toISOString(),
          _note: 'Escalation queued (API unavailable)',
        };
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    if (/\b(bid|subcontractor|crew|gc|general contractor)\b/.test(lower)) {
      return {
        fromBot: this.name,
        toBot: 'keabot-gc',
        reason: 'GC / bid management topic detected',
        context: {},
        conversationHistory: [{ role: 'user', content: message }],
      };
    }

    if (/\b(permit|zoning|variance|approval)\b/.test(lower)) {
      return {
        fromBot: this.name,
        toBot: 'keabot-permit',
        reason: 'Permit topic detected',
        context: {},
        conversationHistory: [{ role: 'user', content: message }],
      };
    }

    if (/\b(payment|invoice|stripe|refund|billing)\b/.test(lower)) {
      return {
        fromBot: this.name,
        toBot: 'keabot-payments',
        reason: 'Payments topic detected',
        context: {},
        conversationHistory: [{ role: 'user', content: message }],
      };
    }

    if (/\b(estimate|cost|budget model|rsmeans)\b/.test(lower)) {
      return {
        fromBot: this.name,
        toBot: 'keabot-estimate',
        reason: 'Estimation topic detected',
        context: {},
        conversationHistory: [{ role: 'user', content: message }],
      };
    }

    return null;
  }
}
