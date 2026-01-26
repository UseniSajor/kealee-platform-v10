'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Users, CheckCircle, ArrowRight, BarChart3, CreditCard, FileText, Bell, Shield, Calendar } from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'Real-Time Tracking', description: 'Monitor project progress, milestones, and timelines in real-time' },
  { icon: CheckCircle, title: 'Milestone Approval', description: 'Review and approve project milestones with one click' },
  { icon: CreditCard, title: 'Payment Processing', description: 'Secure escrow payments released upon milestone completion' },
  { icon: FileText, title: 'Document Management', description: 'All contracts, drawings, and permits in one place' },
  { icon: Bell, title: 'Instant Notifications', description: 'Stay updated on project changes and contractor communications' },
  { icon: Shield, title: 'Secure & Compliant', description: 'Bank-level security for all transactions and data' },
];

export default function PortalPage() {
  return (
    <>
      <Header />

      <section className="pt-32 pb-20 bg-gradient-to-br from-orange-600 via-orange-500 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-semibold mb-8">
              <Users size={16} />
              Project Owner Portal
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Complete Project
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-orange-200"> Visibility & Control</span>
            </h1>
            <p className="text-xl text-orange-100/90 mb-10 max-w-2xl mx-auto">
              Track milestones, approve payments, and manage your construction projects
              from anywhere with our intuitive owner portal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-orange-600 font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all">
                Get Started Free <ArrowRight size={20} />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all">
                <Calendar size={20} /> Schedule Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-slate-600">Powerful tools to manage your construction investment</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="p-8 bg-slate-50 rounded-2xl hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="text-orange-600" size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-xl text-slate-300 mb-12">Just 3% platform fee on project payments</p>
          <div className="max-w-lg mx-auto bg-slate-800 rounded-2xl p-8">
            <div className="text-5xl font-bold text-orange-400 mb-2">3%</div>
            <div className="text-slate-300 mb-6">Platform fee on milestone payments</div>
            <ul className="space-y-3 text-left mb-8">
              {['Unlimited projects', 'Unlimited team members', 'Secure escrow payments', 'Full document management', '24/7 support'].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle className="text-green-400" size={16} />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 font-semibold rounded-xl shadow-lg">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
