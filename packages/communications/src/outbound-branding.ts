import {
  escapeHtml,
  resolveTenantOutboundBranding,
  type TenantOutboundBrandingInput,
} from '@kealee/shared'

export interface TenantEmailEnvelope {
  from: string
  replyTo?: string
}

export interface RenderBrandedEmailOptions {
  bodyHtml: string
  projectName?: string
  branding?: TenantOutboundBrandingInput | null
}

export interface RenderBrandedDocumentOptions {
  title?: string
  branding?: TenantOutboundBrandingInput | null
}

export interface BrandedDocumentChrome {
  headerHtml: string
  footerHtml: string
}

const PLACEHOLDER = /\{\{(\w+)\}\}/g

/** Interpolate trusted template markup with HTML-escaped, tenant/user values. */
export function interpolateHtmlVariables(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(PLACEHOLDER, (_, key: string) => {
    const value = variables[key]
    return value === undefined ? `{{${key}}}` : escapeHtml(value)
  })
}

/** Interpolate a non-HTML field while removing email-header control characters. */
export function interpolateTextVariables(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(PLACEHOLDER, (_, key: string) => {
    const value = variables[key]
    return value === undefined ? `{{${key}}}` : value.replace(/[\r\n\u0000]/g, ' ')
  })
}

/**
 * Resolve the provider envelope without touching provider credentials.
 * Full white-label tenants fail closed instead of silently sending from Kealee.
 */
export function resolveTenantEmailEnvelope(
  input?: TenantOutboundBrandingInput | null,
): TenantEmailEnvelope {
  const brand = resolveTenantOutboundBranding(input)
  if (!brand.emailFrom) {
    throw new Error('A verified tenant emailFrom address is required when Kealee branding is hidden.')
  }

  const from = brand.emailFrom.includes('<') || !brand.emailSenderName
    ? brand.emailFrom
    : `${brand.emailSenderName} <${brand.emailFrom}>`
  return { from, ...(brand.emailReplyTo ? { replyTo: brand.emailReplyTo } : {}) }
}

/**
 * Render the shared table-based layout used by stored HTML templates.
 * bodyHtml must contain approved template markup; dynamic variables should be
 * passed through interpolateHtmlVariables before calling this function.
 */
export function renderBrandedEmailHtml({
  bodyHtml,
  projectName,
  branding,
}: RenderBrandedEmailOptions): string {
  const brand = resolveTenantOutboundBranding(branding)
  const companyName = escapeHtml(brand.companyName)
  const productName = escapeHtml(brand.productName)
  const safeProjectName = projectName ? escapeHtml(projectName) : null
  const logo = brand.logoUrl
    ? `<img src="${escapeHtml(brand.logoUrl)}" alt="${companyName}" width="160" style="display:block; max-width:160px; max-height:56px; margin:0 auto;" />`
    : `<span style="font-size:24px; font-weight:700; color:#ffffff; letter-spacing:-0.5px;">${companyName}</span>`
  const projectLabel = safeProjectName
    ? `<br/><span style="font-size:13px; color:#ffffff; opacity:0.76; margin-top:4px; display:inline-block;">${safeProjectName}</span>`
    : ''
  const support = brand.supportEmail
    ? `<p style="margin:0 0 8px; font-size:12px; color:#64748b;">Support: ${escapeHtml(brand.supportEmail)}</p>`
    : ''
  const legal = brand.legalDisclaimer
    ? `<p style="margin:8px 0; font-size:11px; color:#64748b;">${escapeHtml(brand.legalDisclaimer)}</p>`
    : ''
  const attribution = brand.attributionText
    ? `<p style="margin:0 0 8px; font-size:12px; color:#64748b;">${escapeHtml(brand.attributionText)} &mdash; Construction Project Management</p>`
    : ''
  const links = [
    brand.privacyUrl
      ? `<a href="${escapeHtml(brand.privacyUrl)}" style="color:#64748b;">Privacy Policy</a>`
      : null,
    brand.unsubscribeUrl
      ? `<a href="${escapeHtml(brand.unsubscribeUrl)}" style="color:#64748b;">Unsubscribe</a>`
      : null,
  ].filter((value): value is string => Boolean(value)).join(' &middot; ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${productName}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background-color:${brand.primaryColor}; padding:24px 32px; text-align:center;">
              ${logo}${projectLabel}
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">${bodyHtml}</td>
          </tr>
          <tr>
            <td style="padding:24px 32px; background-color:#f8fafc; border-top:1px solid #e2e8f0; text-align:center;">
              ${attribution}${support}${legal}
              ${links ? `<p style="margin:8px 0 0; font-size:11px; color:#64748b;">${links}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Safe HTML fragments for PDF, report, proposal, and document renderers. */
export function renderBrandedDocumentChrome({
  title,
  branding,
}: RenderBrandedDocumentOptions = {}): BrandedDocumentChrome {
  const brand = resolveTenantOutboundBranding(branding)
  const companyName = escapeHtml(brand.companyName)
  const logo = brand.logoUrl
    ? `<img src="${escapeHtml(brand.logoUrl)}" alt="${companyName}" style="max-width:180px; max-height:64px;" />`
    : `<strong>${companyName}</strong>`
  const documentTitle = title ? `<h1>${escapeHtml(title)}</h1>` : ''
  const customFooter = brand.reportFooter
    ? `<span>${escapeHtml(brand.reportFooter)}</span>`
    : ''
  const legal = brand.legalDisclaimer
    ? `<small>${escapeHtml(brand.legalDisclaimer)}</small>`
    : ''
  const attribution = brand.attributionText
    ? `<small>${escapeHtml(brand.attributionText)}</small>`
    : ''

  return {
    headerHtml: `<header style="border-bottom:2px solid ${brand.primaryColor};"><div>${logo}</div><p>${escapeHtml(brand.reportHeader)}</p>${documentTitle}</header>`,
    footerHtml: `<footer style="border-top:1px solid ${brand.secondaryColor};">${customFooter}${legal}${attribution}</footer>`,
  }
}
