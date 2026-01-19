import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';

export function Hero() {
  return (
    <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text */}
          <div>
            <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              🚀 Trusted by 500+ construction projects
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Complete Construction Management Platform
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              From project planning to permit approval, manage every aspect of
              your construction project in one place. Save time, reduce costs,
              and deliver exceptional results.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center space-x-3">
                <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                <span className="text-gray-700">
                  Professional PM services from $1,750/month
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                <span className="text-gray-700">
                  AI-powered permit review in 5 minutes
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                <span className="text-gray-700">
                  Licensed architects & engineers on demand
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="https://app.kealee.com/signup"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition font-semibold text-lg flex items-center justify-center group"
              >
                Get Started Free
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition" size={20} />
              </Link>
              <a
                href="#services"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-blue-600 hover:text-blue-600 transition font-semibold text-lg text-center"
              >
                Explore Services
              </a>
            </div>
          </div>

          {/* Right Column - Image/Visual */}
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 shadow-2xl">
              {/* Placeholder for hero image or illustration */}
              <div className="bg-white/10 backdrop-blur rounded-xl p-8 text-white">
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white/20 rounded-lg p-4">
                    <span className="font-semibold">Active Projects</span>
                    <span className="text-2xl font-bold">247</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/20 rounded-lg p-4">
                    <span className="font-semibold">On-Time Delivery</span>
                    <span className="text-2xl font-bold">94%</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/20 rounded-lg p-4">
                    <span className="font-semibold">Avg. Cost Savings</span>
                    <span className="text-2xl font-bold">18%</span>
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
