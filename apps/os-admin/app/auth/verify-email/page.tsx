'use client';

import { useState } from 'react';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@kealee/auth/client';

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  async function handleResend() {
    setResending(true);
    setResendMessage('');
    try {
      const storedEmail =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('kealee:signup-email')
          : null;

      if (!storedEmail) {
        setResendMessage(
          'We could not determine your email. Please try signing up again or contact support.'
        );
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: storedEmail,
      });

      if (error) {
        setResendMessage(error.message);
      } else {
        setResendMessage('Verification email resent. Please check your inbox.');
      }
    } catch {
      setResendMessage('Something went wrong. Please try again later.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
          <Mail className="text-blue-600" size={40} />
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Verify Your Email</h1>
        <p className="text-lg text-gray-600 mb-8">
          We have sent a verification link to your email address. Click the link to
          activate your admin account.
        </p>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-gray-900 mb-4">Next steps:</h3>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 flex-shrink-0 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Check your email inbox</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 flex-shrink-0 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Click the verification link</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 flex-shrink-0 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Sign in and get started!</span>
            </li>
          </ol>
        </div>

        {/* Tips + Resend */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-yellow-800 mb-3">
            <strong>Didn't receive the email?</strong> Check your spam folder. The email
            may take a few minutes to arrive.
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-900 bg-yellow-200 hover:bg-yellow-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={resending ? 'animate-spin' : ''} />
            {resending ? 'Resending...' : 'Resend verification email'}
          </button>
          {resendMessage && (
            <p className="mt-2 text-sm text-yellow-800">{resendMessage}</p>
          )}
        </div>

        {/* CTA */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          Go to Login
          <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
}
