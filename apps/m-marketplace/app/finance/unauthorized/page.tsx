'use client'

import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mx-auto max-w-md text-center">
        <ShieldAlert className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-3 text-gray-600">
          You don&apos;t have permission to access this application. Please contact your
          administrator if you believe this is an error.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Sign in with a different account
          </Link>
          <Link
            href="/finance"
            className="rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
