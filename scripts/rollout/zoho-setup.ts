#!/usr/bin/env tsx
/**
 * scripts/rollout/zoho-setup.ts
 *
 * Zoho CRM production setup script.
 * Creates required custom fields in the Leads and Contacts modules.
 *
 * Run once before first deployment:
 *   ZOHO_CLIENT_ID=... ZOHO_CLIENT_SECRET=... ZOHO_REFRESH_TOKEN=... \
 *   tsx scripts/rollout/zoho-setup.ts
 *
 * What this does:
 *   1. Tests OAuth2 token refresh
 *   2. Creates custom fields in Leads module
 *   3. Creates custom fields in Contacts module
 *   4. Verifies fields are accessible via API search
 *   5. Prints field API names for reference
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const ZOHO_DOMAIN        = process.env.ZOHO_DOMAIN       || 'com';
const ZOHO_CLIENT_ID     = process.env.ZOHO_CLIENT_ID    || '';
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || '';
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || '';

const AUTH_BASE  = `https://accounts.zoho.${ZOHO_DOMAIN}`;
const CRM_BASE   = `https://www.zohoapis.${ZOHO_DOMAIN}/crm/v2`;
const META_BASE  = `https://www.zohoapis.${ZOHO_DOMAIN}/crm/v2/settings`;

if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
  console.error('❌ Missing required env: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN');
  process.exit(1);
}

// ─── Token helper ─────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const params = new URLSearchParams({
    refresh_token: ZOHO_REFRESH_TOKEN,
    client_id:     ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    grant_type:    'refresh_token',
  });

  const res = await fetch(`${AUTH_BASE}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  });

  const data = await res.json() as any;
  if (data.error) throw new Error(`Token error: ${data.error}`);
  console.log('✅ OAuth2 token refreshed successfully');
  return data.access_token;
}

// ─── Custom field definitions ─────────────────────────────────────────────────

interface ZohoFieldDef {
  field_label:  string;
  api_name:     string;   // must end in __c for custom fields
  data_type:    'Text' | 'Integer' | 'Decimal' | 'Picklist' | 'Lookup' | 'Date';
  length?:      number;
  pick_list_values?: Array<{ display_value: string; actual_value: string }>;
  tooltip?:     string;
}

const CONTRACTOR_STAGE_VALUES = [
  'Contacted',
  'Interested',
  'Registration Started',
  'Documents Uploaded',
  'Verification Pending',
  'Verified Contractor',
  'Active Contractor',
].map(v => ({ display_value: v, actual_value: v }));

const LEADS_CUSTOM_FIELDS: ZohoFieldDef[] = [
  {
    field_label:    'Contractor Stage',
    api_name:       'Contractor_Stage__c',
    data_type:      'Picklist',
    pick_list_values: CONTRACTOR_STAGE_VALUES,
    tooltip:        'Current stage in the Kealee contractor acquisition pipeline',
  },
  {
    field_label:    'Target Trade',
    api_name:       'Target_Trade__c',
    data_type:      'Text',
    length:         100,
    tooltip:        'Trade specialization targeted by GrowthBot campaign',
  },
  {
    field_label:    'Target Geo',
    api_name:       'Target_Geo__c',
    data_type:      'Text',
    length:         100,
    tooltip:        'Geographic area targeted (city, state, or region)',
  },
  {
    field_label:    'Kealee Profile Id',
    api_name:       'Kealee_Profile_Id__c',
    data_type:      'Text',
    length:         100,
    tooltip:        'Kealee MarketplaceProfile.id for this contractor',
  },
  {
    field_label:    'Kealee User Id',
    api_name:       'Kealee_User_Id__c',
    data_type:      'Text',
    length:         100,
    tooltip:        'Kealee User.id linked to this contractor',
  },
  {
    field_label:    'Shortage Score',
    api_name:       'Shortage_Score__c',
    data_type:      'Integer',
    tooltip:        'GrowthBot trade shortage score (0-100) that triggered this lead',
  },
  {
    field_label:    'Campaign Source',
    api_name:       'Campaign_Source__c',
    data_type:      'Text',
    length:         100,
    tooltip:        'Source campaign identifier (shortage_auto, self_register, etc.)',
  },
  {
    field_label:    'Registration URL',
    api_name:       'Registration_URL__c',
    data_type:      'Text',
    length:         500,
    tooltip:        'Direct registration URL sent in outreach communications',
  },
];

const CONTACTS_CUSTOM_FIELDS: ZohoFieldDef[] = [
  {
    field_label:    'Contractor Stage',
    api_name:       'Contractor_Stage__c',
    data_type:      'Picklist',
    pick_list_values: CONTRACTOR_STAGE_VALUES,
  },
  {
    field_label:    'Kealee Profile Id',
    api_name:       'Kealee_Profile_Id__c',
    data_type:      'Text',
    length:         100,
  },
  {
    field_label:    'Kealee User Id',
    api_name:       'Kealee_User_Id__c',
    data_type:      'Text',
    length:         100,
  },
  {
    field_label:    'Verification Status',
    api_name:       'Verification_Status__c',
    data_type:      'Text',
    length:         50,
  },
  {
    field_label:    'Trades',
    api_name:       'Trades__c',
    data_type:      'Text',
    length:         500,
  },
  {
    field_label:    'Service Areas',
    api_name:       'Service_Areas__c',
    data_type:      'Text',
    length:         500,
  },
];

// ─── Field creation ───────────────────────────────────────────────────────────

async function createField(
  token:    string,
  module:   string,
  field:    ZohoFieldDef,
): Promise<boolean> {
  const url = `${META_BASE}/fields?module=${module}`;

  const body: any = {
    fields: [{
      field_label:  field.field_label,
      api_name:     field.api_name,
      data_type:    field.data_type,
      ...(field.length ? { length: field.length } : {}),
      ...(field.pick_list_values ? { pick_list_values: field.pick_list_values } : {}),
      tooltip:      field.tooltip ? { name: field.tooltip, help_text: field.tooltip } : undefined,
    }],
  };

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      Authorization:  `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as any;
  const result = data.fields?.[0];

  if (result?.status === 'success' || result?.code === 'SUCCESS') {
    console.log(`  ✅  Created: ${field.api_name}`);
    return true;
  }

  // Field may already exist
  if (result?.code === 'DUPLICATE_DATA' || result?.message?.includes('already exists')) {
    console.log(`  ℹ️   Already exists: ${field.api_name} (skipped)`);
    return true;
  }

  console.warn(`  ⚠️   Field ${field.api_name}: ${result?.message ?? JSON.stringify(result)}`);
  return false;
}

// ─── Verify module fields ─────────────────────────────────────────────────────

async function verifyFields(token: string, module: string, fieldNames: string[]): Promise<void> {
  const res = await fetch(`${META_BASE}/fields?module=${module}`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  const data = await res.json() as any;
  const existingApiNames = new Set(
    (data.fields ?? []).map((f: any) => f.api_name as string),
  );

  console.log(`\n  Verifying ${module} custom fields:`);
  let allFound = true;
  for (const name of fieldNames) {
    // Zoho may strip __c suffix in some responses
    const found = existingApiNames.has(name) || existingApiNames.has(name.replace('__c', ''));
    if (found) {
      console.log(`  ✅  ${name}`);
    } else {
      console.warn(`  ❌  ${name} NOT FOUND`);
      allFound = false;
    }
  }
  if (!allFound) {
    console.warn(`\n  Some fields missing in ${module}. Check Zoho admin setup → Customization.`);
  }
}

// ─── Smoke test: create + find a test lead ────────────────────────────────────

async function testLeadCreation(token: string): Promise<void> {
  console.log('\n📋 Smoke test: create test contractor lead...');

  const res = await fetch(`${CRM_BASE}/Leads`, {
    method:  'POST',
    headers: { Authorization: `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [{
        Last_Name:              'TEST_CONTRACTOR_SMOKE',
        Email:                  `smoke-test-${Date.now()}@kealee-test.invalid`,
        Lead_Source:            'GrowthBot',
        Contractor_Stage__c:    'Contacted',
        Target_Trade__c:        'Smoke Test Trade',
        Shortage_Score__c:      99,
        Campaign_Source__c:     'smoke_test',
      }],
    }),
  });

  const data = await res.json() as any;
  const result = data.data?.[0];

  if (result?.status === 'success' || result?.code === 'SUCCESS') {
    const leadId = result.details?.id;
    console.log(`  ✅  Test lead created: ${leadId}`);
    console.log('  ⚠️   Remember to delete this test lead in Zoho CRM!');
    console.log(`  Delete: https://crm.zoho.${ZOHO_DOMAIN}/crm/org/leads/${leadId}`);
  } else {
    console.error('  ❌  Test lead creation failed:', JSON.stringify(data));
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  KEALEE ZOHO CRM PRODUCTION SETUP');
  console.log(`  Domain: zoho.${ZOHO_DOMAIN}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const token = await getToken();

  // Create Leads custom fields
  console.log('\n📋 Creating Leads module custom fields...');
  for (const field of LEADS_CUSTOM_FIELDS) {
    await createField(token, 'Leads', field);
  }

  // Create Contacts custom fields
  console.log('\n👤 Creating Contacts module custom fields...');
  for (const field of CONTACTS_CUSTOM_FIELDS) {
    await createField(token, 'Contacts', field);
  }

  // Verify both modules
  await verifyFields(token, 'Leads', LEADS_CUSTOM_FIELDS.map(f => f.api_name));
  await verifyFields(token, 'Contacts', CONTACTS_CUSTOM_FIELDS.map(f => f.api_name));

  // Smoke test
  const runSmoke = process.argv.includes('--smoke-test');
  if (runSmoke) {
    await testLeadCreation(token);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅  Zoho CRM setup complete.\n');
  console.log('Next steps:');
  console.log('  1. Set ZOHO_WEBHOOK_TOKEN in Railway env');
  console.log(`  2. Configure webhook in Zoho: https://crm.zoho.${ZOHO_DOMAIN}/crm/org/settings/automation/webhooks`);
  console.log('     URL: https://api.kealee.com/zoho/webhook');
  console.log('     Events: Leads (create, update) + Contacts (update)');
  console.log('  3. Run smoke tests: tsx scripts/rollout/smoke-test.sh');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
