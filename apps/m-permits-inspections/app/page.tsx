'use client';

import { FileCheck, Clock, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@kealee/ui';

export default function PermitsLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm font-semibold mb-6">
                ⚡ AI-Powered Permit Review
              </div>
              
              <h1 className="text-5xl font-bold mb-6">
                Get Your Permits Approved 40% Faster
              </h1>
              
              <p className="text-xl text-primary-100 mb-8">
                AI reviews your application in 5 minutes and catches common errors before submission.
                3,000+ jurisdictions supported across the DC-Baltimore corridor.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/permits/new">
                  <Button
                    variant="primary"
                    size="lg"
                    className="bg-white text-primary-600 hover:bg-gray-100"
                    rightIcon={<ArrowRight size={20} />}
                  >
                    Start Application
                  </Button>
                </Link>
                
                <a
                  href="#how-it-works"
                  className="
                    px-8 py-4
                    border-2 border-white text-white
                    font-semibold text-lg
                    rounded-lg
                    hover:bg-white/10
                    transition-all duration-200
                    text-center
                  "
                >
                  How It Works
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span>85% first-try approval rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span>3,000+ jurisdictions</span>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-white">
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white/10 rounded-xl p-4">
                  <span className="text-lg font-medium">Average Approval Time</span>
                  <span className="text-3xl font-bold">14 days</span>
                </div>
                <div className="flex items-center justify-between bg-white/10 rounded-xl p-4">
                  <span className="text-lg font-medium">AI Review Time</span>
                  <span className="text-3xl font-bold">5 min</span>
                </div>
                <div className="flex items-center justify-between bg-white/10 rounded-xl p-4">
                  <span className="text-lg font-medium">Success Rate</span>
                  <span className="text-3xl font-bold">85%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Simple 4-Step Process
          </h2>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { step: '01', title: 'Select Location', desc: 'Enter your project address', icon: '📍' },
              { step: '02', title: 'Choose Permit Type', desc: 'Building, electrical, plumbing, etc.', icon: '📋' },
              { step: '03', title: 'Upload Documents', desc: 'AI reviews in real-time', icon: '⚡' },
              { step: '04', title: 'Submit & Track', desc: 'Get status updates', icon: '✅' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  {item.step}
                </div>
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Your Permit Approved?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Start your application now. AI review takes 5 minutes.
          </p>
          <Link href="/permits/new">
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-primary-600 hover:bg-gray-100"
            >
              Start Application
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
