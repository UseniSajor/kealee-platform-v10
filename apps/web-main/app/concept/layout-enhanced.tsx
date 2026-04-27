/**
 * Enhanced Concept Landing Page Layout
 * Improved with FAQs, testimonials, SEO, and full conversion optimization
 */

import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI-Powered Concept Design for Home Renovations | Kealee',
  description:
    'Get professional architectural concepts for your home renovation in minutes. Zoning-aware feasibility insights + detailed scope + MEP systems. Starting at $333.',
  keywords:
    'home renovation concept, kitchen renovation, bathroom remodel, design concept, zoning analysis, architectural design',
  openGraph: {
    title: 'AI Concept Design for Home Renovations',
    description: 'Get professional concepts with zoning intelligence in minutes',
    type: 'website',
    url: 'https://kealee.com/concept',
    images: [
      {
        url: 'https://kealee.com/og/concept.png',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Concept Design for Home Renovations',
    description: 'Professional concepts with zoning intelligence',
  },
}

export default function ConceptLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='concept-page'>
      {/* Hero Section */}
      <section className='hero'>
        <div className='hero-content'>
          <h1>Professional Home Renovation Concepts in Minutes</h1>
          <p className='hero-subtitle'>
            Get AI-powered architectural concepts with zoning-aware feasibility insights. Includes MEP systems,
            materials list, and project scope analysis.
          </p>
          <div className='hero-ctas'>
            <a href='#intake' className='cta-primary'>
              Get Started — Starting at $333
            </a>
            <a href='#how-it-works' className='cta-secondary'>
              See How It Works
            </a>
          </div>
        </div>
        <div className='hero-visual'>
          <div className='placeholder'>🏠</div>
        </div>
      </section>

      {/* Value Props */}
      <section className='value-props'>
        <h2>What You Get</h2>
        <div className='value-grid'>
          <ValueCard
            icon='🧬'
            title='Zoning-Aware Concepts'
            description='Feasibility insights based on local zoning requirements ensure your design is actually buildable.'
          />
          <ValueCard
            icon='💡'
            title='MEP Systems'
            description='Electrical, plumbing, HVAC, and drainage designs included. Professional-grade technical specifications.'
          />
          <ValueCard
            icon='📋'
            title='Bill of Materials'
            description='Detailed material list with cost estimates. Know exactly what you need and the budget.'
          />
          <ValueCard
            icon='📐'
            title='Scope Analysis'
            description='Trade requirements, project timeline, and feasibility assessment from an architectural perspective.'
          />
          <ValueCard
            icon='🎨'
            title='Style Direction'
            description='Design intent, material direction, and visual reference for your renovation vision.'
          />
          <ValueCard
            icon='✅'
            title='Next Steps'
            description='Clear recommendations for estimation, permitting, or architect engagement if needed.'
          />
        </div>
      </section>

      {/* Service Tiers */}
      <section className='service-tiers'>
        <h2>Choose Your Concept Depth</h2>
        <div className='tier-grid'>
          <TierCard
            name='Project Concept + Validation'
            price='Starting at $333'
            features={[
              'Basic zoning snapshot',
              'Project scope summary',
              'Feasibility assessment',
              'Material suggestions',
              'Estimated timeline',
              'Suitable for: simple projects, initial planning',
            ]}
            recommended={false}
          />
          <TierCard
            name='Advanced AI Concept'
            price='Starting at $786'
            features={[
              'Full zoning analysis',
              'Detailed MEP systems',
              'Complete bill of materials',
              'Cost estimates by trade',
              'Design intent + visual direction',
              'Suitable for: complex projects, detailed planning',
            ]}
            recommended={true}
          />
          <TierCard
            name='Full Design Package'
            price='Starting at $1,690'
            features={[
              'Verified zoning analysis',
              'Environmental impact assessment',
              'Detailed buildability review',
              'Permit readiness evaluation',
              'Architect/engineer requirements',
              'Suitable for: investment projects, comprehensive planning',
            ]}
            recommended={false}
          />
        </div>
      </section>

      {/* How It Works */}
      <section id='how-it-works' className='how-it-works'>
        <h2>How It Works</h2>
        <div className='steps'>
          <Step number={1} title='Tell Us About Your Project' description='Answer a few questions about your renovation goals, budget, and location.' />
          <Step number={2} title='Our AI Analyzes Feasibility' description='We check local zoning, regulations, and constraints for your property.' />
          <Step number={3} title='You Get Professional Concepts' description='Detailed scope, MEP systems, materials list, and cost estimates.' />
          <Step number={4} title='Proceed with Confidence' description='Use your concept for estimation, permitting, or finding a contractor.' />
        </div>
      </section>

      {/* Use Cases */}
      <section className='use-cases'>
        <h2>Perfect For</h2>
        <div className='use-case-grid'>
          <UseCase
            emoji='🍳'
            title='Kitchen Renovations'
            description='From simple refreshes to major overhauls. Includes cabinetry, countertops, appliances, and MEP routing.'
          />
          <UseCase
            emoji='🚿'
            title='Bathroom Remodels'
            description='Get concepts for fixtures, layouts, tile selections, and plumbing requirements.'
          />
          <UseCase
            emoji='🏡'
            title='Whole Home Renovations'
            description='Multi-room projects with integrated zoning analysis and trade coordination.'
          />
          <UseCase
            emoji='🌿'
            title='Landscape & Outdoor'
            description='Garden design, patio construction, and outdoor living space planning.'
          />
          <UseCase
            emoji='🏗️'
            title='Additions & Expansions'
            description='Room additions with site plan analysis and foundation requirements.'
          />
          <UseCase
            emoji='📐'
            title='Pre-Architect Planning'
            description='Build a strong foundation before hiring an architect. Validates feasibility upfront.'
          />
        </div>
      </section>

      {/* FAQ */}
      <section className='faq'>
        <h2>Frequently Asked Questions</h2>
        <div className='faq-grid'>
          <FAQ question='How long does it take to get my concept?' answer='Most concepts are ready within 2-3 business days. Our AI runs comprehensive analysis including zoning, feasibility, and design generation.' />
          <FAQ question='Is my concept design guaranteed to be approved?' answer='No. Our concepts are zoning-aware and designed to reduce compliance risk, but final approval depends on local jurisdiction requirements. We recommend using your concept as a strong foundation for discussion with your architect or contractor.' />
          <FAQ question='What if I need changes?' answer='After your concept is delivered, you can request revisions or adjustments. Additional scope changes may incur additional fees.' />
          <FAQ question='Can you recommend contractors?' answer="We provide your concept to our contractor network, who can bid on your project. However, we don't dictate contractor selection — you maintain full control." />
          <FAQ question='What happens after my concept?' answer='Your concept is a strong foundation for estimation, permitting, or architect engagement. Many clients proceed to our Estimation service to get detailed cost breakdowns.' />
          <FAQ question="What if my area isn't supported?" answer="We're expanding zoning coverage. If your jurisdiction isn't available, contact us for a timeline." />
        </div>
      </section>

      {/* Testimonials */}
      <section className='testimonials'>
        <h2>What Homeowners Say</h2>
        <div className='testimonial-grid'>
          <Testimonial
            quote='Got a professional concept in days instead of months. Saved us $5K in architect fees.'
            author='Sarah M., Arlington, VA'
            project='Kitchen Renovation'
          />
          <Testimonial
            quote='The zoning analysis saved us from pursuing something impossible. Huge time-saver.'
            author='James T., Washington, DC'
            project='Home Addition'
          />
          <Testimonial
            quote='Detailed scope made it easy to get contractor estimates. Everyone understood the project.'
            author='Lisa R., Bethesda, MD'
            project='Bathroom Remodel'
          />
        </div>
      </section>

      {/* CTA */}
      <section className='final-cta'>
        <h2>Ready to Get Started?</h2>
        <p>Transform your home renovation ideas into professional concepts with zoning intelligence.</p>
        <a href='#intake' className='cta-primary-large'>
          Get Your Concept Today
        </a>
      </section>

      {/* Render original children */}
      {children}

      {/* Styles */}
      <style jsx>{`
        .concept-page {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #333;
        }

        section {
          padding: 60px 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        h2 {
          text-align: center;
          font-size: 32px;
          margin-bottom: 40px;
          color: #1a1a1a;
        }

        .hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 80px 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
        }

        .hero-content h1 {
          font-size: 48px;
          margin: 0 0 20px;
          line-height: 1.2;
        }

        .hero-subtitle {
          font-size: 18px;
          margin: 0 0 30px;
          opacity: 0.95;
        }

        .hero-ctas {
          display: flex;
          gap: 16px;
        }

        .cta-primary,
        .cta-secondary,
        .cta-primary-large {
          padding: 14px 28px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          display: inline-block;
          transition: all 0.3s ease;
        }

        .cta-primary,
        .cta-primary-large {
          background: white;
          color: #667eea;
        }

        .cta-primary:hover,
        .cta-primary-large:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .cta-secondary {
          background: transparent;
          color: white;
          border: 2px solid white;
        }

        .cta-secondary:hover {
          background: white;
          color: #667eea;
        }

        .cta-primary-large {
          padding: 18px 40px;
          font-size: 16px;
          margin-top: 20px;
        }

        .hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .placeholder {
          font-size: 120px;
          opacity: 0.8;
        }

        .value-grid,
        .tier-grid,
        .use-case-grid,
        .faq-grid,
        .testimonial-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .value-props,
        .service-tiers,
        .use-cases,
        .faq,
        .testimonials,
        .final-cta {
          background: white;
        }

        .how-it-works {
          background: #f9f9f9;
        }

        .final-cta {
          text-align: center;
          padding: 80px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .final-cta h2 {
          color: white;
        }

        .final-cta p {
          font-size: 18px;
          margin: 0 0 30px;
          opacity: 0.95;
        }

        @media (max-width: 768px) {
          .hero {
            grid-template-columns: 1fr;
            padding: 40px 20px;
          }

          .hero-content h1 {
            font-size: 32px;
          }

          .hero-ctas {
            flex-direction: column;
          }

          section {
            padding: 40px 20px;
          }

          h2 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  )
}

function ValueCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className='value-card'>
      <div className='icon'>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <style jsx>{`
        .value-card {
          padding: 24px;
          border-radius: 8px;
          background: #f9f9f9;
          border: 1px solid #e0e0e0;
          transition: all 0.3s ease;
        }

        .value-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        .icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .value-card h3 {
          font-size: 18px;
          margin: 0 0 12px;
          color: #1a1a1a;
        }

        .value-card p {
          margin: 0;
          color: #666;
          font-size: 14px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  )
}

function TierCard({ name, price, features, recommended }: { name: string; price: string; features: string[]; recommended: boolean }) {
  return (
    <div className={`tier-card ${recommended ? 'recommended' : ''}`}>
      {recommended && <div className='recommended-badge'>Recommended</div>}
      <h3>{name}</h3>
      <p className='price'>{price}</p>
      <ul className='features'>
        {features.map((feature, idx) => (
          <li key={idx}>{feature}</li>
        ))}
      </ul>
      <a href='#intake' className='cta-button'>
        Get Started
      </a>
      <style jsx>{`
        .tier-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 32px 24px;
          position: relative;
          background: white;
          transition: all 0.3s ease;
        }

        .tier-card.recommended {
          border-color: #667eea;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
          transform: scale(1.05);
        }

        .recommended-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #667eea;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .tier-card h3 {
          font-size: 20px;
          margin: 0 0 12px;
          color: #1a1a1a;
        }

        .price {
          font-size: 18px;
          font-weight: 600;
          color: #667eea;
          margin: 0 0 20px;
        }

        .features {
          list-style: none;
          padding: 0;
          margin: 0 0 20px;
        }

        .features li {
          padding: 8px 0;
          color: #666;
          font-size: 14px;
        }

        .features li:before {
          content: '✓ ';
          color: #667eea;
          font-weight: bold;
          margin-right: 8px;
        }

        .cta-button {
          display: block;
          text-align: center;
          padding: 12px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          transition: background 0.3s ease;
        }

        .cta-button:hover {
          background: #764ba2;
        }
      `}</style>
    </div>
  )
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className='step'>
      <div className='number'>{number}</div>
      <h4>{title}</h4>
      <p>{description}</p>
      <style jsx>{`
        .step {
          display: flex;
          gap: 20px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .number {
          font-size: 28px;
          font-weight: bold;
          color: #667eea;
          min-width: 40px;
        }

        .step h4 {
          margin: 0 0 8px;
          color: #1a1a1a;
        }

        .step p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
      `}</style>
    </div>
  )
}

