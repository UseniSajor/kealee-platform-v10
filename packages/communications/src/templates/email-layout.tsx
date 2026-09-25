import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Link, Preview, Img } from '@react-email/components';
import {
  resolveTenantOutboundBranding,
  type TenantOutboundBrandingInput,
} from '@kealee/shared';

export interface EmailLayoutProps {
  preview?: string;
  projectName?: string;
  branding?: TenantOutboundBrandingInput;
  children: React.ReactNode;
}

const EmailBrandingContext = React.createContext<TenantOutboundBrandingInput | undefined>(undefined);

export function EmailBrandingProvider({
  branding,
  children,
}: {
  branding?: TenantOutboundBrandingInput;
  children: React.ReactNode;
}) {
  return <EmailBrandingContext.Provider value={branding}>{children}</EmailBrandingContext.Provider>;
}

const main = { backgroundColor: '#f4f4f5', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', borderRadius: '8px', overflow: 'hidden' as const, maxWidth: '600px' };
const logo = { color: '#ffffff', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px', margin: '0' };
const logoImage = { display: 'block', maxWidth: '160px', maxHeight: '56px', margin: '0 auto' };
const projectLabel = { color: '#ffffff', opacity: 0.76, fontSize: '13px', margin: '4px 0 0' };
const footer = { padding: '24px 32px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' as const };
const footerText = { fontSize: '12px', color: '#64748b', margin: '0 0 8px' };
const footerLinks = { fontSize: '11px', color: '#94a3b8', margin: '0' };

export function EmailLayout({ preview, projectName, branding, children }: EmailLayoutProps) {
  const inheritedBranding = React.useContext(EmailBrandingContext);
  const brand = resolveTenantOutboundBranding(branding ?? inheritedBranding);
  const links = [
    brand.privacyUrl ? { href: brand.privacyUrl, label: 'Privacy Policy' } : null,
    brand.unsubscribeUrl ? { href: brand.unsubscribeUrl, label: 'Unsubscribe' } : null,
  ].filter((link): link is { href: string; label: string } => Boolean(link));

  return (
    <Html lang="en">
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={main}>
        <Container style={container}>
          <Section style={{ backgroundColor: brand.primaryColor, padding: '24px 32px', textAlign: 'center' }}>
            {brand.logoUrl
              ? <Img src={brand.logoUrl} alt={brand.companyName} width="160" style={logoImage} />
              : <Text style={logo}>{brand.companyName}</Text>}
            {projectName && <Text style={projectLabel}>{projectName}</Text>}
          </Section>

          {children}

          <Section style={footer}>
            {brand.attributionText && (
              <Text style={footerText}>{brand.attributionText} — Construction Project Management</Text>
            )}
            {brand.supportEmail && <Text style={footerText}>Support: {brand.supportEmail}</Text>}
            {brand.legalDisclaimer && <Text style={footerLinks}>{brand.legalDisclaimer}</Text>}
            {links.length > 0 && (
              <Text style={footerLinks}>
                {links.map((link, index) => (
                  <React.Fragment key={link.label}>
                    {index > 0 && ' · '}
                    <Link href={link.href} style={{ color: '#94a3b8' }}>{link.label}</Link>
                  </React.Fragment>
                ))}
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
