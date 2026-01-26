"use client";

import { useEffect, useRef, useState } from "react";

const testimonials = [
  {
    quote:
      "We stopped losing Fridays to paperwork. Permits and inspection follow-ups just... happen now.",
    name: "Michael Rodriguez",
    role: "Owner",
    company: "Residential GC",
    result: "Saved ~20 hrs/week",
    avatar: "MR",
    rating: 5,
  },
  {
    quote:
      "Weekly reports used to be a scramble. Now clients get a clean update every week with action items.",
    name: "Sarah Chen",
    role: "Project Manager",
    company: "Design/Build GC",
    result: "Fewer escalations",
    avatar: "SC",
    rating: 5,
  },
  {
    quote:
      "We used to eat margin on delays. The proactive tracking and vendor follow-ups made our schedules tighter.",
    name: "James Thompson",
    role: "Ops Lead",
    company: "Multi-project GC",
    result: "Faster cycle times",
    avatar: "JT",
    rating: 5,
  },
  {
    quote:
      "Finally found a team that understands construction ops. They speak our language and deliver results.",
    name: "David Martinez",
    role: "Principal",
    company: "Commercial GC",
    result: "3x ROI in 90 days",
    avatar: "DM",
    rating: 5,
  },
  {
    quote:
      "The weekly reporting alone is worth the investment. Our clients love the transparency and professionalism.",
    name: "Emily Watson",
    role: "Operations Director",
    company: "Enterprise Builder",
    result: "Better client retention",
    avatar: "EW",
    rating: 5,
  },
  {
    quote:
      "Permit tracking was killing us. Now we catch issues before they become expensive problems.",
    name: "Robert Kim",
    role: "Project Executive",
    company: "Regional GC",
    result: "40% fewer delays",
    avatar: "RK",
    rating: 5,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-amber-400" : "text-zinc-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial, index }: { testimonial: typeof testimonials[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), index * 100);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [index]);

  return (
    <figure
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-500 hover:shadow-xl ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      {/* Decorative gradient */}
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-sky-400/10 to-cyan-300/10 blur-2xl transition-all group-hover:from-sky-400/20 group-hover:to-cyan-300/20" />

      <div className="relative z-10">
        {/* Rating */}
        <StarRating rating={testimonial.rating} />

        {/* Quote */}
        <blockquote className="mt-4 text-base leading-relaxed text-zinc-700">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>

        {/* Author info */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-sm font-bold text-white shadow-lg shadow-sky-500/25">
              {testimonial.avatar}
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900">{testimonial.name}</div>
              <div className="text-xs text-zinc-500">
                {testimonial.role}, {testimonial.company}
              </div>
            </div>
          </div>

          {/* Result badge */}
          <div className="flex-shrink-0 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
            {testimonial.result}
          </div>
        </div>
      </div>
    </figure>
  );
}

export function GCTestimonials() {
  return (
    <section className="relative">
      {/* Section header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-2 text-sm font-semibold text-amber-700">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Trusted by 150+ GCs
        </div>

        <h2 className="mt-6 text-3xl font-black tracking-tight text-zinc-900 md:text-4xl">
          What General Contractors{" "}
          <span className="bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
            Say About Us
          </span>
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600">
          Real feedback from GCs who offloaded permits, coordination, and reporting to our team.
        </p>
      </div>

      {/* Testimonials grid */}
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t, index) => (
          <TestimonialCard key={t.name} testimonial={t} index={index} />
        ))}
      </div>

      {/* Trust metrics */}
      <div className="mt-12 rounded-2xl border border-zinc-200/50 bg-gradient-to-r from-zinc-50 to-slate-50 p-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="text-center">
            <div className="text-3xl font-black text-zinc-900">4.9/5</div>
            <div className="mt-2 flex justify-center">
              <StarRating rating={5} />
            </div>
            <div className="mt-2 text-sm text-zinc-500">Average rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-zinc-900">150+</div>
            <div className="mt-2 text-sm text-zinc-500">Active GC clients</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-zinc-900">98%</div>
            <div className="mt-2 text-sm text-zinc-500">Client retention rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-zinc-900">22hrs</div>
            <div className="mt-2 text-sm text-zinc-500">Avg. weekly time saved</div>
          </div>
        </div>
      </div>

      {/* Social proof logos placeholder */}
      <div className="mt-12 text-center">
        <p className="text-sm font-medium text-zinc-500">Trusted by general contractors across the nation</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 opacity-50">
          {["Regional GC", "Commercial Builder", "Design/Build", "Enterprise GC", "Multi-Family"].map((name) => (
            <div
              key={name}
              className="flex h-12 items-center rounded-lg bg-zinc-100 px-4 text-sm font-bold text-zinc-400"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
