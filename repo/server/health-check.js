
const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
require('dotenv').config();

async function checkHealth() {
    console.log('🔍 Starting Kealee Backend Health Check...');

    // 1. Database Check
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        console.log('✅ DATABASE: Connected Successfully');
    } catch (err) {
        console.error('❌ DATABASE: Connection Failed:', err.message);
    } finally {
        await prisma.$disconnect();
    }

    // 2. Redis Check
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
    try {
        const result = await redis.ping();
        console.log(`✅ REDIS: Connected Successfully (${result})`);
    } catch (err) {
        console.error('❌ REDIS: Connection Failed:', err.message);
    } finally {
        redis.disconnect();
    }

    // 3. AI SDK Availability
    if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('mock')) {
        console.log('✅ AI SERVICE: API Key detected (Claude 3.5 Sonnet)');
    } else {
        console.log('⚠️ AI SERVICE: API Key is missing or using mock value');
    }

    // 4. Mapbox Availability
    if (process.env.MAPBOX_ACCESS_TOKEN && !process.env.MAPBOX_ACCESS_TOKEN.includes('mock')) {
        console.log('✅ LOCATION SERVICE: Mapbox token detected');
    } else {
        console.log('⚠️ LOCATION SERVICE: Mapbox token is missing or using mock value');
    }
}

checkHealth();
