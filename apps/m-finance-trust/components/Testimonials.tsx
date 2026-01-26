'use client';

import { Star, Quote, Building2 } from 'lucide-react';

const testimonials = [
  {
    quote: "Finance Trust has transformed how we manage project payments. The escrow process is seamless, and our contractors love the transparency.",
    author: "Michael Chen",
    title: "VP of Operations",
    company: "Apex Construction Group",
    image: null,
    rating: 5,
    amount: "$12M in transactions",
  },
  {
    quote: "The milestone-based payment system has virtually eliminated payment disputes on our projects. It's a game-changer for large developments.",
    author: "Sarah Williams",
    title: "CFO",
    company: "Williams Development Corp",
    image: null,
    rating: 5,
    amount: "$8M in transactions",
  },
  {
    quote: "Bank-level security with construction-specific features. Finally, a financial platform that understands our industry's unique needs.",
    author: "Robert Martinez",
    title: "Owner",
    company: "Martinez Builders LLC",
    image: null,
    rating: 5,
    amount: "$5M in transactions",
  },
];

const stats = [
  { value: '4.9/5', label: 'Average Rating' },
  { value: '500+', label: 'Reviews' },
  { value: '98%', label: 'Would Recommend' },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Trusted by Construction Leaders
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            See why thousands of construction professionals trust us with their payments
          </p>

          {/* Rating Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative p-8 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 left-8">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Quote className="text-white" size={16} />
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4 pt-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="text-amber-400" size={16} fill="currentColor" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-slate-700 leading-relaxed mb-6">
                "{testimonial.quote}"
              </p>

              {/* Transaction Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full text-emerald-700 text-xs font-medium mb-6">
                <Building2 size={12} />
                {testimonial.amount}
              </div>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{testimonial.author}</div>
                  <div className="text-sm text-slate-500">
                    {testimonial.title}, {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Banner */}
        <div className="mt-16 p-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="text-white">
              <span className="text-2xl font-bold">$500M+</span>
              <span className="text-slate-400 ml-2">secured transactions</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-700" />
            <div className="text-white">
              <span className="text-2xl font-bold">10,000+</span>
              <span className="text-slate-400 ml-2">satisfied users</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-700" />
            <div className="text-white">
              <span className="text-2xl font-bold">99.9%</span>
              <span className="text-slate-400 ml-2">uptime guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
