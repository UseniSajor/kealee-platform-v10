/**
 * @kealee/ai-infrastructure
 * Unified AI infrastructure: LLM routing, agent orchestration, AI gateway, and utility tools
 *
 * This package consolidates four previously separate packages:
 * - @kealee/core-llm → ./llm
 * - @kealee/core-agents → ./agents
 * - @kealee/core-ai-gateway → ./gateway
 * - @kealee/core-tools → ./tools
 *
 * Imports from the old packages are maintained for backward compatibility.
 */

// LLM Provider Routing
export * from './llm/index'
export * from './llm/types'
export * from './llm/provider-registry'
export * from './llm/router'
export * from './llm/confidence'

// Agent Orchestration
export * from './agents/index'
export * from './agents/types'

// AI Gateway
export * from './gateway/index'
export * from './gateway/gateway'

// Tools & Utilities
export * from './tools/index'
export * from './tools/registry'
