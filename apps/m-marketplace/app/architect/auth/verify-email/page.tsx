'use client';

import { Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="
          w-20 h-20 mx-auto mb-6
          bg-blue-100 rounded-full
          flex items-center justify-center
        ">
          <Mail className="text-blue-600" size={40} />
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Verify Your Email
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          We've sent a verification link to your email address. 
          Click the link to activate your account.
        </p>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-gray-900 mb-4">Next steps:</h3>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <span className="
                w-6 h-6 flex-shrink-0
                bg-blue-600 text-white
                rounded-full
                flex items-center justify-center
                text-xs font-bold
              ">
                1
              </span>
              <span>Check your email inbox</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="
                w-6 h-6 flex-shrink-0
                bg-blue-600 text-white
                rounded-full
                flex items-center justify-center
                text-xs font-bold
              ">
                2
              </span>
              <span>Click the verification link</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="
                w-6 h-6 flex-shrink-0
                bg-blue-600 text-white
                rounded-full
                flex items-center justify-center
                text-xs font-bold
              ">
                3
              </span>
              <span>Sign in and get started!</span>
            </li>
          </ol>
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-yellow-800">
            <strong>Didn't receive the email?</strong> Check your spam folder. 
            The email may take a few minutes to arrive.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/architect/login"
          className="
            inline-flex items-center gap-2
            px-6 py-3
            bg-blue-600 hover:bg-blue-700
            text-white font-semibold
            rounded-lg
            shadow-md hover:shadow-lg
            transition-all duration-200
          "
        >
          Go to Login
          <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
}
