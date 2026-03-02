import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface ConceptPackageConfirmationEmailProps {
  customerName: string;
  packageName: string;
  packageTier: string;
  amount: string;
  orderId?: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };
const confirmBox = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '20px', textAlign: 'center' as const, marginBottom: '24px' };
const stepItem = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };

export function ConceptPackageConfirmationEmail({
  customerName,
  packageName,
  packageTier,
  amount,
  orderId,
}: ConceptPackageConfirmationEmailProps) {
  return (
    <EmailLayout preview={`Your ${packageName} order is confirmed!`}>
      <Section style={content}>
        <Section style={confirmBox}>
          <Text style={{ fontSize: '28px', margin: '0 0 4px' }}>
            &#10003;
          </Text>
          <Text style={{ fontSize: '20px', fontWeight: '700', color: '#166534', margin: '0' }}>
            Order Confirmed
          </Text>
          <Text style={{ fontSize: '13px', color: '#16a34a', margin: '4px 0 0' }}>
            Payment received successfully
          </Text>
        </Section>

        <Text style={paragraph}>
          Hi {customerName}, thank you for your purchase! Your concept package order has been
          confirmed and our team is preparing your deliverables.
        </Text>

        <Text style={heading2}>Order Details</Text>
        <Text style={detailRow}><span style={detailLabel}>Package:</span> {packageName}</Text>
        <Text style={detailRow}><span style={detailLabel}>Tier:</span> {packageTier}</Text>
        <Text style={detailRow}><span style={detailLabel}>Amount:</span> {amount}</Text>
        {orderId && (
          <Text style={detailRow}><span style={detailLabel}>Order:</span> #{orderId.slice(-8).toUpperCase()}</Text>
        )}

        <Hr style={divider} />

        <Text style={heading2}>What Happens Next</Text>
        <Text style={stepItem}>1. Our AI generates your custom design concept (2-4 hours)</Text>
        <Text style={stepItem}>2. Our team reviews and refines the deliverables</Text>
        <Text style={stepItem}>3. You receive an email when your package is ready to download</Text>
        <Text style={stepItem}>4. Access your files anytime from your Kealee dashboard</Text>

        <Hr style={divider} />

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/dashboard`} style={ctaButton}>
            Go to Your Dashboard
          </Button>
        </Section>

        <Text style={{ ...paragraph, marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
          Questions about your order? Call us at (301) 575-8777 or reply to this email.
        </Text>
      </Section>
    </EmailLayout>
  );
}
