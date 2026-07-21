#!/usr/bin/env node

/**
 * Add auto-generated secrets to Vercel via CLI
 */

import { execSync } from "child_process";
import crypto from "crypto";

const secrets = {
  CRON_SECRET: crypto.randomBytes(32).toString("hex"),
  KEALEE_OPS_SECRET: crypto.randomBytes(32).toString("hex"),
};

console.log("🔐 Adding auto-generated secrets to Vercel...\n");

Object.entries(secrets).forEach(([key, value]) => {
  console.log(`Adding ${key}...`);
  try {
    execSync(`vercel env add ${key} ${value} --yes`, {
      cwd: ".",
      stdio: "inherit",
    });
    console.log(`✓ ${key} added\n`);
  } catch (error) {
    console.error(`✗ Failed to add ${key}:`, error.message);
  }
});

console.log("\n✅ Secrets added! Now redeploy in Vercel:\n");
console.log("1. Go to: https://vercel.com/dashboard → web-main");
console.log("2. Click latest deployment");
console.log("3. Click 'Redeploy' button");
console.log("4. Wait for build to complete\n");

console.log("Then add your actual keys:");
console.log("- GHL_API_KEY");
console.log("- TWILIO_ACCOUNT_SID");
console.log("- SLACK webhook URLs");
console.log("\nSee ENVIRONMENT_VARIABLES_COPY_PASTE.md for where to get them\n");
