import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface OrderStatusUpdateEmailProps {
  customerName: string;
  packageName: string;
  orderId: string;
  newStatus: string;
  deliveryUrl?: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const ctaButtonGreen = { backgroundColor: '#16a34a', color: '#ffffff', padding: '14px 28px', borderRadius: '6px', fontWeight: '700', fontSize: '15px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const readyBox = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '20px', textAlign: 'center' as const, marginBottom: '24px' };
const generatingBox = { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '20px', textAlign: 'center' as const, marginBottom: '24px' };

const STATUS_CONTENT: Record<string, { title: string; message: string; emoji: string }> = {
  generating: {
    title: 'Concept Generation Started',
    message: 'Our AI is now generating your custom design concept. This typically takes 2-4 hours. We\'ll email you as soon as it\'s ready.',
    emoji: '\u2728',
  },
  ready: {
    title: 'Your Concept Package is Ready!',
    message: 'Great news! Your concept package has been generated and is ready for download.',
    emoji: '\u2705',
  },
  delivered: {
    title: 'Concept Package Delivered',
    message: 'Your concept package has been delivered. You can access it anytime from your dashboard.',
    emoji: '\ud83d\udce6',
  },
};

export function OrderStatusUpdateEmail({
  customerName,
  packageName,
  orderId,
  newStatus,
  deliveryUrl,
}: OrderStatusUpdateEmailProps) {
  const statusInfo = STATUS_CONTENT[newStatus] || {
    title: 'Order Update',
    message: 'There has been an update to your order.',
    emoji: '\ud83d\udcdd',
  };

  const isReady = newStatus === 'ready' || newStatus === 'delivered';

  return (
    <EmailLayout preview={`${statusInfo.title} — ${packageName}`}>
      <Section style={content}>
        <Section style={isReady ? readyBox : generatingBox}>
          <Text style={{ fontSize: '28px', margin: '0 0 4px' }}>
            {statusInfo.emoji}
          </Text>
          <Text style={{ fontSize: '20px', fontWeight: '700', color: isReady ? '#166534' : '#1e40af', margin: '0' }}>
            {statusInfo.title}
          </Text>
        </Section>

        <Text style={paragraph}>
          Hi {customerName}, here&apos;s an update on your order.
        </Text>

        <Text style={paragraph}>{statusInfo.message}</Text>

        <Text style={{ fontSize: '14px', color: '#475569', margin: '0 0 8px' }}>
          <span style={{ fontWeight: '600', color: '#1e293b' }}>Package:</span> {packageName}
        </Text>
        <Text style={{ fontSize: '14px', color: '#475569', margin: '0 0 16px' }}>
          <span style={{ fontWeight: '600', color: '#1e293b' }}>Order:</span> #{orderId.slice(-8).toUpperCase()}
        </Text>

        <Hr style={divider} />

        <Section style={{ textAlign: 'center' as const }}>
          {deliveryUrl && isReady ? (
            <Button href={deliveryUrl} style={ctaButtonGreen}>
              Download Concept Package
            </Button>
          ) : (
            <Button href={`${APP_URL}/dashboard/orders/${orderId}`} style={ctaButton}>
              View Order Status
            </Button>
          )}
        </Section>

        <Text style={{ ...paragraph, marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
          Questions? Call us at (301) 575-8777 or reply to this email.
        </Text>
      </Section>
    </EmailLayout>
  );
}
