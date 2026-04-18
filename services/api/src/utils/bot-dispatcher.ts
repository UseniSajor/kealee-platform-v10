/**
 * services/api/src/utils/bot-dispatcher.ts
 *
 * Unified Bot Dispatcher
 * Routes requests to appropriate bot system (API or KeaBot) based on request characteristics
 * Prevents duplication by making routing decisions explicit and testable
 */

export interface BotRoutingDecision {
  system: 'api-agent' | 'keabot-service'
  botType: string
  reason: string
  estimatedLatency: 'immediate' | 'async'
}

export interface AgentRequest {
  type: 'estimate' | 'permit' | 'contractor-match' | 'lead' | 'support' | 'project-monitor'
  data: Record<string, unknown>
  requiresMultiTurn?: boolean
  requiresToolUse?: boolean
  requiresLongForm?: boolean
  timeoutMs?: number
}

/**
 * Dispatcher Logic:
 * 1. If request needs multi-turn Claude conversation → KeaBot
 * 2. If request needs tool use loops (10+ iterations) → KeaBot
 * 3. If request needs long-form generation → KeaBot
 * 4. If request needs immediate response (<500ms) → API Agent
 * 5. Default: API Agent for routing/validation
 */
export class BotDispatcher {
  static route(request: AgentRequest): BotRoutingDecision {
    // Heuristics for routing
    const needsMultiTurn = request.requiresMultiTurn ?? false
    const needsToolUse = request.requiresToolUse ?? false
    const needsLongForm = request.requiresLongForm ?? false
    const isHighPriority = (request.timeoutMs ?? 5000) < 1000

    // KeaBot: Multi-turn conversations
    if (needsMultiTurn) {
      return {
        system: 'keabot-service',
        botType: `keabot-${request.type}`,
        reason: 'Multi-turn conversation required',
        estimatedLatency: 'async',
      }
    }

    // KeaBot: Complex tool use (estimation, permitting, contractor matching)
    if (needsToolUse && ['estimate', 'permit', 'contractor-match'].includes(request.type)) {
      return {
        system: 'keabot-service',
        botType: `keabot-${request.type}`,
        reason: 'Tool use loop required for complex analysis',
        estimatedLatency: 'async',
      }
    }

    // KeaBot: Long-form generation (reports, strategies)
    if (needsLongForm) {
      return {
        system: 'keabot-service',
        botType: `keabot-${request.type}`,
        reason: 'Long-form content generation required',
        estimatedLatency: 'async',
      }
    }

    // API Agent: Fast validation/routing (default)
    if (isHighPriority) {
      return {
        system: 'api-agent',
        botType: `${request.type}-bot`,
        reason: 'High-priority request requires immediate response (<1s)',
        estimatedLatency: 'immediate',
      }
    }

    // API Agent: Default routing
    return {
      system: 'api-agent',
      botType: `${request.type}-bot`,
      reason: 'Default routing for intake validation and tier recommendation',
      estimatedLatency: 'immediate',
    }
  }

  /**
   * Example usage in agent routes:
   *
   * router.post('/agents/estimate/execute', async (request, reply) => {
   *   const decision = BotDispatcher.route({
   *     type: 'estimate',
   *     data: request.body,
   *     requiresToolUse: true,  // If generating detailed estimate
   *   })
   *
   *   logger.info({ decision }, 'Bot routing decision')
   *
   *   if (decision.system === 'api-agent') {
   *     const bot = bots.registry.get('estimate-bot')
   *     return bot.execute(request.body)
   *   } else {
   *     // Enqueue for KeaBot processing
   *     await projectExecutionQueue.add('project.execution', {
   *       type: 'estimate',
   *       outputId,
   *       intakeId: request.body.intakeId,
   *     })
   *     return { queued: true, jobId: outputId }
   *   }
   * })
   */

  /**
   * Validate routing decision consistency
   * Used for testing and monitoring
   */
  static validateConsistency(
    request1: AgentRequest,
    request2: AgentRequest,
    expectedSameSystem: boolean = true
  ): boolean {
    const decision1 = this.route(request1)
    const decision2 = this.route(request2)

    if (expectedSameSystem) {
      return decision1.system === decision2.system
    }

    return true
  }
}

/**
 * Bot Capability Matrix
 * Documents what each bot system can do
 * Used for preventing misrouting
 */
export const BOT_CAPABILITY_MATRIX = {
  'api-agent': {
    'estimate-bot': ['validate_intake', 'score_lead', 'recommend_tier'],
    'permit-bot': ['validate_permits', 'lookup_jurisdiction', 'classify_type'],
    'contractor-match-bot': ['score_leads', 'filter_by_profile', 'route_to_contractors'],
    'lead-bot': ['classify_intent', 'extract_info', 'schedule_followup'],
    'support-bot': ['classify_issue', 'search_faq', 'create_ticket'],
    'project-monitor-bot': ['track_status', 'alert_delays', 'escalate'],
  },
  'keabot-service': {
    'keabot-estimate': [
      'analyze_project_complex',
      'execute_cost_tools',
      'generate_estimate_report',
      'iterate_with_user',
    ],
    'keabot-permit': [
      'develop_strategy',
      'draft_documents',
      'handle_multi_turn',
      'iterate_with_user',
    ],
    'keabot-contractor-match': [
      'understand_needs',
      'find_matches_iteratively',
      'negotiate_terms',
      'iterate_with_user',
    ],
    'keabot-owner': ['provide_guidance', 'answer_questions', 'handle_disputes'],
    'keabot-support': ['answer_questions', 'create_tickets', 'escalate_to_human'],
  },
} as const

/**
 * Export for testing
 */
export { BotDispatcher as BotDispatcherImpl }
