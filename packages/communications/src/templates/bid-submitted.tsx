import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface BidSubmittedEmailProps {
  pmName: string;
  contractorName: string;
  projectName: string;
  bidAmount: string;
  projectId: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };

export function BidSubmittedEmail({ pmName, contractorName, projectName, bidAmount, projectId }: BidSubmittedEmailProps) {
  return (
    <EmailLayout preview={`New bid received from ${contractorName} for ${projectName}`} projectName={projectName}>
      <Section style={content}>
        <Text style={{ ...paragraph, fontSize: '20px', fontWeight: '600' }}>
          New Bid Received
        </Text>
        <Text style={paragraph}>
          Hi {pmName}, a new bid has been submitted for your project.
        </Text>

        <Hr style={divider} />

        <Text style={heading2}>Bid Summary</Text>
        <Text style={detailRow}><span style={detailLabel}>Contractor:</span> {contractorName}</Text>
        <Text style={detailRow}><span style={detailLabel}>Project:</span> {projectName}</Text>
        <Text style={detailRow}><span style={detailLabel}>Bid Amount:</span> {bidAmount}</Text>

        <Hr style={divider} />

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/projects/${projectId}/bids`} style={ctaButton}>
            Review Bid
          </Button>
        </Section>

        <Text style={{ ...paragraph, marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
          Review the full bid breakdown, contractor qualifications, and scoring in your dashboard.
        </Text>
      </Section>
    </EmailLayout>
  );
}
