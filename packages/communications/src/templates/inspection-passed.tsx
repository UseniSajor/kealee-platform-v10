import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface InspectionPassedEmailProps {
  clientName: string;
  projectName: string;
  inspectionType: string;
  inspectionDate: string;
  projectId: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#16a34a', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };
const successBanner = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px 20px', textAlign: 'center' as const, marginBottom: '24px' };

export function InspectionPassedEmail({ clientName, projectName, inspectionType, inspectionDate, projectId }: InspectionPassedEmailProps) {
  return (
    <EmailLayout preview={`Inspection passed: ${inspectionType} — ${projectName}`} projectName={projectName}>
      <Section style={content}>
        <Section style={successBanner}>
          <Text style={{ fontSize: '20px', fontWeight: '700', color: '#166534', margin: '0' }}>
            Inspection Passed
          </Text>
        </Section>

        <Text style={paragraph}>
          Great news, {clientName}! Your project has passed its latest inspection.
        </Text>

        <Hr style={divider} />

        <Text style={heading2}>Inspection Details</Text>
        <Text style={detailRow}><span style={detailLabel}>Project:</span> {projectName}</Text>
        <Text style={detailRow}><span style={detailLabel}>Inspection Type:</span> {inspectionType}</Text>
        <Text style={detailRow}><span style={detailLabel}>Date:</span> {inspectionDate}</Text>
        <Text style={detailRow}><span style={detailLabel}>Result:</span> <span style={{ color: '#16a34a', fontWeight: '600' }}>Passed</span></Text>

        <Hr style={divider} />

        <Text style={paragraph}>
          This means your project is on track and meeting all required building codes and standards. Work will continue as scheduled.
        </Text>

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/projects/${projectId}/status`} style={ctaButton}>
            View Project Status
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
}
