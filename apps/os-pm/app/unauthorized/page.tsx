import Link from 'next/link';
import { Shield, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <Shield className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Access Denied
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            You don&apos;t have permission to access the Kealee PM Dashboard.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="font-semibold text-slate-900 mb-4">
            This Could Be Because:
          </h2>
          <ul className="text-left space-y-3 text-slate-600">
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold">•</span>
              <span>You&apos;re not assigned as a Project Manager</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold">•</span>
              <span>Your PM account hasn&apos;t been activated yet</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold">•</span>
              <span>Your session has expired</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/queue"
            className="block w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
              <Home className="h-5 w-5" />
              Go to Work Queue
            </div>
          </Link>
          
          <Link
            href="/auth/login"
            className="block w-full px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:border-slate-400 transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              Sign In Again
            </div>
          </Link>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Need PM access?{' '}
          <a href="mailto:pm-admin@kealee.com" className="text-emerald-600 hover:underline">
            Contact your administrator
          </a>
        </p>
      </div>
    </div>
  );
}
