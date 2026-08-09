import { AgentInputPayload, AgentOutput } from './types.js';
import { generateJSON } from '../infrastructure/ai.js';

export abstract class V30AgentBase {
  abstract readonly agentName: string;
  abstract readonly loopType: string;

  protected abstract getSystemPrompt(): string;
  protected abstract buildUserPrompt(input: AgentInputPayload): string;

  async evaluate(input: AgentInputPayload): Promise<AgentOutput> {
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.buildUserPrompt(input);

    const { data } = await generateJSON<AgentOutput>({
      systemPrompt,
      userPrompt,
      model: 'claude-sonnet-4-5-20250929', // Default model
    });

    return {
      ...data,
      agentName: this.agentName,
      loopType: this.loopType,
    };
  }
}
