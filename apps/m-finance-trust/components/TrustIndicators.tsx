'use client';

import { Shield, Award, Building2, Lock } from 'lucide-react';

const certifications = [
  { name: 'SOC 2 Type II', icon: Shield },
  { name: 'FDIC Insured', icon: Building2 },
  { name: 'PCI DSS Level 1', icon: Lock },
  { name: 'BBB A+ Rating', icon: Award },
];

const partners = [
  'Goldman Sachs',
  'JPMorgan Chase',
  'Wells Fargo',
  'Bank of America',
  'Citi',
  'US Bank',
];

export function TrustIndicators() {
  return (
    <section className="py-12 bg-slate-50 border-y border-slate-200/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Certifications */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex flex-wrap items-center justify-center gap-8">
            {certifications.map((cert) => (
              <div key={cert.name} className="flex items-center gap-2 text-slate-600">
                <cert.icon size={20} className="text-emerald-600" />
                <span className="font-semibold text-sm">{cert.name}</span>
              </div>
            ))}
          </div>

          <div className="hidden lg:block w-px h-12 bg-slate-300" />

          {/* Banking Partners */}
          <div className="flex flex-col items-center lg:items-end gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
              Banking Partners
            </span>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {partners.map((partner) => (
                <span
                  key={partner}
                  className="text-slate-400 font-semibold text-sm hover:text-slate-600 transition-colors"
                >
                  {partner}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
