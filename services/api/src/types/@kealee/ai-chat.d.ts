declare module '@kealee/ai-chat' {
  export class PlatformChatEngine {
    constructor(prisma: any)
    sendMessage(conversationId: string, message: string, userId: string): Promise<any>
    getHistory(conversationId: string): Promise<any[]>
    listConversations(userId: string): Promise<any[]>
    archiveConversation(conversationId: string): Promise<void>
    [key: string]: any
  }
}
