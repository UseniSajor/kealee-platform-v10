import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface ScheduleDisruptionEmailProps {
  pmName: string;
  projectName: string;
  disruptionType: string;
  impactDays: number;
  affectedMilestones: string[];
  projectId: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };
const alertBanner = { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px 20px', textAlign: 'center' as const, marginBottom: '24px' };
const milestoneItem = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 6px', paddingLeft: '12px' };

export function ScheduleDisruptionEmail({ pmName, projectName, disruptionType, impactDays, affectedMilestones, projectId }: ScheduleDisruptionEmailProps) {
  return (
    <EmailLayout preview={`Schedule disruption: ${disruptionType} — ${impactDays}-day impact on ${projectName}`} projectName={projectName}>
      <Section style={content}>
        <Section style={alertBanner}>
          <Text style={{ fontSize: '20px', fontWeight: '700', color: '#92400e', margin: '0' }}>
            Schedule Disruption Detected
          </Text>
        </Section>

        <Text style={paragraph}>
          Hi {pmName}, a schedule disruption has been detected on {projectName} that may delay upcoming milestones.
        </Text>

        <Hr style={divider} />

        <Text style={heading2}>Disruption Details</Text>
        <Text style={detailRow}><span style={detailLabel}>Project:</span> {projectName}</Text>
        <Text style={detailRow}><span style={detailLabel}>Disruption Type:</span> {disruptionType}</Text>
        <Text style={detailRow}><span style={detailLabel}>Estimated Impact:</span> <span style={{ fontWeight: '600', color: '#b45309' }}>{impactDays} day{impactDays !== 1 ? 's' : ''}</span></Text>

        <Hr style={divider} />

        <Text style={heading2}>Affected Milestones</Text>
        {affectedMilestones.map((milestone, i) => (
          <Text key={i} style={milestoneItem}>
            &bull; {milestone}
          </Text>
        ))}

        <Hr style={divider} />

        <Text style={paragraph}>
          Review the updated schedule and consider mitigation options such as resource reallocation, overtime scheduling, or scope adjustments to minimize project delays.
        </Text>

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/projects/${projectId}/schedule`} style={ctaButton}>
            Review Schedule
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
}
