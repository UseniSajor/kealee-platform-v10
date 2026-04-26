"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedPage = getCachedPage;
exports.setCachedPage = setCachedPage;
const ioredis_1 = __importDefault(require("ioredis"));
const CACHE_TTL = 3600; // 1 hour
let redis = null;
function getRedis() {
    if (!redis) {
        redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: 1,
            lazyConnect: true,
        });
        redis.on('error', (err) => {
            console.warn('[PageCache] Redis connection error:', err.message);
        });
    }
    return redis;
}
async function getCachedPage(sessionId) {
    try {
        const data = await getRedis().get(`funnel:page:${sessionId}`);
        if (!data)
            return null;
        return JSON.parse(data);
    }
    catch {
        return null;
    }
}
async function setCachedPage(sessionId, result) {
    try {
        await getRedis().set(`funnel:page:${sessionId}`, JSON.stringify(result), 'EX', CACHE_TTL);
    }
    catch (err) {
        console.warn('[PageCache] Failed to cache page:', err.message);
    }
}
