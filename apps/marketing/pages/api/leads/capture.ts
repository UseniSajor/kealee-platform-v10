import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, projectType, source } = req.body;

  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          projectType,
          source,
          timestamp: new Date().toISOString()
        })
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing lead:', error);
    return res.status(500).json({ error: 'Failed to process lead' });
  }
}