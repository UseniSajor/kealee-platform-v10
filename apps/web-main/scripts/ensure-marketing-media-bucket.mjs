#!/usr/bin/env node
/**
 * Ensure Supabase storage bucket `marketing-media` exists (public read).
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.
 */
import { loadWebMainEnv } from './load-env.mjs'

loadWebMainEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const bucket = process.env.SUPABASE_MARKETING_MEDIA_BUCKET || 'marketing-media'

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const res = await fetch(`${url}/storage/v1/bucket`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    apikey: key,
  },
  body: JSON.stringify({
    id: bucket,
    name: bucket,
    public: true,
    file_size_limit: 52428800,
    allowed_mime_types: ['image/jpeg', 'image/webp', 'image/png', 'video/mp4', 'video/webm'],
  }),
})

if (res.ok) {
  console.log(`Created bucket: ${bucket}`)
  process.exit(0)
}

const text = await res.text()
if (text.includes('already exists') || res.status === 409) {
  console.log(`Bucket already exists: ${bucket}`)
  process.exit(0)
}

console.error('Bucket create failed:', res.status, text)
process.exit(1)
