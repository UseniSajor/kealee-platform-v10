import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface MilestoneCompleteEmailProps {
  clientName: string;
  projectName: string;
  milestoneName: string;
  milestoneDescription?: string;
  inspectionStatus: string;
  paymentAmount: string;
  projectId: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };
const statusBadge = (color: string) => ({ display: 'inline-block', backgroundColor: color === 'green' ? '#f0fdf4' : '#fefce8', color: color === 'green' ? '#166534' : '#854d0e', padding: '4px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: '600' });

export function MilestoneCompleteEmail({ clientName, projectName, milestoneName, milestoneDescription, inspectionStatus, paymentAmount, projectId }: MilestoneCompleteEmailProps) {
  const isPassed = inspectionStatus.toLowerCase() === 'passed';
  return (
    <EmailLayout preview={`${milestoneName} is complete — review and approve payment`} projectName={projectName}>
      <Section style={content}>
        <Text style={{ ...paragraph, fontSize: '18px', fontWeight: '600' }}>
          Milestone Complete
        </Text>
        <Text style={paragraph}>
          Hi {clientName}, a milestone on your project has been completed and is ready for your review.
        </Text>

        <Hr style={divider} />

        <Text style={heading2}>Milestone Details</Text>
        <Text style={detailRow}><span style={detailLabel}>Milestone:</span> {milestoneName}</Text>
        {milestoneDescription && <Text style={detailRow}><span style={detailLabel}>Description:</span> {milestoneDescription}</Text>}
        <Text style={detailRow}>
          <span style={detailLabel}>Inspection:</span>{' '}
          <span style={statusBadge(isPassed ? 'green' : 'yellow')}>{inspectionStatus}</span>
        </Text>
        <Text style={detailRow}><span style={detailLabel}>Payment Amount:</span> {paymentAmount}</Text>

        <Hr style={divider} />

        <Text style={paragraph}>
          Please review the completed work. Once approved, payment of {paymentAmount} will be released from escrow to the contractor.
        </Text>

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/projects/${projectId}/milestones`} style={ctaButton}>
            Approve &amp; Release Payment
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
}
