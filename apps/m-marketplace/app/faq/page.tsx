'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, MessageCircle, Star, HelpCircle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Faq {
  id: string;
  number: number;
  question: string;
  answer: string;
  section: string;
  sectionSlug: string;
  tags: string[];
  serviceArea: string;
  featured: boolean;
  order: number;
}

interface FaqSection {
  slug: string;
  label: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BRAND = '#1B4F8C';

const SECTION_TABS: { slug: string; label: string }[] = [
  { slug: 'all', label: 'All' },
  { slug: 'understanding', label: 'Understanding' },
  { slug: 'pricing', label: 'Pricing' },
  { slug: 'ai-trust', label: 'AI Trust' },
  { slug: 'process', label: 'Process' },
  { slug: 'comparison', label: 'Comparison' },
  { slug: 'platform', label: 'Platform' },
  { slug: 'next-steps', label: 'Next Steps' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Search skeleton */}
      <div className="h-12 bg-gray-200 rounded-xl w-full" />

      {/* Tabs skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-200 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Featured cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl" />
        ))}
      </div>

      {/* Accordion skeleton */}
      <div className="space-y-3 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ query, onAskKeaBot }: { query: string; onAskKeaBot: () => void }) {
  return (
    <div className="text-center py-16 px-4">
      <div
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: `${BRAND}10` }}
      >
        <HelpCircle className="h-8 w-8" style={{ color: BRAND }} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No results for &ldquo;{query}&rdquo;
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        We couldn&apos;t find any FAQs matching your search. Try a different search term or ask
        KeaBot for help.
      </p>
      <button
        onClick={onAskKeaBot}
        className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        style={{ backgroundColor: BRAND }}
      >
        <MessageCircle className="h-5 w-5" />
        Ask KeaBot
      </button>
    </div>
  );
}

function FeaturedCard({
  faq,
  onClick,
}: {
  faq: Faq;
  onClick: (faq: Faq) => void;
}) {
  return (
    <button
      onClick={() => onClick(faq)}
      className="group text-left rounded-xl border-2 border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <Star className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-400" />
        <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 leading-snug line-clamp-3">
          {faq.question}
        </p>
      </div>
    </button>
  );
}

