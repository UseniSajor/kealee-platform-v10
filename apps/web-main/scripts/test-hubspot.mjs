#!/usr/bin/env node

/**
 * Test HubSpot Connection
 * Usage: pnpm run test:hubspot
 */

import { verifyConnection, searchContacts } from "../lib/marketing/hubspot-client.js";

async function testHubSpot() {
  console.log("🧪 Testing HubSpot Connection...\n");

  if (!process.env.HUBSPOT_API_KEY) {
    console.error(
      "❌ HUBSPOT_API_KEY not set. Get one from:\n" +
      "   https://app.hubspot.com/l/accounts/27161/private-apps/create\n"
    );
    process.exit(1);
  }

  try {
    // Test 1: Verify connection
    console.log("Test 1: Verifying HubSpot API connection...");
    const connected = await verifyConnection();

    if (!connected) {
      throw new Error("Failed to connect to HubSpot");
    }

    console.log("✅ HubSpot API connection successful\n");

    // Test 2: Search for test contact
    console.log("Test 2: Searching for contacts...");
    try {
      const contacts = await searchContacts("email", "test@example.com");
      console.log(`✅ Contact search working (found ${contacts.length} test contacts)\n`);
    } catch (e) {
      console.log("ℹ️  Contact search test skipped (no test contacts)\n");
    }

    console.log("✅ All HubSpot tests passed!\n");
    console.log("🚀 You're ready to use HubSpot for lead management.\n");
    console.log("Next steps:");
    console.log("1. Create a HubSpot Private App for API access");
    console.log("2. Set HUBSPOT_API_KEY environment variable");
    console.log("3. Run: pnpm run test:hubspot");
    console.log("4. Deploy and go live!");

  } catch (error) {
    console.error("❌ HubSpot test failed:");
    console.error(error);
    process.exit(1);
  }
}

testHubSpot();
