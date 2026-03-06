'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Star, HelpCircle, ArrowRight, Phone, Mail } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { brand } from '@kealee/ui';

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
  featured: boolean;
}

// ---------------------------------------------------------------------------
// Section Tabs
// ---------------------------------------------------------------------------

const SECTION_TABS = [
  { slug: 'all', label: 'All' },
  { slug: 'getting-started', label: 'Getting Started' },
  { slug: 'concept-design', label: 'Concept Design' },
  { slug: 'architecture', label: 'Architecture' },
  { slug: 'pricing', label: 'Pricing & Payments' },
  { slug: 'permits', label: 'Permits' },
  { slug: 'contractors', label: 'Contractors' },
  { slug: 'platform', label: 'Platform & Tech' },
  { slug: 'trust', label: 'Trust & Safety' },
];

// ---------------------------------------------------------------------------
// Static FAQ Content
// ---------------------------------------------------------------------------

const STATIC_FAQS: Faq[] = [
  // ── Getting Started ────────────────────────────────────
  {
    id: 'gs-1', number: 1,
    question: 'What is Kealee and how does it work?',
    answer: 'Kealee is an all-in-one construction platform that takes homeowners from initial concept through design, permitting, and construction. You start by describing your project — renovation, addition, or new build — and our AI generates floor plans, 3D renderings, and cost estimates. Once you approve a concept, a licensed architect develops permit-ready drawings. We then handle permits, connect you with vetted contractors, and manage payments through escrow so your money is always protected.',
    section: 'Getting Started', sectionSlug: 'getting-started', featured: true,
  },
  {
    id: 'gs-2', number: 2,
    question: 'Who is Kealee for?',
    answer: 'Kealee is designed for homeowners planning renovations, additions, ADUs, or new construction. It is also used by real estate investors building multifamily housing, property developers exploring workforce housing programs, and general contractors looking for project management tools and new project leads through our marketplace.',
    section: 'Getting Started', sectionSlug: 'getting-started', featured: false,
  },
  {
    id: 'gs-3', number: 3,
    question: 'How do I get started?',
    answer: 'Click "Start Your Project" and describe what you want to build — a kitchen remodel, room addition, ADU, custom home, or anything else. Choose a Pre-Con concept package ($199, $499, or $999) and our AI will generate design concepts within minutes. You get up to 5 rounds of AI revisions and 3 final concepts to choose from, plus a designer review meeting.',
    section: 'Getting Started', sectionSlug: 'getting-started', featured: true,
  },
  {
    id: 'gs-4', number: 4,
    question: 'What types of projects does Kealee handle?',
    answer: 'We handle a wide range of residential and commercial projects including: kitchen remodels, bathroom renovations, basement finishing, whole-home remodels, room additions, second story additions, ADUs and in-law suites, garage conversions, custom home builds, townhomes and duplexes, decks and outdoor living, roofing and siding, electrical upgrades, HVAC and plumbing, solar and energy upgrades, and commercial tenant improvements.',
    section: 'Getting Started', sectionSlug: 'getting-started', featured: false,
  },
  {
    id: 'gs-5', number: 5,
    question: 'Do I need to know exactly what I want before starting?',
    answer: 'Not at all. That is exactly what the concept phase is for. You can start with just a general idea — "I want to add a bedroom" or "I want to finish my basement" — and our AI will generate multiple design options for you to explore. The concept phase is designed to help you figure out what you want before spending thousands on an architect.',
    section: 'Getting Started', sectionSlug: 'getting-started', featured: false,
  },

  // ── Concept Design ─────────────────────────────────────
  {
    id: 'cd-1', number: 6,
    question: 'How does the AI concept design work?',
    answer: 'When you start a project, you describe your vision — project type, preferred style, rooms, budget range, and any special requirements. Our AI engine generates floor plans, 3D renderings, material suggestions, and cost estimates based on your input. You can revise and iterate up to 5 times, then choose from 3 final concept options. A designer reviews your selected concept in a one-on-one meeting before handoff to architecture.',
    section: 'Concept Design', sectionSlug: 'concept-design', featured: true,
  },
  {
    id: 'cd-2', number: 7,
    question: 'What is included in each concept package?',
    answer: 'Starter ($199): 2 AI-generated floor plan options, basic room layout and dimensions, rough cost estimate, up to 5 design revisions, 3 final concepts, and a designer review meeting.\n\nStandard ($499): 3 AI-generated design concepts, detailed floor plans with 3D renderings, material and finish suggestions, detailed cost breakdown, up to 5 design revisions, 3 final concepts, designer review meeting, and site layout with elevation views.\n\nPremium ($999): 5 AI-generated design concepts, full floor plans with 3D renders and elevations, material specifications and cost analysis, energy efficiency and sustainability scoring, up to 5 design revisions, 3 final concepts, designer review meeting, and permit-readiness pre-check.',
    section: 'Concept Design', sectionSlug: 'concept-design', featured: false,
  },
  {
    id: 'cd-3', number: 8,
    question: 'How long does concept generation take?',
    answer: 'AI concept generation typically takes just a few minutes per iteration. The entire concept phase — from your initial input through revisions to your final selection and designer meeting — usually takes 1 to 2 weeks depending on how quickly you provide feedback on each round.',
    section: 'Concept Design', sectionSlug: 'concept-design', featured: false,
  },
  {
    id: 'cd-4', number: 9,
    question: 'Can I make changes to the AI-generated concepts?',
    answer: 'Yes. Every concept package includes up to 5 rounds of AI revisions. You can ask for changes to room sizes, layouts, style, materials, or any other aspect. After revisions, you choose from 3 final concepts. Your designer meeting also provides an opportunity for minor adjustments before handing off to the architecture phase.',
    section: 'Concept Design', sectionSlug: 'concept-design', featured: false,
  },
  {
    id: 'cd-5', number: 10,
    question: 'What happens after I approve a concept?',
    answer: 'Once you approve a concept in your designer meeting, the next step is the Architecture phase. A licensed architect is assigned within 48 hours to develop your approved concept into permit-ready construction documents. Your concept fee ($199–$999) is fully credited toward your architecture package — you never pay twice for the same work.',
    section: 'Concept Design', sectionSlug: 'concept-design', featured: false,
  },

  // ── Architecture ───────────────────────────────────────
  {
    id: 'ar-1', number: 11,
    question: 'How does the architecture phase work?',
    answer: 'After your concept is approved, a licensed architect is assigned to your project within 48 hours. They take your approved AI concept and develop it into professional construction documents through Schematic Design (SD), Design Development (DD), and Construction Documents (CD). The result is a complete, permit-ready drawing set including structural, MEP (mechanical, electrical, plumbing), and code compliance.',
    section: 'Architecture', sectionSlug: 'architecture', featured: false,
  },
  {
    id: 'ar-2', number: 12,
    question: 'What architecture packages are available?',
    answer: 'Schematic Design ($2,995): Licensed architect, schematic floor plans and elevations, structural concept layout, initial code compliance review, and owner review session. Concept fee credited.\n\nFull Design Package ($5,995): Everything in Schematic Design plus Design Development drawings, Construction Documents, structural engineering coordination, MEP layout, and permit-ready drawing set. Concept fee credited.\n\nPremium Architecture ($9,995): Everything in Full Design Package plus interior design and finish selections, 3D BIM model, construction administration support, contractor RFI response during build, and site visit coordination. Concept fee credited.',
    section: 'Architecture', sectionSlug: 'architecture', featured: false,
  },
  {
    id: 'ar-3', number: 13,
    question: 'Is my concept fee credited toward architecture?',
    answer: 'Yes. Your Pre-Con concept fee ($199, $499, or $999) is fully credited when you purchase any Architecture package. For example, if you paid $499 for the Standard concept package and then purchase the Full Design Package at $5,995, you only pay $5,496. You never pay twice for the same project.',
    section: 'Architecture', sectionSlug: 'architecture', featured: true,
  },
  {
    id: 'ar-4', number: 14,
    question: 'How long does the architecture phase take?',
    answer: 'Schematic Design typically takes 2–4 weeks. The Full Design Package (through Construction Documents) takes 6–10 weeks depending on project complexity. Premium Architecture with construction administration extends through the build phase. Your architect will provide a specific timeline during your kickoff meeting.',
    section: 'Architecture', sectionSlug: 'architecture', featured: false,
  },
  {
    id: 'ar-5', number: 15,
    question: 'Can I bring my own architect or plans?',
    answer: 'Yes. If you already have an architect or existing plans, you can skip the concept and architecture phases and go directly to our Permit Management, Contractor Marketplace, or Project Management services. We work with whatever stage your project is at.',
    section: 'Architecture', sectionSlug: 'architecture', featured: false,
  },

  // ── Pricing & Payments ─────────────────────────────────
  {
    id: 'pr-1', number: 16,
    question: 'How much does Kealee cost?',
    answer: 'Pre-Con Concepts: $199 (Starter), $499 (Standard), or $999 (Premium) — one-time fee, credited to architecture.\n\nArchitecture: $2,995 (Schematic), $5,995 (Full Design), or $9,995 (Premium) — one-time fee.\n\nPermit Services: $495 (Single Permit), $1,295 (Permit Package), or $2,995 (Full Permit + Inspection) — per project.\n\nProject Management: Starting at $1,750/month for a dedicated PM.\n\nContractor bids are separate and competitive through our marketplace. All pricing is transparent and itemized upfront — no hidden fees.',
    section: 'Pricing & Payments', sectionSlug: 'pricing', featured: true,
  },
  {
    id: 'pr-2', number: 17,
    question: 'How do payments work?',
    answer: 'For Kealee services (concepts, architecture, permits), you pay upfront for the package you select. For construction work, payments are managed through our milestone escrow system. Your funds are held in escrow and only released to the contractor when you approve that a milestone is completed satisfactorily. This protects you from paying for unfinished or unsatisfactory work.',
    section: 'Pricing & Payments', sectionSlug: 'pricing', featured: false,
  },
  {
    id: 'pr-3', number: 18,
    question: 'What is milestone escrow and how does it protect me?',
    answer: 'Milestone escrow means your construction payments are held by a neutral third party (escrow) and released only when you approve completed work. Before construction starts, your project is divided into milestones — for example, foundation, framing, rough MEP, drywall, finishes, and final. As each milestone is completed and passes inspection, you review and approve the release of funds. If work is not completed or not up to standard, funds remain in escrow until the issue is resolved.',
    section: 'Pricing & Payments', sectionSlug: 'pricing', featured: true,
  },
  {
    id: 'pr-4', number: 19,
    question: 'Are there any hidden fees?',
    answer: 'No. All Kealee service fees are listed upfront before you purchase. Contractor bids include itemized cost breakdowns. Permit fees charged by your local jurisdiction are passed through at cost. Our platform service fee is clearly disclosed. We believe in complete transparency — you will never be surprised by a charge.',
    section: 'Pricing & Payments', sectionSlug: 'pricing', featured: false,
  },
  {
    id: 'pr-5', number: 20,
    question: 'Can I get a refund if I change my mind?',
    answer: 'Concept packages are non-refundable once AI generation begins, but if you are not satisfied with your concepts, contact us and we will work to make it right. Architecture packages follow a milestone-based billing structure — you pay for completed work. For construction, milestone escrow ensures you only pay for approved completed milestones.',
    section: 'Pricing & Payments', sectionSlug: 'pricing', featured: false,
  },

  // ── Permits ────────────────────────────────────────────
  {
    id: 'pm-1', number: 21,
    question: 'Does Kealee handle building permits?',
    answer: 'Yes. We offer full permit management services from application preparation through inspection and certificate of occupancy. Our system includes AI-powered compliance pre-checks that catch common issues before submission, jurisdiction-specific checklists, plan review correction responses, and inspection scheduling coordination. You can purchase permit services as part of our full flow or standalone if you already have plans.',
    section: 'Permits', sectionSlug: 'permits', featured: false,
  },
  {
    id: 'pm-2', number: 22,
    question: 'What permit packages are available?',
    answer: 'Single Permit ($495): One permit application with AI compliance pre-check, jurisdiction submission, plan review corrections, and approval notification.\n\nPermit Package ($1,295): All required permits (building, mechanical, electrical, plumbing) with multi-discipline coordination, corrections, resubmissions, inspection scheduling, and status tracking.\n\nFull Permit + Inspection ($2,995): Everything in Permit Package plus all inspection scheduling and coordination, inspector liaison, on-site support, correction follow-up, re-inspections, certificate of occupancy processing, and final closeout documentation.',
    section: 'Permits', sectionSlug: 'permits', featured: false,
  },
  {
    id: 'pm-3', number: 23,
    question: 'How long does the permit process take?',
    answer: 'Permit timelines vary significantly by jurisdiction. Simple permits (like a deck or water heater) may take 1–2 weeks. Standard residential permits typically take 4–8 weeks. Complex projects or jurisdictions with backlogs can take 3–6 months. Our AI compliance pre-check helps reduce the chance of plan review rejections, which is the most common cause of delays.',
    section: 'Permits', sectionSlug: 'permits', featured: false,
  },
  {
    id: 'pm-4', number: 24,
    question: 'What if my permit application is rejected?',
    answer: 'Rejections and correction requests are normal. Our Permit Package and Full Permit + Inspection tiers include correction responses and resubmissions at no additional cost. We review the plan reviewer comments, coordinate with your architect if drawing changes are needed, prepare the response, and resubmit. Most corrections are resolved in one round.',
    section: 'Permits', sectionSlug: 'permits', featured: false,
  },

  // ── Contractors ────────────────────────────────────────
  {
    id: 'ct-1', number: 25,
    question: 'How does the contractor marketplace work?',
    answer: 'Once your project has plans and permits, you can post it to our contractor marketplace. Vetted, licensed, and insured contractors in your area can view your project details and submit competitive bids. You compare bids side-by-side with itemized cost breakdowns, read contractor reviews and ratings, and choose the contractor that fits your budget and timeline. All payments go through milestone escrow for your protection.',
    section: 'Contractors', sectionSlug: 'contractors', featured: false,
  },
  {
    id: 'ct-2', number: 26,
    question: 'How are contractors vetted?',
    answer: 'Every contractor in our network is verified for: active state license, general liability and workers compensation insurance, bond status (where required), business registration, reference checks, and ongoing performance reviews based on project outcomes, client ratings, and milestone completion rates. Contractors who fall below our quality standards are removed from the platform.',
    section: 'Contractors', sectionSlug: 'contractors', featured: true,
  },
  {
    id: 'ct-3', number: 27,
    question: 'Can I use my own contractor?',
    answer: 'Yes. You are not required to use our marketplace. If you have a contractor you already trust, you can still use Kealee for concept design, architecture, permits, project management, and escrow payment protection. We integrate with any licensed contractor.',
    section: 'Contractors', sectionSlug: 'contractors', featured: false,
  },
  {
    id: 'ct-4', number: 28,
    question: 'What if I have a problem with my contractor?',
    answer: 'Milestone escrow is your primary protection. If work is not completed satisfactorily, you do not approve the milestone and funds remain in escrow. Our platform includes dispute resolution support, and if you have a dedicated PM, they will work directly with the contractor to resolve issues. In extreme cases, we can help you transition to another vetted contractor.',
    section: 'Contractors', sectionSlug: 'contractors', featured: false,
  },

  // ── Platform & Tech ────────────────────────────────────
  {
    id: 'pt-1', number: 29,
    question: 'What technology powers Kealee?',
    answer: 'Kealee is built on a modern technology stack including AI-powered design generation (using Claude by Anthropic), real-time project dashboards, automated permit compliance checking, milestone-based escrow payment processing, in-app messaging, scheduling and timeline management, daily photo-verified progress reports, and zoning analysis tools. Everything is accessible through your web browser — no software to install.',
    section: 'Platform & Tech', sectionSlug: 'platform', featured: false,
  },
  {
    id: 'pt-2', number: 30,
    question: 'Do I need to download an app?',
    answer: 'No. Kealee works entirely in your web browser on desktop, tablet, and mobile devices. There is nothing to download or install. You will receive email and SMS notifications for important updates like milestone completions, permit status changes, and messages from your team.',
    section: 'Platform & Tech', sectionSlug: 'platform', featured: false,
  },
  {
    id: 'pt-3', number: 31,
    question: 'How does the project dashboard work?',
    answer: 'Your project dashboard gives you a real-time view of everything happening on your project: current phase and status, upcoming milestones and deadlines, budget tracking with cost breakdown, permit application status, contractor communications, photo logs and daily reports, and payment history with escrow status. You can access it anytime from any device.',
    section: 'Platform & Tech', sectionSlug: 'platform', featured: false,
  },
  {
    id: 'pt-4', number: 32,
    question: 'Is my data secure?',
    answer: 'Yes. We use bank-level encryption for all data in transit and at rest. Payment processing is handled through Stripe, a PCI-compliant payment processor. Your personal information is never shared with third parties without your consent. You can request deletion of your data at any time through our data deletion page. See our Privacy Policy for full details.',
    section: 'Platform & Tech', sectionSlug: 'platform', featured: false,
  },

  // ── Trust & Safety ─────────────────────────────────────
  {
    id: 'ts-1', number: 33,
    question: 'How does Kealee protect my money?',
    answer: 'All construction payments go through our milestone escrow system. Your funds are held securely and only released when you approve completed work. You are never asked to pay a contractor directly for work that has not been done. Kealee service fees (concepts, architecture, permits) are clearly disclosed upfront with no hidden charges. Escrow provides a neutral third-party layer of protection between you and your contractor.',
    section: 'Trust & Safety', sectionSlug: 'trust', featured: true,
  },
  {
    id: 'ts-2', number: 34,
    question: 'What if my project goes over budget?',
    answer: 'Your project budget is locked at the bid stage. Change orders — requests for work not in the original scope — require your written approval before any additional funds are released. Our PM tools track every cost against the original budget in real time, so you always know where you stand. If unexpected conditions arise (like hidden structural issues), your contractor must submit a formal change order with detailed pricing for your review.',
    section: 'Trust & Safety', sectionSlug: 'trust', featured: false,
  },
  {
    id: 'ts-3', number: 35,
    question: 'What guarantees does Kealee provide?',
    answer: 'Kealee guarantees that all contractors in our marketplace are licensed and insured, your funds are held in escrow until you approve milestones, your concept fee is credited toward architecture packages, all pricing is transparent and disclosed upfront, and our AI compliance pre-checks reduce the risk of permit rejections. While we cannot guarantee construction outcomes (every project is unique), our escrow and PM systems are designed to protect you throughout the process.',
    section: 'Trust & Safety', sectionSlug: 'trust', featured: false,
  },
  {
    id: 'ts-4', number: 36,
    question: 'How do I delete my account and data?',
    answer: 'You can request account and data deletion at any time by visiting kealee.com/data-deletion and submitting a request. We will process your request within 30 days and confirm deletion via email. For more information, see our Privacy Policy at kealee.com/privacy.',
    section: 'Trust & Safety', sectionSlug: 'trust', featured: false,
  },
  {
    id: 'ts-5', number: 37,
    question: 'Where is Kealee available?',
    answer: 'Kealee is available nationwide across the United States. Our AI concept design, architecture coordination, and project management tools work for any location. Permit services cover all U.S. jurisdictions — our system automatically identifies your local jurisdiction requirements. Our contractor marketplace is growing and currently has the strongest coverage in major metro areas, with expansion to smaller markets ongoing.',
    section: 'Trust & Safety', sectionSlug: 'trust', featured: false,
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FeaturedCard({ faq, onClick }: { faq: Faq; onClick: (faq: Faq) => void }) {
  return (
    <button
      onClick={() => onClick(faq)}
      className="group text-left rounded-xl border-2 border-gray-200 bg-white p-5 hover:border-teal-300 hover:shadow-md transition-all duration-200"
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
  return (
    <div
      ref={itemRef}
      className={`rounded-xl border-2 overflow-hidden transition-all duration-300 ${
        isOpen ? 'shadow-md' : 'bg-white'
      }`}
      style={{ borderColor: isOpen ? brand.teal : '#E5E7EB' }}
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

      {isOpen && (
        <div className="px-5 pb-5 pl-14">
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // ── Derived ──
  const filtered = STATIC_FAQS.filter((faq) => {
    const matchesTab = activeTab === 'all' || faq.sectionSlug === activeTab;
    if (!searchQuery.trim()) return matchesTab;
    const q = searchQuery.toLowerCase();
    return matchesTab && (faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q));
  });

  const featuredFaqs = STATIC_FAQS.filter((f) => f.featured);
  const isSearching = searchQuery.trim().length > 0;

  const sectionCounts = SECTION_TABS.map((tab) => ({
    ...tab,
    count: tab.slug === 'all'
      ? STATIC_FAQS.length
      : STATIC_FAQS.filter((f) => f.sectionSlug === tab.slug).length,
  }));

  // ── Handlers ──
  const handleToggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  const handleFeaturedClick = (faq: Faq) => {
    setActiveTab(faq.sectionSlug);
    setOpenId(faq.id);
    requestAnimationFrame(() => {
      const el = itemRefs.current.get(faq.id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const setItemRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  };

  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero */}
        <section
          className="relative py-20 lg:py-28 px-4 sm:px-6 lg:px-8 text-center"
          style={{ background: `linear-gradient(135deg, ${brand.navy} 0%, #1B3A6B 60%, #1F4A8A 100%)` }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/5" />
          </div>
          <div className="relative max-w-3xl mx-auto">
            <p className="text-blue-200 text-sm font-semibold uppercase tracking-wider mb-3">
              Help Center
            </p>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif' }}
            >
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Everything you need to know about Kealee &mdash; from AI concept design and
              architecture to permits, contractors, and escrow payments.
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 relative z-10 pb-20">
          {/* Search */}
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQs — try &quot;escrow&quot;, &quot;permits&quot;, or &quot;concept design&quot;..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white shadow-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all text-base"
            />
          </div>

          {/* Search result count */}
          {isSearching && (
            <p className="text-sm text-gray-500 mb-6 -mt-4">
              Showing <span className="font-semibold text-gray-700">{filtered.length}</span>{' '}
              result{filtered.length !== 1 ? 's' : ''} for &ldquo;
              <span className="font-medium text-gray-700">{searchQuery}</span>&rdquo;
            </p>
          )}

          {/* Section Tabs */}
          <div className="mb-8 -mx-4 sm:mx-0">
            <div className="flex gap-2 overflow-x-auto px-4 sm:px-0 pb-2">
              {sectionCounts.map((tab) => {
                const isActive = activeTab === tab.slug;
                return (
                  <button
                    key={tab.slug}
                    onClick={() => setActiveTab(tab.slug)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'text-white shadow-md'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300 hover:text-teal-700'
                    }`}
                    style={isActive ? { backgroundColor: brand.teal } : undefined}
                  >
                    {tab.label}
                    <span className={`ml-1.5 text-xs ${isActive ? 'text-teal-200' : 'text-gray-400'}`}>
                      ({tab.count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Featured FAQs */}
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

          {/* FAQ Accordion */}
          {filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  faq={faq}
                  isOpen={openId === faq.id}
                  onToggle={() => handleToggle(faq.id)}
                  itemRef={setItemRef(faq.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: `${brand.teal}15` }}
              >
                <HelpCircle className="h-8 w-8" style={{ color: brand.teal }} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isSearching ? `No results for "${searchQuery}"` : 'No FAQs in this section yet'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Try a different search term or browse another section.
              </p>
            </div>
          )}

          {/* Still Have Questions CTA */}
          <div className="mt-16 rounded-2xl border-2 border-gray-200 p-8 sm:p-10 text-center" style={{ backgroundColor: '#F7FAFC' }}>
            <h2 className="text-2xl font-bold mb-3" style={{ color: brand.navy, fontFamily: '"Clash Display", sans-serif' }}>
              Still have questions?
            </h2>
            <p className="text-gray-500 mb-6 max-w-lg mx-auto">
              Our team is ready to help. Reach out and we&apos;ll get back to you within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Link
                href="/owner/precon/new"
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl shadow-md hover:opacity-90 transition"
                style={{ backgroundColor: brand.teal }}
              >
                Start Your Project <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 font-semibold rounded-xl transition hover:bg-gray-50"
                style={{ borderColor: brand.navy, color: brand.navy }}
              >
                View Pricing
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-600">
              <a href="tel:+13015758777" className="flex items-center gap-2 hover:text-gray-900 transition">
                <Phone className="w-4 h-4" /> (301) 575-8777
              </a>
              <a href="mailto:getstarted@kealee.com" className="flex items-center gap-2 hover:text-gray-900 transition">
                <Mail className="w-4 h-4" /> getstarted@kealee.com
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
