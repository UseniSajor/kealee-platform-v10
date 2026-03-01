/**
 * GHL Custom Fields Setup Script
 *
 * Creates Kealee-specific custom fields in GoHighLevel.
 * Run once during initial setup:
 *   npx tsx scripts/ghl-setup-fields.ts
 *
 * Requires: GHL_API_KEY, GHL_LOCATION_ID, GHL_BASE_URL
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../services/api/.env.local') });

const GHL_BASE_URL = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';
const GHL_API_KEY = process.env.GHL_API_KEY || '';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || '';

if (!GHL_API_KEY || !GHL_LOCATION_ID) {
  console.error('Missing GHL_API_KEY or GHL_LOCATION_ID. Set them in services/api/.env.local');
  process.exit(1);
}

const CUSTOM_FIELDS = [
  { name: 'Kealee User ID', dataType: 'TEXT', placeholder: 'Kealee platform user ID' },
  { name: 'Project Type', dataType: 'SINGLE_OPTIONS', options: ['Residential', 'Commercial', 'Renovation', 'New Build', 'Addition', 'Multifamily'] },
  { name: 'Project Budget', dataType: 'MONETARY', placeholder: 'Estimated project budget' },
  { name: 'Service Area', dataType: 'SINGLE_OPTIONS', options: ['DC', 'Maryland', 'Virginia', 'Baltimore', 'Other'] },
  { name: 'Kealee Package', dataType: 'SINGLE_OPTIONS', options: ['PM Basic', 'PM Professional', 'PM Enterprise', 'Arch Basic', 'Arch Premium', 'PO Starter', 'PO Pro', 'Permit Basic', 'Permit Complex', 'Ops', 'Estimation'] },
  { name: 'KeaBot Lead Score', dataType: 'NUMBER', placeholder: '0-100' },
  { name: 'Last Purchase Date', dataType: 'DATE', placeholder: 'Last Stripe purchase' },
  { name: 'Total Spent', dataType: 'MONETARY', placeholder: 'Lifetime Stripe spend' },
  { name: 'Stripe Customer ID', dataType: 'TEXT', placeholder: 'cus_xxx' },
];

async function ghlPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${GHL_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GHL_API_KEY}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function main() {
  console.log('Creating Kealee custom fields in GHL...');
  console.log(`Location: ${GHL_LOCATION_ID}`);
  console.log('');

  const results: Array<{ name: string; id: string }> = [];

  for (const field of CUSTOM_FIELDS) {
    try {
      const body: Record<string, unknown> = {
        name: field.name,
        dataType: field.dataType,
        model: 'contact',
        locationId: GHL_LOCATION_ID,
      };
      if (field.placeholder) body.placeholder = field.placeholder;
      if ('options' in field && field.options) body.options = field.options;

      const result = await ghlPost<{ customField: { id: string; name: string } }>(
        '/locations/customFields',
        body,
      );

      results.push({ name: result.customField.name, id: result.customField.id });
      console.log(`  Created: ${field.name} -> ${result.customField.id}`);
    } catch (err: any) {
      console.error(`  Failed: ${field.name} - ${err.message}`);
    }
  }

  console.log('');
  console.log('Custom Field IDs:');
  results.forEach((r) => console.log(`  ${r.name}: ${r.id}`));
  console.log('');
  console.log('Save these IDs for use in GHL sync operations.');
}

main();
