import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Hr, Link, Preview } from '@react-email/components';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

interface EmailLayoutProps {
  preview?: string;
  projectName?: string;
  children: React.ReactNode;
}

const main = { backgroundColor: '#f4f4f5', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', borderRadius: '8px', overflow: 'hidden' as const, maxWidth: '600px' };
const header = { backgroundColor: '#1e293b', padding: '24px 32px', textAlign: 'center' as const };
const logo = { color: '#ffffff', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px', margin: '0' };
const projectLabel = { color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' };
const footer = { padding: '24px 32px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' as const };
const footerText = { fontSize: '12px', color: '#64748b', margin: '0 0 8px' };
const footerLinks = { fontSize: '11px', color: '#94a3b8', margin: '0' };

export function EmailLayout({ preview, projectName, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Kealee</Text>
            {projectName && <Text style={projectLabel}>{projectName}</Text>}
          </Section>

          {children}

          <Section style={footer}>
            <Text style={footerText}>Powered by Kealee — Construction Project Management</Text>
            <Text style={footerLinks}>
              <Link href={`${APP_URL}/privacy`} style={{ color: '#94a3b8' }}>Privacy Policy</Link>
              {' · '}
              <Link href={`${APP_URL}/unsubscribe`} style={{ color: '#94a3b8' }}>Unsubscribe</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
