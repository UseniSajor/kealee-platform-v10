
import { sendEmail } from '../../core/integrations/sendgrid';

export class CommunicationRouter {
    async send(request: any): Promise<string[]> {
        const messageIds: string[] = [];

        // Mock send
        for (const recipient of request.recipients) {
            console.log(`[Communication Hub] Sending ${request.type} to ${recipient.email}: ${request.subject}`);
            // In real app: await sendEmail(...)
            messageIds.push(`msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        }

        return messageIds;
    }
}
