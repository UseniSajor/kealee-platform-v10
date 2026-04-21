/**
 * LLM Configuration and Status
 *
 * Central place to check LLM availability and configuration across the app
 */

import { getLLMConfig } from './llm-fallback';

export interface LLMStatusReport {
  claude: {
    enabled: boolean;
    configured: boolean;
    endpoint: string;
  };
  localLLM: {
    enabled: boolean;
    baseUrl: string;
    model: string;
  };
  primaryProvider: 'CLAUDE' | 'LOCAL' | 'NONE';
  status: 'FULL' | 'DEGRADED' | 'OFFLINE';
  message: string;
}

/**
 * Get current LLM status
 */
export function getLLMStatus(): LLMStatusReport {
  const config = getLLMConfig();

  let primaryProvider: 'CLAUDE' | 'LOCAL' | 'NONE' = 'NONE';
  let status: 'FULL' | 'DEGRADED' | 'OFFLINE' = 'OFFLINE';
  let message = 'No LLM providers configured';

  if (config.claudeEnabled) {
    primaryProvider = 'CLAUDE';
    status = 'FULL';
    message = 'Claude API is primary provider';

    if (config.localLLMEnabled) {
      status = 'FULL';
      message = 'Claude API primary, local LLM as fallback';
    }
  } else if (config.localLLMEnabled) {
    primaryProvider = 'LOCAL';
    status = 'DEGRADED';
    message = 'Claude API unavailable, using local LLM';
  }

  return {
    claude: {
      enabled: config.claudeEnabled,
      configured: !!process.env.ANTHROPIC_API_KEY,
      endpoint: 'api.anthropic.com',
    },
    localLLM: {
      enabled: config.localLLMEnabled,
      baseUrl: config.localLLMConfig.baseUrl,
      model: config.localLLMConfig.model,
    },
    primaryProvider,
    status,
    message,
  };
}

/**
 * Check if LLM system is healthy enough for operations
 */
export function isLLMHealthy(): boolean {
  const status = getLLMStatus();
  return status.primaryProvider !== 'NONE';
}

/**
 * Get recommended provider for a specific use case
 */
export function getRecommendedProvider(useCase: 'chat' | 'tools' | 'analysis'): 'CLAUDE' | 'LOCAL' {
  const config = getLLMConfig();

  // Tool use only works with Claude
  if (useCase === 'tools' && config.claudeEnabled) {
    return 'CLAUDE';
  }

  // Default to Claude if available
  if (config.claudeEnabled) {
    return 'CLAUDE';
  }

  // Fall back to local if that's all we have
  if (config.localLLMEnabled) {
    return 'LOCAL';
  }

  // Should not reach here — callLLMWithFallback handles no-provider case
  return 'CLAUDE';
}
