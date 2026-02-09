import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface WelcomeEmailProps {
  firstName: string;
  role: string;
  dashboardUrl?: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const stepItem = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };

const ROLE_NEXT_STEPS: Record<string, string[]> = {
  pm: ['Set up your first project', 'Invite your team members', 'Configure notification preferences'],
  contractor: ['Complete your company profile', 'Add licenses and insurance', 'Browse available projects'],
  homeowner: ['Create your renovation project', 'Describe your scope of work', 'Review matched contractors'],
  architect: ['Set up your portfolio', 'Configure service offerings', 'Connect with project managers'],
  default: ['Explore the platform', 'Complete your profile', 'Check your notification settings'],
};

export function WelcomeEmail({ firstName, role, dashboardUrl }: WelcomeEmailProps) {
  const steps = ROLE_NEXT_STEPS[role] || ROLE_NEXT_STEPS.default;

  return (
    <EmailLayout preview={`Welcome to Kealee, ${firstName}!`}>
      <Section style={content}>
        <Text style={{ ...paragraph, fontSize: '20px', fontWeight: '600' }}>
          Welcome to Kealee, {firstName}!
        </Text>
        <Text style={paragraph}>
          Your account is ready. Kealee streamlines construction project management
          with powerful automation, real-time collaboration, and transparent financial tracking.
        </Text>

        <Hr style={divider} />

        <Text style={heading2}>Get Started:</Text>
        {steps.map((step, i) => (
          <Text key={i} style={stepItem}>
            {i + 1}. {step}
          </Text>
        ))}

        <Hr style={divider} />

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={dashboardUrl || `${APP_URL}/dashboard`} style={ctaButton}>
            Go to Your Dashboard
          </Button>
        </Section>

        <Text style={{ ...paragraph, marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
          Need help? Reply to this email or visit our help center at {APP_URL}/help.
        </Text>
      </Section>
    </EmailLayout>
  );
}
