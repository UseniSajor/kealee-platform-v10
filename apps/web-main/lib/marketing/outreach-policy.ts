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

export interface ContactWindowInput {
  now: Date
  timezone: string
  startHour?: number
  endHour?: number
  allowedWeekdays?: number[]
}

export interface ContactWindowDecision {
  withinWindow: boolean
  nextAllowedAt: Date
  localWeekday: number
  localHour: number
}

function localParts(at: Date, timezone: string): { weekday: number; hour: number; minute: number } {
  const values = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at).reduce<Record<string, string>>((result, part) => {
    result[part.type] = part.value
    return result
  }, {})
  const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return { weekday: weekdays[values.weekday], hour: Number(values.hour), minute: Number(values.minute) }
}

/** DST-safe contact window calculation using the contact's IANA timezone. */
export function calculateContactWindow(input: ContactWindowInput): ContactWindowDecision {
  const startHour = input.startHour ?? 9
  const endHour = input.endHour ?? 20
  const allowedWeekdays = input.allowedWeekdays ?? [1, 2, 3, 4, 5, 6]
  if (startHour < 0 || endHour > 24 || startHour >= endHour) throw new Error('Invalid contact window')

  const isAllowed = (at: Date) => {
    const local = localParts(at, input.timezone)
    const localMinutes = local.hour * 60 + local.minute
    return allowedWeekdays.includes(local.weekday)
      && localMinutes >= startHour * 60
      && localMinutes < endHour * 60
  }

  const current = localParts(input.now, input.timezone)
  if (isAllowed(input.now)) {
    return { withinWindow: true, nextAllowedAt: input.now, localWeekday: current.weekday, localHour: current.hour }
  }

  const candidate = new Date(input.now)
  candidate.setUTCSeconds(0, 0)
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1)
  for (let minute = 0; minute < 8 * 24 * 60; minute += 1) {
    if (isAllowed(candidate)) {
      const local = localParts(candidate, input.timezone)
      return { withinWindow: false, nextAllowedAt: candidate, localWeekday: local.weekday, localHour: local.hour }
    }
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1)
  }
  throw new Error('No allowed contact window exists in the next eight days')
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
  if (input.channel === 'call_task' && input.consentStatus !== 'granted') {
    blocking.push('Phone outreach requires affirmative consent')
  }

  if (blocking.length) return { allowed: false, executionMode: 'blocked', reasons: [...blocking, ...approval] }
  if (approval.length) return { allowed: false, executionMode: 'approval_required', reasons: approval }
  return { allowed: true, executionMode: 'automatic', reasons: ['All outreach policy checks passed'] }
}
