
import { sendEmail } from '../../core/integrations/sendgrid';
import { prisma } from '../../core/db';

export class CommunicationRouter {
    async send(request: any): Promise<string[]> {
        const messageIds: string[] = [];
        const { projectId, type, recipients, subject, message } = request;

        for (const recipient of recipients) {
            // Log to DB
            const log = await prisma.communicationLog.create({
                data: {
                    projectId,
                    type,
                    recipientEmail: recipient.email,
                    subject,
                    body: message,
                    status: 'PENDING',
                },
            });

            try {
                if (type === 'EMAIL') {
                    await sendEmail({
                        to: recipient.email,
                        subject: subject || 'Notification',
                        html: message, // Assuming message is HTML
                    });
                }
                // Update status if successful
                await prisma.communicationLog.update({
                    where: { id: log.id },
                    data: { status: 'SENT' },
                });
                messageIds.push(log.id);
            } catch (err) {
                await prisma.communicationLog.update({
                    where: { id: log.id },
                    data: { status: 'FAILED' },
                });
                console.error(`Failed to send email to ${recipient.email}`, err);
            }
        }

        return messageIds;
    }
}
