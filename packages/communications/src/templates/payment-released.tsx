import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface PaymentReleasedEmailProps {
  contractorName: string;
  projectName: string;
  milestoneName: string;
  amount: string;
  payoutDate: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };
const amountBox = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '20px', textAlign: 'center' as const, marginBottom: '24px' };

export function PaymentReleasedEmail({ contractorName, projectName, milestoneName, amount, payoutDate }: PaymentReleasedEmailProps) {
  return (
    <EmailLayout preview={`Payment of ${amount} released for ${projectName}`} projectName={projectName}>
      <Section style={content}>
        <Text style={{ ...paragraph, fontSize: '18px', fontWeight: '600' }}>
          Payment Released
        </Text>
        <Text style={paragraph}>
          Hi {contractorName}, a payment has been released for your completed work.
        </Text>

        <Section style={amountBox}>
          <Text style={{ fontSize: '32px', fontWeight: '700', color: '#166534', margin: '0' }}>
            {amount}
          </Text>
          <Text style={{ fontSize: '13px', color: '#16a34a', margin: '4px 0 0' }}>
            Released from escrow
          </Text>
        </Section>

        <Text style={heading2}>Details</Text>
        <Text style={detailRow}><span style={detailLabel}>Project:</span> {projectName}</Text>
        <Text style={detailRow}><span style={detailLabel}>Milestone:</span> {milestoneName}</Text>
        <Text style={detailRow}><span style={detailLabel}>Expected Payout:</span> {payoutDate}</Text>

        <Hr style={divider} />

        <Text style={paragraph}>
          Funds will be deposited to your linked bank account per your Stripe Connect payout schedule.
        </Text>

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/contractor/payouts`} style={ctaButton}>
            View Payout Details
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
}
