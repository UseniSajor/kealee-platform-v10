import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PACKAGE_NAME = 'com.kealee.projectowner'
const fingerprintPattern = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/i

export function GET() {
  const fingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? '')
    .split(',')
    .map(value => value.trim().toUpperCase())
    .filter(value => fingerprintPattern.test(value))

  return NextResponse.json(
    fingerprints.length === 0
      ? []
      : [{
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: PACKAGE_NAME,
            sha256_cert_fingerprints: fingerprints,
          },
        }],
    {
      status: fingerprints.length === 0 ? 503 : 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        'X-Kealee-Android-Package': PACKAGE_NAME,
      },
    },
  )
}
