import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface BidAcceptedEmailProps {
  contractorName: string;
  projectName: string;
  projectAddress: string;
  bidAmount: string;
  contractId: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#16a34a', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };
const stepItem = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const successBanner = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px 20px', textAlign: 'center' as const, marginBottom: '24px' };

export function BidAcceptedEmail({ contractorName, projectName, projectAddress, bidAmount, contractId }: BidAcceptedEmailProps) {
  return (
    <EmailLayout preview={`Congratulations! Your bid was accepted for ${projectName}`} projectName={projectName}>
      <Section style={content}>
        <Section style={successBanner}>
          <Text style={{ fontSize: '20px', fontWeight: '700', color: '#166534', margin: '0' }}>
            Bid Accepted!
          </Text>
        </Section>

        <Text style={paragraph}>
          Congratulations, {contractorName}! Your bid has been selected for this project.
        </Text>

        <Text style={heading2}>Project Summary</Text>
        <Text style={detailRow}><span style={detailLabel}>Project:</span> {projectName}</Text>
        <Text style={detailRow}><span style={detailLabel}>Location:</span> {projectAddress}</Text>
        <Text style={detailRow}><span style={detailLabel}>Accepted Bid:</span> {bidAmount}</Text>

        <Hr style={divider} />

        <Text style={heading2}>Next Steps</Text>
        <Text style={stepItem}>1. Review the contract details</Text>
        <Text style={stepItem}>2. Sign the contract electronically</Text>
        <Text style={stepItem}>3. Escrow will be funded after signing</Text>
        <Text style={stepItem}>4. Begin work per the project schedule</Text>

        <Hr style={divider} />

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/contracts/${contractId}`} style={ctaButton}>
            Review &amp; Sign Contract
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
}
