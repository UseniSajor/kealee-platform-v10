'use client';

import { Shield, Lock, Eye, Server, FileCheck, Users, Key, AlertTriangle, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: Lock,
    title: 'AES-256 Encryption',
    description: 'Military-grade encryption protects all data at rest and in transit. Your financial information is always secure.',
  },
  {
    icon: Server,
    title: 'Redundant Infrastructure',
    description: 'Multiple data centers with real-time replication ensure your data is always available and protected.',
  },
  {
    icon: Eye,
    title: 'Real-Time Monitoring',
    description: '24/7 security operations center monitoring for suspicious activity and potential threats.',
  },
  {
    icon: Users,
    title: 'Multi-Factor Authentication',
    description: 'Mandatory MFA for all accounts with support for hardware keys, authenticator apps, and biometrics.',
  },
  {
    icon: FileCheck,
    title: 'SOC 2 Type II Certified',
    description: 'Annual third-party audits verify our security controls meet the highest industry standards.',
  },
  {
    icon: Key,
    title: 'Role-Based Access Control',
    description: 'Granular permissions ensure users only access the data and functions they need.',
  },
];

const complianceItems = [
  'SOC 2 Type II',
  'PCI DSS Level 1',
  'GDPR Compliant',
  'CCPA Compliant',
  'ISO 27001',
  'NIST Framework',
];

export function SecurityFeatures() {
  return (
    <section id="security" className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-700 text-sm font-medium mb-6">
            <Shield size={16} />
            Enterprise Security
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Bank-Level Security for Your Funds
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            We employ the same security measures used by the world's leading financial institutions
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 bg-white rounded-2xl border border-slate-200/50 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-200 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-500 transition-colors">
                <feature.icon className="text-emerald-600 group-hover:text-white transition-colors" size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Compliance Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-3xl p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                Full Regulatory Compliance
              </h3>
              <p className="text-emerald-100 max-w-xl">
                Our platform meets and exceeds all major security and privacy compliance frameworks
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {complianceItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-lg text-white"
                >
                  <CheckCircle size={16} className="text-emerald-300" />
                  <span className="font-medium text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security Alert */}
        <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-amber-600" size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Your Security is Our Priority</h4>
            <p className="text-slate-600">
              We never store sensitive financial data on local systems. All transactions are processed through
              our secure, PCI-compliant infrastructure. If you ever suspect unauthorized access, contact our
              24/7 security team immediately.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
