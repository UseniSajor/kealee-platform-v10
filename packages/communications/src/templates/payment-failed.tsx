import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface PaymentFailedEmailProps {
  userName: string;
  failureType: string;
  amount: string;
  impact: string;
  billingUrl?: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const ctaButton = { backgroundColor: '#dc2626', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };
const alertBox = { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px' };

export function PaymentFailedEmail({ userName, failureType, amount, impact, billingUrl }: PaymentFailedEmailProps) {
  return (
    <EmailLayout preview={`Payment failed — action required`}>
      <Section style={content}>
        <Section style={alertBox}>
          <Text style={{ fontSize: '18px', fontWeight: '700', color: '#991b1b', margin: '0 0 4px' }}>
            Payment Failed
          </Text>
          <Text style={{ fontSize: '14px', color: '#b91c1c', margin: '0' }}>
            Immediate action required
          </Text>
        </Section>

        <Text style={paragraph}>
          Hi {userName}, we were unable to process your payment.
        </Text>

        <Text style={detailRow}><span style={detailLabel}>What failed:</span> {failureType}</Text>
        <Text style={detailRow}><span style={detailLabel}>Amount:</span> {amount}</Text>

        <Hr style={divider} />

        <Text style={{ ...paragraph, fontWeight: '600' }}>
          Impact
        </Text>
        <Text style={paragraph}>
          {impact}
        </Text>

        <Hr style={divider} />

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={billingUrl || `${APP_URL}/billing`} style={ctaButton}>
            Update Payment Method
          </Button>
        </Section>

        <Text style={{ ...paragraph, marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
          If you believe this is an error, please contact support@kealee.com.
        </Text>
      </Section>
    </EmailLayout>
  );
}
