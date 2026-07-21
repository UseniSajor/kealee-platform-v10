'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowRight, User } from 'lucide-react'
import Link from 'next/link'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration: 0.5 },
}

const BLOG_POSTS = [
  {
    slug: 'digital-twins-construction',
    title: 'How Digital Twins Are Transforming Construction Project Management',
    excerpt: 'Digital twins provide real-time project intelligence by combining schedule tracking, payment data, and AI analysis into a living model of your construction project.',
    author: 'Tim Chamberlain',
    date: '2026-03-05',
    readTime: '6 min',
    category: 'Technology',
    gradient: 'from-teal to-teal-dark',
  },
  {
    slug: 'keabots-ai-construction',
    title: 'Meet the KeaBots: 13 AI Assistants for Every Phase of Construction',
    excerpt: 'From land analysis to operations management, our specialized AI assistants handle domain-specific tasks while you focus on building.',
    author: 'Tim Chamberlain',
    date: '2026-03-01',
    readTime: '8 min',
    category: 'AI',
    gradient: 'from-builder-orange to-builder-orange-dark',
  },
  {
    slug: 'escrow-payments-guide',
    title: 'The Complete Guide to Construction Escrow Payments',
    excerpt: 'Learn how milestone-based escrow payments protect both project owners and contractors by ensuring work is verified before funds are released.',
    author: 'Tim Chamberlain',
    date: '2026-02-20',
    readTime: '8 min',
    category: 'Finance',
    gradient: 'from-navy to-navy-dark',
  },
  {
    slug: 'os-land-parcel-analysis',
    title: 'AI-Powered Land Intelligence: How OS-Land Transforms Parcel Analysis',
    excerpt: 'From zoning analysis to development readiness scoring, discover how AI is changing the way developers evaluate and acquire land.',
    author: 'Tim Chamberlain',
    date: '2026-02-15',
    readTime: '7 min',
    category: 'Land',
    gradient: 'from-green-600 to-green-800',
  },
  {
    slug: 'ai-cost-estimation',
    title: 'AI-Powered Cost Estimation: Accuracy Meets Speed',
    excerpt: 'Modern AI can analyze architectural plans and generate detailed cost estimates in minutes instead of days. Here is how it works and why it matters.',
    author: 'Tim Chamberlain',
    date: '2026-02-10',
    readTime: '5 min',
    category: 'AI',
    gradient: 'from-builder-orange to-builder-orange-dark',
  },
  {
    slug: 'housing-act-technology',
    title: 'How Technology Aligns with the Affordable Housing Act',
    excerpt: 'The intersection of construction technology and housing policy: how platforms like Kealee support key Housing Act provisions.',
    author: 'Tim Chamberlain',
    date: '2026-02-01',
    readTime: '6 min',
    category: 'Policy',
    gradient: 'from-teal to-teal-dark',
  },
  {
    slug: 'choosing-contractor',
    title: '7 Things to Verify Before Hiring a Contractor',
    excerpt: 'From license verification to insurance requirements, here is your checklist for vetting contractors before your next project.',
    author: 'Tim Chamberlain',
    date: '2026-01-28',
    readTime: '4 min',
    category: 'Guides',
    gradient: 'from-navy to-navy-dark',
  },
  {
    slug: 'feasibility-studies',
    title: 'The Developer\'s Guide to Feasibility Studies with AI',
    excerpt: 'Multi-scenario pro forma analysis, sensitivity modeling, and go/no-go decisions — how AI makes feasibility studies faster and more reliable.',
    author: 'Tim Chamberlain',
    date: '2026-01-20',
    readTime: '7 min',
    category: 'Finance',
    gradient: 'from-green-600 to-green-800',
  },
  {
    slug: 'construction-trends-2026',
    title: 'Top Construction Industry Trends for 2026',
    excerpt: 'From modular construction to AI assistants and digital twins, these are the trends shaping the construction industry this year.',
    author: 'Tim Chamberlain',
    date: '2026-01-02',
    readTime: '6 min',
    category: 'Industry',
    gradient: 'from-builder-orange to-builder-orange-dark',
  },
]

