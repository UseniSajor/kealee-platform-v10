export type ConversationRelayInbound =
  | { type: 'setup'; sessionId: string; accountSid: string; callSid: string; from?: string; to?: string; direction: string; customParameters?: Record<string, string> }
  | { type: 'prompt'; voicePrompt: string; lang: string; last: boolean }
  | { type: 'dtmf'; digit: string }
  | { type: 'interrupt'; utteranceUntilInterrupt: string; durationUntilInterruptMs: number }
  | { type: 'error'; description: string };

export type ConversationRelayOutbound =
  | { type: 'text'; token: string; last: boolean; lang?: string; interruptible: boolean; preemptible: boolean }
  | { type: 'end'; handoffData?: string };

export interface VoiceAgentTurnContext {
  sessionId: string; callSid: string; locale: string; partial: boolean; signal: AbortSignal;
}
export interface ConversationRelayCallbacks {
  onSetup(message: Extract<ConversationRelayInbound, { type: 'setup' }>): Promise<void>;
  onPrompt(text: string, context: VoiceAgentTurnContext): AsyncIterable<string>;
  onTranscript(message: { sessionId: string; role: 'CALLER' | 'ASSISTANT'; text: string; final: boolean; redacted: boolean }): Promise<void>;
  onDtmf?(digit: string, context: VoiceAgentTurnContext): Promise<void>;
  onInterrupt?(message: Extract<ConversationRelayInbound, { type: 'interrupt' }>, context: VoiceAgentTurnContext): Promise<void>;
  onError?(description: string, context?: VoiceAgentTurnContext): Promise<void>;
}

const CARD_SEQUENCE = /(?:\d[ -]*?){13,19}/g;
export function redactVoiceSensitiveData(value: string): { text: string; redacted: boolean } {
  let redacted = false;
  const text = value.replace(CARD_SEQUENCE, (candidate) => {
    const digits = candidate.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return candidate;
    redacted = true;
    return '[PAYMENT_CARD_REDACTED]';
  });
  return { text, redacted };
}

export function parseConversationRelayMessage(raw: string): ConversationRelayInbound {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('ConversationRelay message is not valid JSON'); }
  if (!value || typeof value !== 'object' || typeof (value as any).type !== 'string') throw new Error('ConversationRelay message type is required');
  const message = value as Record<string, unknown>;
  switch (message.type) {
    case 'setup':
      if (typeof message.sessionId !== 'string' || typeof message.callSid !== 'string' || typeof message.accountSid !== 'string') throw new Error('Invalid setup message');
      return message as unknown as Extract<ConversationRelayInbound, { type: 'setup' }>;
    case 'prompt':
      if (typeof message.voicePrompt !== 'string' || typeof message.lang !== 'string' || typeof message.last !== 'boolean') throw new Error('Invalid prompt message');
      return message as unknown as Extract<ConversationRelayInbound, { type: 'prompt' }>;
    case 'dtmf':
      if (typeof message.digit !== 'string' || !/^[0-9*#]$/.test(message.digit)) throw new Error('Invalid DTMF message');
      return message as unknown as Extract<ConversationRelayInbound, { type: 'dtmf' }>;
    case 'interrupt':
      if (typeof message.utteranceUntilInterrupt !== 'string' || typeof message.durationUntilInterruptMs !== 'number') throw new Error('Invalid interrupt message');
      return message as unknown as Extract<ConversationRelayInbound, { type: 'interrupt' }>;
    case 'error':
      if (typeof message.description !== 'string') throw new Error('Invalid error message');
      return message as unknown as Extract<ConversationRelayInbound, { type: 'error' }>;
    default: throw new Error(`Unsupported ConversationRelay message type: ${String(message.type)}`);
  }
}

/** Stateful controller for one socket. Socket transport supplies raw messages and sends returned frames. */
export class ConversationRelaySessionController {
  private sessionId?: string;
  private callSid?: string;
  private locale = 'en-US';
  private activeTurn?: AbortController;
  private malformedCount = 0;

  constructor(private readonly callbacks: ConversationRelayCallbacks) {}

  private context(partial: boolean): VoiceAgentTurnContext {
    if (!this.sessionId || !this.callSid) throw new Error('ConversationRelay setup is required first');
    this.activeTurn ??= new AbortController();
    return { sessionId: this.sessionId, callSid: this.callSid, locale: this.locale, partial, signal: this.activeTurn.signal };
  }

  async *handle(raw: string): AsyncIterable<ConversationRelayOutbound> {
    let message: ConversationRelayInbound;
    try { message = parseConversationRelayMessage(raw); this.malformedCount = 0; }
    catch (error) {
      this.malformedCount += 1;
      await this.callbacks.onError?.((error as Error).message);
      if (this.malformedCount >= 10) throw new Error('Too many consecutive malformed ConversationRelay messages');
      return;
    }
    if (message.type === 'setup') {
      this.sessionId = message.sessionId; this.callSid = message.callSid;
      await this.callbacks.onSetup(message); return;
    }
    const context = this.context(message.type === 'prompt' ? !message.last : false);
    if (message.type === 'interrupt') {
      this.activeTurn?.abort('caller_interrupt'); this.activeTurn = undefined;
      await this.callbacks.onInterrupt?.(message, context); return;
    }
    if (message.type === 'dtmf') { await this.callbacks.onDtmf?.(message.digit, context); return; }
    if (message.type === 'error') { await this.callbacks.onError?.(message.description, context); return; }

    this.locale = message.lang;
    const caller = redactVoiceSensitiveData(message.voicePrompt);
    await this.callbacks.onTranscript({ sessionId: this.sessionId!, role: 'CALLER', text: caller.text, final: message.last, redacted: caller.redacted });
    if (!message.last) return;
    this.activeTurn?.abort('new_final_prompt'); this.activeTurn = new AbortController();
    const finalContext = this.context(false);
    for await (const token of this.callbacks.onPrompt(caller.text, finalContext)) {
      if (finalContext.signal.aborted) return;
      const safe = redactVoiceSensitiveData(token);
      await this.callbacks.onTranscript({ sessionId: this.sessionId!, role: 'ASSISTANT', text: safe.text, final: false, redacted: safe.redacted });
      yield { type: 'text', token: safe.text, last: false, lang: this.locale, interruptible: true, preemptible: true };
    }
    if (!finalContext.signal.aborted) yield { type: 'text', token: '', last: true, lang: this.locale, interruptible: true, preemptible: true };
  }

  endForHuman(reason: string): ConversationRelayOutbound {
    this.activeTurn?.abort('human_handoff');
    return { type: 'end', handoffData: JSON.stringify({ reasonCode: 'live-agent-handoff', reason }) };
  }
}
