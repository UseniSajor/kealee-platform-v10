'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    companySize: '',
    currentProjects: '',
    interests: [] as string[],
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const companySizes = [
    '1-5 employees',
    '6-15 employees',
    '16-50 employees',
    '51-200 employees',
    '200+ employees',
  ];

  const projectCounts = [
    '1-2 active projects',
    '3-5 active projects',
    '6-10 active projects',
    '10+ active projects',
  ];

  const interestOptions = [
    { id: 'ops-packages', label: 'Operations Packages (A-D)' },
    { id: 'precon', label: 'Pre-Construction Workflow' },
    { id: 'estimation', label: 'AI Estimation Engine' },
    { id: 'permits', label: 'Permits & Inspections' },
    { id: 'marketplace', label: 'Contractor Marketplace' },
    { id: 'finance', label: 'Finance & Trust (Escrow)' },
  ];

  const handleInterestChange = (id: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id],
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        alert('Something went wrong. Please try again or email ops@kealee.com');
      }
    } catch {
      alert('Network error. Please try again or email ops@kealee.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="rounded-2xl border border-black/10 bg-white p-12 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-black">Demo Request Received</h1>
          <p className="mt-3 text-zinc-600">
            Thanks, {formData.name}! A member of our team will reach out within one business day
            to schedule your personalized demo.
          </p>
          <p className="mt-4 text-sm text-zinc-500">
            We'll send a confirmation email to {formData.email}
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
    <main>
      {/* Hero */}
      <section className="relative py-16">
        <Image src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1920&q=80&auto=format&fit=crop" alt="Team meeting" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white">
            Request a Demo
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            See how Kealee can transform your construction operations. Our team will walk you
            through the platform and answer all your questions.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[var(--primary)] hover:underline mb-8"
      >
        ← Back to Home
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Left Column - Info */}
        <div>

          <div className="mt-8 space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">📋</span>
              </div>
              <div>
                <h3 className="font-bold">Personalized Walkthrough</h3>
                <p className="text-sm text-zinc-600 mt-1">
                  We'll tailor the demo to your specific needs and show you relevant features.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">💡</span>
              </div>
              <div>
                <h3 className="font-bold">ROI Analysis</h3>
                <p className="text-sm text-zinc-600 mt-1">
                  Learn how much time and money you can save with our operations packages.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🚀</span>
              </div>
              <div>
                <h3 className="font-bold">Free Trial Setup</h3>
                <p className="text-sm text-zinc-600 mt-1">
                  Start your 14-day free trial right after the demo if you're ready.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 p-6 rounded-2xl bg-zinc-50 border border-black/5">
            <p className="text-sm font-bold text-zinc-900">What our clients say:</p>
            <p className="mt-3 text-zinc-600 italic">
              "The demo really opened my eyes to how much time I was wasting on admin work.
              Within the first month, I got 20+ hours back per week."
            </p>
            <p className="mt-2 text-sm font-semibold text-zinc-700">
              — Mike R., General Contractor
            </p>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
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
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-black/10 rounded-lg focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  placeholder="Smith Construction"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-black/10 rounded-lg focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  placeholder="john@smithconstruction.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-black/10 rounded-lg focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  placeholder="(202) 555-0123"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Company Size
                </label>
                <select
                  value={formData.companySize}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  className="w-full px-4 py-2.5 border border-black/10 rounded-lg focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                  <option value="">Select...</option>
                  {companySizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Active Projects
                </label>
                <select
                  value={formData.currentProjects}
                  onChange={(e) => setFormData({ ...formData, currentProjects: e.target.value })}
                  className="w-full px-4 py-2.5 border border-black/10 rounded-lg focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                  <option value="">Select...</option>
                  {projectCounts.map(count => (
                    <option key={count} value={count}>{count}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                What are you interested in?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {interestOptions.map(option => (
                  <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.interests.includes(option.id)}
                      onChange={() => handleInterestChange(option.id)}
                      className="w-4 h-4 rounded border-black/20 text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-sm text-zinc-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                Anything else we should know?
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-black/10 rounded-lg focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 resize-none"
                placeholder="Tell us about your current challenges or questions..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[var(--primary)] text-white font-bold rounded-xl hover:opacity-95 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Request Demo'}
            </button>

            <p className="text-xs text-center text-zinc-500">
              We'll contact you within one business day to schedule your demo.
            </p>
          </form>
        </div>
      </div>
      </div>
    </main>
  );
}
