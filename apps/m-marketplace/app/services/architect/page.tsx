'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Pencil, CheckCircle, ArrowRight, Palette, FileText, Box, Users, Calendar } from 'lucide-react';

const services = [
  { icon: FileText, title: 'Permit-Ready Drawings', description: 'Complete construction documents ready for submission' },
  { icon: Box, title: '3D Renderings', description: 'Photorealistic visualizations of your project' },
  { icon: Palette, title: 'Design Development', description: 'Full design services from concept to completion' },
  { icon: Users, title: 'Licensed Architects', description: 'All work stamped by licensed professionals' },
];

const pricing = [
  { name: 'Renovation', price: 'From $3,500', description: 'Interior renovations and modifications' },
  { name: 'Addition', price: 'From $5,000', description: 'Home additions and expansions' },
  { name: 'New Construction', price: 'From $8,000', description: 'Ground-up residential construction' },
  { name: 'Commercial', price: 'Custom', description: 'Commercial and mixed-use projects' },
];

export default function ArchitectPage() {
  return (
    <>
      <Header />

      <section className="pt-32 pb-20 bg-gradient-to-br from-green-900 via-green-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/20 backdrop-blur text-green-300 px-4 py-2 rounded-full text-sm font-semibold mb-8">
              <Pencil size={16} />
              Architect Services
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Professional Design &
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500"> Permit-Ready Plans</span>
            </h1>
            <p className="text-xl text-green-100/80 mb-10 max-w-2xl mx-auto">
              Work with licensed architects to bring your vision to life. From concept to permit-ready drawings,
              we handle every detail.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all">
                Start Your Project <ArrowRight size={20} />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all">
                <Calendar size={20} /> Free Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Services</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div key={index} className="text-center p-8 bg-slate-50 rounded-2xl">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <service.icon className="text-green-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-slate-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Pricing</h2>
            <p className="text-xl text-slate-600">Transparent pricing based on project type</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {pricing.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 text-center">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.name}</h3>
                <div className="text-3xl font-bold text-green-600 mb-2">{item.price}</div>
                <p className="text-slate-600 mb-6">{item.description}</p>
                <Link href="/signup" className="block w-full py-3 bg-green-100 text-green-700 font-semibold rounded-xl hover:bg-green-200 transition-all">
                  Get Quote
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
