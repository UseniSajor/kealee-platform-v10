'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Star,
    CheckCircle2,
    MapPin,
    ShieldCheck,
    ExternalLink,
    ArrowLeft,
    Calendar,
    Layers,
    Award,
    Zap,
    MessageSquare,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

// Mock data for initial UI build
const MOCK_VENDOR = {
    id: 'v1',
    businessName: 'Elevation Design & Build',
    description: 'Excellence in modern residential transformations. We specialize in high-end kitchen remodels, custom home additions, and architectural interior design. With over 15 years of serving the DMV area, our team brings precision and passion to every square foot.',
    rating: 4.9,
    reviewCount: 128,
    projectsCompleted: 245,
    verified: true,
    specialties: ['Kitchen Remodeling', 'Bathroom Design', 'Full Home Renovation', 'Custom Cabinetry'],
    availableCapacity: 'Limited (Booking for March)',
    performanceScore: 98,
    memberSince: '2021',
    portfolio: [
        { id: 'p1', title: 'Modern Minimalist Kitchen', category: 'Kitchen', image: 'https://images.unsplash.com/photo-1556911220-e15224bbbe39?q=80&w=800&auto=format&fit=crop' },
        { id: 'p2', title: 'Open Concept Living Area', category: 'Renovation', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800&auto=format&fit=crop' },
        { id: 'p3', title: 'Luxury Master Bath', category: 'Bathroom', image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=800&auto=format&fit=crop' },
        { id: 'p4', title: 'Contemporary Home Extension', category: 'Addition', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop' },
    ]
};

export default function VendorProfilePage() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
            <Header />

            <main className="flex-grow">
                {/* Banner */}
                <div className="h-64 md:h-80 bg-gradient-to-r from-indigo-900 to-slate-900 relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                    <Link
                        href="/vendors"
                        className="absolute top-8 left-8 flex items-center gap-2 text-white/80 hover:text-white font-bold transition-all bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Directory
                    </Link>
                </div>

                <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10 pb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left Column: Profile Card */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-[2rem] shadow-xl shadow-neutral-200/50 border border-neutral-100 p-8 overflow-hidden sticky top-8">
                                <div className="relative mb-6">
                                    <div className="w-32 h-32 bg-indigo-50 rounded-3xl flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                                        <span className="text-4xl font-black text-indigo-600">ED</span>
                                    </div>
                                    {MOCK_VENDOR.verified && (
                                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-2xl shadow-lg border-4 border-white">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 mb-6">
                                    <h1 className="text-2xl font-bold text-neutral-900 leading-tight">{MOCK_VENDOR.businessName}</h1>
                                    <div className="flex items-center gap-2 text-amber-500">
                                        <Star className="w-5 h-5 fill-amber-500" />
                                        <span className="font-bold">{MOCK_VENDOR.rating}</span>
                                        <span className="text-neutral-400 text-sm font-medium">({MOCK_VENDOR.reviewCount} reviews)</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-8">
                                    {MOCK_VENDOR.specialties.map((s) => (
                                        <span key={s} className="bg-neutral-50 text-neutral-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-neutral-100">
                                            {s}
                                        </span>
                                    ))}
                                </div>

                                <div className="space-y-4 pt-6 border-t border-neutral-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-neutral-500 text-sm font-medium">
                                            <Calendar className="w-4 h-4" />
                                            Member Since
                                        </div>
                                        <span className="font-bold text-neutral-900">{MOCK_VENDOR.memberSince}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-neutral-500 text-sm font-medium">
                                            <Layers className="w-4 h-4" />
                                            Scale
                                        </div>
                                        <span className="font-bold text-neutral-900 text-sm">Residential Elite</span>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-3">
                                    <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group">
                                        Request Quote
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <button className="w-full bg-white text-neutral-600 font-bold py-4 rounded-2xl border border-neutral-200 hover:bg-neutral-50 transition-all flex items-center justify-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        Message
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Details & Portfolio */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Stats Bar */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-1">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total Projects</p>
                                    <p className="text-2xl font-bold text-neutral-900">{MOCK_VENDOR.projectsCompleted}+</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-1">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Perf. Score</p>
                                    <div className="flex items-end gap-2">
                                        <p className="text-2xl font-bold text-green-600">{MOCK_VENDOR.performanceScore}%</p>
                                        <Award className="w-4 h-4 text-green-600 mb-1" />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-1 col-span-2 md:col-span-1">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Current Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                        <p className="text-sm font-bold text-neutral-700">{MOCK_VENDOR.availableCapacity}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bio Section */}
                            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8 md:p-10">
                                <h2 className="text-xl font-bold text-neutral-900 mb-4">About the Business</h2>
                                <p className="text-neutral-600 leading-relaxed font-normal">
                                    {MOCK_VENDOR.description}
                                </p>

                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100">
                                        <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-sm text-neutral-900">Licensed & Insured</p>
                                            <p className="text-xs text-neutral-500">Verified CAL3402 License</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100">
                                        <Zap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-sm text-neutral-900">Avg. Response Time</p>
                                            <p className="text-xs text-neutral-500">Under 2 hours</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Portfolio Grid */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-2xl font-bold text-neutral-900">Recent Projects</h2>
                                    <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                        View All
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <motion.div
                                    variants={container}
                                    initial="hidden"
                                    animate="show"
                                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                >
                                    {MOCK_VENDOR.portfolio.map((project) => (
                                        <motion.div
                                            key={project.id}
                                            variants={item}
                                            className="group cursor-pointer"
                                        >
                                            <div className="relative h-64 rounded-[2rem] overflow-hidden mb-4 shadow-sm border border-neutral-200">
                                                <img
                                                    src={project.image}
                                                    alt={project.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                                    <p className="text-white text-xs font-bold uppercase tracking-widest mb-1 italic">{project.category}</p>
                                                    <p className="text-white font-bold text-lg">{project.title}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
