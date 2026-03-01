'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MESSAGES } from '@/lib/messages'

const tagColors: Record<string, { bg: string; text: string }> = {
  guide:    { bg: '#EFF6FF', text: '#2563EB' },
  faq:      { bg: '#FEF3C7', text: '#92400E' },
  process:  { bg: '#ECFDF5', text: '#065F46' },
  glossary: { bg: '#F5F3FF', text: '#6D28D9' },
}

export function KnowledgeHub() {
  const m = MESSAGES.knowledgeHub

  return (
    <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#F7FAFC]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span
            className="inline-block text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: '#0F2240' }}
          >
            {m.eyebrow}
          </span>
          <h2
            className="text-3xl lg:text-4xl font-bold mb-4"
            style={{ fontFamily: '"Clash Display", "Playfair Display", sans-serif', color: '#0F2240' }}
          >
            {m.headline}{' '}
            <em className="italic">{m.headlineEm}</em>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {m.sub}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {m.articles.map((article) => {
            const colors = tagColors[article.tagType] || tagColors.guide
            return (
              <div
                key={article.title}
                className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col hover:shadow-lg hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="inline-block rounded-full px-3 py-1 text-xs font-bold"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {article.tag}
                  </span>
                  <span className="text-xs text-gray-400">{article.readTime}</span>
                </div>
                <h3
                  className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                >
                  {article.title}
                </h3>
                <p className="text-sm text-gray-600 mb-6 flex-1 line-clamp-3">
                  {article.desc}
                </p>
                <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                  {article.cta}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const faqs = MESSAGES.faq

  return (
    <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span
            className="inline-block text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: '#0F2240' }}
          >
            FAQ
          </span>
          <h2
            className="text-3xl lg:text-4xl font-bold mb-4"
            style={{ fontFamily: '"Clash Display", "Playfair Display", sans-serif', color: '#0F2240' }}
          >
            Common Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all"
              >
                <button
                  className="w-full flex items-start justify-between gap-4 p-5 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <span className="text-[15px] font-semibold text-gray-900 leading-snug">
                    {faq.q}
                  </span>
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm transition-transform"
                    style={{ transform: isOpen ? 'rotate(45deg)' : 'none' }}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
