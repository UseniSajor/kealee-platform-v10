
import { prisma } from '../../core/db';
import { getEventBus, EVENT_TYPES } from '../../core/events';
import { sendEmail, EMAIL_TEMPLATES } from '../../core/integrations/sendgrid'; // Need to create this
import { MatchResult } from './types';

export class InvitationSender {
    async sendInvitations(bidRequestId: string, contractors: MatchResult[]): Promise<string[]> {
        const bidRequest = await prisma.bidRequest.findUniqueOrThrow({
            where: { id: bidRequestId },
            include: { project: true },
        });

        const invitationIds: string[] = [];

        for (const match of contractors) {
            const invitation = await prisma.bidInvitation.create({
                data: {
                    bidRequestId,
                    contractorId: match.contractorId,
                    status: 'SENT',
                },
            });

            const bidLink = `${process.env.APP_URL}/bids/submit/${invitation.id}`;

            await sendEmail({
                to: match.contractor.email,
                templateId: EMAIL_TEMPLATES.BID_INVITATION,
                dynamicTemplateData: {
                    contractorName: match.contractor.name,
                    projectName: bidRequest.project.name,
                    projectAddress: bidRequest.project.address,
                    deadline: bidRequest.deadline.toLocaleDateString(),
                    bidLink,
                    matchScore: Math.round(match.score * 100),
                    matchReasons: match.matchReasons,
                },
            });

            invitationIds.push(invitation.id);

            await getEventBus().publish(
                EVENT_TYPES.BID_INVITATION_SENT,
                {
                    invitationId: invitation.id,
                    bidRequestId,
                    contractorId: match.contractorId,
                    contractorEmail: match.contractor.email,
                },
                'bid-engine'
            );
        }

        return invitationIds;
    }

    async sendReminders(bidRequestId: string): Promise<void> {
        const invitations = await prisma.bidInvitation.findMany({
            where: {
                bidRequestId,
                status: { in: ['SENT', 'VIEWED'] },
            },
            include: {
                contractor: true,
                bidRequest: { include: { project: true } },
            },
        });

        for (const invitation of invitations) {
            const daysUntilDeadline = Math.ceil(
                (invitation.bidRequest.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilDeadline <= 3 && daysUntilDeadline > 0) {
                await sendEmail({
                    to: invitation.contractor.email,
                    subject: `Reminder: Bid deadline in ${daysUntilDeadline} days - ${invitation.bidRequest.project.name}`,
                    html: `
            <p>Hi ${invitation.contractor.contactName},</p>
            <p>This is a friendly reminder that the bid deadline for <strong>${invitation.bidRequest.project.name}</strong> 
            is in <strong>${daysUntilDeadline} days</strong>.</p>
            <p>Please submit your bid before ${invitation.bidRequest.deadline.toLocaleDateString()}.</p>
            <p><a href="${process.env.APP_URL}/bids/submit/${invitation.id}">Submit Your Bid</a></p>
          `,
                });
            }
        }
    }
}
