'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Play, Building2, Shield, Clock, TrendingUp, Star } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/50" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative blobs */}
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-blue-300/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Content */}
          <div className="max-w-2xl">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur border border-slate-200/50 text-slate-700 px-4 py-2 rounded-full text-sm font-medium mb-8 shadow-sm">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span>
                Trusted by <span className="font-bold text-blue-600">500+</span> construction projects
              </span>
              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={12} fill="currentColor" />
                ))}
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-[1.1] tracking-tight">
              Build Smarter.{' '}
              <span className="relative">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800">
                  Deliver Faster.
                </span>
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-orange-400/40" viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path d="M0 9c40-6 80-6 120-2s80 6 80 0" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed max-w-xl">
              The all-in-one construction management platform that helps contractors, architects, and project owners
              streamline every phase of their projects.
            </p>

            {/* Key Value Props */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur border border-slate-200/50">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="text-green-600" size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">40% Cost Savings</div>
                  <div className="text-sm text-slate-500">On project management</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur border border-slate-200/50">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="text-blue-600" size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">25% Faster Delivery</div>
                  <div className="text-sm text-slate-500">Average project completion</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur border border-slate-200/50">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="text-orange-600" size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">85% First-Pass Approval</div>
                  <div className="text-sm text-slate-500">Permit success rate</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur border border-slate-200/50">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="text-purple-600" size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">3,000+ Jurisdictions</div>
                  <div className="text-sm text-slate-500">Nationwide coverage</div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-[1.02]"
              >
                Start Your Free Trial
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </Link>

              <button
                onClick={() => {}}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-lg rounded-xl transition-all duration-300"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="text-white ml-0.5" size={18} fill="white" />
                </div>
                Watch Demo
              </button>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={16} />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={16} />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={16} />
                <span>Setup in 5 minutes</span>
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
                  <div className="px-4 py-1 bg-white rounded-md text-xs text-slate-400 border border-slate-200">
                    app.kealee.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <div className="text-3xl font-bold">24</div>
                    <div className="text-sm text-blue-100">Active Projects</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <div className="text-3xl font-bold">94%</div>
                    <div className="text-sm text-green-100">On-Time Rate</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <div className="text-3xl font-bold">$2.4M</div>
                    <div className="text-sm text-orange-100">Saved YTD</div>
                  </div>
                </div>

                {/* Chart Placeholder */}
                <div className="h-32 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl flex items-end p-4 gap-2">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                {/* Project List */}
                <div className="space-y-3">
                  {[
                    { name: 'Downtown Office Complex', status: 'On Track', progress: 78, color: 'green' },
                    { name: 'Residential Development', status: 'In Review', progress: 45, color: 'blue' },
                    { name: 'Warehouse Renovation', status: 'Permitting', progress: 23, color: 'orange' },
                  ].map((project, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                      <div className={`w-10 h-10 rounded-lg bg-${project.color}-100 flex items-center justify-center`}>
                        <Building2 className={`text-${project.color}-600`} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{project.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-${project.color}-500 rounded-full`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 font-medium">{project.progress}%</span>
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-xs font-medium bg-${project.color}-100 text-${project.color}-700`}>
                        {project.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl border border-slate-200/50 p-4 animate-float">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Permit Approved!</div>
                  <div className="text-sm text-slate-500">2 days ahead of schedule</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl border border-slate-200/50 p-4 animate-float animation-delay-2000">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">$12,500 Saved</div>
                  <div className="text-sm text-slate-500">This month alone</div>
                </div>
              </div>
            </div>

            {/* Notification Badge */}
            <div className="absolute top-1/2 -left-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-xl p-3 animate-pulse">
              <div className="text-xs font-bold">LIVE</div>
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
