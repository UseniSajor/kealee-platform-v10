'use client';

import { DollarSign, Users, Shield, Clock } from 'lucide-react';

const stats = [
  {
    value: '$500M+',
    label: 'Secured Transactions',
    description: 'Total funds protected through our platform',
    icon: DollarSign,
    color: 'emerald',
  },
  {
    value: '2,500+',
    label: 'Active Projects',
    description: 'Construction projects using our escrow',
    icon: Shield,
    color: 'blue',
  },
  {
    value: '10,000+',
    label: 'Trusted Users',
    description: 'Contractors, owners & developers',
    icon: Users,
    color: 'amber',
  },
  {
    value: '99.9%',
    label: 'Uptime Guarantee',
    description: 'Enterprise-grade reliability',
    icon: Clock,
    color: 'purple',
  },
];

export function Stats() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Our platform has facilitated billions in secure construction payments
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative group p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/50 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl bg-${stat.color}-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`text-${stat.color}-600`} size={28} />
              </div>
              <div className={`text-4xl sm:text-5xl font-bold text-${stat.color}-600 mb-2`}>
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-slate-900 mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-slate-500">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
