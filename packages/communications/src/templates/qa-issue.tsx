import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface QAIssueEmailProps {
  contractorName: string;
  projectName: string;
  issueDescription: string;
  severity: 'HIGH' | 'CRITICAL';
  recommendedCorrection: string;
  deadline: string;
  issueId: string;
  projectId: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#dc2626', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };
const severityBadge = (sev: string) => ({
  display: 'inline-block',
  backgroundColor: sev === 'CRITICAL' ? '#fef2f2' : '#fefce8',
  color: sev === 'CRITICAL' ? '#991b1b' : '#854d0e',
  padding: '4px 10px',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: '700',
});
const correctionBox = { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px 20px', marginBottom: '16px' };

export function QAIssueEmail({ contractorName, projectName, issueDescription, severity, recommendedCorrection, deadline, issueId, projectId }: QAIssueEmailProps) {
  return (
    <EmailLayout preview={`${severity} QA issue found on ${projectName}`} projectName={projectName}>
      <Section style={content}>
        <Text style={{ ...paragraph, fontSize: '18px', fontWeight: '600' }}>
          QA Issue Detected
        </Text>
        <Text style={paragraph}>
          Hi {contractorName}, a quality inspection on your project has identified an issue that requires correction.
        </Text>

        <Hr style={divider} />

        <Text style={heading2}>Issue Details</Text>
        <Text style={detailRow}>
          <span style={detailLabel}>Severity:</span>{' '}
          <span style={severityBadge(severity)}>{severity}</span>
        </Text>
        <Text style={detailRow}><span style={detailLabel}>Description:</span> {issueDescription}</Text>
        <Text style={detailRow}><span style={detailLabel}>Deadline for Fix:</span> {deadline}</Text>

        <Hr style={divider} />

        <Text style={heading2}>Recommended Correction</Text>
        <Section style={correctionBox}>
          <Text style={{ fontSize: '14px', color: '#1e40af', margin: '0', lineHeight: '22px' }}>
            {recommendedCorrection}
          </Text>
        </Section>

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/projects/${projectId}/qa/${issueId}`} style={ctaButton}>
            View Issue Details
          </Button>
        </Section>

        <Text style={{ ...paragraph, marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
          Failure to address this issue by the deadline may result in project delays and payment holds.
        </Text>
      </Section>
    </EmailLayout>
  );
}
