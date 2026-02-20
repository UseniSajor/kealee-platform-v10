import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {/* Back to Home */}
            <div className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Home
              </Link>
            </div>

            {children}

            {/* Legal Navigation */}
            <div className="mt-16 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Legal Documents
              </h3>
              <div className="flex flex-wrap gap-6">
                <Link
                  href="/legal/terms"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/legal/privacy"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/legal/acceptable-use"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Acceptable Use Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
