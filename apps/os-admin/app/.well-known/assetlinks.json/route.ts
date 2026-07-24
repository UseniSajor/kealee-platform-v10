import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  const fingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? '')
    .split(',').map((value) => value.trim()).filter(Boolean)
  return NextResponse.json(fingerprints.length ? [{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: 'com.kealee.admin', sha256_cert_fingerprints: fingerprints },
  }] : [], { status: fingerprints.length ? 200 : 503 })
}
