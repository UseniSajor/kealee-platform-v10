'use client';

import { useEffect } from 'react';
import { CheckCircle, Calendar, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@kealee/ui';

export default function CheckoutSuccessPage() {
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
          Welcome to Kealee Premium!
        </h1>

        <p className="text-xl text-gray-600 mb-12">
          Your 14-day free trial has started. Your PM will contact you within 24 hours.
        </p>

        {/* Next Steps */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/dashboard"
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
              Access your project management tools
            </p>
            <ArrowRight
              size={16}
              className="mt-2 text-primary-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
            />
          </Link>

          <Link
            href="/ops/onboarding"
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
              <Users size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Complete Profile</h3>
            <p className="text-sm text-gray-600">
              Help us understand your needs
            </p>
            <ArrowRight
              size={16}
              className="mt-2 text-primary-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
            />
          </Link>

          <Link
            href="/ops/schedule"
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
              <Calendar size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Schedule Kickoff</h3>
            <p className="text-sm text-gray-600">
              Book your initial consultation
            </p>
            <ArrowRight
              size={16}
              className="mt-2 text-primary-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
            />
          </Link>
        </div>

        {/* Info Card */}
        <Card className="bg-primary-50 border-primary-200">
          <p className="text-primary-900">
            💡 <strong>What's next?</strong> Your dedicated project manager will reach out within 24 hours to discuss your project and get started.
          </p>
        </Card>
      </div>
    </div>
  );
}
