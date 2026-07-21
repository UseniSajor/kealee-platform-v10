'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Calendar, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@kealee/ui';

export default function PermitSuccessPage() {
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
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-3xl w-full">
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
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
          Application Submitted Successfully!
        </h1>

        <p className="text-xl text-center text-gray-600 mb-12">
          Your permit application has been received and is being processed.
        </p>

        {/* Timeline Card */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What Happens Next</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Today</h3>
                <p className="text-gray-600">You submitted your application</p>
                <p className="text-sm text-gray-500 mt-1">Application ID: PER-2024-001234</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Day 2</h3>
                <p className="text-gray-600">Initial review begins</p>
                <p className="text-sm text-gray-500 mt-1">You'll receive an email confirmation</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Day 7</h3>
                <p className="text-gray-600">Site inspection (if needed)</p>
                <p className="text-sm text-gray-500 mt-1">You'll be notified to schedule</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Day 14-21</h3>
                <p className="text-gray-600">Approval expected</p>
                <p className="text-sm text-gray-500 mt-1">Typical approval time for your jurisdiction</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/permits/permits/status"
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
              <FileText size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">View Application Status</h3>
            <p className="text-sm text-gray-600">
              Track your permit application progress
            </p>
            <ArrowRight
              size={16}
              className="mt-2 text-primary-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
            />
          </Link>

          <Link
            href="/permits/permits/schedule"
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
              <Calendar size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Schedule Inspection</h3>
            <p className="text-sm text-gray-600">
              Book your site inspection appointment
            </p>
            <ArrowRight
              size={16}
              className="mt-2 text-primary-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
            />
          </Link>

          <Link
            href="/permits/dashboard"
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
              📊
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Go to Dashboard</h3>
            <p className="text-sm text-gray-600">
              View all your permit applications
            </p>
            <ArrowRight
              size={16}
              className="mt-2 text-primary-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
            />
          </Link>
        </div>

        {/* Email Notice */}
        <Card className="bg-blue-50 border-blue-200 text-center">
          <p className="text-blue-900">
            📧 A confirmation email has been sent with your application details and tracking link.
          </p>
        </Card>
      </div>
    </div>
  );
}