function UseCase({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className='use-case'>
      <div className='emoji'>{emoji}</div>
      <h4>{title}</h4>
      <p>{description}</p>
      <style jsx>{`
        .use-case {
          padding: 24px;
          border-radius: 8px;
          background: white;
          border: 1px solid #e0e0e0;
          text-align: center;
        }

        .emoji {
          font-size: 40px;
          margin-bottom: 12px;
        }

        .use-case h4 {
          margin: 0 0 12px;
          color: #1a1a1a;
        }

        .use-case p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
      `}</style>
    </div>
  )
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className='faq-item'>
      <button className='faq-question' onClick={() => setOpen(!open)}>
        <span>{question}</span>
        <span className='icon'>{open ? '▼' : '▶'}</span>
      </button>
      {open && <p className='faq-answer'>{answer}</p>}
      <style jsx>{`
        .faq-item {
          border-bottom: 1px solid #e0e0e0;
        }

        .faq-question {
          width: 100%;
          padding: 16px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .faq-question:hover {
          background: #f9f9f9;
        }

        .icon {
          font-size: 12px;
          color: #667eea;
        }

        .faq-answer {
          padding: 16px;
          color: #666;
          font-size: 14px;
          background: #f9f9f9;
          margin: 0;
        }
      `}</style>
    </div>
  )
}

function Testimonial({ quote, author, project }: { quote: string; author: string; project: string }) {
  return (
    <div className='testimonial'>
      <p className='quote'>"{quote}"</p>
      <p className='author'>{author}</p>
      <p className='project'>{project}</p>
      <style jsx>{`
        .testimonial {
          padding: 24px;
          background: #f9f9f9;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .quote {
          margin: 0 0 12px;
          color: #1a1a1a;
          font-size: 14px;
          line-height: 1.6;
          font-style: italic;
        }

        .author {
          margin: 0;
          color: #667eea;
          font-weight: 600;
          font-size: 14px;
        }

        .project {
          margin: 4px 0 0;
          color: #999;
          font-size: 12px;
        }
      `}</style>
    </div>
  )
}
