import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';

export const definition: ToolDefinition = {
  name: 'send_message',
  description:
    'Send an in-app message to another user on the platform.',
  input_schema: {
    type: 'object',
    properties: {
      recipientId: {
        type: 'string',
        description: 'The user ID of the recipient',
      },
      subject: {
        type: 'string',
        description: 'Message subject line',
      },
      body: {
        type: 'string',
        description: 'Message body text',
      },
      projectId: {
        type: 'string',
        description:
          'Optional project ID to associate with the message',
      },
    },
    required: ['recipientId', 'body'],
  },
};

export async function execute(
  prisma: PrismaClient,
  userId: string,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const p = prisma as any;

  const message = await p.message.create({
    data: {
      senderId: userId,
      recipientId: input.recipientId as string,
      channel: 'IN_APP',
      type: 'MESSAGE',
      subject: (input.subject as string) || null,
      body: input.body as string,
      projectId: (input.projectId as string) || null,
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  return {
    content: `Message sent successfully. (ID: ${message.id})`,
    actions: [
      {
        type: 'send_message',
        description: `Sent message to ${input.recipientId}`,
        data: {
          messageId: message.id,
          recipientId: input.recipientId,
          projectId: input.projectId || null,
        },
        requiresConfirmation: false,
      },
    ],
  };
}
