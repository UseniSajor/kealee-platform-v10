
import sgMail from '@sendgrid/mail';

// SendGrid Configure
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface EmailParams {
    to: string | string[];
    subject?: string;
    html?: string;
    text?: string;
    templateId?: string;
    dynamicTemplateData?: Record<string, any>;
    attachments?: Array<{
        content: string;
        filename: string;
        type: string;
        disposition?: 'attachment' | 'inline';
    }>;
}

export async function sendEmail(params: EmailParams): Promise<void> {
    const msg: any = {
        to: params.to,
        from: {
            email: process.env.SENDGRID_FROM_EMAIL!,
            name: 'Kealee Construction',
        },
        subject: params.subject,
        html: params.html,
        text: params.text,
        templateId: params.templateId,
        dynamicTemplateData: params.dynamicTemplateData,
        attachments: params.attachments,
    };

    // Remove undefined fields to satisfy SendGrid client expectations
    Object.keys(msg).forEach(key => msg[key] === undefined && delete msg[key]);

    await sgMail.send(msg);
}

export const EMAIL_TEMPLATES = {
    BID_INVITATION: 'd-bid-invitation',
    BID_RECEIVED: 'd-bid-received',
    VISIT_REMINDER: 'd-visit-reminder',
    REPORT_DELIVERY: 'd-report-delivery',
    PERMIT_STATUS: 'd-permit-status',
    INSPECTION_RESULT: 'd-inspection-result',
    CHANGE_ORDER_REQUEST: 'd-change-order',
    BUDGET_ALERT: 'd-budget-alert',
};
