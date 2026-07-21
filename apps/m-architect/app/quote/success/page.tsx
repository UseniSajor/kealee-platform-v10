'use client';

import { useEffect } from 'react';
import { CheckCircle, Mail, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@kealee/ui';

export default function QuoteSuccessPage() {
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
          Quote Request Received!
        </h1>

        <p className="text-xl text-gray-600 mb-12">
          We've received your request and will send you a detailed quote within 24 hours.
        </p>

        {/* Timeline Card */}
        <Card className="mb-8 text-left">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What Happens Next</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Immediate</h3>
                <p className="text-gray-600">We've received your quote request</p>
                <p className="text-sm text-gray-500 mt-1">Request ID: QUO-2024-001234</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Within 4 Hours</h3>
                <p className="text-gray-600">Our team will review your project details</p>
                <p className="text-sm text-gray-500 mt-1">We'll reach out if we need clarification</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Within 24 Hours</h3>
                <p className="text-gray-600">You'll receive a detailed quote via email</p>
                <p className="text-sm text-gray-500 mt-1">Including timeline, pricing, and next steps</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-blue-50 border-blue-200 text-left">
            <div className="flex items-start gap-4">
              <Mail className="text-blue-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Email Confirmation</h3>
                <p className="text-sm text-blue-800">
                  Check your inbox for a confirmation email with your request details.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-green-50 border-green-200 text-left">
            <div className="flex items-start gap-4">
              <Clock className="text-green-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">24-Hour Response</h3>
                <p className="text-sm text-green-800">
                  We guarantee a detailed quote within 24 hours of your request.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Next Steps */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <button className="
              px-6 py-3
              border-2 border-gray-300 text-gray-700
              font-semibold
              rounded-lg
              hover:border-gray-400 hover:bg-gray-50
              transition-all duration-200
            ">
              Back to Home
            </button>
          </Link>
          <Link href="/portfolio">
            <button className="
              px-6 py-3
              bg-primary-600 hover:bg-primary-700
              text-white font-semibold
              rounded-lg
              shadow-md hover:shadow-lg
              transition-all duration-200
              flex items-center gap-2
            ">
              View Our Portfolio
              <ArrowRight size={20} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
