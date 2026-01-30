import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ============================================================================
  // 1. SERVICE PLANS (Package A-D)
  // ============================================================================
  console.log("📦 Seeding service plans...");
  const plans = [
    {
      name: "Package A",
      slug: "package-a",
      tier: "basic",
      description: "PM Staffing - Starter (Package A)",
      monthlyPrice: "1750.00",
      annualPrice: "17850.00", // 10% discount for annual
      features: ["Ops intake + planning", "Vendor shortlist", "Monthly check-ins", "Basic reporting"],
      limits: { projects: 1, serviceRequestsPerMonth: 5 },
      isActive: true,
      order: 1,
      stripeProductId: process.env.STRIPE_PRODUCT_PACKAGE_A || null, // Set in production: prod_...
      stripePriceIdMonthly: process.env.STRIPE_PRICE_PACKAGE_A_MONTHLY || null, // Set in production: price_...
      stripePriceIdAnnual: process.env.STRIPE_PRICE_PACKAGE_A_ANNUAL || null, // Optional: price_...
    },
    {
      name: "Package B",
      slug: "package-b",
      tier: "standard",
      description: "PM Staffing - Professional (Package B)",
      monthlyPrice: "4500.00", // Updated to match Stripe product
      annualPrice: "45900.00", // 10% discount for annual
      features: ["Dedicated ops support", "Weekly updates", "Permit tracking", "Vendor coordination"],
      limits: { projects: 2, serviceRequestsPerMonth: 15 },
      isActive: true,
      order: 2,
      stripeProductId: process.env.STRIPE_PRODUCT_PACKAGE_B || null, // Set in production: prod_...
      stripePriceIdMonthly: process.env.STRIPE_PRICE_PACKAGE_B_MONTHLY || null, // Set in production: price_...
      stripePriceIdAnnual: process.env.STRIPE_PRICE_PACKAGE_B_ANNUAL || null, // Optional: price_...
    },
    {
      name: "Package C",
      slug: "package-c",
      tier: "premium",
      description: "PM Staffing - Premium (Package C)",
      monthlyPrice: "8500.00", // Updated to match Stripe product
      annualPrice: "86700.00", // 10% discount for annual
      features: ["Priority response", "Full vendor ops", "Risk tracking", "Weekly reporting + escalation"],
      limits: { projects: 5, serviceRequestsPerMonth: 50 },
      isActive: true,
      order: 3,
      stripeProductId: process.env.STRIPE_PRODUCT_PACKAGE_C || null, // Set in production: prod_...
      stripePriceIdMonthly: process.env.STRIPE_PRICE_PACKAGE_C_MONTHLY || null, // Set in production: price_...
      stripePriceIdAnnual: process.env.STRIPE_PRICE_PACKAGE_C_ANNUAL || null, // Optional: price_...
    },
    {
      name: "Package D",
      slug: "package-d",
      tier: "enterprise",
      description: "PM Staffing - Enterprise (Package D)",
      monthlyPrice: "16500.00",
      annualPrice: "168300.00", // 10% discount for annual
      features: ["Multi-project program", "Custom SLA", "Program reporting", "Dedicated support channel"],
      limits: { projects: "unlimited", serviceRequestsPerMonth: "unlimited" },
      isActive: true,
      order: 4,
      stripeProductId: process.env.STRIPE_PRODUCT_PACKAGE_D || null, // Set in production: prod_...
      stripePriceIdMonthly: process.env.STRIPE_PRICE_PACKAGE_D_MONTHLY || null, // Set in production: price_...
      stripePriceIdAnnual: process.env.STRIPE_PRICE_PACKAGE_D_ANNUAL || null, // Optional: price_...
    },
  ] as const;

  for (const p of plans) {
    await prisma.servicePlan.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        tier: p.tier,
        description: p.description,
        monthlyPrice: p.monthlyPrice,
        annualPrice: p.annualPrice,
        features: p.features,
        limits: p.limits,
        isActive: p.isActive,
        order: p.order,
        stripeProductId: p.stripeProductId,
        stripePriceIdMonthly: p.stripePriceIdMonthly,
        stripePriceIdAnnual: p.stripePriceIdAnnual,
      },
      create: {
        name: p.name,
        slug: p.slug,
        tier: p.tier,
        description: p.description,
        monthlyPrice: p.monthlyPrice,
        annualPrice: p.annualPrice,
        features: p.features,
        limits: p.limits,
        isActive: p.isActive,
        order: p.order,
        stripeProductId: p.stripeProductId,
        stripePriceIdMonthly: p.stripePriceIdMonthly,
        stripePriceIdAnnual: p.stripePriceIdAnnual,
      },
    });
  }
  console.log("✅ Service plans seeded");

  // ============================================================================
  // 2. DEFAULT ROLES
  // ============================================================================
  console.log("👥 Seeding default roles...");
  const roles = [
    {
      key: "admin",
      name: "Administrator",
      description: "Full platform access and administration",
    },
    {
      key: "pm",
      name: "Project Manager",
      description: "Project management and coordination",
    },
    {
      key: "contractor",
      name: "Contractor",
      description: "Contractor access to projects and milestones",
    },
    {
      key: "architect",
      name: "Architect",
      description: "Architect access to design projects",
    },
    {
      key: "project_owner",
      name: "Project Owner",
      description: "Project owner access to their projects",
    },
    {
      key: "jurisdiction_staff",
      name: "Jurisdiction Staff",
      description: "Jurisdiction staff access to permits and inspections",
    },
    {
      key: "member",
      name: "Member",
      description: "Basic organization member",
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: {
        name: role.name,
        description: role.description,
      },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
      },
    });
  }
  console.log("✅ Default roles seeded");

  // ============================================================================
  // 3. DEFAULT PERMISSIONS
  // ============================================================================
  console.log("🔐 Seeding default permissions...");
  const permissions = [
    // Admin permissions
    { key: "admin.*", name: "Admin All", description: "Full administrative access" },
    
    // Project permissions
    { key: "project.create", name: "Create Project", description: "Create new projects" },
    { key: "project.read", name: "Read Project", description: "View project details" },
    { key: "project.update", name: "Update Project", description: "Update project information" },
    { key: "project.delete", name: "Delete Project", description: "Delete projects" },
    
    // Milestone permissions
    { key: "milestone.create", name: "Create Milestone", description: "Create project milestones" },
    { key: "milestone.approve", name: "Approve Milestone", description: "Approve milestones" },
    { key: "milestone.release_payment", name: "Release Payment", description: "Release milestone payments" },
    
    // PM permissions
    { key: "pm.assign_task", name: "Assign Task", description: "Assign tasks to team members" },
    { key: "pm.view_queue", name: "View Work Queue", description: "View PM work queue" },
    { key: "pm.generate_report", name: "Generate Report", description: "Generate PM reports" },
    
    // Contract permissions
    { key: "contract.create", name: "Create Contract", description: "Create contracts" },
    { key: "contract.sign", name: "Sign Contract", description: "Sign contracts" },
    { key: "contract.view", name: "View Contract", description: "View contract details" },
    
    // Billing permissions
    { key: "billing.view", name: "View Billing", description: "View billing information" },
    { key: "billing.manage", name: "Manage Billing", description: "Manage billing and subscriptions" },
    
    // Permit permissions
    { key: "permit.submit", name: "Submit Permit", description: "Submit permit applications" },
    { key: "permit.review", name: "Review Permit", description: "Review permit applications" },
    { key: "permit.approve", name: "Approve Permit", description: "Approve permits" },
    
    // Architect permissions
    { key: "designs.create", name: "Create Design", description: "Create design projects" },
    { key: "designs.read", name: "Read Design", description: "View design projects" },
    { key: "designs.update", name: "Update Design", description: "Update design projects" },
    { key: "designs.delete", name: "Delete Design", description: "Delete design projects" },
    { key: "designs.*", name: "All Design Permissions", description: "Full design project access" },
    
    // Bid permissions
    { key: "bids.create", name: "Submit Bid", description: "Submit contractor bids" },
    { key: "bids.read", name: "View Bid", description: "View bid details" },
    { key: "bids.update", name: "Update Bid", description: "Update bid information" },
    
    // Payment permissions
    { key: "payments.create", name: "Create Payment", description: "Create payment transactions" },
    { key: "payments.read", name: "View Payment", description: "View payment details" },
    
    // Task permissions
    { key: "tasks.create", name: "Create Task", description: "Create tasks" },
    { key: "tasks.read", name: "Read Task", description: "View tasks" },
    { key: "tasks.update", name: "Update Task", description: "Update tasks" },
    { key: "tasks.delete", name: "Delete Task", description: "Delete tasks" },
    { key: "tasks.*", name: "All Task Permissions", description: "Full task management access" },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        name: perm.name,
        description: perm.description,
      },
      create: {
        key: perm.key,
        name: perm.name,
        description: perm.description,
      },
    });
  }
  console.log("✅ Default permissions seeded");

  // ============================================================================
  // 4. ASSIGN PERMISSIONS TO ROLES
  // ============================================================================
  console.log("🔗 Assigning permissions to roles...");
  
  // Admin gets all permissions
  const adminRole = await prisma.role.findUnique({ where: { key: "admin" } });
  if (adminRole) {
    for (const perm of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleKey_permissionKey: {
            roleKey: "admin",
            permissionKey: perm.key,
          },
        },
        update: {},
        create: {
          roleKey: "admin",
          permissionKey: perm.key,
        },
      });
    }
  }

  // PM permissions
  const pmPermissions = [
    "project.read",
    "project.update",
    "milestone.create",
    "pm.assign_task",
    "pm.view_queue",
    "pm.generate_report",
    "contract.view",
    "permit.submit",
    "permit.review",
  ];
  for (const permKey of pmPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleKey_permissionKey: {
          roleKey: "pm",
          permissionKey: permKey,
        },
      },
      update: {},
      create: {
        roleKey: "pm",
        permissionKey: permKey,
      },
    });
  }

  // Project Owner permissions
  const ownerPermissions = [
    "project.create",
    "project.read",
    "project.update",
    "milestone.approve",
    "milestone.release_payment",
    "contract.create",
    "contract.sign",
    "contract.view",
    "billing.view",
    "billing.manage",
  ];
  for (const permKey of ownerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleKey_permissionKey: {
          roleKey: "project_owner",
          permissionKey: permKey,
        },
      },
      update: {},
      create: {
        roleKey: "project_owner",
        permissionKey: permKey,
      },
    });
  }

  // Contractor permissions
  const contractorPermissions = [
    "project.read",
    "milestone.create",
    "contract.view",
    "contract.sign",
    "bids.create",
    "bids.read",
    "bids.update",
  ];

  // Architect permissions
  const architectPermissions = [
    "project.read",
    "designs.create",
    "designs.read",
    "designs.update",
    "designs.*",
  ];
  
  for (const permKey of architectPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleKey_permissionKey: {
          roleKey: "architect",
          permissionKey: permKey,
        },
      },
      update: {},
      create: {
        roleKey: "architect",
        permissionKey: permKey,
      },
    });
  }
  for (const permKey of contractorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleKey_permissionKey: {
          roleKey: "contractor",
          permissionKey: permKey,
        },
      },
      update: {},
      create: {
        roleKey: "contractor",
        permissionKey: permKey,
      },
    });
  }

  console.log("✅ Permissions assigned to roles");

  // ============================================================================
  // 5. CREATE ADMIN USER
  // ============================================================================
  console.log("👤 Creating admin user...");
  const adminEmail = process.env.ADMIN_EMAIL || "admin@kealee.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  
  // Note: User passwords are managed by Supabase Auth
  // This creates a user record that should be linked to Supabase Auth user
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "System Administrator",
      email: adminEmail,
      status: "ACTIVE",
    },
    create: {
      email: adminEmail,
      name: "System Administrator",
      status: "ACTIVE",
    },
  });

  console.log(`✅ Admin user created: ${adminEmail}`);
  console.log(`   User ID: ${adminUser.id}`);
  console.log(`   ⚠️  IMPORTANT: Create user in Supabase Auth dashboard with email: ${adminEmail}`);
  console.log(`   ⚠️  IMPORTANT: Link Supabase Auth user ID to this User record`);
  console.log(`   ⚠️  Default password suggestion: ${adminPassword} (change after first login)`);

  // ============================================================================
  // 6. CREATE DEFAULT ORGANIZATION (if needed)
  // ============================================================================
  console.log("🏢 Creating default organization...");
  const defaultOrg = await prisma.org.upsert({
    where: { slug: "kealee-platform" },
    update: {
      name: "Kealee Platform",
      slug: "kealee-platform",
      description: "Platform administration organization",
    },
    create: {
      name: "Kealee Platform",
      slug: "kealee-platform",
      description: "Platform administration organization",
    },
  });

  // Add admin user to default org with admin role
  await prisma.orgMember.upsert({
    where: {
      userId_orgId: {
        userId: adminUser.id,
        orgId: defaultOrg.id,
      },
    },
    update: {
      roleKey: "admin",
    },
    create: {
      userId: adminUser.id,
      orgId: defaultOrg.id,
      roleKey: "admin",
    },
  });

  console.log("✅ Default organization created and admin assigned");

  // ============================================================================
  // 7. DC AREA JURISDICTIONS
  // ============================================================================
  console.log("🏛️  Seeding DC-area jurisdictions...");
  const jurisdictions = [
    {
      name: "District of Columbia",
      code: "US-DC-DC",
      state: "DC",
      county: null,
      city: "Washington",
      integrationType: "PORTAL_SCRAPE",
      portalUrl: "https://dcra.dc.gov",
      requiredDocuments: {
        building: [
          "Site Plan",
          "Building Plans",
          "Structural Calculations",
          "Mechanical Plans",
          "Electrical Plans",
          "Plumbing Plans",
        ],
        mechanical: ["Mechanical Plans", "HVAC Calculations"],
        electrical: ["Electrical Plans", "Load Calculations"],
        plumbing: ["Plumbing Plans", "Fixture Count"],
      },
      feeSchedule: {
        building: { base: 150, perSquareFoot: 0.15 },
        mechanical: { base: 85, perUnit: 10 },
        electrical: { base: 85, perCircuit: 5 },
        plumbing: { base: 85, perFixture: 8 },
      },
      formTemplates: {},
      avgReviewDays: 21,
      firstTimeApprovalRate: 0.65,
    },
    {
      name: "Montgomery County, MD",
      code: "US-MD-MONT",
      state: "MD",
      county: "Montgomery",
      city: null,
      integrationType: "PORTAL_SCRAPE",
      portalUrl: "https://permitservices.montgomerycountymd.gov",
      requiredDocuments: {
        building: [
          "Site Plan",
          "Building Plans",
          "Energy Code Compliance",
          "Stormwater Management Plan",
        ],
        mechanical: ["Mechanical Plans", "Energy Calculations"],
        electrical: ["Electrical Plans", "Load Calculations"],
        plumbing: ["Plumbing Plans", "Water Efficiency Report"],
      },
      feeSchedule: {
        building: { base: 200, perSquareFoot: 0.18 },
        mechanical: { base: 95, perUnit: 12 },
        electrical: { base: 95, perCircuit: 6 },
        plumbing: { base: 95, perFixture: 10 },
      },
      formTemplates: {},
      avgReviewDays: 14,
      firstTimeApprovalRate: 0.70,
    },
    {
      name: "Prince George's County, MD",
      code: "US-MD-PG",
      state: "MD",
      county: "Prince George's",
      city: null,
      integrationType: "PORTAL_SCRAPE",
      portalUrl: "https://www.princegeorgescountymd.gov/dps",
      requiredDocuments: {
        building: [
          "Site Plan",
          "Building Plans",
          "Fire Safety Plan",
          "Accessibility Compliance",
        ],
        mechanical: ["Mechanical Plans", "Fire Safety Calculations"],
        electrical: ["Electrical Plans", "Fire Alarm Plans"],
        plumbing: ["Plumbing Plans", "Backflow Prevention"],
      },
      feeSchedule: {
        building: { base: 180, perSquareFoot: 0.16 },
        mechanical: { base: 90, perUnit: 11 },
        electrical: { base: 90, perCircuit: 5.5 },
        plumbing: { base: 90, perFixture: 9 },
      },
      formTemplates: {},
      avgReviewDays: 21,
      firstTimeApprovalRate: 0.68,
    },
    {
      name: "Arlington County, VA",
      code: "US-VA-ARL",
      state: "VA",
      county: "Arlington",
      city: null,
      integrationType: "PORTAL_SCRAPE",
      portalUrl: "https://arlingtonva.us/building",
      requiredDocuments: {
        building: [
          "Site Plan",
          "Building Plans",
          "Zoning Analysis",
          "Environmental Impact Statement",
        ],
        mechanical: ["Mechanical Plans", "Energy Efficiency Report"],
        electrical: ["Electrical Plans", "Code Compliance Certificate"],
        plumbing: ["Plumbing Plans", "Water Conservation Plan"],
      },
      feeSchedule: {
        building: { base: 175, perSquareFoot: 0.17 },
        mechanical: { base: 88, perUnit: 11 },
        electrical: { base: 88, perCircuit: 6 },
        plumbing: { base: 88, perFixture: 9 },
      },
      formTemplates: {},
      avgReviewDays: 10,
      firstTimeApprovalRate: 0.72,
    },
    {
      name: "Fairfax County, VA",
      code: "US-VA-FFX",
      state: "VA",
      county: "Fairfax",
      city: null,
      integrationType: "PORTAL_SCRAPE",
      portalUrl: "https://www.fairfaxcounty.gov/landdevelopment",
      requiredDocuments: {
        building: [
          "Site Plan",
          "Building Plans",
          "Drainage Plan",
          "Erosion Control Plan",
        ],
        mechanical: ["Mechanical Plans", "HVAC Load Calculations"],
        electrical: ["Electrical Plans", "Service Load Calculations"],
        plumbing: ["Plumbing Plans", "Water Supply Calculations"],
      },
      feeSchedule: {
        building: { base: 185, perSquareFoot: 0.17 },
        mechanical: { base: 92, perUnit: 11.5 },
        electrical: { base: 92, perCircuit: 6 },
        plumbing: { base: 92, perFixture: 9.5 },
      },
      formTemplates: {},
      avgReviewDays: 14,
      firstTimeApprovalRate: 0.69,
    },
  ];

  for (const j of jurisdictions) {
    await prisma.jurisdiction.upsert({
      where: { code: j.code },
      update: {
        name: j.name,
        state: j.state,
        county: j.county,
        city: j.city,
        integrationType: j.integrationType,
        portalUrl: j.portalUrl,
        requiredDocuments: j.requiredDocuments,
        feeSchedule: j.feeSchedule,
        formTemplates: j.formTemplates,
        avgReviewDays: j.avgReviewDays,
        firstTimeApprovalRate: j.firstTimeApprovalRate,
        subscriptionStatus: "TRIAL",
      },
      create: {
        name: j.name,
        code: j.code,
        state: j.state,
        county: j.county,
        city: j.city,
        integrationType: j.integrationType,
        portalUrl: j.portalUrl,
        requiredDocuments: j.requiredDocuments,
        feeSchedule: j.feeSchedule,
        formTemplates: j.formTemplates,
        avgReviewDays: j.avgReviewDays,
        firstTimeApprovalRate: j.firstTimeApprovalRate,
        subscriptionStatus: "TRIAL",
      },
    });
  }
  console.log("✅ DC-area jurisdictions seeded");

  // ============================================================================
  // 8. SEED SUMMARY
  // ============================================================================
  console.log("\n🎉 Database seed completed successfully!");
  console.log("\n📋 Summary:");
  console.log(`   ✅ Service Plans: ${plans.length} (Package A-D with Stripe integration)`);
  console.log(`   ✅ Roles: ${roles.length} (Admin, PM, Contractor, Architect, Project Owner, etc.)`);
  console.log(`   ✅ Permissions: ${permissions.length} (with role assignments)`);
  console.log(`   ✅ Admin User: ${adminEmail} (ID: ${adminUser.id})`);
  console.log(`   ✅ Default Org: ${defaultOrg.name} (ID: ${defaultOrg.id})`);
  console.log(`   ✅ Org Membership: Admin user added to default org with admin role`);
  console.log(`   ✅ Jurisdictions: ${jurisdictions.length} (DC, Montgomery, Prince George's, Arlington, Fairfax)`);
  
  console.log("\n⚠️  IMPORTANT NEXT STEPS:");
  console.log("   1. ✅ Stripe Setup:");
  console.log("      - Set STRIPE_PRODUCT_PACKAGE_A/B/C/D in environment variables");
  console.log("      - Set STRIPE_PRICE_PACKAGE_A/B/C/D_MONTHLY in environment variables");
  console.log("      - Re-run seed to update service plans with LIVE Stripe IDs");
  console.log("");
  console.log("   2. ✅ Admin User Setup:");
  console.log(`      - Create user in Supabase Auth dashboard: ${adminEmail}`);
  console.log(`      - Link Supabase Auth user ID to User record (ID: ${adminUser.id})`);
  console.log(`      - Set secure password (suggested: ${adminPassword})`);
  console.log("");
  console.log("   3. ✅ Database Migrations:");
  console.log("      - Run in production: npx prisma migrate deploy");
  console.log("");
  console.log("   4. ✅ Verify Seed Data:");
  console.log("      - Check admin user can login");
  console.log("      - Verify roles and permissions are assigned");
  console.log("      - Confirm service plans have Stripe IDs");
  console.log("      - Test jurisdiction data is accessible");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
