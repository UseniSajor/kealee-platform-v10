'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Shield, Lock, Banknote, TrendingUp, Star, BadgeCheck } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {/* Base gradient - Financial green theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/50" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative blobs */}
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-emerald-300/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Content */}
          <div className="max-w-2xl">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur border border-slate-200/50 text-slate-700 px-4 py-2 rounded-full text-sm font-medium mb-8 shadow-sm">
              <div className="flex items-center gap-1">
                <Shield className="text-emerald-600" size={16} />
                <BadgeCheck className="text-emerald-600" size={16} />
              </div>
              <span>
                Trusted by <span className="font-bold text-emerald-600">$500M+</span> in secured transactions
              </span>
              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={12} fill="currentColor" />
                ))}
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-[1.1] tracking-tight">
              Secure Escrow.{' '}
              <span className="relative">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800">
                  Protected Payments.
                </span>
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-amber-400/40" viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path d="M0 9c40-6 80-6 120-2s80 6 80 0" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed max-w-xl">
              The enterprise-grade escrow platform for construction projects. Protect your funds with
              milestone-based releases, complete transparency, and bank-level security.
            </p>

            {/* Key Value Props */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur border border-slate-200/50">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Lock className="text-emerald-600" size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Bank-Level Security</div>
                  <div className="text-sm text-slate-500">256-bit encryption</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur border border-slate-200/50">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Banknote className="text-blue-600" size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">FDIC Insured</div>
                  <div className="text-sm text-slate-500">Up to $250,000 coverage</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur border border-slate-200/50">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="text-amber-600" size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Fraud Protection</div>
                  <div className="text-sm text-slate-500">Multi-layer verification</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur border border-slate-200/50">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="text-purple-600" size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Real-Time Tracking</div>
                  <div className="text-sm text-slate-500">Complete visibility</div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold text-lg rounded-xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-[1.02]"
              >
                Start Secure Transaction
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </Link>

              <Link
                href="/demo"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-lg rounded-xl transition-all duration-300"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center shadow-lg">
                  <Shield className="text-white" size={18} />
                </div>
                View Demo
              </Link>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-emerald-500" size={16} />
                <span>No hidden fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-emerald-500" size={16} />
                <span>SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-emerald-500" size={16} />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Right Column - Dashboard Preview */}
          <div className="relative">
            {/* Main Dashboard Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-white rounded-md text-xs text-slate-400 border border-slate-200 flex items-center gap-2">
                    <Lock size={10} className="text-emerald-500" />
                    trust.kealee.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <div className="text-3xl font-bold">$2.4M</div>
                    <div className="text-sm text-emerald-100">In Escrow</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <div className="text-3xl font-bold">12</div>
                    <div className="text-sm text-blue-100">Active Projects</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                    <div className="text-3xl font-bold">98%</div>
                    <div className="text-sm text-amber-100">On-Time Release</div>
                  </div>
                </div>

                {/* Progress Visualization */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-sm font-medium text-slate-700 mb-3">Escrow Flow</div>
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-4 left-8 right-8 h-1 bg-slate-200">
                      <div className="h-full w-2/3 bg-emerald-500 rounded-full" />
                    </div>
                    {['Deposit', 'Verified', 'Milestone', 'Release'].map((step, i) => (
                      <div key={step} className="relative z-10 flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          i < 3 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {i < 3 ? <CheckCircle size={16} /> : i + 1}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transaction List */}
                <div className="space-y-3">
                  {[
                    { name: 'Downtown Office Complex', amount: '$850,000', status: 'Protected', color: 'emerald' },
                    { name: 'Residential Development', amount: '$425,000', status: 'Releasing', color: 'blue' },
                    { name: 'Warehouse Renovation', amount: '$175,000', status: 'Pending', color: 'amber' },
                  ].map((tx, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                      <div className={`w-10 h-10 rounded-lg bg-${tx.color}-100 flex items-center justify-center`}>
                        <Shield className={`text-${tx.color}-600`} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{tx.name}</div>
                        <div className="text-sm text-slate-500">{tx.amount}</div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-xs font-medium bg-${tx.color}-100 text-${tx.color}-700`}>
                        {tx.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl border border-slate-200/50 p-4 animate-float">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Lock className="text-emerald-600" size={24} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Funds Secured</div>
                  <div className="text-sm text-slate-500">256-bit encrypted</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl border border-slate-200/50 p-4 animate-float animation-delay-2000">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Banknote className="text-blue-600" size={24} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">$125,000 Released</div>
                  <div className="text-sm text-slate-500">Milestone 3 complete</div>
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="absolute top-1/2 -left-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl shadow-xl p-3">
              <div className="text-xs font-bold flex items-center gap-1">
                <Shield size={12} />
                SECURED
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 text-slate-400">
        <span className="text-xs font-medium uppercase tracking-wider">Scroll to explore</span>
        <div className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-slate-400 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
