'use client';

import { Wallet, Shield, FileCheck, Banknote, ArrowRight, CheckCircle } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Wallet,
    title: 'Create Escrow Account',
    description: 'Set up a secure escrow account in minutes. Define project milestones, payment schedules, and release conditions.',
    details: ['Custom milestone setup', 'Flexible payment terms', 'Multi-party support'],
    color: 'emerald',
  },
  {
    number: '02',
    icon: Shield,
    title: 'Secure Fund Deposit',
    description: 'Funds are deposited into FDIC-insured accounts with bank-level security. All parties receive instant confirmation.',
    details: ['Bank-level encryption', 'FDIC insurance', 'Instant verification'],
    color: 'blue',
  },
  {
    number: '03',
    icon: FileCheck,
    title: 'Milestone Verification',
    description: 'Work is verified against agreed milestones. Our system supports documentation upload and multi-party approval.',
    details: ['Document uploads', 'Digital signatures', 'Audit trail'],
    color: 'amber',
  },
  {
    number: '04',
    icon: Banknote,
    title: 'Automated Release',
    description: 'Once milestones are approved, funds are released automatically to the designated parties within 24 hours.',
    details: ['Same-day processing', 'Direct deposit', 'Complete records'],
    color: 'purple',
  },
];

export function EscrowProcess() {
  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-6">
            <Shield size={16} />
            Secure & Transparent Process
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            How Escrow Works
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Our streamlined 4-step process ensures your funds are protected at every stage
            of your construction project
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-16 left-full w-full items-center justify-center z-0">
                  <div className="w-full h-px bg-gradient-to-r from-slate-600 to-slate-700" />
                  <ArrowRight className="absolute text-slate-600" size={20} />
                </div>
              )}

              {/* Card */}
              <div className="relative bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/80 hover:border-slate-600/50 transition-all duration-300 h-full">
                {/* Step Number */}
                <div className={`absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
                  {step.number}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-${step.color}-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <step.icon className={`text-${step.color}-400`} size={32} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-400 mb-4 leading-relaxed">
                  {step.description}
                </p>

                {/* Details */}
                <ul className="space-y-2">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-500">
                      <CheckCircle className={`text-${step.color}-500`} size={14} />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Process Flow Visualization (Mobile) */}
        <div className="lg:hidden mt-12 flex justify-center">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-10 h-10 rounded-full bg-${step.color}-500 flex items-center justify-center text-white font-bold text-sm`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="text-slate-600 mx-1" size={16} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
