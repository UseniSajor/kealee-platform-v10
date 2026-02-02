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
            Admin access required
          </p>
        </div>
        <Link
          href="/dashboard"
          className="block w-full px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
