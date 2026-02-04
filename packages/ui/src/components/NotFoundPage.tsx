// packages/ui/src/components/NotFoundPage.tsx
// Reusable 404 Page Component with Construction Theme

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface NotFoundPageProps {
  homeUrl?: string;
  servicesUrl?: string;
  permitsUrl?: string;
  contactUrl?: string;
}

export function NotFoundPage({
  homeUrl = '/',
  servicesUrl = '/services',
  permitsUrl = '/permits',
  contactUrl = '/contact',
}: NotFoundPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full text-center"
      >
        {/* Construction Illustration Placeholder */}
        <div className="mb-8">
          <div className="w-64 h-64 mx-auto bg-gray-100 rounded-full flex items-center justify-center relative overflow-hidden">
            {/* Hard Hat */}
            <svg
              className="w-32 h-32 text-[#E8793A]"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Hard hat shape */}
              <path
                d="M20 60 Q20 35 50 30 Q80 35 80 60 L80 70 Q80 75 75 75 L25 75 Q20 75 20 70 Z"
                fill="currentColor"
              />
              {/* Hat brim */}
              <path
                d="M10 70 Q10 65 20 65 L80 65 Q90 65 90 70 L90 75 Q90 80 85 80 L15 80 Q10 80 10 75 Z"
                fill="#d16a2f"
              />
              {/* Hard hat stripe */}
              <rect x="30" y="40" width="40" height="5" rx="2" fill="#fff" opacity="0.3" />
            </svg>

            {/* Construction Tape Stripes */}
            <div className="absolute bottom-0 left-0 right-0 h-8 flex">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i % 2 === 0 ? 'bg-[#E8793A]' : 'bg-[#1A2B4A]'}`}
                  style={{ transform: 'skewX(-20deg)' }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-6xl font-bold text-[#1A2B4A] mb-4 font-mono">404</h1>

        {/* Message */}
        <h2 className="text-2xl font-bold text-[#1A2B4A] mb-3">This Page is Under Construction</h2>
        <p className="text-gray-600 mb-8">
          Looks like this page hasn't been built yet, or the blueprint got lost along the way.
          Let's get you back on track.
        </p>

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href={homeUrl}
            className="px-6 py-3 bg-[#E8793A] text-white font-semibold rounded-xl hover:bg-[#d16a2f] transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Or try one of these:</p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href={servicesUrl}
              className="text-[#1A2B4A] hover:text-[#E8793A] font-medium text-sm transition-colors"
            >
              Services
            </Link>
            <Link
              href={permitsUrl}
              className="text-[#1A2B4A] hover:text-[#E8793A] font-medium text-sm transition-colors"
            >
              Permits
            </Link>
            <Link
              href={contactUrl}
              className="text-[#1A2B4A] hover:text-[#E8793A] font-medium text-sm transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>

        {/* Fun Message */}
        <p className="mt-8 text-xs text-gray-400">
          Error Code: BLUEPRINTS_NOT_FOUND • If you think this is a mistake, please{' '}
          <Link href={contactUrl} className="text-[#E8793A] hover:underline">
            let us know
          </Link>
          .
        </p>
      </motion.div>
    </div>
  );
}
