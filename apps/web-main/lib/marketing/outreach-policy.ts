export type OutreachChannel = 'email' | 'sms' | 'call_task' | 'linkedin_task'

export interface OutreachPolicyInput {
  campaignStatus: string
  campaignApproved: boolean
  templateApproved: boolean
  channel: OutreachChannel
  suppressed: boolean
  optedOut: boolean
  hardBounced?: boolean
  complained?: boolean
  purchased?: boolean
  manualHold?: boolean
  duplicateMessage?: boolean
  consentStatus?: 'unknown' | 'granted' | 'denied' | 'withdrawn'
  sentToday: number
  mailboxDailyLimit: number
  domainSentToday: number
  domainDailyLimit: number
  withinSendWindow: boolean
}

export interface OutreachPolicyDecision {
  allowed: boolean
  executionMode: 'automatic' | 'approval_required' | 'blocked'
  reasons: string[]
}

export function evaluateOutreachPolicy(input: OutreachPolicyInput): OutreachPolicyDecision {
  const blocking: string[] = []
  const approval: string[] = []

  if (input.suppressed) blocking.push('Contact is on a suppression list')
  if (input.optedOut || input.consentStatus === 'withdrawn' || input.consentStatus === 'denied') {
    blocking.push('Contact has denied or withdrawn channel permission')
  }
  if (input.hardBounced) blocking.push('Contact previously hard bounced')
  if (input.complained) blocking.push('Contact previously complained')
  if (input.purchased) blocking.push('Sequence stops after purchase')
  if (input.manualHold) blocking.push('Contact or enrollment is on manual hold')
  if (input.duplicateMessage) blocking.push('Duplicate message attempt detected')
  if (input.sentToday >= input.mailboxDailyLimit) blocking.push('Mailbox daily limit reached')
  if (input.domainSentToday >= input.domainDailyLimit) blocking.push('Domain daily limit reached')
  if (!input.withinSendWindow) blocking.push('Outside approved send window')

  if (!input.campaignApproved || input.campaignStatus !== 'active') approval.push('Campaign is not approved and active')
  if (!input.templateApproved) approval.push('Template is not approved')
  if (input.channel === 'sms' && input.consentStatus !== 'granted') {
    blocking.push('SMS requires affirmative consent')
  }

  if (blocking.length) return { allowed: false, executionMode: 'blocked', reasons: [...blocking, ...approval] }
  if (approval.length) return { allowed: false, executionMode: 'approval_required', reasons: approval }
  return { allowed: true, executionMode: 'automatic', reasons: ['All outreach policy checks passed'] }
}

