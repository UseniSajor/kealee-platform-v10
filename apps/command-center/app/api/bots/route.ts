/**
 * GET /api/bots
 *
 * Returns the registered KeaBot registry for the command-center bots dashboard.
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const BOTS = [
  {
    id:          'lead-bot',
    name:        'Lead Qualification Bot',
    description: 'Scores and qualifies inbound leads from the intake form. Extracts budget, timeline, project type, and location to produce a structured lead profile.',
    version:     '1.2.0',
    costProfile: 'low',
    requiresLLM: true,
  },
  {
    id:          'estimate-bot',
    name:        'Cost Estimation Bot',
    description: 'Generates an itemized cost estimate for a given project type, scope, location, and quality level based on RSMeans and local market data.',
    version:     '2.0.1',
    costProfile: 'medium',
    requiresLLM: true,
  },
  {
    id:          'permit-bot',
    name:        'Permit Path Bot',
    description: 'Analyzes a project and jurisdiction to produce a permit requirement summary, timeline estimate, and path-to-approval checklist.',
    version:     '1.5.0',
    costProfile: 'low',
    requiresLLM: true,
  },
  {
    id:          'contractor-match-bot',
    name:        'Contractor Matching Bot',
    description: 'Derives contractor matching criteria from a lead profile and produces a ranking strategy for the Kealee marketplace.',
    version:     '1.1.0',
    costProfile: 'low',
    requiresLLM: true,
  },
  {
    id:          'project-monitor-bot',
    name:        'Project Monitor Bot',
    description: 'Evaluates a project\'s health based on budget variance, SPI, and open issues. Returns a structured health report without LLM inference.',
    version:     '3.0.0',
    costProfile: 'free',
    requiresLLM: false,
  },
  {
    id:          'support-bot',
    name:        'Owner Support Bot',
    description: 'Answers owner-portal support questions about project status, concept packages, permit credits, and timeline expectations.',
    version:     '1.0.3',
    costProfile: 'low',
    requiresLLM: true,
  },
  {
    id:          'marketing-bot',
    name:        'Marketing Lead Pitcher',
    description: 'Generates personalized outreach scripts, social media posts, and email sequences for a given service type and target audience. Outputs content ready to deploy in marketing channels.',
    version:     '1.0.0',
    costProfile: 'low',
    requiresLLM: true,
  },
  {
    id:          'pitch-bot',
    name:        'Concept Pitch Bot',
    description: 'Given a qualified lead profile, produces a personalized concept pitch — which package tier to recommend, why it fits, and a compelling one-paragraph sell for email or DM.',
    version:     '1.0.0',
    costProfile: 'low',
    requiresLLM: true,
  },
]

export async function GET() {
  return NextResponse.json({ bots: BOTS })
}
