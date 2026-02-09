import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface InspectionFailedEmailProps {
  contractorName: string;
  projectName: string;
  inspectionType: string;
  failureReason: string;
  reinspectionDeadline: string;
  projectId: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };
const alertBanner = { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px 20px', textAlign: 'center' as const, marginBottom: '24px' };
const failureBox = { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px' };

export function InspectionFailedEmail({ contractorName, projectName, inspectionType, failureReason, reinspectionDeadline, projectId }: InspectionFailedEmailProps) {
  return (
    <EmailLayout preview={`Inspection failed: ${inspectionType} — ${projectName}`} projectName={projectName}>
      <Section style={content}>
        <Section style={alertBanner}>
          <Text style={{ fontSize: '20px', fontWeight: '700', color: '#991b1b', margin: '0' }}>
            Inspection Failed
          </Text>
        </Section>

        <Text style={paragraph}>
          Hi {contractorName}, the recent inspection for {projectName} did not pass. Corrective action is required before the reinspection deadline.
        </Text>

        <Hr style={divider} />

        <Text style={heading2}>Inspection Details</Text>
        <Text style={detailRow}><span style={detailLabel}>Project:</span> {projectName}</Text>
        <Text style={detailRow}><span style={detailLabel}>Inspection Type:</span> {inspectionType}</Text>
        <Text style={detailRow}><span style={detailLabel}>Reinspection Deadline:</span> <span style={{ color: '#b45309', fontWeight: '600' }}>{reinspectionDeadline}</span></Text>

        <Hr style={divider} />

        <Text style={heading2}>Failure Reason</Text>
        <Section style={failureBox}>
          <Text style={{ fontSize: '14px', lineHeight: '22px', color: '#92400e', margin: '0' }}>
            {failureReason}
          </Text>
        </Section>

        <Text style={paragraph}>
          Please address the issues noted above and schedule a reinspection before the deadline. The full inspection report with photos and details is available in your dashboard.
        </Text>

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/projects/${projectId}/inspections`} style={ctaButton}>
            View Inspection Report
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
}
