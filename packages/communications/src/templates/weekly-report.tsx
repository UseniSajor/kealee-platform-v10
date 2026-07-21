import * as React from 'react';
import { Section, Text, Button, Hr, Link } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface WeeklyReportEmailProps {
  clientName: string;
  projectName: string;
  weekEnding: string;
  highlights: string[];
  budgetSpent: string;
  budgetRemaining: string;
  budgetPercent: number;
  nextWeekPreview: string[];
  reportUrl: string;
  projectId: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const bulletItem = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 6px', paddingLeft: '4px' };
const budgetBox = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 20px', marginBottom: '16px' };
const budgetLabel = { fontSize: '12px', color: '#64748b', margin: '0' };
const budgetValue = { fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '4px 0 0' };

export function WeeklyReportEmail({ clientName, projectName, weekEnding, highlights, budgetSpent, budgetRemaining, budgetPercent, nextWeekPreview, reportUrl, projectId }: WeeklyReportEmailProps) {
  return (
    <EmailLayout preview={`Weekly progress report for ${projectName} — ${weekEnding}`} projectName={projectName}>
      <Section style={content}>
        <Text style={{ ...paragraph, fontSize: '18px', fontWeight: '600' }}>
          Weekly Progress Report
        </Text>
        <Text style={paragraph}>
          Hi {clientName}, here is your weekly update for the week ending {weekEnding}.
        </Text>

        <Hr style={divider} />

        <Text style={heading2}>This Week&apos;s Highlights</Text>
        {highlights.map((item, i) => (
          <Text key={i} style={bulletItem}>• {item}</Text>
        ))}

        <Hr style={divider} />

        <Text style={heading2}>Budget Status</Text>
        <Section style={budgetBox}>
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tr>
              <td width="50%" style={{ padding: '0 8px 0 0' }}>
                <Text style={budgetLabel}>Spent</Text>
                <Text style={budgetValue}>{budgetSpent}</Text>
              </td>
              <td width="50%" style={{ padding: '0 0 0 8px' }}>
                <Text style={budgetLabel}>Remaining</Text>
                <Text style={{ ...budgetValue, color: '#16a34a' }}>{budgetRemaining}</Text>
              </td>
            </tr>
          </table>
          <Section style={{ marginTop: '12px' }}>
            <div style={{ backgroundColor: '#e2e8f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: budgetPercent > 90 ? '#ef4444' : budgetPercent > 75 ? '#f59e0b' : '#22c55e', height: '8px', width: `${Math.min(budgetPercent, 100)}%`, borderRadius: '4px' }} />
            </div>
            <Text style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0', textAlign: 'right' as const }}>
              {budgetPercent}% spent
            </Text>
          </Section>
        </Section>

        <Hr style={divider} />

        <Text style={heading2}>Next Week Preview</Text>
        {nextWeekPreview.map((item, i) => (
          <Text key={i} style={bulletItem}>• {item}</Text>
        ))}

        <Hr style={divider} />

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/projects/${projectId}/reports`} style={ctaButton}>
            View Full Report
          </Button>
        </Section>

        {reportUrl && (
          <Text style={{ ...paragraph, marginTop: '16px', fontSize: '13px', textAlign: 'center' as const }}>
            <Link href={reportUrl} style={{ color: '#2563eb' }}>Download PDF Report</Link>
          </Text>
        )}
      </Section>
    </EmailLayout>
  );
}
