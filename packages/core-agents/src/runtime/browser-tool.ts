/**
 * Browser Tool — Expose browser agent as an agentic tool
 *
 * Used by: callModelAgentic() to enable Claude to control a browser
 * Actions: navigate, click, input, extract, screenshot
 */

import { AgenticTool } from './agentic-executor';
import { BrowserAgent } from './browser-agent';
import { BrowserSessionManager } from './browser-session-manager';
import { BrowserSecurity } from './browser-security';

export interface BrowserToolInput {
  sessionId: string;
  action: 'navigate' | 'click' | 'input' | 'extract' | 'screenshot';
  url?: string;
  selector?: string;
  text?: string;
  format?: 'text' | 'json' | 'html';
  timeout?: number;
  waitForSelector?: string;
}

export function createBrowserTool(
  agent?: BrowserAgent,
  sessionManager?: BrowserSessionManager,
  security?: BrowserSecurity
): AgenticTool {
  const browserAgent = agent ?? new BrowserAgent(sessionManager, security);

  return {
    name: 'browse_web',
    description:
      'Control a browser to navigate websites and extract information. Actions: navigate (go to URL), click (click element), input (fill text field), extract (get element content), screenshot (capture page/element). CRITICAL: Never navigate to localhost, 127.0.0.1, private IPs, or file:// URLs. All actions are logged for audit.',
    inputSchema: {
      sessionId: {
        type: 'string',
        description: 'Browser session ID (unique per conversation)',
      },
      action: {
        type: 'string',
        enum: ['navigate', 'click', 'input', 'extract', 'screenshot'],
        description: 'Action to perform',
      },
      url: {
        type: 'string',
        description: 'URL for navigate action (e.g., https://example.com)',
      },
      selector: {
        type: 'string',
        description: 'CSS selector for click/input/extract/screenshot (e.g., ".price", "#submit")',
      },
      text: {
        type: 'string',
        description: 'Text to input (for input action)',
      },
      format: {
        type: 'string',
        enum: ['text', 'json', 'html'],
        description: 'Format for extract action (default: text)',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in ms (default: 10000)',
      },
      waitForSelector: {
        type: 'string',
        description: 'CSS selector to wait for after navigation',
      },
    } as Record<string, unknown>,
    execute: async (input: unknown): Promise<unknown> => {
      const parsed = input as BrowserToolInput;

      switch (parsed.action) {
        case 'navigate':
          if (!parsed.url) throw new Error('navigate requires url');
          return browserAgent.navigate(parsed.sessionId, {
            url: parsed.url,
            timeout: parsed.timeout,
            waitForSelector: parsed.waitForSelector,
          });

        case 'click':
          if (!parsed.selector) throw new Error('click requires selector');
          return browserAgent.click(parsed.sessionId, {
            selector: parsed.selector,
            timeout: parsed.timeout,
          });

        case 'input':
          if (!parsed.selector || !parsed.text) {
            throw new Error('input requires selector and text');
          }
          return browserAgent.fillInput(parsed.sessionId, {
            selector: parsed.selector,
            text: parsed.text,
            timeout: parsed.timeout,
          });

        case 'extract':
          if (!parsed.selector) throw new Error('extract requires selector');
          return browserAgent.extractData(parsed.sessionId, {
            selector: parsed.selector,
            format: parsed.format ?? 'text',
            timeout: parsed.timeout,
          });

        case 'screenshot':
          return browserAgent.screenshot(parsed.sessionId, parsed.selector);

        default:
          throw new Error(`Unknown action: ${parsed.action}`);
      }
    },
  };
}

// Singleton instance for process lifetime
let globalBrowserAgent: BrowserAgent | null = null;

export function getGlobalBrowserAgent(): BrowserAgent {
  if (!globalBrowserAgent) {
    globalBrowserAgent = new BrowserAgent();
  }
  return globalBrowserAgent;
}

export async function shutdownGlobalBrowserAgent(): Promise<void> {
  if (globalBrowserAgent) {
    await globalBrowserAgent.destroyAll();
    globalBrowserAgent = null;
  }
}
