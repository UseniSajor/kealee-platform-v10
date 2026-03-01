/**
 * GHL Pipeline Setup Script
 *
 * Creates the "Kealee Construction" pipeline in GoHighLevel with 11 stages.
 * Run once during initial setup:
 *   npx tsx scripts/ghl-setup-pipeline.ts
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

const PIPELINE_STAGES = [
  { name: 'New Lead', position: 0 },
  { name: 'Qualified', position: 1 },
  { name: 'Quote Requested', position: 2 },
  { name: 'Quote Sent', position: 3 },
  { name: 'Consultation Booked', position: 4 },
  { name: 'Proposal Sent', position: 5 },
  { name: 'Contract Signed', position: 6 },
  { name: 'Permitting', position: 7 },
  { name: 'Project Active', position: 8 },
  { name: 'Punch List', position: 9 },
  { name: 'Project Complete', position: 10 },
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
  console.log('Creating Kealee Construction pipeline in GHL...');
  console.log(`Location: ${GHL_LOCATION_ID}`);
  console.log('');

  try {
    const result = await ghlPost<{ pipeline: { id: string; stages: Array<{ id: string; name: string }> } }>(
      '/opportunities/pipelines',
      {
        locationId: GHL_LOCATION_ID,
        name: 'Kealee Construction',
        stages: PIPELINE_STAGES,
      },
    );

    console.log('Pipeline created successfully!');
    console.log(`Pipeline ID: ${result.pipeline.id}`);
    console.log('');
    console.log('Stage IDs:');
    result.pipeline.stages.forEach((stage) => {
      console.log(`  ${stage.name}: ${stage.id}`);
    });
    console.log('');
    console.log('Save these IDs in your environment or config for stage transitions.');
  } catch (err: any) {
    console.error('Failed to create pipeline:', err.message);
    process.exit(1);
  }
}

main();
