export interface ConversationRelayTwiMLInput {
  websocketUrl: string;
  welcomeGreeting: string;
  language?: string;
  interruptible?: boolean;
  recordingDisclosure?: string;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  })[character] as string);
}

export function buildConversationRelayTwiML(input: ConversationRelayTwiMLInput): string {
  const url = new URL(input.websocketUrl);
  if (url.protocol !== 'wss:') throw new Error('ConversationRelay requires a wss:// URL');
  const disclosure = input.recordingDisclosure?.trim();
  const greeting = disclosure ? `${disclosure} ${input.welcomeGreeting}` : input.welcomeGreeting;
  const attributes = [
    `url="${escapeXml(url.toString())}"`,
    `welcomeGreeting="${escapeXml(greeting)}"`,
    `language="${escapeXml(input.language ?? 'en-US')}"`,
    `interruptible="${input.interruptible === false ? 'false' : 'true'}"`,
  ].join(' ');
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Connect><ConversationRelay ${attributes} /></Connect></Response>`;
}
