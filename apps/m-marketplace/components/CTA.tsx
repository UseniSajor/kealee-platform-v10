'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Phone, Mail, Sparkles } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Main Content */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-white/10">
              <Sparkles size={16} className="text-orange-400" />
              Start Building Smarter Today
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to Transform Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
                Construction Projects?
              </span>
            </h2>

            <p className="text-xl text-blue-100/80 max-w-3xl mx-auto mb-10">
              Join 500+ successful projects using Kealee. Experience the difference
              that modern construction management can make.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-900 font-semibold text-lg rounded-xl shadow-2xl hover:shadow-white/20 transition-all duration-300 transform hover:scale-[1.02]"
              >
                Start Free Trial
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </Link>

              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold text-lg rounded-xl hover:bg-white/20 transition-all duration-300"
              >
                <Phone size={20} />
                Schedule a Demo
              </Link>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-blue-200/70">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-400" size={16} />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-400" size={16} />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-400" size={16} />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-400" size={16} />
                <span>24/7 support</span>
              </div>
            </div>
          </div>

          {/* Contact Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-16">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                <Mail className="text-blue-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Email Us</h3>
              <p className="text-blue-200/70 mb-4">Get a response within 24 hours</p>
              <a
                href="mailto:sales@kealee.com"
                className="text-lg font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                sales@kealee.com
              </a>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
                <Phone className="text-green-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Call Us</h3>
              <p className="text-blue-200/70 mb-4">Mon-Fri from 8am to 6pm EST</p>
              <a
                href="tel:+18005551234"
                className="text-lg font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                1-800-555-1234
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
