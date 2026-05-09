'use client'

import Link from 'next/link'
import { AlertCircle, ArrowRight, Lightbulb, Zap, DollarSign } from 'lucide-react'

interface FallbackOutputProps {
  projectId?: string
  projectType?: string
  failureReason?: string
}

export function FallbackOutput({ projectId, projectType, failureReason }: FallbackOutputProps) {
  return (
    <div className="space-y-8">
      {/* Error notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex gap-4">
        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-900">Processing Update</h3>
          <p className="text-amber-800 text-sm mt-1">
            {failureReason || 'We encountered an issue generating your detailed analysis.'}
          </p>
          <p className="text-amber-700 text-sm mt-2">
            But don't worry! We've prepared next steps to continue your project.
          </p>
        </div>
      </div>

      {/* Main fallback content */}
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-gray-900">Your project is ready to continue</h2>
          <p className="text-lg text-gray-600">
            We've identified next steps to move your project forward
          </p>
        </div>

        {/* Three CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {/* Permit Package */}
          <Link
            href={`/intake/permit_path_only/payment?projectId=${projectId}`}
            className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 w-fit">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Permit Package</h3>
                <p className="text-sm text-gray-600">
                  Get professional permit prep and submission coordination
                </p>
              </div>
              <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                From $299 <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Contractor Match */}
          <Link
            href={`/intake/contractor_match?projectId=${projectId}`}
            className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 hover:border-green-500 hover:shadow-lg transition-all"
          >
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-3 w-fit">
                <Lightbulb className="w-6 h-6 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Contractor Match</h3>
                <p className="text-sm text-gray-600">
                  Connect with verified contractors specialized in your project type
                </p>
              </div>
              <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                From $199 <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Architect Consultation */}
          <Link
            href={`/intake/consultation?projectId=${projectId}`}
            className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 hover:border-purple-500 hover:shadow-lg transition-all"
          >
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-3 w-fit">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Expert Consultation</h3>
                <p className="text-sm text-gray-600">
                  Schedule a 1:1 call with a licensed architect to discuss your vision
                </p>
              </div>
              <div className="flex items-center gap-2 text-purple-600 font-medium text-sm">
                $149 <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Support section */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Need help?</h3>
        <p className="text-gray-600 text-sm mb-4">
          Our team is ready to assist with your project. Contact us anytime.
        </p>
        <div className="flex gap-3">
          <a
            href="mailto:support@kealee.com"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Email Support
          </a>
          <a
            href="tel:+1-800-KEALEE-1"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Call Us
          </a>
        </div>
      </div>
    </div>
  )
}
