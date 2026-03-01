/**
 * GHL Contact Service
 *
 * Create, update, search, and tag contacts in GoHighLevel CRM.
 */

import { ghlGet, ghlPost, ghlPut, GHL_LOCATION_ID } from './ghl-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GhlContact {
  id: string;
  locationId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  tags?: string[];
  customFields?: Array<{ id: string; value: string }>;
  dateAdded?: string;
  dateUpdated?: string;
}

export interface CreateContactInput {
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  tags?: string[];
  customFields?: Array<{ id: string; field_value: string }>;
  source?: string;
}

export interface UpdateContactInput {
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  tags?: string[];
  customFields?: Array<{ id: string; field_value: string }>;
}

// ---------------------------------------------------------------------------
// Service methods
// ---------------------------------------------------------------------------

/**
 * Search for a GHL contact by email address.
 * Returns the first matching contact or null.
 */
export async function findContactByEmail(email: string): Promise<GhlContact | null> {
  const result = await ghlGet<{ contacts: GhlContact[] }>('/contacts/search/duplicate', {
    locationId: GHL_LOCATION_ID,
    email,
  });
  return result.contacts?.[0] ?? null;
}

/**
 * Create a new contact in GHL.
 * Always includes the locationId automatically.
 */
export async function createContact(input: CreateContactInput): Promise<GhlContact> {
  const result = await ghlPost<{ contact: GhlContact }>('/contacts/', {
    locationId: GHL_LOCATION_ID,
    ...input,
  });
  return result.contact;
}

/**
 * Update an existing GHL contact by ID.
 */
export async function updateContact(contactId: string, input: UpdateContactInput): Promise<GhlContact> {
  const result = await ghlPut<{ contact: GhlContact }>(`/contacts/${contactId}`, {
    ...input,
  });
  return result.contact;
}

/**
 * Add tags to a GHL contact.
 */
export async function addTags(contactId: string, tags: string[]): Promise<void> {
  await ghlPost(`/contacts/${contactId}/tags`, { tags });
}

/**
 * Remove a tag from a GHL contact.
 */
export async function removeTag(contactId: string, tag: string): Promise<void> {
  // GHL API: DELETE /contacts/{contactId}/tags with body
  await ghlPost(`/contacts/${contactId}/tags/remove`, { tags: [tag] });
}

/**
 * Create or update a contact (upsert by email).
 * Checks if contact exists first; if so, updates. Otherwise creates.
 * Returns the contact and whether it was newly created.
 */
export async function upsertContact(input: CreateContactInput): Promise<{ contact: GhlContact; created: boolean }> {
  const existing = await findContactByEmail(input.email);
  if (existing) {
    const updated = await updateContact(existing.id, input);
    return { contact: updated, created: false };
  }
  const created = await createContact(input);
  return { contact: created, created: true };
}
