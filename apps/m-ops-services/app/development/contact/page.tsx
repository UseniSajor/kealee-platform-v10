'use client';

import { useState } from 'react';
import Link from 'next/link';

const projectTypes = [
  'Residential - Single Family',
  'Residential - Multi-Family',
  'Commercial - Office',
  'Commercial - Retail',
  'Mixed-Use Development',
  'Government / Institutional',
  'Industrial',
  'Renovation / Remodel',
  'Other',
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    projectType: '',
    budget: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100 py-3 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm text-gray-500">
          <Link href="/development" className="hover:text-gray-700">Development</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Contact</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-5 gap-12">
          {/* Contact Info */}
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold text-[#1A2B4A] mb-4">Get in Touch</h1>
            <p className="text-gray-600 mb-8">
              Ready to streamline your construction operations? Tell us about your project and we will create a customized plan.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-[#1A2B4A] text-sm uppercase tracking-wider mb-2">Email</h3>
                <a href="mailto:getstarted@kealee.com" className="text-[#F97316] hover:underline">getstarted@kealee.com</a>
              </div>
              <div>
                <h3 className="font-semibold text-[#1A2B4A] text-sm uppercase tracking-wider mb-2">Phone</h3>
                <a href="tel:+13015758777" className="text-[#F97316] hover:underline">(301) 575-8777</a>
              </div>
              <div>
                <h3 className="font-semibold text-[#1A2B4A] text-sm uppercase tracking-wider mb-2">Service Area</h3>
                <p className="text-gray-600 text-sm">DC-Baltimore Corridor including Washington DC, Maryland, and Northern Virginia.</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#1A2B4A] text-sm uppercase tracking-wider mb-2">Office Hours</h3>
                <p className="text-gray-600 text-sm">Monday - Friday: 8:00 AM - 6:00 PM EST</p>
                <p className="text-gray-600 text-sm">Saturday: 9:00 AM - 1:00 PM EST</p>
                <p className="text-gray-600 text-sm">Sunday: Closed</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-orange-50 rounded-xl">
              <p className="text-sm text-gray-700 font-medium mb-1">Response Time</p>
              <p className="text-xs text-gray-600">We respond to all inquiries within 4 business hours.</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-3">
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h2>
                <p className="text-green-700 text-sm">Thank you for your interest. Our team will review your project details and respond within 4 business hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6 md:p-8 space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" placeholder="John Smith" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" placeholder="john@company.com" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" placeholder="Your Company" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                    <select name="projectType" value={formData.projectType} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none bg-white">
                      <option value="">Select type...</option>
                      {projectTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Budget</label>
                    <select name="budget" value={formData.budget} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none bg-white">
                      <option value="">Select range...</option>
                      <option value="under-500k">Under $500K</option>
                      <option value="500k-1m">$500K - $1M</option>
                      <option value="1m-5m">$1M - $5M</option>
                      <option value="5m-10m">$5M - $10M</option>
                      <option value="10m-25m">$10M - $25M</option>
                      <option value="25m-plus">$25M+</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tell Us About Your Project *</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} required rows={5} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none resize-none" placeholder="Describe your project, timeline, and any specific operational needs..." />
                </div>
                <button type="submit" className="w-full py-3 bg-[#F97316] text-white rounded-lg font-semibold hover:bg-orange-600 transition text-sm">
                  Send Message
                </button>
                <p className="text-xs text-gray-400 text-center">We will respond within 4 business hours.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
