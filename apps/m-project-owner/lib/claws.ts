/**
 * CLAW Client — Frontend integration for the 8-Claw agent system.
 *
 * All processes trigger CLAWs behind the scenes from the start.
 * The user sees 1-click simplicity while CLAWs handle orchestration.
 *
 * Architecture:
 *   Frontend (this) → CLAW Gateway (port 3002) → Event Bus → Claw Agents
 *
 * Claw A: Acquisition & PreCon — estimates, bids, contractor matching
 * Claw B: Contract & Commercials — contracts, change orders, payments
 * Claw C: Schedule & Field Ops — scheduling, site visits, weather
 * Claw D: Budget & Cost Control — budgets, variance, forecasting
 * Claw E: Permits & Compliance — permits, inspections, QA
 * Claw F: Docs & Communication — documents, messaging, notifications
 * Claw G: Risk & Predictions — risk assessment, decision support
 * Claw H: Command Center — orchestration, automation, dashboards
 */

import { getAuthToken } from './supabase'

const CLAWS_URL = process.env.NEXT_PUBLIC_CLAWS_URL || 'http://localhost:3002'

// ---------------------------------------------------------------------------
// Core fetch helper — talks to CLAW Gateway
// ---------------------------------------------------------------------------

async function clawFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken()
  const res = await fetch(`${CLAWS_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `CLAW request failed (${res.status})`)
  }

  return res.json()
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClawStatus {
  name: string
  id: string
  status: 'online' | 'offline' | 'degraded'
  lastEvent?: string
  lastEventAt?: string
}

export interface ClawSystemHealth {
  status: 'ok' | 'degraded' | 'down'
  claws: ClawStatus[]
  eventBus: 'connected' | 'disconnected'
  totalClaws: number
  onlineClaws: number
}

export interface AutoDesignTriggerResult {
  sessionId: string
  status: 'GENERATING'
  message: string
  clawsActivated: string[]
}

export interface QuickStartResult {
  projectId: string
  preconId: string
  autoDesignSessionId: string
  phase: string
  clawsActivated: string[]
  nextAction: string
}

export interface EstimateResult {
  estimateId: string
  status: string
  sections: number
  lineItems: number
}

export interface BidRequestResult {
  bidRequestId: string
  invitations: number
  fairRotationApplied: boolean
}

export interface ClawTaskStatus {
  taskId: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  claw: string
  progress: number
  result?: any
  error?: string
}

// ---------------------------------------------------------------------------
// System Health & Status
// ---------------------------------------------------------------------------

/** Check health of entire CLAW system */
export async function getClawsHealth(): Promise<ClawSystemHealth> {
  return clawFetch('/health')
}

/** Get status of all running CLAW agents */
export async function getClawsStatus(): Promise<{ claws: ClawStatus[] }> {
  return clawFetch('/api/claws/command/status')
}

/** Get active tasks for a project */
export async function getProjectTasks(projectId: string): Promise<{ tasks: ClawTaskStatus[] }> {
  return clawFetch(`/api/claws/command/tasks?projectId=${projectId}`)
}

// ---------------------------------------------------------------------------
// Claw A: Acquisition & PreCon — 1-Click Project Start
// ---------------------------------------------------------------------------

/**
 * QUICK START — 1-click project creation.
 * Creates project + triggers Claw A (estimation) + Claw F (welcome comms) + Claw H (orchestration).
 * All CLAWs activate immediately behind the scenes.
 */
export async function quickStartProject(data: {
  name: string
  category: string
  description: string
  designPackageTier: 'STARTER' | 'STANDARD' | 'PREMIUM'
  city?: string
  state?: string
  zipCode?: string
  address?: string
  squareFootage?: number
  complexity?: string
}): Promise<QuickStartResult> {
  return clawFetch('/api/claws/acquisition/estimates/quick-start', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      // Signal to CLAWs to activate full pipeline from start
      activateClaws: true,
      clawPipeline: [
        'acquisition-precon',    // A: Create estimate + initial scope
        'docs-communication',    // F: Send welcome email, create project channel
        'command-automation',    // H: Log activity, set up automation rules
        'risk-prediction',       // G: Initial risk assessment
      ],
    }),
  })
}

/**
 * Trigger Auto Design — kicks off AI concept generation.
 * Activates: Claw A (scope → concepts), Claw F (notifications), Claw H (tracking)
 */
export async function triggerAutoDesign(preconId: string, params?: {
  style?: string
  roomTypes?: string[]
  budgetRange?: { min: number; max: number }
}): Promise<AutoDesignTriggerResult> {
  return clawFetch(`/api/claws/acquisition/estimates/${preconId}/auto-design`, {
    method: 'POST',
    body: JSON.stringify(params || {}),
  })
}

/** Submit an AI revision request (up to 5 rounds) */
export async function requestAutoDesignRevision(sessionId: string, feedback: string): Promise<{
  revisionId: string
  revisionsRemaining: number
  status: string
}> {
  return clawFetch(`/api/claws/acquisition/estimates/auto-design/${sessionId}/revise`, {
    method: 'POST',
    body: JSON.stringify({ feedback }),
  })
}

/** Select final design from 3 candidates */
export async function selectFinalDesign(sessionId: string, optionId: string): Promise<{
  status: string
  nextStep: 'DESIGNER_MEETING'
  meetingScheduledAt?: string
}> {
  return clawFetch(`/api/claws/acquisition/estimates/auto-design/${sessionId}/select`, {
    method: 'POST',
    body: JSON.stringify({ optionId }),
  })
}

/** Get estimate for a project */
export async function getEstimate(projectId: string): Promise<{ estimate: EstimateResult }> {
  return clawFetch(`/api/claws/acquisition/estimates/${projectId}`)
}

/** Request contractor bids via Fair Bid Rotation */
export async function requestBids(projectId: string): Promise<BidRequestResult> {
  return clawFetch(`/api/claws/acquisition/bids/request`, {
    method: 'POST',
    body: JSON.stringify({ projectId }),
  })
}

// ---------------------------------------------------------------------------
// Claw B: Contract & Commercials
// ---------------------------------------------------------------------------

/** Initiate contract after bid acceptance */
export async function initiateContract(projectId: string, bidId: string): Promise<{
  contractId: string
  status: string
}> {
  return clawFetch('/api/claws/contracts/initiate', {
    method: 'POST',
    body: JSON.stringify({ projectId, bidId }),
  })
}

// ---------------------------------------------------------------------------
// Claw C: Schedule & Field Ops
// ---------------------------------------------------------------------------

/** Get project schedule */
export async function getSchedule(projectId: string): Promise<{ schedule: any }> {
  return clawFetch(`/api/claws/schedule/${projectId}`)
}

// ---------------------------------------------------------------------------
// Claw D: Budget & Cost Control
// ---------------------------------------------------------------------------

/** Get budget overview for a project */
export async function getBudgetOverview(projectId: string): Promise<{ budget: any }> {
  return clawFetch(`/api/claws/budget/${projectId}`)
}

// ---------------------------------------------------------------------------
// Claw E: Permits & Compliance
// ---------------------------------------------------------------------------

/** Trigger permit submission — activates after architecture phase */
export async function submitForPermits(projectId: string, packageTier: string): Promise<{
  permitId: string
  jurisdiction: string
  status: string
}> {
  return clawFetch('/api/claws/permits/submit', {
    method: 'POST',
    body: JSON.stringify({ projectId, packageTier }),
  })
}

/** Get permit status */
export async function getPermitStatus(projectId: string): Promise<{ permits: any[] }> {
  return clawFetch(`/api/claws/permits/${projectId}`)
}

// ---------------------------------------------------------------------------
// Claw F: Documents & Communication
// ---------------------------------------------------------------------------

/** Send message via Kealee Messenger */
export async function sendMessage(projectId: string, message: string): Promise<{
  messageId: string
  aiResponse?: string
}> {
  return clawFetch('/api/messenger/send', {
    method: 'POST',
    body: JSON.stringify({ projectId, message }),
  })
}

// ---------------------------------------------------------------------------
// Claw G: Risk & Predictions
// ---------------------------------------------------------------------------

/** Get risk assessment for a project */
export async function getRiskAssessment(projectId: string): Promise<{ risks: any[] }> {
  return clawFetch(`/api/claws/risk/${projectId}`)
}

/** Get AI-generated decision recommendations */
export async function getDecisions(projectId: string): Promise<{ decisions: any[] }> {
  return clawFetch(`/api/claws/risk/${projectId}/decisions`)
}

// ---------------------------------------------------------------------------
// Claw H: Command Center — Activity & Automation
// ---------------------------------------------------------------------------

/** Get recent activity log for a project */
export async function getActivityLog(projectId: string): Promise<{ activities: any[] }> {
  return clawFetch(`/api/claws/command/activity?projectId=${projectId}`)
}

/** Get automation rules for a project */
export async function getAutomationRules(projectId: string): Promise<{ rules: any[] }> {
  return clawFetch(`/api/claws/command/automation?projectId=${projectId}`)
}
