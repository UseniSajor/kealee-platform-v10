import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface ContractSignedEmailProps {
  recipientName: string;
  projectName: string;
  contractNumber: string;
  effectiveDate: string;
  projectId: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };
const stepItem = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const successBanner = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px 20px', textAlign: 'center' as const, marginBottom: '24px' };

export function ContractSignedEmail({ recipientName, projectName, contractNumber, effectiveDate, projectId }: ContractSignedEmailProps) {
  return (
    <EmailLayout preview={`Contract signed for ${projectName} — #${contractNumber}`} projectName={projectName}>
      <Section style={content}>
        <Section style={successBanner}>
          <Text style={{ fontSize: '20px', fontWeight: '700', color: '#166534', margin: '0' }}>
            Contract Signed
          </Text>
        </Section>

        <Text style={paragraph}>
          Hi {recipientName}, the contract for {projectName} has been fully executed by all parties.
        </Text>

        <Hr style={divider} />

        <Text style={heading2}>Contract Details</Text>
        <Text style={detailRow}><span style={detailLabel}>Contract #:</span> {contractNumber}</Text>
        <Text style={detailRow}><span style={detailLabel}>Project:</span> {projectName}</Text>
        <Text style={detailRow}><span style={detailLabel}>Effective Date:</span> {effectiveDate}</Text>

        <Hr style={divider} />

        <Text style={heading2}>Next Steps</Text>
        <Text style={stepItem}>1. Escrow funding will be initiated</Text>
        <Text style={stepItem}>2. Contractor mobilization can begin</Text>
        <Text style={stepItem}>3. Project schedule will be activated</Text>

        <Hr style={divider} />

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/projects/${projectId}/contracts`} style={ctaButton}>
            View Contract
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
}
