"use strict";
/** Patterns used to detect and redact PII in marketing exports. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOCKED_BUCKET_PREFIXES = exports.BLOCKED_FIELD_NAMES = exports.TAX_ID_PATTERN = exports.PARCEL_ID_PATTERN = exports.PERMIT_NUMBER_PATTERN = exports.STREET_ADDRESS_PATTERN = exports.PHONE_PATTERN = exports.EMAIL_PATTERN = void 0;
exports.EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
exports.PHONE_PATTERN = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
exports.STREET_ADDRESS_PATTERN = /\b\d{1,6}\s+[A-Za-z0-9.'\-\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Place|Pl|Circle|Cir)\b/gi;
exports.PERMIT_NUMBER_PATTERN = /\b(?:permit|PERMIT)[#:\s-]*[A-Z0-9-]{5,}\b/gi;
exports.PARCEL_ID_PATTERN = /\b(?:parcel|APN|PIN)[#:\s-]*[A-Z0-9-]{6,}\b/gi;
exports.TAX_ID_PATTERN = /\b\d{2}-\d{7}\b/g;
exports.BLOCKED_FIELD_NAMES = new Set([
    'client_name',
    'contact_email',
    'contact_phone',
    'project_address',
    'phone',
    'email',
    'parcel_id',
    'parcelId',
    'permit_number',
    'permitNumber',
    'tax_id',
    'taxId',
    'form_data',
    'payment_amount',
    'stripe_customer_id',
    'prompt',
    'prompt_hash',
    'instructions',
    'internal_notes',
    'notes',
]);
exports.BLOCKED_BUCKET_PREFIXES = [
    'deliverables/',
    'project-documents/',
    'portal-uploads/',
    'permits/',
    'receipts/',
];
