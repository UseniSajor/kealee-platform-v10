import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface ChangeOrderEmailProps {
  pmName: string;
  projectName: string;
  changeOrderNumber: string;
  title: string;
  amount: string;
  requestedBy: string;
  projectId: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };
const amberBanner = { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px 20px', textAlign: 'center' as const, marginBottom: '24px' };

export function ChangeOrderEmail({ pmName, projectName, changeOrderNumber, title, amount, requestedBy, projectId }: ChangeOrderEmailProps) {
  return (
    <EmailLayout preview={`Change Order #${changeOrderNumber}: ${title} — ${projectName}`} projectName={projectName}>
      <Section style={content}>
        <Section style={amberBanner}>
          <Text style={{ fontSize: '20px', fontWeight: '700', color: '#92400e', margin: '0' }}>
            Change Order Requested
          </Text>
        </Section>

        <Text style={paragraph}>
          Hi {pmName}, a change order has been submitted for {projectName} and requires your review.
        </Text>

        <Hr style={divider} />

        <Text style={heading2}>Change Order Details</Text>
        <Text style={detailRow}><span style={detailLabel}>CO Number:</span> #{changeOrderNumber}</Text>
        <Text style={detailRow}><span style={detailLabel}>Title:</span> {title}</Text>
        <Text style={detailRow}><span style={detailLabel}>Amount:</span> <span style={{ fontWeight: '600', color: '#b45309' }}>{amount}</span></Text>
        <Text style={detailRow}><span style={detailLabel}>Requested By:</span> {requestedBy}</Text>
        <Text style={detailRow}><span style={detailLabel}>Project:</span> {projectName}</Text>

        <Hr style={divider} />

        <Text style={paragraph}>
          Review the change order scope, cost impact, and justification. You can approve, request modifications, or reject directly from the project dashboard.
        </Text>

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/projects/${projectId}/change-orders`} style={ctaButton}>
            Review Change Order
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
}
