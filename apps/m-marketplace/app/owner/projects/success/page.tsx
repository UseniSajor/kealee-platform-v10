'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@kealee/ui';

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Confetti animation
    if (typeof window !== 'undefined') {
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      });
    }

    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push('/owner/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        {/* Success Icon */}
        <div className="
          w-24 h-24 mx-auto mb-6
          bg-green-100 rounded-full
          flex items-center justify-center
          animate-in zoom-in duration-500
        ">
          <CheckCircle className="text-green-600" size={48} />
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Project Created Successfully!
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          Your project is ready to go. Here's what you can do next:
        </p>

        {/* Next Steps */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/owner/dashboard"
            className="
              p-6
              bg-white
              border-2 border-gray-200 hover:border-primary-500
              rounded-xl
              text-left
              transition-all duration-200
              group
            "
          >
            <div className="
              w-12 h-12
              bg-primary-100 text-primary-600
              rounded-full
              flex items-center justify-center
              mb-4
            ">
              📊
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">View Dashboard</h3>
            <p className="text-sm text-gray-600">
              See your project overview and timeline
            </p>
            <ArrowRight
              size={16}
              className="mt-2 text-primary-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
            />
          </Link>

          <Link
            href="/contractors/invite"
            className="
              p-6
              bg-white
              border-2 border-gray-200 hover:border-primary-500
              rounded-xl
              text-left
              transition-all duration-200
              group
            "
          >
            <div className="
              w-12 h-12
              bg-green-100 text-green-600
              rounded-full
              flex items-center justify-center
              mb-4
            ">
              👷
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Invite Contractors</h3>
            <p className="text-sm text-gray-600">
              Add contractors to your project
            </p>
            <ArrowRight
              size={16}
              className="mt-2 text-primary-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
            />
          </Link>

          <Link
            href="/documents/upload"
            className="
              p-6
              bg-white
              border-2 border-gray-200 hover:border-primary-500
              rounded-xl
              text-left
              transition-all duration-200
              group
            "
          >
            <div className="
              w-12 h-12
              bg-purple-100 text-purple-600
              rounded-full
              flex items-center justify-center
              mb-4
            ">
              📁
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Upload Documents</h3>
            <p className="text-sm text-gray-600">
              Add plans, permits, and contracts
            </p>
            <ArrowRight
              size={16}
              className="mt-2 text-primary-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
            />
          </Link>
        </div>

        {/* Auto-redirect notice */}
        <p className="text-sm text-gray-500">
          Redirecting to dashboard in 5 seconds...
        </p>
      </div>
    </div>
  );
}
