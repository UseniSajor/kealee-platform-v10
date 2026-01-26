'use client';

import Link from 'next/link';
import { ArrowRight, Shield, CheckCircle, Phone } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-full text-white text-sm font-medium mb-8">
            <Shield size={16} />
            Start Protecting Your Payments Today
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Secure Your Next
            <span className="block text-amber-300">Construction Project?</span>
          </h2>

          {/* Description */}
          <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
            Join thousands of contractors and project owners who trust Finance Trust
            for secure, transparent financial management.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="flex items-center gap-2 text-white">
              <CheckCircle className="text-emerald-300" size={20} />
              <span>Free to get started</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <CheckCircle className="text-emerald-300" size={20} />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <CheckCircle className="text-emerald-300" size={20} />
              <span>24/7 support</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-emerald-700 font-semibold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:bg-emerald-50 transition-all duration-300 transform hover:scale-[1.02]"
            >
              Open Free Account
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-transparent text-white font-semibold text-lg rounded-xl border-2 border-white/30 hover:border-white/50 hover:bg-white/10 transition-all duration-300"
            >
              <Phone size={20} />
              Talk to Sales
            </Link>
          </div>

          {/* Trust Note */}
          <p className="mt-8 text-emerald-200 text-sm">
            FDIC insured  |  SOC 2 certified  |  Bank-level security
          </p>
        </div>
      </div>
    </section>
  );
}