function AccordionItem({
  faq,
  isOpen,
  onToggle,
  itemRef,
}: {
  faq: Faq;
  isOpen: boolean;
  onToggle: () => void;
  itemRef: (el: HTMLDivElement | null) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen, faq.answer]);

  return (
    <div
      ref={itemRef}
      className={`rounded-xl border-2 overflow-hidden transition-all duration-300 ${
        isOpen ? 'border-blue-300 shadow-md' : 'border-gray-200 bg-white'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 pr-4 min-w-0">
          <span className="text-sm font-medium text-gray-400 flex-shrink-0 tabular-nums">
            #{faq.number}
          </span>
          <h3 className="text-base font-semibold text-gray-900 leading-snug">
            {faq.question}
          </h3>
        </div>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-gray-500 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? `${contentHeight}px` : '0px' }}
      >
        <div ref={contentRef} className="px-5 pb-5 pl-14">
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{faq.answer}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function FAQPage() {
  // ---- State ----
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [sections, setSections] = useState<FaqSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // ---- Data Fetching ----

  const fetchFaqs = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const endpoint = query
        ? `${API_URL}/api/faq/search?q=${encodeURIComponent(query)}`
        : `${API_URL}/api/faq`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Failed to fetch FAQs: ${res.status}`);
      const data: { faqs: Faq[]; sections?: FaqSection[] } = await res.json();
      setFaqs(data.faqs ?? []);
      if (data.sections) {
        setSections(data.sections);
      }
    } catch (err) {
      console.error('FAQ fetch error:', err);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  // Search fetch
  useEffect(() => {
    if (debouncedQuery.trim()) {
      fetchFaqs(debouncedQuery.trim());
    } else {
      fetchFaqs();
    }
  }, [debouncedQuery, fetchFaqs]);

  // ---- Derived Data ----

  const filteredFaqs =
    activeTab === 'all' ? faqs : faqs.filter((f) => f.sectionSlug === activeTab);

  const featuredFaqs = faqs.filter((f) => f.featured);

  const sectionCounts = SECTION_TABS.map((tab) => ({
    ...tab,
    count: tab.slug === 'all' ? faqs.length : faqs.filter((f) => f.sectionSlug === tab.slug).length,
  }));

  const isSearching = debouncedQuery.trim().length > 0;

  // ---- Handlers ----

  const handleToggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleFeaturedClick = (faq: Faq) => {
    // Switch to the correct tab
    setActiveTab(faq.sectionSlug);
    // Open the accordion item
    setOpenId(faq.id);
    // Scroll to it after a brief delay for re-render
    requestAnimationFrame(() => {
      const el = itemRefs.current.get(faq.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  const handleAskKeaBot = () => {
    // Navigate to contact or chat — adjust as needed
    window.location.href = '/contact';
  };

  const setItemRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    } else {
      itemRefs.current.delete(id);
    }
  };

  // ---- Render ----

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16" style={{ backgroundColor: BRAND }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/5" />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 text-center">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-wider mb-3">
            AI Concept Generation
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Everything you need to know about our AI-powered concept generation service. Can&apos;t
            find an answer?{' '}
            <Link href="/contact" className="underline text-white hover:text-blue-200 font-medium">
              Get in touch
            </Link>
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Content */}
      {/* ------------------------------------------------------------------ */}
      <div className="container mx-auto px-4 sm:px-6 -mt-6 relative z-10 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* -------------------------------------------------------------- */}
          {/* Search Bar */}
          {/* -------------------------------------------------------------- */}
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white shadow-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-base"
            />
          </div>

          {/* Search result count */}
          {isSearching && !loading && (
            <p className="text-sm text-gray-500 mb-6 -mt-4">
              Showing <span className="font-semibold text-gray-700">{filteredFaqs.length}</span>{' '}
              result{filteredFaqs.length !== 1 ? 's' : ''} for &ldquo;
              <span className="font-medium text-gray-700">{debouncedQuery}</span>&rdquo;
            </p>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Section Tabs */}
          {/* -------------------------------------------------------------- */}
          <div className="mb-8 -mx-4 sm:mx-0">
            <div className="flex gap-2 overflow-x-auto px-4 sm:px-0 pb-2 scrollbar-hide">
              {sectionCounts.map((tab) => {
                const isActive = activeTab === tab.slug;
                return (
                  <button
                    key={tab.slug}
                    onClick={() => setActiveTab(tab.slug)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'text-white shadow-md'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-700'
                    }`}
                    style={isActive ? { backgroundColor: BRAND } : undefined}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        className={`ml-1.5 text-xs ${
                          isActive ? 'text-blue-200' : 'text-gray-400'
                        }`}
                      >
                        ({tab.count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Loading */}
          {/* -------------------------------------------------------------- */}
          {loading && <LoadingSkeleton />}

          {/* -------------------------------------------------------------- */}
          {/* Content when loaded */}
          {/* -------------------------------------------------------------- */}
          {!loading && (
            <>
              {/* ---------------------------------------------------------- */}
              {/* Empty State */}
              {/* ---------------------------------------------------------- */}
              {filteredFaqs.length === 0 && isSearching && (
                <EmptyState query={debouncedQuery} onAskKeaBot={handleAskKeaBot} />
              )}

              {/* ---------------------------------------------------------- */}
              {/* Featured FAQs */}
              {/* ---------------------------------------------------------- */}
              {featuredFaqs.length > 0 && !isSearching && activeTab === 'all' && (
                <div className="mb-10">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-400" />
                    Most Asked Questions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {featuredFaqs.slice(0, 6).map((faq) => (
                      <FeaturedCard key={faq.id} faq={faq} onClick={handleFeaturedClick} />
                    ))}
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------------- */}
              {/* FAQ Accordion */}
              {/* ---------------------------------------------------------- */}
              {filteredFaqs.length > 0 && (
                <div className="space-y-3">
                  {filteredFaqs.map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      faq={faq}
                      isOpen={openId === faq.id}
                      onToggle={() => handleToggle(faq.id)}
                      itemRef={setItemRef(faq.id)}
                    />
                  ))}
                </div>
              )}

              {/* ---------------------------------------------------------- */}
              {/* No FAQs loaded at all (non-search) */}
              {/* ---------------------------------------------------------- */}
              {filteredFaqs.length === 0 && !isSearching && (
                <div className="text-center py-16">
                  <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No FAQs available in this section yet.</p>
                </div>
              )}
            </>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Still have questions CTA */}
          {/* -------------------------------------------------------------- */}
          <div className="mt-16 rounded-2xl bg-white border-2 border-gray-200 p-8 sm:p-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Still have questions?
            </h2>
            <p className="text-gray-500 mb-6 max-w-lg mx-auto">
              Our team is ready to help. Reach out and we&apos;ll get back to you within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                style={{ backgroundColor: BRAND }}
              >
                Contact Support
              </Link>
              <Link
                href="/owner/precon/new"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 font-semibold rounded-lg transition-all duration-200 hover:bg-blue-50"
                style={{ borderColor: BRAND, color: BRAND }}
              >
                Start Your Project
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
