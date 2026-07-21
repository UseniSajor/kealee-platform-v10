import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface DecisionNeededEmailProps {
  recipientName: string;
  decisionType: string;
  decisionTitle: string;
  aiRecommendation: string;
  projectName: string;
  projectId: string;
  decisionId: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };
const aiBox = { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px' };

export function DecisionNeededEmail({ recipientName, decisionType, decisionTitle, aiRecommendation, projectName, projectId, decisionId }: DecisionNeededEmailProps) {
  return (
    <EmailLayout preview={`Decision needed: ${decisionTitle} — ${projectName}`} projectName={projectName}>
      <Section style={content}>
        <Text style={{ ...paragraph, fontSize: '20px', fontWeight: '600' }}>
          Decision Required
        </Text>
        <Text style={paragraph}>
          Hi {recipientName}, a new decision card has been created that requires your input.
        </Text>

        <Hr style={divider} />

        <Text style={heading2}>Decision Details</Text>
        <Text style={detailRow}><span style={detailLabel}>Type:</span> {decisionType}</Text>
        <Text style={detailRow}><span style={detailLabel}>Title:</span> {decisionTitle}</Text>

        <Hr style={divider} />

        <Text style={heading2}>AI Recommendation</Text>
        <Section style={aiBox}>
          <Text style={{ fontSize: '14px', lineHeight: '22px', color: '#1e40af', margin: '0' }}>
            {aiRecommendation}
          </Text>
        </Section>

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/projects/${projectId}/decisions/${decisionId}`} style={ctaButton}>
            Make Decision Now
          </Button>
        </Section>

        <Text style={{ ...paragraph, marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
          Timely decisions help keep your project on track. Review the full context and options in your dashboard.
        </Text>
      </Section>
    </EmailLayout>
  );
}
