'use client';

import { useEffect, useState, useRef } from 'react';
import { TrendingUp, Building2, DollarSign, Clock, Award } from 'lucide-react';

const stats = [
  {
    value: 500,
    suffix: '+',
    label: 'Projects Completed',
    description: 'Successful builds delivered',
    icon: Building2,
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    value: 2.4,
    prefix: '$',
    suffix: 'M',
    label: 'Client Savings',
    description: 'Through efficient processes',
    icon: DollarSign,
    gradient: 'from-green-500 to-green-600',
  },
  {
    value: 94,
    suffix: '%',
    label: 'On-Time Delivery',
    description: 'Projects on schedule',
    icon: Clock,
    gradient: 'from-orange-500 to-orange-600',
  },
  {
    value: 3000,
    suffix: '+',
    label: 'Jurisdictions',
    description: 'Nationwide coverage',
    icon: Award,
    gradient: 'from-purple-500 to-purple-600',
  },
];

function AnimatedCounter({ value, prefix = '', suffix = '', duration = 2000 }: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(value * easeOutQuart);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, value, duration]);

  const displayValue = value < 10 ? count.toFixed(1) : Math.round(count).toLocaleString();

  return (
    <span ref={countRef}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-50/50 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <TrendingUp size={16} />
            Proven Results
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Numbers That{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
              Speak
            </span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-transparent overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:bg-white/20 transition-colors`}>
                  <stat.icon className="text-white" size={28} />
                </div>

                <div className="text-4xl lg:text-5xl font-bold text-slate-900 group-hover:text-white transition-colors mb-2">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>

                <div className="text-lg font-semibold text-slate-700 group-hover:text-white/90 transition-colors mb-1">
                  {stat.label}
                </div>

                <div className="text-sm text-slate-500 group-hover:text-white/70 transition-colors">
                  {stat.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
