import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

interface AccountSetupEmailProps {
  customerName: string;
  setupUrl: string;
  packageName?: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '14px 28px', borderRadius: '6px', fontWeight: '700', fontSize: '15px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const setupBox = { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '20px', textAlign: 'center' as const, marginBottom: '24px' };

export function AccountSetupEmail({
  customerName,
  setupUrl,
  packageName,
}: AccountSetupEmailProps) {
  return (
    <EmailLayout preview="Set up your Kealee dashboard account">
      <Section style={content}>
        <Section style={setupBox}>
          <Text style={{ fontSize: '28px', margin: '0 0 4px' }}>
            {'\ud83d\udd11'}
          </Text>
          <Text style={{ fontSize: '20px', fontWeight: '700', color: '#1e40af', margin: '0' }}>
            Set Up Your Account
          </Text>
        </Section>

        <Text style={paragraph}>
          Hi {customerName}, your Kealee account has been created!
        </Text>

        {packageName && (
          <Text style={paragraph}>
            Your <strong>{packageName}</strong> is being generated and will be ready soon.
            Set up your password below to access your dashboard, track your order, and manage your projects.
          </Text>
        )}

        {!packageName && (
          <Text style={paragraph}>
            Set up your password to access your Kealee dashboard, track orders, and manage projects.
          </Text>
        )}

        <Hr style={divider} />

        <Text style={heading2}>What you can do in your dashboard:</Text>

        <Text style={{ ...paragraph, paddingLeft: '16px' }}>
          {'\u2705'} Track your concept package delivery<br />
          {'\u2705'} Start new construction projects<br />
          {'\u2705'} Get AI-generated design concepts<br />
          {'\u2705'} Connect with verified contractors
        </Text>

        <Hr style={divider} />

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={setupUrl} style={ctaButton}>
            Set Up Your Password
          </Button>
        </Section>

        <Text style={{ ...paragraph, marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
          This link expires in 24 hours. If you didn&apos;t make a purchase on Kealee, you can ignore this email.
        </Text>

        <Text style={{ ...paragraph, fontSize: '13px', color: '#64748b' }}>
          Questions? Call us at (301) 575-8777 or reply to this email.
        </Text>
      </Section>
    </EmailLayout>
  );
}
