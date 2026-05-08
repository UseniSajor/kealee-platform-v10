/**
 * Slack Notifications
 *
 * Sends lead updates and daily digests to Slack
 */

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL ?? ''

export interface SlackLeadNotification {
  leadId: string
  leadName: string
  leadService: string
  leadBudget: string
  leadScore: number
  routingTag: string
  ghlLink?: string
}

/**
 * Send lead notification to Slack
 */
export async function sendLeadToSlack(lead: SlackLeadNotification): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('Slack not configured')
    return false
  }

  try {
    const color =
      lead.routingTag === 'hot' ? '#FF4444' :
      lead.routingTag === 'medium' ? '#FFD700' :
      '#999999'

    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🆕 ${lead.routingTag.toUpperCase()} Lead: ${lead.leadName}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Service:*\n${lead.leadService}`,
            },
            {
              type: 'mrkdwn',
              text: `*Budget:*\n${lead.leadBudget}`,
            },
            {
              type: 'mrkdwn',
              text: `*Lead Score:*\n${lead.leadScore}/100`,
            },
            {
              type: 'mrkdwn',
              text: `*Tag:*\n${lead.routingTag}`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📊 View in GHL',
                emoji: true,
              },
              url: lead.ghlLink || '#',
              action_id: 'view_ghl',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📞 Call',
                emoji: true,
              },
              action_id: 'call_lead',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '⏭️ Skip',
                emoji: true,
              },
              action_id: 'skip_lead',
              style: 'danger',
            },
          ],
        },
      ],
    }

    const res = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      throw new Error(`Slack error: ${res.status}`)
    }

    return true
  } catch (err) {
    console.error('Error sending Slack notification:', err)
    return false
  }
}

/**
 * Send daily lead digest to Slack
 */
export async function sendDailyLeadDigest(leads: SlackLeadNotification[]): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) return false

  try {
    const hotCount = leads.filter((l) => l.routingTag === 'hot').length
    const mediumCount = leads.filter((l) => l.routingTag === 'medium').length

    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `📊 Daily Lead Digest (${leads.length} new)`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔥 Hot: ${hotCount} | ⚡ Medium: ${mediumCount}`,
          },
        },
        {
          type: 'divider',
        },
        ...leads.slice(0, 5).map((lead) => ({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${lead.leadName}* (${lead.routingTag})\n${lead.leadService} | ${lead.leadBudget} | Score: ${lead.leadScore}`,
          },
        })),
      ],
    }

    const res = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return res.ok
  } catch (err) {
    console.error('Error sending Slack digest:', err)
    return false
  }
}
