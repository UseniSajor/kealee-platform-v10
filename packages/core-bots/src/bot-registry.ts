/**
 * Bot Registry — manages all KeaBot instances and handles handoffs
 */

import type { KeaBot, HandoffRequest, BotMessage } from './keabot-base';

export class BotRegistry {
  private bots = new Map<string, KeaBot>();

  register(bot: KeaBot): void {
    this.bots.set(bot.name, bot);
  }

  get(name: string): KeaBot | undefined {
    return this.bots.get(name);
  }

  getRequired(name: string): KeaBot {
    const bot = this.bots.get(name);
    if (!bot) throw new Error(`Bot not found: ${name}`);
    return bot;
  }

  getByDomain(domain: string): KeaBot | undefined {
    for (const bot of this.bots.values()) {
      if (bot.domain === domain) return bot;
    }
    return undefined;
  }

  list(): Array<{ name: string; domain: string }> {
    return Array.from(this.bots.values()).map(b => ({
      name: b.name,
      domain: b.domain,
    }));
  }

  /**
   * Execute a handoff between bots
   */
  async executeHandoff(request: HandoffRequest): Promise<string> {
    const targetBot = this.getRequired(request.toBot);
    const context = {
      ...request.context,
      handoffFrom: request.fromBot,
      handoffReason: request.reason,
      conversationHistory: request.conversationHistory,
    };

    const summary = request.conversationHistory
      .filter(m => m.role !== 'system')
      .map(m => `${m.role}: ${m.content}`)
      .slice(-5)
      .join('\n');

    return targetBot.handleMessage(
      `[Handoff from ${request.fromBot}] Reason: ${request.reason}\n\nConversation context:\n${summary}`,
      context,
    );
  }

  /**
   * Initialize all bots
   */
  async initializeAll(): Promise<void> {
    for (const bot of this.bots.values()) {
      await bot.initialize();
    }
  }
}
