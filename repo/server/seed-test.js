
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding test data...');

    // Ensure a PM user exists
    const pm = await prisma.user.upsert({
        where: { email: 'pm@kealee.com' },
        update: {},
        create: {
            email: 'pm@kealee.com',
            name: 'Test PM',
            role: 'PM'
        }
    });

    // Ensure a project exists
    const project = await prisma.project.upsert({
        where: { id: 'demo-project-id' },
        update: {},
        create: {
            id: 'demo-project-id',
            name: 'Testing Site A',
            status: 'PLANNING',
            pmId: pm.id,
            address: '123 Test Ave, New York, NY'
        }
    });

    // Create some contractors
    const contractors = [
        { name: 'Elite HVAC Services', trade: 'HVAC', rating: 4.9 },
        { name: 'Standard Plumbing & Heat', trade: 'HVAC', rating: 4.2 },
        { name: 'Budget Cooling', trade: 'HVAC', rating: 3.5 }
    ];

    for (const c of contractors) {
        await prisma.contractor.upsert({
            where: { email: `${c.name.toLowerCase().replace(/ /g, '.')}@test.com` },
            update: { trades: [c.trade], rating: c.rating },
            create: {
                companyName: c.name,
                email: `${c.name.toLowerCase().replace(/ /g, '.')}@test.com`,
                trades: [c.trade],
                latitude: 40.7128,
                longitude: -74.0060,
                rating: c.rating
            }
        });
    }

    console.log('✅ Seeded 3 HVAC contractors and a demo project.');
}

seed()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
