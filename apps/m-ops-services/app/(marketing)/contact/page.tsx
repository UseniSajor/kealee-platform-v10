'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    projectCount: '',
    interestedPackage: '',
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
      value: 'ops@kealee.com',
      link: 'mailto:ops@kealee.com',
    },
    {
      icon: '📞',
      label: 'Phone',
      value: '(301) 575-8777',
      link: 'tel:+13015758777',
    },
    {
      icon: '🕐',
      label: 'Response Time',
      value: 'Within 2 business hours',
      link: null,
    },
  ];

  if (submitted) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Message Sent</h1>
          <p className="mt-3 text-zinc-600">
            Thanks for reaching out! A member of our ops team will get back to you within 2 business hours.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
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
        className="inline-flex items-center gap-2 text-sky-600 hover:underline mb-8"
      >
        &larr; Back to Home
      </Link>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Get Started with Kealee Ops</h1>
        <p className="mt-3 text-lg text-zinc-600">
          Tell us about your business and we&apos;ll recommend the right package for you. Free consultation, no commitment.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 text-zinc-900">Get in Touch</h2>
            <div className="space-y-4">
              {contactInfo.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-500">{item.label}</p>
                    {item.link ? (
                      <a
                        href={item.link}
                        className="text-zinc-900 hover:text-sky-600 transition"
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

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 text-zinc-900">Office Hours</h2>
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
              Emergency support for Package C &amp; D clients available 24/7
            </p>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6">
            <h2 className="text-lg font-bold mb-2 text-zinc-900">Book a Demo</h2>
            <p className="text-sm text-zinc-600 mb-4">
              Prefer to see the platform in action first? Schedule a 30-minute walkthrough with our team.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-xl border border-sky-500 bg-white px-5 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50 transition"
            >
              Schedule Demo
            </Link>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-zinc-900">Tell Us About Your Business</h2>
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
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
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
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    placeholder="Smith Construction LLC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    placeholder="(555) 555-5555"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                    Current # of Projects
                  </label>
                  <select
                    value={formData.projectCount}
                    onChange={(e) => setFormData({ ...formData, projectCount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="">Select...</option>
                    <option value="1">1 project</option>
                    <option value="2-3">2-3 projects</option>
                    <option value="4-5">4-5 projects</option>
                    <option value="6-10">6-10 projects</option>
                    <option value="10+">10+ projects</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                    Interested In
                  </label>
                  <select
                    value={formData.interestedPackage}
                    onChange={(e) => setFormData({ ...formData, interestedPackage: e.target.value })}
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="">Select a service...</option>
                    <option value="package-a">PM Package A — Starter ($1,750/mo)</option>
                    <option value="package-b">PM Package B — Professional ($3,750/mo)</option>
                    <option value="package-c">PM Package C — Premium ($9,500/mo)</option>
                    <option value="package-d">PM Package D — Enterprise ($16,500/mo)</option>
                    <option value="pm-software">PM Software Platform</option>
                    <option value="individual">Individual Services</option>
                    <option value="escrow">Escrow &amp; Finance</option>
                    <option value="developer">Developer Services</option>
                    <option value="not-sure">Not Sure Yet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Tell Us About Your Needs
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 resize-none"
                  placeholder="What challenges are you facing? How many team members do you have? What types of projects do you work on?"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition"
              >
                Get My Free Consultation
              </button>
              <p className="text-center text-xs text-zinc-500">
                We&apos;ll respond within 2 business hours. No spam, no pressure.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* FAQ CTA */}
      <div className="mt-12 text-center p-8 rounded-2xl bg-zinc-50 border border-zinc-200">
        <h2 className="text-xl font-bold text-zinc-900">Not Sure Which Package Is Right?</h2>
        <p className="mt-2 text-zinc-600">
          See how our packages compare or learn more about how our services work.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <Link
            href="/packages"
            className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition"
          >
            Compare Packages
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 transition"
          >
            How It Works
          </Link>
        </div>
      </div>
    </main>
  );
}
