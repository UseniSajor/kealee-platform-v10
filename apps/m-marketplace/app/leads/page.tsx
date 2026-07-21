'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    BarChart3,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getLeads } from '@/lib/api';

// Lead stages from the backend
const LEAD_STAGES = ['OPEN', 'INTAKE', 'QUALIFIED', 'SCOPED', 'QUOTED', 'WON', 'LOST'] as const;
type LeadStage = typeof LEAD_STAGES[number];

const STAGE_BADGE_STYLES: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-700',
    INTAKE: 'bg-purple-100 text-purple-700',
    QUALIFIED: 'bg-cyan-100 text-cyan-700',
    SCOPED: 'bg-orange-100 text-orange-700',
    QUOTED: 'bg-indigo-100 text-indigo-700',
    WON: 'bg-green-100 text-green-700',
    LOST: 'bg-neutral-100 text-neutral-500',
};

interface Lead {
    id: string;
    category: string;
    description: string;
    estimatedValue: number | null;
    location: string;
    city: string | null;
    state: string | null;
    stage: string;
    createdAt: string;
    distributedTo?: { id: string; businessName: string }[];
    assignedSalesRep?: { id: string; name: string; email: string } | null;
    awardedProfile?: { id: string; businessName: string; user?: { name: string } } | null;
}

