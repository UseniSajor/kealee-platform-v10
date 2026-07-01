"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeMarketingExport = sanitizeMarketingExport;
exports.assertPublicSafeAsset = assertPublicSafeAsset;
const pii_patterns_1 = require("./pii-patterns");
const REDACTED = '[REDACTED]';
function redactString(value) {
    return value
        .replace(pii_patterns_1.EMAIL_PATTERN, REDACTED)
        .replace(pii_patterns_1.PHONE_PATTERN, REDACTED)
        .replace(pii_patterns_1.STREET_ADDRESS_PATTERN, REDACTED)
        .replace(pii_patterns_1.PERMIT_NUMBER_PATTERN, REDACTED)
        .replace(pii_patterns_1.PARCEL_ID_PATTERN, REDACTED)
        .replace(pii_patterns_1.TAX_ID_PATTERN, REDACTED);
}
function isBlockedStorageUrl(url) {
    const lower = url.toLowerCase();
    return pii_patterns_1.BLOCKED_BUCKET_PREFIXES.some((prefix) => lower.includes(prefix));
}
function sanitizeMarketingExport(data, depth = 0) {
    if (depth > 12)
        return data;
    if (data === null || data === undefined)
        return data;
    if (typeof data === 'string') {
        if (isBlockedStorageUrl(data))
            return REDACTED;
        return redactString(data);
    }
    if (Array.isArray(data)) {
        return data.map((item) => sanitizeMarketingExport(item, depth + 1));
    }
    if (typeof data === 'object') {
        const out = {};
        for (const [key, value] of Object.entries(data)) {
            if (pii_patterns_1.BLOCKED_FIELD_NAMES.has(key))
                continue;
            if (key === 'metadata' && depth === 0) {
                out[key] = {};
                continue;
            }
            out[key] = sanitizeMarketingExport(value, depth + 1);
        }
        return out;
    }
    return data;
}
function assertPublicSafeAsset(asset) {
    if (asset.contains_customer_data) {
        throw new Error('Asset contains customer data and cannot be exported');
    }
    if (!asset.public_safe && asset.approval_status !== 'approved' && asset.approval_status !== 'published') {
        throw new Error('Asset is not approved for public export');
    }
}
