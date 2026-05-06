
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Master Platform Seed...');

    // 1. Users (Project Managers)
    const users = [
        { email: 'sarah.pm@kealee.com', name: 'Sarah Jenkins', role: 'PM' },
        { email: 'bob.admin@kealee.com', name: 'Bob Miller', role: 'ADMIN' },
        { email: 'marcus.pm@kealee.com', name: 'Marcus Thorne', role: 'PM' }
    ];

    for (const u of users) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: u,
            create: u
        });
    }
    const pmSarah = await prisma.user.findUnique({ where: { email: 'sarah.pm@kealee.com' } });
    const pmMarcus = await prisma.user.findUnique({ where: { email: 'marcus.pm@kealee.com' } });

    // 2. Contractors (Diverse Trades)
    const contractors = [
        { company: 'Titan Structural', contact: 'Dave Titan', email: 'dave@titanstruct.com', trades: ['CONCRETE', 'STEEL'], rating: 4.9, lat: 40.7128, lng: -74.0060 },
        { company: 'Precision MEP', contact: 'Elena Ross', email: 'elena@precisionmep.com', trades: ['ELECTRICAL', 'PLUMBING', 'HVAC'], rating: 4.7, lat: 40.7306, lng: -73.9352 },
        { company: 'Standard Framing', contact: 'John Frame', email: 'john@standardframe.com', trades: ['FRAMING', 'ROOFING'], rating: 4.2, lat: 40.6782, lng: -73.9442 },
        { company: 'Finish Pros', contact: 'Maria Garcia', email: 'maria@finishpros.com', trades: ['PAINTING', 'FLOORING', 'DRYWALL'], rating: 4.5, lat: 40.7589, lng: -73.9851 },
        { company: 'Earthwork King', contact: 'King Arthur', email: 'art@earthking.com', trades: ['EXCAVATION', 'SITE_PREP'], rating: 3.8, lat: 40.7829, lng: -73.9654 }
    ];

    for (const c of contractors) {
        await prisma.contractor.upsert({
            where: { email: c.email },
            update: { companyName: c.company, trades: c.trades, rating: c.rating },
            create: {
                companyName: c.company,
                contactName: c.contact,
                email: c.email,
                trades: c.trades,
                rating: c.rating,
                latitude: c.lat,
                longitude: c.lng
            }
        });
    }

    // 3. Projects
    const projects = [
        { id: 'proj_01', name: 'Downtown Tech Hub', address: '101 Broadway, NY', budget: 15000000, pmId: pmSarah.id, status: 'CONSTRUCTION', clientName: 'Innovate Corp' },
        { id: 'proj_02', name: 'Westside Residential', address: '500 W 42nd St, NY', budget: 8500000, pmId: pmSarah.id, status: 'PLANNING', clientName: 'City Living LLC' },
        { id: 'proj_03', name: 'Retail Retrofit', address: '12 5th Ave, NY', budget: 1200000, pmId: pmMarcus.id, status: 'PLANNING', clientName: 'Global Brands' }
    ];

    for (const p of projects) {
        await prisma.project.upsert({
            where: { id: p.id },
            update: { status: p.status, budget: p.budget },
            create: p
        });
    }

    // 4. Bid Engine Data
    const bidRequest = await prisma.bidRequest.create({
        data: {
            projectId: 'proj_02',
            trade: ['HVAC', 'PLUMBING'],
            deadline: new Date(Date.now() + 14 * 86400000),
            status: 'OPEN',
            description: 'Mechanical and plumbing package for residential complex',
            scope: { description: 'Full MEP install' },
            requirements: { insurance: 2000000 }
        }
    });

    const precisionMep = await prisma.contractor.findUnique({ where: { email: 'elena@precisionmep.com' } });
    await prisma.bidSubmission.create({
        data: {
            projectId: 'proj_02',
            bidRequestId: bidRequest.id,
            contractorId: precisionMep.id,
            amount: 450000,
            trade: 'MEP',
            status: 'PENDING',
            score: 88,
            analysis: { reason: 'Competitive pricing and high rating' }
        }
    });

    // 5. Visit Scheduler Data
    await prisma.siteVisit.create({
        data: {
            projectId: 'proj_01',
            type: 'SAFETY_INSPECTION',
            scheduledAt: new Date(Date.now() + 2 * 86400000),
            endAt: new Date(Date.now() + 2.1 * 86400000),
            status: 'SCHEDULED',
            notes: 'Initial structural safety check.'
        }
    });

    // 6. Change Order Processor
    await prisma.changeOrder.create({
        data: {
            projectId: 'proj_01',
            number: 'CO-001',
            description: 'Upgrade to premium steel grade',
            reason: 'Architectural requirement update',
            amount: 75000,
            status: 'PENDING_APPROVAL',
            impactAnalysis: { delay: 3, criticalPath: true }
        }
    });

    // 7. Permit & Inspection Data
    const permit = await prisma.permit.create({
        data: {
            projectId: 'proj_01',
            type: 'ELECTRICAL',
            status: 'IN_REVIEW',
            submittedAt: new Date(Date.now() - 5 * 86400000),
            applicationNo: 'EL-99221'
        }
    });

    await prisma.inspection.create({
        data: {
            projectId: 'proj_01',
            permitId: permit.id,
            type: 'ROUGH_IN',
            status: 'SCHEDULED',
            scheduledAt: new Date(Date.now() + 7 * 86400000)
        }
    });

    // 8. Budget Tracker Data
    await prisma.budgetTransaction.createMany({
        data: [
            { projectId: 'proj_01', amount: 120000, description: 'Lumber delivery', type: 'EXPENSE', date: new Date(), category: 'Materials' },
            { projectId: 'proj_01', amount: 45000, description: 'Design Fee - Pmt 1', type: 'EXPENSE', date: new Date(), category: 'Professional Services' }
        ]
    });

    // 9. Smart Scheduler (Milestones)
    await prisma.milestone.createMany({
        data: [
            { projectId: 'proj_01', name: 'Foundation Complete', startDate: new Date(), dueDate: new Date(Date.now() + 30 * 86400000), status: 'IN_PROGRESS', isCritical: true },
            { projectId: 'proj_01', name: 'Topping Out', startDate: new Date(Date.now() + 120 * 86400000), dueDate: new Date(Date.now() + 130 * 86400000), status: 'PENDING' }
        ]
    });

    // 10. QA Inspector (Photo Analysis)
    await prisma.photoAnalysis.create({
        data: {
            projectId: 'proj_01',
            photoUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5',
            type: 'STRUCTURAL',
            analysis: { issues: ['Minor crack on column A2'], safety: 'PASS' }
        }
    });

    // 11. Delay Predictor (Predictions)
    await prisma.prediction.create({
        data: {
            projectId: 'proj_01',
            type: 'DELAY',
            probability: 0.65,
            impact: 'MEDIUM',
            description: 'Supply chain issues for HVAC components likely to cause 2 week delay.'
        }
    });

    // 12. Document Generator (Document)
    await prisma.document.create({
        data: {
            projectId: 'proj_01',
            name: 'Monthly Progress Report - Jan 2026',
            type: 'REPORT',
            content: 'Generated content here...',
            format: 'PDF',
            status: 'FINAL'
        }
    });

    // 13. Task Queue (Automation Task)
    await prisma.automationTask.create({
        data: {
            projectId: 'proj_01',
            type: 'DAILY_WEATHER_CHECK',
            status: 'PENDING',
            priority: 2,
            dueAt: new Date(Date.now() + 86400000)
        }
    });

    // 14. Communication Hub
    await prisma.notification.create({
        data: {
            userId: pmSarah.id,
            type: 'URGENT',
            message: 'New Bid submitted for Downtown Tech Hub'
        }
    });

    console.log('✅ Master Platform Seed Completed - All 14 Agents Ready.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
