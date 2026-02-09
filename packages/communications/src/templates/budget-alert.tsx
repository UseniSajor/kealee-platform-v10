import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface BudgetAlertEmailProps {
  pmName: string;
  projectName: string;
  category: string;
  overrunAmount: string;
  overrunPercent: string;
  alertLevel: 'WARNING' | 'CRITICAL';
  projectId: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };

const ALERT_STYLES = {
  WARNING: {
    banner: { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px 20px', textAlign: 'center' as const, marginBottom: '24px' },
    title: { fontSize: '20px', fontWeight: '700', color: '#92400e', margin: '0' },
    label: 'Budget Warning',
  },
  CRITICAL: {
    banner: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px 20px', textAlign: 'center' as const, marginBottom: '24px' },
    title: { fontSize: '20px', fontWeight: '700', color: '#991b1b', margin: '0' },
    label: 'Critical Budget Alert',
  },
};

export function BudgetAlertEmail({ pmName, projectName, category, overrunAmount, overrunPercent, alertLevel, projectId }: BudgetAlertEmailProps) {
  const styles = ALERT_STYLES[alertLevel];

  return (
    <EmailLayout preview={`${styles.label}: ${category} over budget by ${overrunPercent} — ${projectName}`} projectName={projectName}>
      <Section style={content}>
        <Section style={styles.banner}>
          <Text style={styles.title}>
            {styles.label}
          </Text>
        </Section>

        <Text style={paragraph}>
          Hi {pmName}, a budget overrun has been detected on {projectName}. Immediate review is recommended{alertLevel === 'CRITICAL' ? ' — this is a critical threshold breach' : ''}.
        </Text>

        <Hr style={divider} />

        <Text style={heading2}>Overrun Details</Text>
        <Text style={detailRow}><span style={detailLabel}>Project:</span> {projectName}</Text>
        <Text style={detailRow}><span style={detailLabel}>Category:</span> {category}</Text>
        <Text style={detailRow}><span style={detailLabel}>Overrun Amount:</span> <span style={{ fontWeight: '600', color: alertLevel === 'CRITICAL' ? '#991b1b' : '#b45309' }}>{overrunAmount}</span></Text>
        <Text style={detailRow}><span style={detailLabel}>Overrun Percent:</span> <span style={{ fontWeight: '600', color: alertLevel === 'CRITICAL' ? '#991b1b' : '#b45309' }}>{overrunPercent}</span></Text>
        <Text style={detailRow}><span style={detailLabel}>Severity:</span> <span style={{ fontWeight: '600', color: alertLevel === 'CRITICAL' ? '#991b1b' : '#b45309' }}>{alertLevel}</span></Text>

        <Hr style={divider} />

        <Text style={paragraph}>
          Review the budget breakdown and consider adjustments such as reallocating contingency funds or initiating value engineering to bring costs back in line.
        </Text>

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/projects/${projectId}/budget`} style={ctaButton}>
            Review Budget
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
}
