import * as React from 'react';
import { Section, Text, Button, Hr } from '@react-email/components';
import { EmailLayout } from './email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface NewLeadEmailProps {
  contractorName: string;
  projectType: string;
  location: string;
  budgetRange: string;
  tradesNeeded: string[];
  bidDeadline: string;
  leadId: string;
}

const content = { padding: '32px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' };
const heading2 = { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px' };
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' };
const divider = { borderColor: '#e2e8f0', margin: '24px 0' };
const detailRow = { fontSize: '14px', lineHeight: '22px', color: '#475569', margin: '0 0 8px' };
const detailLabel = { fontWeight: '600', color: '#1e293b' };
const badge = { display: 'inline-block', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', marginRight: '6px', marginBottom: '4px' };

export function NewLeadEmail({ contractorName, projectType, location, budgetRange, tradesNeeded, bidDeadline, leadId }: NewLeadEmailProps) {
  return (
    <EmailLayout preview={`New ${projectType} lead in ${location}`}>
      <Section style={content}>
        <Text style={{ ...paragraph, fontSize: '18px', fontWeight: '600' }}>
          New Project Lead Available
        </Text>
        <Text style={paragraph}>
          Hi {contractorName}, a new project matching your profile is looking for bids.
        </Text>

        <Hr style={divider} />

        <Text style={heading2}>Project Details</Text>
        <Text style={detailRow}><span style={detailLabel}>Type:</span> {projectType}</Text>
        <Text style={detailRow}><span style={detailLabel}>Location:</span> {location}</Text>
        <Text style={detailRow}><span style={detailLabel}>Budget Range:</span> {budgetRange}</Text>
        <Text style={detailRow}><span style={detailLabel}>Bid Deadline:</span> {bidDeadline}</Text>

        <Text style={{ ...detailRow, marginTop: '12px' }}><span style={detailLabel}>Trades Needed:</span></Text>
        <Section>
          {tradesNeeded.map((trade, i) => (
            <span key={i} style={badge}>{trade}</span>
          ))}
        </Section>

        <Hr style={divider} />

        <Section style={{ textAlign: 'center' as const }}>
          <Button href={`${APP_URL}/leads/${leadId}`} style={ctaButton}>
            View &amp; Bid on This Project
          </Button>
        </Section>

        <Text style={{ ...paragraph, marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
          Respond quickly — early bids are reviewed first.
        </Text>
      </Section>
    </EmailLayout>
  );
}
