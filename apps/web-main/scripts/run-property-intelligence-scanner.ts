/**
 * Outbound Property Intelligence Scanner CLI Tool
 *
 * Scans the database/assessor parcel records for product fits (ADUs, additions, remodels)
 * and exports marketing data packages for Direct Mail (Postcards), Twilio SMS, and Resend Emails.
 *
 * From repo root:
 *   pnpm --filter web-main exec tsx scripts/run-property-intelligence-scanner.ts
 *   pnpm --filter web-main exec tsx scripts/run-property-intelligence-scanner.ts --dry-run
 */
import { existsSync, readFileSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '../../../packages/database/src/index';
import { sendSMS, sendEmail } from '../../../packages/communications/src/index';

const webMainRoot = path.join(__dirname, '..');
const outputDir = path.join(webMainRoot, 'public', 'media', 'campaigns', 'design-permit');
const proofsDir = path.join(outputDir, 'postcard-proofs');
const isDryRun = process.argv.includes('--dry-run');

// Load environment variables
for (const name of ['.env.local', '.env.vercel.production', '.env']) {
  const envPath = path.join(webMainRoot, name);
  if (!existsSync(envPath)) continue;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    if (!process.env[key]) {
      process.env[key] = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
}

// Ensure the local env DATABASE_URL is set in process.env so prisma client connects correctly
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres.rkreqfpkxavqpsqexbfs:mFGurIiScT9AlMw8@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=20';
}

// Recommended Concept 1 Ribbon logo SVG for Postcards
const LOGO_SVG_RIBBON = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" style="width: 150px; height: auto;">
  <g transform="translate(12, 10)">
    <rect x="15" y="5" width="14" height="50" rx="7" fill="#2563EB" />
    <path d="M 22 28 C 36 28, 42 5, 54 5" fill="none" stroke="#F97316" stroke-width="12" stroke-linecap="round" />
    <path d="M 22 32 C 36 32, 42 55, 54 55" fill="none" stroke="#8B5CF6" stroke-width="12" stroke-linecap="round" />
  </g>
  <text x="88" y="52" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="bold" font-size="38" fill="#1E293B" letter-spacing="-1px">kealee</text>
</svg>
`;

async function runScan() {
  console.log('🚀 [property-intelligence] Initiating GIS Outbound Marketing Scanner...');
  await mkdir(outputDir, { recursive: true });
  await mkdir(proofsDir, { recursive: true });

  let dbParcels = [];

  try {
    console.log('[property-intelligence] Querying Prisma database parcels...');
    dbParcels = await prisma.parcel.findMany({
      include: {
        zoning: true,
      },
    });

    console.log(`✅ [property-intelligence] Successfully queried ${dbParcels.length} assessor records from PostgreSQL.`);
  } catch (err: any) {
    console.error('❌ [property-intelligence] Failed to query parcels database:', err.message);
    process.exit(1);
  }

  const directMailTargets: any[] = [];
  const smsTargets: any[] = [];
  const emailTargets: any[] = [];

  console.log(`🔍 [property-intelligence] Scanning ${dbParcels.length} properties for product-fit categories...`);

  for (const p of dbParcels) {
    // Unpack ownerContact info
    const contact = (p.ownerContact as any) || {};
    const ownerName = contact.name || p.currentOwner || 'Property Owner';
    const email = contact.email || null;
    const phone = contact.phone || null;
    const ownerAddress = contact.address || p.address || '';

    // Unpack scoringFactors characteristics
    const factors = (p.scoringFactors as any) || {};
    const yearBuilt = factors.yearBuilt || 1980;
    const lotCoveragePct = factors.lotCoveragePct || 30;
    const stories = factors.stories || 1;
    const lastSoldDateStr = factors.lastSoldDate || null;
    const structureSize = factors.structureSize || 2000;
    const hasCodeViolations = factors.hasCodeViolations || false;
    const hasUnpermittedWork = factors.hasUnpermittedWork || false;
    const overlay = factors.overlay || 'None';

    const lotSize = p.squareFeet ? Number(p.squareFeet) : 5000;
    const zoningRelation = p.zoning && p.zoning.length > 0 ? p.zoning[0] : null;
    const zoningCode = zoningRelation?.zoningCode || 'R-1';
    const zoningDesc = zoningRelation?.zoningDesc || 'Residential District';

    let productMatch = '';
    let productSlug = '';
    let reason = '';
    let price = 395;

    // Last sold date check
    let daysSinceSale = 9999;
    if (lastSoldDateStr) {
      const soldDate = new Date(lastSoldDateStr);
      const diffTime = Math.abs(new Date().getTime() - soldDate.getTime());
      daysSinceSale = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // 1. Rule: Permit package & coordination (Critical environmental overlay or violations)
    if (overlay.toLowerCase().includes('rpa') || overlay.toLowerCase().includes('chesapeake') || hasCodeViolations || hasUnpermittedWork) {
      productMatch = 'Zoning Permit Package & Coordination';
      productSlug = 'permit-package';
      reason = `Property has critical environmental overlays (${overlay}) or active code violations requiring zoning coordination.`;
      price = 1150;
    }
    // 2. Rule: ADU & Tiny Home (large lot, low coverage, residential zoning)
    else if (lotSize > 6000 && lotCoveragePct < 25 && zoningCode.startsWith('R')) {
      productMatch = 'Accessory Dwelling Unit (ADU)';
      productSlug = 'adu';
      reason = `Large lot size (${lotSize} sq ft) and low coverage (${lotCoveragePct}%) fit by-right backyard cottage density rules.`;
      price = 395;
    }
    // 3. Rule: New Build (vacant lot or very small house on huge lot built long ago)
    else if (p.currentUse === 'vacant' || (lotSize > 8000 && structureSize < 800 && yearBuilt < 1950)) {
      productMatch = 'New Home Construction';
      productSlug = 'new-build';
      reason = `Lot is vacant or highly underutilized (structure ${structureSize} sq ft on ${lotSize} sq ft lot), perfect for teardown/new build.`;
      price = 857;
    }
    // 4. Rule: Historic Renovation (old property in historic overlay)
    else if (yearBuilt < 1940 && (overlay.toLowerCase().includes('historic') || overlay.toLowerCase().includes('hp'))) {
      productMatch = 'Historic Renovation Concept';
      productSlug = 'historic-renovation';
      reason = `Pre-war property (built ${yearBuilt}) located in a designated Historic Preservation Overlay district.`;
      price = 585;
    }
    // 5. Rule: Whole Home Renovation (older home recently sold)
    else if (yearBuilt < 1985 && daysSinceSale <= 180) {
      productMatch = 'Whole Home Gut Renovation';
      productSlug = 'whole-home';
      reason = `Older home (built ${yearBuilt}) recently purchased (${daysSinceSale} days ago), highly likely to undergo major interior remodel.`;
      price = 585;
    }
    // 6. Rule: Basement Renovation (multi-story residential built before 2010)
    else if (stories > 1 && zoningCode.startsWith('R') && yearBuilt < 2010) {
      productMatch = 'Basement Renovation Concept';
      productSlug = 'basement';
      reason = `Multi-story home (built ${yearBuilt}) with potential for finished lower-level walk-out conversions.`;
      price = 395;
    }
    // 7. Rule: Garden & Landscape (large open yard area)
    else if (lotSize > 5000 && lotCoveragePct < 40) {
      productMatch = 'Custom Landscaping & Yard Design';
      productSlug = 'landscape';
      reason = `Generous open space (${100 - lotCoveragePct}% open yard) suitable for custom landscape architecture.`;
      price = 534;
    }
    // 8. Rule: Kitchen & Bath Remodel (all other older single family)
    else {
      productMatch = 'Kitchen & Bathroom Remodel';
      productSlug = 'kitchen-remodel';
      reason = `Older residential layout (built ${yearBuilt}) ready for interior design updates.`;
      price = 395;
    }

    const campaignUrl = `https://kealee.com/campaigns/design-permit?apn=${p.parcelNumber}&product=${productSlug}&utm_source=outbound_direct_mail&utm_medium=postcard&utm_campaign=property_intelligence_scanner`;

    const targetInfo = {
      apn: p.parcelNumber,
      ownerName,
      address: p.address,
      city: p.city,
      state: p.state,
      zipCode: p.zipCode,
      productMatch,
      productSlug,
      reason,
      price,
      campaignUrl,
      email,
      phone,
      ownerAddress,
      jurisdiction: p.county || p.city || 'local'
    };

    directMailTargets.push(targetInfo);

    if (phone) {
      smsTargets.push(targetInfo);
    }

    if (email) {
      emailTargets.push(targetInfo);
    }
  }

  // 1. Write Direct Mail CSV
  const csvHeader = 'APN,OwnerName,Address,City,State,Zip,MailingAddress,ProductMatch,EstPrice,Reason,CampaignUrl\n';
  const csvRows = directMailTargets.map(t =>
    `"${t.apn}","${t.ownerName}","${t.address}","${t.city}","${t.state}","${t.zipCode}","${t.ownerAddress}","${t.productMatch}","$${t.price}","${t.reason}","${t.campaignUrl}"`
  ).join('\n');

  const csvPath = path.join(outputDir, 'direct-mail-export.csv');
  await writeFile(csvPath, csvHeader + csvRows, 'utf8');
  console.log(`\n📬 [property-intelligence] Exported ${directMailTargets.length} direct-mail records to CSV: ${csvPath}`);

  // 2. Generate Postcard HTML Proofs (Lob Mock/Simulations)
  console.log(`🖼️  [property-intelligence] Generating Lob physical postcard HTML proofs to: ${proofsDir}`);
  for (const t of directMailTargets) {
    const frontHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; background: #0B0F19; color: #FFFFFF; width: 600px; height: 400px; box-sizing: border-box; overflow: hidden; position: relative; }
    .card-content { padding: 40px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; }
    .badge { background: #F97316; color: white; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; align-self: flex-start; margin-bottom: 20px; letter-spacing: 1px; }
    h1 { font-size: 26px; font-weight: 800; line-height: 1.2; margin: 0 0 10px 0; color: #F8FAFC; letter-spacing: -0.5px; }
    p.sub { font-size: 14px; color: #94A3B8; margin: 0 0 20px 0; line-height: 1.5; }
    .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #1E293B; padding-top: 20px; }
    .footer-left { font-size: 12px; color: #64748B; }
    .footer-right { font-weight: bold; color: #2563EB; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card-content">
    <div class="badge">Zoning Qualification Notice</div>
    <div>
      <h1>Outbound Lot Check: ${t.address}</h1>
      <p class="sub">${t.ownerName}, we completed a GIS scanner review of your property. It qualifies for a <strong>${t.productMatch}</strong> by-right under ${t.jurisdiction} code rules.</p>
    </div>
    <div class="footer">
      <div class="footer-left">Zoning Scanner: ${t.reason}</div>
      <div class="footer-right">Starting at $${t.price}</div>
    </div>
  </div>
</body>
</html>
    `;

    const backHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; background: #FFFFFF; color: #1E293B; width: 600px; height: 400px; box-sizing: border-box; overflow: hidden; }
    .container { display: flex; height: 100%; box-sizing: border-box; }
    .left-col { width: 55%; padding: 30px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; border-right: 1px dashed #CBD5E1; }
    .right-col { width: 45%; padding: 30px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; background: #F8FAFC; }
    .logo { margin-bottom: 20px; }
    h2 { font-size: 16px; margin: 0 0 10px 0; font-weight: bold; color: #0F172A; }
    ul { padding-left: 15px; margin: 0; font-size: 12px; color: #475569; }
    li { margin-bottom: 8px; }
    .address-block { margin-top: auto; font-size: 13px; line-height: 1.4; color: #334155; }
    .qr-block { text-align: center; font-size: 10px; color: #64748B; margin-top: 10px; }
    .stamp-box { border: 1px solid #94A3B8; width: 65px; height: 65px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94A3B8; text-align: center; text-transform: uppercase; border-radius: 4px; margin-left: auto; }
  </style>
</head>
<body>
  <div class="container">
    <div class="left-col">
      <div>
        <div class="logo">${LOGO_SVG_RIBBON}</div>
        <h2>Unlock Your Land's Potential</h2>
        <ul>
          <li><strong>By-Right Verification:</strong> 100% compliant with local setbacks and lot coverage guidelines.</li>
          <li><strong>Pre-Mapped Design Options:</strong> Instant AI layout concepts tailored to your boundaries.</li>
          <li><strong>Stripe Integration:</strong> Start your design and zoning brief securely online.</li>
        </ul>
      </div>
      <div style="font-size: 10px; color: #94A3B8;">Zoning scan ID: ${t.apn}</div>
    </div>
    <div class="right-col">
      <div class="stamp-box">Postage<br>Required</div>
      <div class="address-block">
        <strong>${t.ownerName}</strong><br>
        ${t.ownerAddress.split(',').join('<br>')}
      </div>
      <div class="qr-block">
        <div style="background: #E2E8F0; width: 60px; height: 60px; margin: 0 auto 5px auto; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px;">[QR]</div>
        Scan to view your customized zoning analysis layout:<br>
        <a href="${t.campaignUrl}" style="color: #2563EB; font-size: 9px; word-break: break-all;">${t.campaignUrl.slice(0, 45)}...</a>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await writeFile(path.join(proofsDir, `${t.apn}-front.html`), frontHtml.trim(), 'utf8');
    await writeFile(path.join(proofsDir, `${t.apn}-back.html`), backHtml.trim(), 'utf8');
  }

  // 3. Dispatch Twilio SMS outreach
  console.log(`\n💬 [property-intelligence] Dispatching SMS Outreach Queue (${smsTargets.length} targets)...`);
  for (const s of smsTargets) {
    const textMsg = `Hi ${s.ownerName}, we ran a zoning analysis on ${s.address} and noticed it qualifies for a ${s.productMatch} by-right. View your custom design options: ${s.campaignUrl}`;

    if (isDryRun) {
      console.log(`   [DRY-RUN] Would send SMS to: ${s.phone} | Msg: "${textMsg.slice(0, 80)}..."`);
    } else {
      const activeTwilio = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;
      if (activeTwilio) {
        try {
          const res = await sendSMS({ to: s.phone, body: textMsg });
          console.log(`   ✅ [SMS:SENT] To: ${s.phone} | Twilio SID: ${res.messageSid}`);
        } catch (err: any) {
          console.error(`   ❌ [SMS:FAILED] To: ${s.phone} | Error:`, err.message);
        }
      } else {
        console.log(`   [SMS:SIMULATION] (Missing Twilio key) To: ${s.phone} | Msg: "${textMsg.slice(0, 80)}..."`);
      }
    }
  }

  // 4. Dispatch Resend Email outreach
  console.log(`\n✉️ [property-intelligence] Dispatching Email Outreach Queue (${emailTargets.length} targets)...`);
  for (const e of emailTargets) {
    const emailHtml = `
      <h1>Outbound Lot Design Qualification Report</h1>
      <p>Dear ${e.ownerName},</p>
      <p>We completed an automated property assessment of your parcel at <strong>${e.address}</strong>.</p>
      <p>Under local ${e.jurisdiction} zoning guidelines, your lot qualifies for a <strong>${e.productMatch}</strong> by-right. Below are the details:</p>
      <ul>
        <li><strong>Parcel Number (APN):</strong> ${e.apn}</li>
        <li><strong>Identified Opportunity:</strong> ${e.productMatch}</li>
        <li><strong>Zoning Context:</strong> ${e.reason}</li>
      </ul>
      <p>You can unlock and view your pre-designed layout concept package online here:</p>
      <p><a href="${e.campaignUrl}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Custom Zoning Report</a></p>
      <br>
      <p>Best regards,</p>
      <p>The Kealee Property Intelligence Engine Team</p>
    `;

    if (isDryRun) {
      console.log(`   [DRY-RUN] Would send Email to: ${e.email} | Subject: "Zoning Report for ${e.address}"`);
    } else {
      const activeResend = process.env.RESEND_API_KEY;
      if (activeResend) {
        try {
          const res = await sendEmail({
            to: e.email,
            subject: `Zoning Scan Qualification Report for ${e.address}`,
            html: emailHtml,
          });
          console.log(`   ✅ [EMAIL:SENT] To: ${e.email} | Resend Message ID: ${res.messageId}`);
        } catch (err: any) {
          console.error(`   ❌ [EMAIL:FAILED] To: ${e.email} | Error:`, err.message);
        }
      } else {
        console.log(`   [EMAIL:SIMULATION] (Missing Resend key) To: ${e.email} | Subject: "Zoning Report for ${e.address}"`);
      }
    }
  }

  console.log('\n✅ [property-intelligence] GIS Outbound campaign sync complete.');
}

runScan()
  .catch((err) => {
    console.error('[property-intelligence] Scanner error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
