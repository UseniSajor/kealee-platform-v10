'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send, MessageSquare, ArrowRight, Clock } from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration: 0.5 },
}

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send message.')
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="py-20">
        <motion.div {...fadeInUp} className="mx-auto max-w-lg text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(56,161,105,0.1)' }}
          >
            <Send className="h-8 w-8" style={{ color: '#38A169' }} />
          </div>
          <h2 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>Message Sent</h2>
          <p className="mt-2 text-gray-600">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero */}
      <section className="py-16 lg:py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.span {...fadeInUp} className="section-label">
            Contact Us
          </motion.span>
          <motion.h1
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 text-4xl font-bold font-display sm:text-5xl"
            style={{ color: '#1A2B4A' }}
          >
            Get in Touch
          </motion.h1>
          <motion.p
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-600"
          >
            Have a question about Kealee? Want a demo? Our team is here to help you find the right solution for your project.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Contact Info */}
            <motion.div {...fadeInUp} className="lg:col-span-2">
              <h2 className="text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>Contact Information</h2>
              <div className="mt-6 space-y-6">
                {[
                  { icon: Mail, label: 'Email', value: 'hello@kealee.com', href: 'mailto:hello@kealee.com' },
                  { icon: Phone, label: 'Phone', value: '(240) 555-0100', href: 'tel:+12405550100' },
                  { icon: MapPin, label: 'Office', value: 'DC-Baltimore Metropolitan Area', href: undefined },
                  { icon: Clock, label: 'Hours', value: 'Mon-Fri 9am-6pm ET', href: undefined },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(42,191,191,0.1)' }}>
                      <item.icon className="h-5 w-5" style={{ color: '#2ABFBF' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-sm transition-colors hover:opacity-80" style={{ color: '#E8793A' }}>
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-600">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div className="mt-10 rounded-xl p-6" style={{ backgroundColor: '#F7FAFC' }}>
                <h3 className="mb-4 text-sm font-bold" style={{ color: '#1A2B4A' }}>Quick Links</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Explore Features', href: '/features' },
                    { label: 'View Pricing', href: '/pricing' },
                    { label: 'Read the Blog', href: '/blog' },
                  ].map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                      style={{ color: '#2ABFBF' }}
                    >
                      <ArrowRight className="h-4 w-4" /> {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div {...fadeInUp} transition={{ duration: 0.5, delay: 0.2 }} className="lg:col-span-3">
              <form
                onSubmit={handleSubmit}
                className="space-y-5 rounded-xl bg-white p-6"
                style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #E5E7EB' }}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-1 block text-sm font-medium" style={{ color: '#1A2B4A' }}>Name</label>
                    <input
                      id="name" type="text" required value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-1 block text-sm font-medium" style={{ color: '#1A2B4A' }}>Email</label>
                    <input
                      id="email" type="email" required value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
                    />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="phone" className="mb-1 block text-sm font-medium" style={{ color: '#1A2B4A' }}>Phone (optional)</label>
                    <input
                      id="phone" type="tel" value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="mb-1 block text-sm font-medium" style={{ color: '#1A2B4A' }}>Subject</label>
                    <select
                      id="subject" required value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
                    >
                      <option value="">Select a topic</option>
                      <option value="demo">Request a Demo</option>
                      <option value="pricing">Pricing & Plans</option>
                      <option value="project">Start a Project</option>
                      <option value="contractor">Contractor Signup</option>
                      <option value="developer">Developer/Investor Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="mb-1 block text-sm font-medium" style={{ color: '#1A2B4A' }}>Message</label>
                  <textarea
                    id="message" rows={5} required value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
                    placeholder="Tell us about your project or question..."
                  />
                </div>
                {error && (
                  <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: '#E8793A' }}
                >
                  {loading ? 'Sending…' : <><span>Send Message</span><ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
