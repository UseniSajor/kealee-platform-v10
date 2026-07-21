#!/usr/bin/env node

/**
 * Simpler approach: Just print the vercel env add commands you need to run
 */

import crypto from "crypto";

const CRON_SECRET = crypto.randomBytes(32).toString("hex");
const KEALEE_OPS_SECRET = crypto.randomBytes(32).toString("hex");

console.log("🔐 Here are your auto-generated secrets:\n");

console.log("Copy and paste each command into your terminal:\n");

console.log(`vercel env add CRON_SECRET "${CRON_SECRET}" --yes\n`);
console.log(`vercel env add KEALEE_OPS_SECRET "${KEALEE_OPS_SECRET}" --yes\n`);

console.log("\nOR add manually in Vercel Dashboard:");
console.log("1. Go to: https://vercel.com/dashboard → web-main → Settings → Environment Variables");
console.log("2. Add Variable → CRON_SECRET → " + CRON_SECRET.substring(0, 20) + "...");
console.log("3. Add Variable → KEALEE_OPS_SECRET → " + KEALEE_OPS_SECRET.substring(0, 20) + "...");

console.log("\n✅ Save these values!");
