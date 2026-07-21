import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface EscrowFundedEmailProps {
  contractorName: string;
  projectName: string;
  amount: string;
  milestoneName: string;
  projectId: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#16a34a', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };
const successBanner = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px 20px', textAlign: 'center' as const, marginBottom: '24px' };

export function EscrowFundedEmail({ contractorName, projectName, amount, milestoneName, projectId }: EscrowFundedEmailProps) {
  return (
    <EmailLayout preview={`Escrow funded: ${amount} for ${milestoneName} — ${projectName}`} projectName={projectName}>
      <Section style={content}>
        <Section style={successBanner}>
          <Text style={{ fontSize: '20px', fontWeight: '700', color: '#166534', margin: '0' }}>
            Escrow Funded
          </Text>
        </Section>

        <Text style={paragraph}>
          Hi {contractorName}, the escrow for your upcoming milestone has been funded. You are clear to proceed with work.
        </Text>

        <Hr style={divider} />

        <Text style={heading2}>Funding Details</Text>
        <Text style={detailRow}><span style={detailLabel}>Project:</span> {projectName}</Text>
        <Text style={detailRow}><span style={detailLabel}>Milestone:</span> {milestoneName}</Text>
        <Text style={detailRow}><span style={detailLabel}>Amount:</span> <span style={{ fontWeight: '600', color: '#166534' }}>{amount}</span></Text>

        <Hr style={divider} />

        <Text style={paragraph}>
          Funds are held in escrow and will be released upon milestone completion and approval. You can track the status of all milestones in your project dashboard.
        </Text>

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/projects/${projectId}`} style={ctaButton}>
            View Project
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
}
