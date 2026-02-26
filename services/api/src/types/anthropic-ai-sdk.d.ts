declare module '@anthropic-ai/sdk' {
  interface MessageCreateParams {
    model: string
    max_tokens: number
    messages: Array<{
      role: string
      content: any
    }>
    system?: string
    [key: string]: any
  }

  interface ContentBlock {
    type: string
    text?: string
    [key: string]: any
  }

  interface Message {
    id: string
    type: string
    role: string
    content: ContentBlock[]
    model: string
    stop_reason: string | null
    usage: { input_tokens: number; output_tokens: number }
  }

  interface Messages {
    create(params: MessageCreateParams): Promise<Message>
  }

  class Anthropic {
    constructor(options?: { apiKey?: string; [key: string]: any })
    messages: Messages
  }

  export default Anthropic
}
