'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitted(true);
  };

  const contactInfo = [
    {
      icon: '📧',
      label: 'Email',
      value: 'support@kealee.com',
      link: 'mailto:support@kealee.com',
    },
    {
      icon: '📞',
      label: 'Phone',
      value: '(202) 555-0199',
      link: 'tel:+12025550199',
    },
    {
      icon: '📍',
      label: 'Address',
      value: '1401 H Street NW, Suite 300, Washington, DC 20005',
      link: null,
    },
  ];

  const departments = [
    { name: 'General Inquiries', email: 'info@kealee.com' },
    { name: 'Sales & Demos', email: 'sales@kealee.com' },
    { name: 'Technical Support', email: 'support@kealee.com' },
    { name: 'Billing Questions', email: 'billing@kealee.com' },
    { name: 'Press & Media', email: 'press@kealee.com' },
    { name: 'Partnerships', email: 'partners@kealee.com' },
  ];

  if (submitted) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="rounded-2xl border border-black/10 bg-white p-12 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-black">Message Sent</h1>
          <p className="mt-3 text-zinc-600">
            Thanks for reaching out! We'll get back to you within 24 hours.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white transition hover:opacity-95"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[var(--primary)] hover:underline mb-8"
      >
        ← Back to Home
      </Link>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-black tracking-tight">Contact Us</h1>
        <p className="mt-3 text-lg text-zinc-600">
          Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black mb-4">Get in Touch</h2>
            <div className="space-y-4">
              {contactInfo.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-500">{item.label}</p>
                    {item.link ? (
                      <a
                        href={item.link}
                        className="text-zinc-900 hover:text-[var(--primary)] transition"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-zinc-900">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black mb-4">Department Emails</h2>
            <div className="space-y-3">
              {departments.map((dept) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-700">{dept.name}</span>
                  <a
                    href={`mailto:${dept.email}`}
                    className="text-sm text-[var(--primary)] hover:underline"
                  >
                    {dept.email}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black mb-4">Office Hours</h2>
            <div className="space-y-2 text-sm text-zinc-700">
              <div className="flex justify-between">
                <span>Monday - Friday</span>
                <span className="font-semibold">9:00 AM - 6:00 PM EST</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday</span>
                <span className="font-semibold">10:00 AM - 2:00 PM EST</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span className="text-zinc-500">Closed</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Emergency support for Package C & D clients available 24/7
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-black/10 rounded-lg focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-black/10 rounded-lg focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Subject *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-black/10 rounded-lg focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                  <option value="">Select a topic...</option>
                  <option value="general">General Inquiry</option>
                  <option value="sales">Sales & Pricing</option>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing Question</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="feedback">Product Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-2.5 border border-black/10 rounded-lg focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 resize-none"
                  placeholder="How can we help you?"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[var(--primary)] text-white font-bold rounded-xl hover:opacity-95 transition"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* FAQ CTA */}
      <div className="mt-12 text-center p-8 rounded-2xl bg-zinc-50 border border-black/5">
        <h2 className="text-xl font-black">Looking for Quick Answers?</h2>
        <p className="mt-2 text-zinc-600">
          Check out our frequently asked questions for immediate help.
        </p>
        <Link
          href="/how-it-works"
          className="mt-4 inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-2.5 text-sm font-bold text-zinc-900 hover:bg-zinc-50 transition"
        >
          How It Works →
        </Link>
      </div>
    </main>
  );
}
