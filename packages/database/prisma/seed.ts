import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: "Package A",
      slug: "package-a",
      tier: "basic",
      description: "Basic Ops",
      monthlyPrice: "1750.00",
      annualPrice: "17850.00",
      features: ["Ops intake + planning", "Vendor shortlist", "Monthly check-ins", "Basic reporting"],
      limits: { projects: 1, serviceRequestsPerMonth: 5 },
      isActive: true,
      order: 1,
    },
    {
      name: "Package B",
      slug: "package-b",
      tier: "standard",
      description: "Standard Ops",
      monthlyPrice: "3750.00",
      annualPrice: "38250.00",
      features: ["Dedicated ops support", "Weekly updates", "Permit tracking", "Vendor coordination"],
      limits: { projects: 2, serviceRequestsPerMonth: 15 },
      isActive: true,
      order: 2,
    },
    {
      name: "Package C",
      slug: "package-c",
      tier: "premium",
      description: "Premium Ops",
      monthlyPrice: "9500.00",
      annualPrice: "96900.00",
      features: ["Priority response", "Full vendor ops", "Risk tracking", "Weekly reporting + escalation"],
      limits: { projects: 5, serviceRequestsPerMonth: 50 },
      isActive: true,
      order: 3,
    },
    {
      name: "Package D",
      slug: "package-d",
      tier: "enterprise",
      description: "Enterprise Ops",
      monthlyPrice: "16500.00",
      annualPrice: "168300.00",
      features: ["Multi-project program", "Custom SLA", "Program reporting", "Dedicated support channel"],
      limits: { projects: "unlimited", serviceRequestsPerMonth: "unlimited" },
      isActive: true,
      order: 4,
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
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

