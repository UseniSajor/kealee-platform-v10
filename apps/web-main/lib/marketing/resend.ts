const FROM_MARKETING = 'Kealee <hello@kealee.com>'

export async function sendMarketingEmail(opts: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_MARKETING,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.text ? { text: opts.text } : {}),
      }),
    })
    return res.ok
  } catch {
    return false
  }
}
