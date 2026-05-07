/**
 * GoHighLevel (GHL) API Client
 *
 * All functions are typed, throw on HTTP errors, and return typed responses.
 * Use GHL_LOCATION_ID and GHL_API_KEY from environment variables.
 *
 * Base URL: https://services.leadconnectorhq.com
 */

const GHL_BASE        = 'https://services.leadconnectorhq.com'
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID ?? ''
const GHL_API_KEY     = process.env.GHL_API_KEY      ?? ''

// ── Common types ──────────────────────────────────────────────────────────────

export interface GhlContact {
  id:          string
  email:       string
  firstName?:  string
  lastName?:   string
  phone?:      string
  locationId:  string
  tags?:       string[]
  customFields?: Record<string, string>
}

export interface GhlOpportunity {
  id:          string
  name:        string
  pipelineId:  string
  stageId:     string
  status:      string
  contactId:   string
  monetaryValue?: number
}

// ── Internal helper ───────────────────────────────────────────────────────────

async function ghlFetch<T>(
  method:  'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path:    string,
  body?:   Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${GHL_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Content-Type':  'application/json',
      'Version':       '2021-07-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`GHL ${method} ${path} → ${res.status}: ${text}`)
  }

  return res.json() as Promise<T>
}

// ── 1. createOrUpdateContact ──────────────────────────────────────────────────

export interface CreateContactInput {
  email:      string
  firstName?: string
  lastName?:  string
  phone?:     string
  source?:    string
  tags?:      string[]
  customFields?: { key: string; field_value: string }[]
}

/**
 * Search for an existing contact by email; PATCH if found, POST if not.
 * Returns the contact record either way.
 */
export async function createOrUpdateContact(
  input: CreateContactInput,
): Promise<GhlContact> {
  // Search first
  const searchRes = await ghlFetch<{ contacts: GhlContact[] }>(
    'GET',
    `/contacts/search?email=${encodeURIComponent(input.email)}&locationId=${GHL_LOCATION_ID}`,
  )

  const existing = searchRes.contacts?.[0]

  const payload: Record<string, unknown> = {
    locationId:   GHL_LOCATION_ID,
    email:        input.email,
    firstName:    input.firstName,
    lastName:     input.lastName,
    phone:        input.phone,
    source:       input.source ?? 'kealee-web',
    tags:         input.tags ?? [],
    customFields: input.customFields ?? [],
  }

  if (existing) {
    const updated = await ghlFetch<{ contact: GhlContact }>(
      'PATCH',
      `/contacts/${existing.id}`,
      payload,
    )
    return updated.contact
  }

  const created = await ghlFetch<{ contact: GhlContact }>(
    'POST',
    '/contacts/',
    payload,
  )
  return created.contact
}

// ── 2. tagContact ─────────────────────────────────────────────────────────────

/**
 * Add tags to a contact (appends; does not replace existing tags).
 */
export async function tagContact(
  contactId: string,
  tags:      string[],
): Promise<GhlContact> {
  const res = await ghlFetch<{ contact: GhlContact }>(
    'POST',
    `/contacts/${contactId}/tags`,
    { tags },
  )
  return res.contact
}

// ── 3. updateContactField ─────────────────────────────────────────────────────

/**
 * Update a single custom field on a contact by key name.
 */
export async function updateContactField(
  contactId:  string,
  fieldKey:   string,
  fieldValue: string,
): Promise<GhlContact> {
  const res = await ghlFetch<{ contact: GhlContact }>(
    'PATCH',
    `/contacts/${contactId}`,
    {
      locationId:   GHL_LOCATION_ID,
      customFields: [{ key: fieldKey, field_value: fieldValue }],
    },
  )
  return res.contact
}

// ── 4. triggerWorkflow ────────────────────────────────────────────────────────

export interface TriggerWorkflowInput {
  contactId:  string
  workflowId: string
  /** Optional key-value event data passed into the workflow */
  eventData?: Record<string, string>
}

export interface TriggerWorkflowResult {
  success: boolean
  workflowId: string
  contactId:  string
}

export async function triggerWorkflow(
  input: TriggerWorkflowInput,
): Promise<TriggerWorkflowResult> {
  await ghlFetch<unknown>(
    'POST',
    `/contacts/${input.contactId}/workflow/${input.workflowId}`,
    { eventData: input.eventData ?? {} },
  )
  return { success: true, workflowId: input.workflowId, contactId: input.contactId }
}

// ── 5. sendSMS ────────────────────────────────────────────────────────────────

export interface SendSMSInput {
  contactId: string
  message:   string
  /** GHL conversation ID (optional; creates a new conversation if absent) */
  conversationId?: string
}

export interface SendSMSResult {
  messageId: string
  status:    string
}

export async function sendSMS(input: SendSMSInput): Promise<SendSMSResult> {
  const res = await ghlFetch<{ messageId: string; status: string }>(
    'POST',
    '/conversations/messages',
    {
      type:           'SMS',
      contactId:      input.contactId,
      locationId:     GHL_LOCATION_ID,
      message:        input.message,
      conversationId: input.conversationId,
    },
  )
  return { messageId: res.messageId, status: res.status ?? 'sent' }
}

// ── 6. sendEmail ──────────────────────────────────────────────────────────────

export interface SendEmailInput {
  contactId: string
  subject:   string
  html:      string
  fromName?: string
  fromEmail?: string
}

export interface SendEmailResult {
  messageId: string
  status:    string
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const res = await ghlFetch<{ messageId: string; status: string }>(
    'POST',
    '/conversations/messages',
    {
      type:       'Email',
      contactId:  input.contactId,
      locationId: GHL_LOCATION_ID,
      subject:    input.subject,
      html:       input.html,
      fromName:   input.fromName  ?? 'Kealee',
      fromEmail:  input.fromEmail ?? 'hello@kealee.com',
    },
  )
  return { messageId: res.messageId, status: res.status ?? 'sent' }
}

// ── 7. createOpportunity ──────────────────────────────────────────────────────

export interface CreateOpportunityInput {
  contactId:      string
  name:           string
  pipelineId:     string
  pipelineStageId: string
  status?:        'open' | 'won' | 'lost' | 'abandoned'
  monetaryValue?: number
  source?:        string
}

export async function createOpportunity(
  input: CreateOpportunityInput,
): Promise<GhlOpportunity> {
  const res = await ghlFetch<{ opportunity: GhlOpportunity }>(
    'POST',
    '/opportunities/',
    {
      locationId:      GHL_LOCATION_ID,
      name:            input.name,
      pipelineId:      input.pipelineId,
      pipelineStageId: input.pipelineStageId,
      status:          input.status ?? 'open',
      contactId:       input.contactId,
      monetaryValue:   input.monetaryValue ?? 0,
      source:          input.source ?? 'kealee-web',
    },
  )
  return res.opportunity
}

// ── 8. moveOpportunityStage ───────────────────────────────────────────────────

export async function moveOpportunityStage(
  opportunityId: string,
  newStageId:    string,
): Promise<GhlOpportunity> {
  const res = await ghlFetch<{ opportunity: GhlOpportunity }>(
    'PUT',
    `/opportunities/${opportunityId}`,
    { pipelineStageId: newStageId },
  )
  return res.opportunity
}
