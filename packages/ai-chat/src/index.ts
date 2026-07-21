/**
 * @kealee/ai-chat — Conversational AI Chat Engine
 *
 * Provides the PlatformChatEngine class and all supporting types
 * for building AI-powered chat interfaces on the Kealee Platform.
 */

// Core engine
export { PlatformChatEngine } from './chat-engine';

// Types
export type {
  ChatRequest,
  ChatResponse,
  ChatAction,
  ChatSource,
  ConversationMessage,
  UserContext,
  UserProject,
  ToolDefinition,
  ToolExecutor,
  ToolResult,
  SSEEventType,
  SSEEvent,
} from './types';

// Tools (for advanced use / testing)
export { allToolDefinitions, toolExecutors, getToolDefinition } from './tools';

// Utilities
export { buildSystemPrompt } from './system-prompt';
export { assertChatProjectAccess, assertChatProjectOwnerOrPM } from './access-guard';
