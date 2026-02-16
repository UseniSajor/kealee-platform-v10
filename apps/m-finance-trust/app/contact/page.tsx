'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // In production, this would submit to an API endpoint
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Kealee</span>
              <span className="text-sm text-emerald-600 font-semibold">Finance & Trust</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Home
              </Link>
              <Link
                href="/help"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Help
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#1A2B4A] py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Have questions about escrow, payments, or our platform? We would love to hear from you.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Us a Message</h2>
                <p className="text-gray-600 mb-8">
                  Fill out the form below and our team will get back to you within one business day.
                </p>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-emerald-600 text-2xl font-bold">&#10003;</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent</h3>
                    <p className="text-gray-600 mb-6">
                      Thank you for reaching out. We will respond within one business day.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false)
                        setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
                      }}
                      className="text-emerald-600 font-semibold hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Smith"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john@example.com"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="(301) 555-0123"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="subject"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Subject <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="subject"
                          name="subject"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors bg-white"
                        >
                          <option value="">Select a topic</option>
                          <option value="escrow">Escrow Account Questions</option>
                          <option value="payments">Payments & Funding</option>
                          <option value="pricing">Pricing & Fees</option>
                          <option value="dispute">Dispute Resolution</option>
                          <option value="contractor">Contractor Inquiries</option>
                          <option value="partnership">Partnership Opportunities</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors resize-vertical"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-6 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Contact Info Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Office Info */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Office Location</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Region</p>
                    <p className="text-gray-600">DC-Baltimore Corridor</p>
                    <p className="text-gray-500 text-sm">Maryland | District of Columbia</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Email</p>
                    <a
                      href="mailto:finance@kealee.com"
                      className="text-emerald-600 hover:underline"
                    >
                      finance@kealee.com
                    </a>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Phone</p>
                    <a href="tel:3015758777" className="text-emerald-600 hover:underline">
                      (301) 575-8777
                    </a>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Business Hours</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday - Friday</span>
                    <span className="font-medium text-gray-900">9:00 AM - 6:00 PM ET</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday</span>
                    <span className="font-medium text-gray-900">10:00 AM - 2:00 PM ET</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday</span>
                    <span className="font-medium text-gray-500">Closed</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Emergency support for active escrow accounts is available 24/7 at (301) 575-8777.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
                <div className="space-y-3">
                  <Link
                    href="/help"
                    className="block text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  >
                    Help Center &amp; FAQ &rarr;
                  </Link>
                  <Link
                    href="/project/start"
                    className="block text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  >
                    Start a Project &rarr;
                  </Link>
                  <Link
                    href="/pricing"
                    className="block text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  >
                    View Pricing &rarr;
                  </Link>
                  <Link
                    href="/contractors"
                    className="block text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  >
                    For Contractors &rarr;
                  </Link>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-gray-200 rounded-2xl overflow-hidden h-48 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2 text-gray-400">&#9906;</div>
                  <p className="text-gray-500 text-sm font-medium">DC-Baltimore Corridor</p>
                  <p className="text-gray-400 text-xs">Maryland &amp; DC Metro Area</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/help" className="hover:text-white transition-colors">Help</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
          <p className="text-sm">&copy; 2026 Kealee Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