/** Format estimated value as currency */
function formatValue(val: number | null): string {
    if (val === null || val === undefined) return 'TBD';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

/** Format createdAt into a relative time string */
function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Build a display location from lead fields */
function displayLocation(lead: Lead): string {
    if (lead.city && lead.state) return `${lead.city}, ${lead.state}`;
    if (lead.city) return lead.city;
    if (lead.state) return lead.state;
    return lead.location || 'Unknown';
}

/** Determine if a lead is "prime" (high value) */
function isPrimeLead(lead: Lead): boolean {
    return lead.estimatedValue !== null && lead.estimatedValue >= 50000;
}

export default function LeadDashboardPage() {
    const [activeTab, setActiveTab] = useState('available');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalLeads, setTotalLeads] = useState(0);
    const [stageFilter, setStageFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    // Stats derived from data
    const wonCount = leads.filter((l) => l.stage === 'WON').length;
    const activeCount = leads.filter((l) => !['WON', 'LOST'].includes(l.stage)).length;

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getLeads({
                stage: stageFilter || undefined,
                limit: 50,
                offset: 0,
            });

            if (result.success && result.data) {
                setLeads(result.data.leads || []);
                setTotalLeads(result.data.total || 0);
            } else {
                setError(result.error || 'Failed to load leads');
                setLeads([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    }, [stageFilter]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    // Client-side search filtering
    const filteredLeads = leads.filter((lead) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (lead.category || '').toLowerCase().includes(q) ||
            (lead.description || '').toLowerCase().includes(q) ||
            (lead.location || '').toLowerCase().includes(q) ||
            (lead.city || '').toLowerCase().includes(q) ||
            (lead.state || '').toLowerCase().includes(q)
        );
    });

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
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">Active Leads</p>
                                    <p className="text-xl font-bold text-neutral-900 leading-none">
                                        {loading ? '--' : activeCount}
                                        <span className="text-xs text-neutral-400 font-medium whitespace-nowrap"> / {loading ? '--' : totalLeads} total</span>
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-neutral-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">Won Leads</p>
                                    <p className="text-xl font-bold text-neutral-900 leading-none">{loading ? '--' : wonCount}</p>
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
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-3">Stage</label>
                                        <select
                                            value={stageFilter}
                                            onChange={(e) => setStageFilter(e.target.value)}
                                            className="w-full bg-neutral-50 border-none rounded-xl py-3 px-4 text-sm font-semibold text-neutral-700 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all"
                                        >
                                            <option value="">All Stages</option>
                                            {LEAD_STAGES.map((stage) => (
                                                <option key={stage} value={stage}>{stage}</option>
                                            ))}
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
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by category, description, or location..."
                                    className="w-full pl-14 pr-6 py-5 bg-white rounded-3xl border border-neutral-100 shadow-sm outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600/30 transition-all font-medium text-neutral-700"
                                />
                            </div>

                            {/* Error State */}
                            {error && (
                                <div className="rounded-3xl p-6 flex items-center gap-4 bg-red-50 border border-red-200">
                                    <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-500" />
                                    <div className="flex-1">
                                        <p className="text-sm text-red-700 font-bold">Unable to load leads</p>
                                        <p className="text-xs text-red-600 mt-0.5">{error}</p>
                                    </div>
                                    <button
                                        onClick={fetchLeads}
                                        className="text-sm font-bold text-red-600 hover:text-red-800 underline"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

                            {/* Loading State */}
                            {loading && (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mb-4" />
                                    <p className="text-sm text-neutral-500">Loading leads...</p>
                                </div>
                            )}

                            {/* Lead List */}
                            {!loading && (
                                <>
                                    <motion.div
                                        variants={container}
                                        initial="hidden"
                                        animate="show"
                                        className="grid grid-cols-1 gap-4"
                                    >
                                        {filteredLeads.map((lead) => (
                                            <motion.div
                                                key={lead.id}
                                                variants={item}
                                                className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 hover:shadow-xl hover:shadow-neutral-200/50 hover:border-indigo-100 transition-all group relative overflow-hidden cursor-pointer"
                                            >
                                                {/* Status Badge */}
                                                <div className="absolute right-8 top-8">
                                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${STAGE_BADGE_STYLES[lead.stage] || 'bg-neutral-100 text-neutral-600'
                                                        }`}>
                                                        {lead.stage}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col md:flex-row gap-6 md:items-center">
                                                    <div className="p-4 bg-neutral-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                                                        <Target className="w-8 h-8 text-neutral-400 group-hover:text-indigo-600 transition-colors" />
                                                    </div>

                                                    <div className="flex-grow space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-xl font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">
                                                                {lead.category || 'Untitled Lead'}
                                                            </h3>
                                                            {isPrimeLead(lead) && (
                                                                <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                                    <Zap className="w-2.5 h-2.5 fill-amber-600" />
                                                                    PRIME LEAD
                                                                </span>
                                                            )}
                                                        </div>

                                                        {lead.description && (
                                                            <p className="text-sm text-neutral-500 line-clamp-1">{lead.description}</p>
                                                        )}

                                                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                                                            <div className="flex items-center gap-2 text-neutral-500 text-sm font-medium">
                                                                <MapPin className="w-4 h-4" />
                                                                {displayLocation(lead)}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-indigo-600 text-sm font-bold">
                                                                <DollarSign className="w-4 h-4" />
                                                                {formatValue(lead.estimatedValue)}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-neutral-400 text-sm font-medium">
                                                                <Clock className="w-4 h-4" />
                                                                {timeAgo(lead.createdAt)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        {lead.distributedTo && lead.distributedTo.length > 0 && (
                                                            <div className="text-right hidden md:block">
                                                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">Distributed</p>
                                                                <p className="text-lg font-bold text-neutral-900 leading-none">{lead.distributedTo.length}</p>
                                                            </div>
                                                        )}
                                                        <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                            <ChevronRight className="w-6 h-6" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>

                                    {/* Empty State */}
                                    {filteredLeads.length === 0 && !error && (
                                        <div className="text-center py-16">
                                            <Target className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-bold text-neutral-700 mb-2">No leads found</h3>
                                            <p className="text-neutral-500 text-sm">
                                                {stageFilter
                                                    ? `No leads with stage "${stageFilter}". Try selecting a different stage.`
                                                    : 'There are no leads to display at this time.'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Pagination Placeholder */}
                                    {filteredLeads.length > 0 && totalLeads > filteredLeads.length && (
                                        <div className="flex justify-center mt-12">
                                            <button className="text-sm font-bold text-neutral-400 hover:text-indigo-600 transition-colors py-2 px-4 rounded-xl hover:bg-neutral-100">
                                                Load more leads from your area
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
