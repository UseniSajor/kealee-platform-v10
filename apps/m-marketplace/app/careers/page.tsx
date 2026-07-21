'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Briefcase, MapPin, Clock, ChevronRight, Heart, Home, DollarSign, BookOpen, Laptop, Calendar, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { heroImages } from '@kealee/ui';

interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
}

export default function CareersPage() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const perks = [
    {
      icon: Home,
      title: 'Remote-First',
      description: 'Work from anywhere in the US. We\'re a distributed team that values flexibility.',
    },
    {
      icon: DollarSign,
      title: 'Competitive Compensation',
      description: 'Top-of-market salaries plus equity. We believe in sharing our success.',
    },
    {
      icon: Heart,
      title: 'Health & Wellness',
      description: 'Full medical, dental, and vision coverage for you and your family.',
    },
    {
      icon: Calendar,
      title: 'Unlimited PTO',
      description: 'Take the time you need to recharge. We trust you to manage your time.',
    },
    {
      icon: BookOpen,
      title: 'Learning Budget',
      description: '$2,000/year for courses, conferences, and books to grow your skills.',
    },
    {
      icon: Laptop,
      title: 'Equipment Stipend',
      description: 'MacBook Pro, monitor, and $1,000 for your home office setup.',
    },
  ];

  const values = [
    {
      icon: Users,
      title: 'Customer Obsessed',
      description: 'Every decision starts with how it impacts our customers.',
    },
    {
      icon: Zap,
      title: 'Move Fast',
      description: 'We ship early and iterate. Perfection is the enemy of progress.',
    },
    {
      icon: Heart,
      title: 'Build with Care',
      description: 'Quality matters. We take pride in our craft.',
    },
  ];

  const openings: JobOpening[] = [
    {
      id: 'swe-fullstack',
      title: 'Senior Full-Stack Engineer',
      department: 'Engineering',
      location: 'Remote (US)',
      type: 'Full-time',
      description: 'Build the core platform features that help contractors manage their projects.',
    },
    {
      id: 'swe-frontend',
      title: 'Frontend Engineer',
      department: 'Engineering',
      location: 'Remote (US)',
      type: 'Full-time',
      description: 'Create beautiful, intuitive interfaces for our project management tools.',
    },
    {
      id: 'pm-product',
      title: 'Product Manager',
      department: 'Product',
      location: 'Remote (US)',
      type: 'Full-time',
      description: 'Define and execute the product roadmap for our permit processing platform.',
    },
    {
      id: 'design-product',
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote (US)',
      type: 'Full-time',
      description: 'Design user experiences that simplify complex project workflows.',
    },
    {
      id: 'sales-ae',
      title: 'Account Executive',
      department: 'Sales',
      location: 'Washington, DC',
      type: 'Full-time',
      description: 'Help contractors discover how Kealee can transform their business.',
    },
    {
      id: 'success-csm',
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Remote (US)',
      type: 'Full-time',
      description: 'Ensure our customers get maximum value from the Kealee platform.',
    },
    {
      id: 'ops-permits',
      title: 'Permit Specialist',
      department: 'Operations',
      location: 'Remote (US)',
      type: 'Full-time',
      description: 'Process permit applications and work with jurisdictions across the Mid-Atlantic.',
    },
  ];

  const departments = ['all', ...Array.from(new Set(openings.map(j => j.department)))];

  const filteredOpenings = selectedDepartment === 'all'
    ? openings
    : openings.filter(j => j.department === selectedDepartment);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <Image
          src={heroImages.teamCollaboration.src}
          alt={heroImages.teamCollaboration.alt}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative text-center max-w-4xl mx-auto px-6">
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
            Build Your Career at Kealee
          </h1>
          <p className="text-xl text-white/85 mb-8">
            Join a team of builders transforming how projects get done.
            We're solving real problems for real contractors—and we need your help.
          </p>
          <a
            href="#openings"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
          >
            View Open Positions
            <ChevronRight size={20} />
          </a>
        </div>
      </section>

      <main className="pb-20">
        <div className="container mx-auto px-6">

          {/* Why Kealee */}
          <div className="bg-blue-600 rounded-3xl p-12 mb-20 text-white max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Why Kealee?</h2>
                <p className="text-blue-100 text-lg mb-6">
                  Building is a $1.4 trillion industry still running on spreadsheets and phone calls.
                  We're building the software that will change that—and we're just getting started.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Massive Market Opportunity</h3>
                      <p className="text-blue-200 text-sm">Building tech is still early. There's room to build category-defining products.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Real Impact</h3>
                      <p className="text-blue-200 text-sm">Our customers save real time and money. You'll see the impact of your work every day.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Growth Stage</h3>
                      <p className="text-blue-200 text-sm">We're past the "will this work?" phase but still small enough to move fast and have outsized impact.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500 rounded-xl p-6">
                  <div className="text-4xl font-bold mb-1">500+</div>
                  <div className="text-blue-200">Active Customers</div>
                </div>
                <div className="bg-blue-500 rounded-xl p-6">
                  <div className="text-4xl font-bold mb-1">50+</div>
                  <div className="text-blue-200">Team Members</div>
                </div>
                <div className="bg-blue-500 rounded-xl p-6">
                  <div className="text-4xl font-bold mb-1">3x</div>
                  <div className="text-blue-200">YoY Growth</div>
                </div>
                <div className="bg-blue-500 rounded-xl p-6">
                  <div className="text-4xl font-bold mb-1">$20M</div>
                  <div className="text-blue-200">Funding Raised</div>
                </div>
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="mb-20 max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
              <p className="text-xl text-gray-600">What drives us every day</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <value.icon className="text-blue-600" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Perks */}
          <div className="bg-gray-50 rounded-3xl p-12 mb-20 max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Perks & Benefits</h2>
              <p className="text-xl text-gray-600">We take care of our team</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {perks.map((perk, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <perk.icon className="text-blue-600" size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{perk.title}</h3>
                  <p className="text-gray-600 text-sm">{perk.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Open Positions */}
          <div id="openings" className="max-w-4xl mx-auto scroll-mt-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Open Positions</h2>
              <p className="text-xl text-gray-600 mb-8">Find your next opportunity</p>

              {/* Department Filter */}
              <div className="flex flex-wrap justify-center gap-2">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDepartment(dept)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      selectedDepartment === dept
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {dept === 'all' ? 'All Departments' : dept}
                  </button>
                ))}
              </div>
            </div>

            {filteredOpenings.length > 0 ? (
              <div className="space-y-4">
                {filteredOpenings.map((job) => (
                  <Link
                    key={job.id}
                    href={`mailto:careers@kealee.com?subject=Application: ${job.title}`}
                    className="block bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition">
                          {job.title}
                        </h3>
                        <p className="text-gray-600 mb-3">{job.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Briefcase size={16} />
                            {job.department}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={16} />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={16} />
                            {job.type}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-blue-600 transition flex-shrink-0" size={24} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-600">No openings in this department right now.</p>
              </div>
            )}
          </div>

          {/* General Applications */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-2xl p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-3">Don't see your role?</h3>
              <p className="text-gray-300 mb-6">
                We're always looking for talented people. Send us your resume and tell us how you'd contribute.
              </p>
              <a
                href="mailto:careers@kealee.com?subject=General Application"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
              >
                Send Your Resume
                <ChevronRight size={20} />
              </a>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
