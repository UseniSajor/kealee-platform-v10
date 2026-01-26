'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy,
    Clock,
    MapPin,
    DollarSign,
    ChevronRight,
    Filter,
    Search,
    Zap,
    ArrowUpRight,
    Target,
    BarChart3
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

// Mock data for initial UI build
const MOCK_LEADS = [
    {
        id: 'l1',
        title: 'Modern Kitchen Remodel',
        location: 'Bethesda, MD',
        budget: '$35,000 - $50,000',
        postedAt: '2 hours ago',
        status: 'OPEN',
        potential: 'High',
        bidCount: 2,
        category: 'Renovation'
    },
    {
        id: 'l2',
        title: 'Whole House Painting',
        location: 'Arlington, VA',
        budget: '$8,000 - $12,000',
        postedAt: '5 hours ago',
        status: 'MY_BID',
        potential: 'Medium',
        bidCount: 4,
        category: 'Interior'
    },
    {
        id: 'l3',
        title: 'New Outdoor Deck construction',
        location: 'Potomac, MD',
        budget: '$20,000 - $30,000',
        postedAt: 'Yesterday',
        status: 'WON',
        potential: 'High',
        bidCount: 1,
        category: 'Construction'
    }
];

export default function LeadDashboardPage() {
    const [activeTab, setActiveTab] = useState('available');

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
            <Header />

            <main className="flex-grow pt-12 pb-24 px-4">
                <div className="max-w-6xl mx-auto">

                    {/* Header & Stats */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl font-bold text-neutral-900 tracking-tight mb-2">Lead HQ</h1>
                            <p className="text-neutral-500 font-medium">Your command center for high-value projects.</p>
                        </div>

                        <div className="grid grid-cols-2 md:flex gap-4">
                            <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-neutral-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">Queue Position</p>
                                    <p className="text-xl font-bold text-neutral-900 leading-none">#4 <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">/ 42 active</span></p>
                                </div>
                            </div>

                            <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-neutral-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">Won Leads</p>
                                    <p className="text-xl font-bold text-neutral-900 leading-none">12</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                        {/* Sidebar Filters */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6">
                                <h3 className="font-bold text-neutral-900 mb-6 flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-indigo-600" />
                                    Filter Leads
                                </h3>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-3">Radius</label>
                                        <select className="w-full bg-neutral-50 border-none rounded-xl py-3 px-4 text-sm font-semibold text-neutral-700 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all">
                                            <option>Within 25 miles</option>
                                            <option>Within 50 miles</option>
                                            <option>Statewide</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-3">Project Scale</label>
                                        <div className="space-y-2">
                                            {['Small Repair', 'Medium Project', 'Large Renovation'].map((scale) => (
                                                <label key={scale} className="flex items-center gap-3 group cursor-pointer">
                                                    <input type="checkbox" className="w-5 h-5 rounded-md border-neutral-200 text-indigo-600 focus:ring-indigo-600/20 transition-all cursor-pointer" />
                                                    <span className="text-sm font-medium text-neutral-600 group-hover:text-neutral-900 transition-colors">{scale}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <BarChart3 className="w-10 h-10 mb-4 opacity-80" />
                                    <h4 className="font-bold text-lg mb-2">Grow your pipeline</h4>
                                    <p className="text-indigo-100 text-sm mb-6 leading-relaxed">Boost your verified score to get priority access to high-value leads.</p>
                                    <button className="w-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                                        Optimize Profile
                                        <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-3 space-y-6">

                            {/* Tab Navigation */}
                            <div className="flex p-1.5 bg-neutral-100 rounded-2xl w-fit">
                                <button
                                    onClick={() => setActiveTab('available')}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'available' ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                                        }`}
                                >
                                    Distributed to You
                                </button>
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                                        }`}
                                >
                                    My Active Bids
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5 transition-colors group-focus-within:text-indigo-600" />
                                <input
                                    type="text"
                                    placeholder="Search project titles or locations..."
                                    className="w-full pl-14 pr-6 py-5 bg-white rounded-3xl border border-neutral-100 shadow-sm outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600/30 transition-all font-medium text-neutral-700"
                                />
                            </div>

                            {/* Lead List */}
                            <motion.div
                                variants={container}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-1 gap-4"
                            >
                                {MOCK_LEADS.map((lead) => (
                                    <motion.div
                                        key={lead.id}
                                        variants={item}
                                        className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 hover:shadow-xl hover:shadow-neutral-200/50 hover:border-indigo-100 transition-all group relative overflow-hidden cursor-pointer"
                                    >
                                        {/* Status Badge */}
                                        <div className="absolute right-8 top-8">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${lead.status === 'WON' ? 'bg-green-100 text-green-700' :
                                                    lead.status === 'MY_BID' ? 'bg-indigo-100 text-indigo-700' :
                                                        'bg-neutral-100 text-neutral-600'
                                                }`}>
                                                {lead.status.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-6 md:items-center">
                                            <div className="p-4 bg-neutral-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                                                <Target className="w-8 h-8 text-neutral-400 group-hover:text-indigo-600 transition-colors" />
                                            </div>

                                            <div className="flex-grow space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">{lead.title}</h3>
                                                    {lead.potential === 'High' && (
                                                        <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                            <Zap className="w-2.5 h-2.5 fill-amber-600" />
                                                            PRIME LEAD
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                                                    <div className="flex items-center gap-2 text-neutral-500 text-sm font-medium">
                                                        <MapPin className="w-4 h-4" />
                                                        {lead.location}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-indigo-600 text-sm font-bold">
                                                        <DollarSign className="w-4 h-4" />
                                                        {lead.budget}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-neutral-400 text-sm font-medium">
                                                        <Clock className="w-4 h-4" />
                                                        {lead.postedAt}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right hidden md:block">
                                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">Competitors</p>
                                                    <p className="text-lg font-bold text-neutral-900 leading-none">{lead.bidCount}</p>
                                                </div>
                                                <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <ChevronRight className="w-6 h-6" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Pagination Placeholder */}
                            <div className="flex justify-center mt-12">
                                <button className="text-sm font-bold text-neutral-400 hover:text-indigo-600 transition-colors py-2 px-4 rounded-xl hover:bg-neutral-100">
                                    Load more leads from your area
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
