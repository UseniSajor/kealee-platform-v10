"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setProgress = setProgress;
exports.getProgress = getProgress;
const ioredis_1 = __importDefault(require("ioredis"));
let redis = null;
function getRedis() {
    if (!redis) {
        redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: 1,
            lazyConnect: true,
        });
        redis.on('error', (err) => {
            console.warn('[ProgressTracker] Redis error:', err.message);
        });
    }
    return redis;
}
async function setProgress(sessionId, percent) {
    try {
        await getRedis().set(`funnel:progress:${sessionId}`, String(Math.round(percent)), 'EX', 600);
    }
    catch { }
}
async function getProgress(sessionId) {
    try {
        const val = await getRedis().get(`funnel:progress:${sessionId}`);
        return val ? parseInt(val, 10) : 0;
    }
    catch {
        return 0;
    }
}
