import type { NextApiRequest, NextApiResponse } from 'next';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const serviceMap: Record<string, string> = {
  design_concept: 'interior_reno_concept',
  cost_estimate: 'cost_estimate',
  permit_path_only: 'permit_path_only',
  full_preconstruction: 'design_estimate_permit_bundle',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    name,
    email,
    phone,
    service,
    projectType,
    location,
    projectStage,
    timeline,
    message,
    source,
    landingPath,
    referrer,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
  } = req.body ?? {};

  if (!name || !emailPattern.test(String(email)) || !location || !projectType || !projectStage) {
    return res.status(400).json({ error: 'Please complete all required project fields.' });
  }

  const platformUrl = process.env.PLATFORM_LEAD_API_URL
    || (process.env.PLATFORM_WEB_URL ? `${process.env.PLATFORM_WEB_URL.replace(/\/$/, '')}/api/leads/marketing` : '');

  if (!platformUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[marketing lead preview]', { name, email, service, projectType, location });
      return res.status(200).json({ success: true, preview: true });
    }
    return res.status(503).json({ error: 'Lead service is temporarily unavailable.' });
  }

  const projectNotes = [
    message,
    `Project type: ${projectType}`,
    `Current stage: ${projectStage}`,
    timeline ? `Desired start: ${timeline}` : '',
    landingPath ? `Landing path: ${landingPath}` : '',
    referrer ? `Referrer: ${referrer}` : '',
    utm_content ? `UTM content: ${utm_content}` : '',
  ].filter(Boolean).join('\n');

  try {
    const response = await fetch(platformUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.MARKETING_BOT_API_KEY
          ? { 'x-marketing-bot-key': process.env.MARKETING_BOT_API_KEY }
          : {}),
      },
      body: JSON.stringify({
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : undefined,
        projectInterest: serviceMap[service] || 'design_estimate_permit_bundle',
        location: String(location).trim(),
        message: projectNotes,
        source: source || 'preconstruction_campaign',
        utm_source,
        utm_medium,
        utm_campaign,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('[marketing lead] platform rejected request', response.status, result);
      return res.status(502).json({ error: 'We could not submit your request. Please try again.' });
    }

    return res.status(200).json({ success: true, leadId: result.leadId });
  } catch (error) {
    console.error('[marketing lead] platform request failed', error);
    return res.status(502).json({ error: 'We could not submit your request. Please try again.' });
  }
}
