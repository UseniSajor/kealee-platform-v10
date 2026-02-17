'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Play } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-orange-50" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
      <div className="absolute top-40 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Copy */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
              </span>
              Trusted by 500+ projects
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Complete Project Management{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-600">
                Made Simple
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              From project planning to permit approval, manage every aspect of your project in one place. 
              <strong> Save 40% on project management costs</strong> and deliver projects 25% faster.
            </p>

            {/* Benefits */}
            <div className="space-y-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-white" size={16} />
                </div>
                <span className="text-gray-700 font-medium">Professional PM services from $1,750/month</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-white" size={16} />
                </div>
                <span className="text-gray-700 font-medium">AI-powered permit review in 5 minutes</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-white" size={16} />
                </div>
                <span className="text-gray-700 font-medium">Licensed architects & engineers on demand</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
              <Link
                href="https://app.kealee.com/signup"
                className="
                  group
                  inline-flex items-center justify-center gap-2
                  px-8 py-4
                  bg-blue-600 hover:bg-blue-700
                  text-white font-semibold text-lg
                  rounded-xl
                  shadow-lg hover:shadow-xl
                  transition-all duration-200
                  transform hover:scale-105
                "
              >
                Get Started Free
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
              
              <button
                onClick={() => {/* Open video modal */}}
                className="
                  group
                  inline-flex items-center justify-center gap-2
                  px-8 py-4
                  border-2 border-gray-300 hover:border-blue-600
                  text-gray-700 hover:text-blue-600 font-semibold text-lg
                  rounded-xl
                  transition-all duration-200
                "
              >
                <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                  <Play className="text-blue-600 group-hover:text-white transition-colors" size={20} />
                </div>
                Watch Demo
              </button>
            </div>

            {/* Trust Signals */}
            <div className="mt-8 flex items-center gap-6 text-sm text-gray-600 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
            {/* Dashboard Preview */}
            <div className="relative">
              {/* Main Card */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
                {/* Fake Browser Chrome */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                </div>

                {/* Dashboard Content */}
                <div className="space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">24</div>
                      <div className="text-xs text-gray-600">Active Projects</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">94%</div>
                      <div className="text-xs text-gray-600">On-Time</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-orange-600">18%</div>
                      <div className="text-xs text-gray-600">Cost Savings</div>
                    </div>
                  </div>

                  {/* Project List */}
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {i}
                        </div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-300 rounded w-3/4 mb-1" />
                          <div className="h-2 bg-gray-200 rounded w-1/2" />
                        </div>
                        <div className="w-16 h-6 bg-green-100 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-xl p-4 border border-gray-200 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Permit Approved!</div>
                    <div className="text-xs text-gray-600">2 days ahead of schedule</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 border border-gray-200 animate-float animation-delay-2000">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <ArrowRight className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">$12,500 Saved</div>
                    <div className="text-xs text-gray-600">This month</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