const categoryColors: Record<string, { bg: string; text: string }> = {
  Technology: { bg: 'rgba(42,191,191,0.1)', text: '#2ABFBF' },
  Finance: { bg: 'rgba(56,161,105,0.1)', text: '#38A169' },
  AI: { bg: 'rgba(232,121,58,0.1)', text: '#E8793A' },
  Guides: { bg: 'rgba(26,43,74,0.1)', text: '#1A2B4A' },
  Policy: { bg: 'rgba(42,191,191,0.1)', text: '#2ABFBF' },
  Land: { bg: 'rgba(56,161,105,0.1)', text: '#38A169' },
  Industry: { bg: 'rgba(26,43,74,0.1)', text: '#1A2B4A' },
}

export default function BlogPage() {
  const [email, setEmail] = useState('')
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    setSubStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSubStatus(res.ok ? 'success' : 'error')
    } catch {
      setSubStatus('error')
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="py-16 lg:py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.span {...fadeInUp} className="section-label">
            Blog
          </motion.span>
          <motion.h1
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 text-4xl font-bold font-display sm:text-5xl"
            style={{ color: '#1A2B4A' }}
          >
            Kealee Blog
          </motion.h1>
          <motion.p
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-600"
          >
            Insights, guides, and industry news for construction professionals, project owners, and developers.
          </motion.p>
        </div>
      </section>

      {/* Featured post */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.article
            {...fadeInUp}
            className="group grid overflow-hidden rounded-xl bg-white sm:grid-cols-2"
            style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          >
            <div className={`h-64 bg-gradient-to-br sm:h-auto`} style={{ background: 'linear-gradient(135deg, #2ABFBF, #1A8F8F)' }}>
              <div className="flex h-full items-center justify-center">
                <span className="text-6xl font-bold text-white/20 font-display">DDTS</span>
              </div>
            </div>
            <div className="p-8">
              <div className="mb-3 flex items-center gap-3">
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#2ABFBF' }}
                >
                  {BLOG_POSTS[0].category}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />{BLOG_POSTS[0].readTime}
                </span>
              </div>
              <h2 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
                {BLOG_POSTS[0].title}
              </h2>
              <p className="mt-3 text-gray-600">{BLOG_POSTS[0].excerpt}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User className="h-4 w-4" />
                  <span>{BLOG_POSTS[0].author}</span>
                  <span>|</span>
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(BLOG_POSTS[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: '#E8793A' }}>
                  Read <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </motion.article>
        </div>
      </section>

      {/* All posts */}
      <section className="py-12 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {BLOG_POSTS.slice(1).map((post, i) => {
              const colors = categoryColors[post.category] || categoryColors.Industry
              return (
                <motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="group overflow-hidden rounded-xl bg-white transition-shadow hover:shadow-md"
                  style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}
                >
                  <div className="h-40" style={{ background: `linear-gradient(135deg, ${colors.text}, ${colors.text}CC)` }}>
                    <div className="flex h-full items-center justify-center">
                      <span className="text-3xl font-bold text-white/15 font-display">{post.category}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />{post.readTime}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold font-display transition-colors" style={{ color: '#1A2B4A' }}>
                      {post.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{post.excerpt}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        <span>{post.author}</span>
                        <span>|</span>
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#E8793A' }}>
                        Read <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white font-display">Stay in the Loop</h2>
          <p className="mt-4 text-gray-300">
            Get construction insights, platform updates, and industry analysis delivered to your inbox.
          </p>
          {subStatus === 'success' ? (
            <p className="mt-8 text-sm font-medium" style={{ color: '#2ABFBF' }}>
              ✓ You're subscribed! Look out for our next update.
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="mx-auto mt-8 flex max-w-md gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
              />
              <button
                type="submit"
                disabled={subStatus === 'loading'}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#E8793A' }}
              >
                {subStatus === 'loading' ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
          )}
          {subStatus === 'error' && (
            <p className="mt-2 text-sm text-red-400">Something went wrong. Please try again.</p>
          )}
        </div>
      </section>
    </div>
  )
}
