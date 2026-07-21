/**
 * Database Seed Script
 * Seeds initial data for development and testing
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await hash('admin123', 10);
  const admin = await prisma.profile.upsert({
    where: { email: 'admin@kealee.com' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@kealee.com',
      fullName: 'Admin User',
      role: 'admin',
    },
  });
  console.log('✅ Admin user created');

  // Create service plans (GC packages)
  const plans = [
    {
      id: 'package-a',
      name: 'Package A',
      description: 'Starter package for small projects',
      price: 1750,
      stripePriceId: process.env.STRIPE_PRICE_ID_PACKAGE_A || 'price_XXXXXX', // Replace with real Stripe price ID
      features: [
        '5-10 hours/week PM time',
        'Single project focus',
        'Email support (48hr response)',
        'Weekly progress reports',
        'Basic task tracking',
      ],
      interval: 'month' as const,
      active: true,
    },
    {
      id: 'package-b',
      name: 'Package B',
      description: 'Professional package for growing projects',
      price: 4500,
      stripePriceId: process.env.STRIPE_PRICE_ID_PACKAGE_B || 'price_YYYYYY',
      features: [
        '15-20 hours/week PM time',
        'Up to 3 concurrent projects',
        'Priority email & phone support',
        'Bi-weekly progress reports',
        'Advanced project tracking',
        'Contractor coordination',
      ],
      interval: 'month' as const,
      active: true,
    },
    {
      id: 'package-c',
      name: 'Package C',
      description: 'Premium package for complex projects',
      price: 8500,
      stripePriceId: process.env.STRIPE_PRICE_ID_PACKAGE_C || 'price_ZZZZZZ',
      features: [
        '30-40 hours/week PM time',
        'Unlimited projects',
        '24/7 priority support',
        'Daily progress reports',
        'Dedicated PM assigned',
        'Full contractor management',
        'Budget optimization',
        'Risk management',
      ],
      interval: 'month' as const,
      active: true,
    },
    {
      id: 'package-d',
      name: 'Package D',
      description: 'Enterprise package for portfolio management',
      price: 16500,
      stripePriceId: process.env.STRIPE_PRICE_ID_PACKAGE_D || 'price_AAAAAA',
      features: [
        '40+ hours/week PM time',
        'Portfolio management',
        'Dedicated account manager',
        'Custom reporting',
        'Strategic planning support',
        'Multi-project coordination',
        'Executive-level insights',
        'White-glove service',
      ],
      interval: 'month' as const,
      active: true,
    },
  ];

  for (const plan of plans) {
    await prisma.servicePlan.upsert({
      where: { id: plan.id },
      update: {},
      create: plan,
    });
  }
  console.log('✅ Service plans created');

  // Create jurisdictions
  const jurisdictions = [
    {
      id: 'dc',
      name: 'Washington, DC',
      processingTime: 21,
      fees: { min: 350, max: 500 },
      requirements: ['Site plan', 'Floor plan', 'Elevation drawings'],
      active: true,
    },
    {
      id: 'montgomery-md',
      name: 'Montgomery County, MD',
      processingTime: 14,
      fees: { min: 250, max: 400 },
      requirements: ['Site plan', 'Floor plan', 'Building specs'],
      active: true,
    },
    {
      id: 'prince-georges-md',
      name: 'Prince George\'s County, MD',
      processingTime: 28,
      fees: { min: 300, max: 450 },
      requirements: ['Site plan', 'Floor plan', 'Elevation drawings', 'Structural calcs'],
      active: true,
    },
    {
      id: 'arlington-va',
      name: 'Arlington, VA',
      processingTime: 18,
      fees: { min: 400, max: 600 },
      requirements: ['Site plan', 'Floor plan', 'Elevation drawings'],
      active: true,
    },
    {
      id: 'fairfax-va',
      name: 'Fairfax County, VA',
      processingTime: 24,
      fees: { min: 350, max: 500 },
      requirements: ['Site plan', 'Floor plan', 'Building specs', 'Soils report'],
      active: true,
    },
  ];

  for (const jurisdiction of jurisdictions) {
    await prisma.jurisdiction.upsert({
      where: { id: jurisdiction.id },
      update: {},
      create: jurisdiction,
    });
  }
  console.log('✅ Jurisdictions created');

  // Create sample PM user
  const pm = await prisma.profile.upsert({
    where: { email: 'pm@kealee.com' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'pm@kealee.com',
      fullName: 'Project Manager',
      role: 'pm',
    },
  });
  console.log('✅ PM user created');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

