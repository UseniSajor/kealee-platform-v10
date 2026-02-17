'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Filter,
    Star,
    MapPin,
    ShieldCheck,
    ArrowUpRight,
    ChevronRight,
    SlidersHorizontal,
    Building2,
    Hammer,
    Palette,
    Lightbulb,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getContractors } from '@/lib/api';

interface Vendor {
    id: string;
    name: string;
    rating: number;
    reviews: number;
    location: string;
    specialties: string[];
    verified: boolean;
    image: string | null;
}

/** Map a raw API contractor profile to the Vendor card shape */
function mapApiVendor(p: any): Vendor {
    return {
        id: p.id,
        name: p.businessName || 'Unknown Business',
        rating: typeof p.rating === 'number' ? p.rating : 0,
        reviews: typeof p.reviewCount === 'number' ? p.reviewCount : 0,
        location: '', // Backend doesn't expose location on list endpoint yet
        specialties: Array.isArray(p.specialties) ? p.specialties : [],
        verified: !!p.verified,
        image: p.user?.avatar || null,
    };
}

export default function VendorDirectoryPage() {
    const [search, setSearch] = useState('');
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalResults, setTotalResults] = useState(0);

    const fetchVendors = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getContractors({
                search: search || undefined,
                limit: 20,
                offset: 0,
            });

            if (result.success && result.data) {
                const mapped = (result.data.profiles || []).map(mapApiVendor);
                setVendors(mapped);
                setTotalResults(result.data.total || mapped.length);
            } else {
                setError(result.error || 'Failed to load vendors');
                setVendors([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error');
            setVendors([]);
        } finally {
            setLoading(false);
        }
    }, [search]);

    // Debounced fetch on search changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchVendors();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchVendors]);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1 }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
            <Header />

            <main className="flex-grow pt-12 pb-24 px-4">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl font-black text-neutral-900 tracking-tight mb-4">Find Your Master Pro</h1>
                        <p className="text-xl text-neutral-500 max-w-2xl mx-auto font-medium">
                            Vetted professionals, verified ratings, and guaranteed delivery for every scale of construction.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">

                        {/* Sidebar Filters */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="sticky top-8 space-y-8">
                                {/* Search */}
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5 transition-colors group-focus-within:text-indigo-600" />
                                    <input
                                        type="text"
                                        placeholder="Search by name..."
                                        className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-neutral-100 shadow-sm outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all font-medium"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>

                                {/* Filter Groups */}
                                <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm space-y-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                                            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                                            Filters
                                        </h3>
                                        <button className="text-xs font-bold text-indigo-600">Clear All</button>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-4">Category</label>
                                        <div className="space-y-3">
                                            {[
                                                { name: 'General Contractor', icon: Hammer },
                                                { name: 'Interior Design', icon: Palette },
                                                { name: 'Structural', icon: Building2 },
                                                { name: 'Electrical', icon: Lightbulb }
                                            ].map((cat) => (
                                                <label key={cat.name} className="flex items-center gap-3 group cursor-pointer">
                                                    <input type="checkbox" className="w-5 h-5 rounded-lg border-neutral-200 text-indigo-600 focus:ring-indigo-600/10 transition-all" />
                                                    <span className="text-sm font-semibold text-neutral-600 group-hover:text-neutral-900 transition-colors">{cat.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-4">Location</label>
                                        <select className="w-full bg-neutral-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-neutral-700 outline-none">
                                            <option>All DMV Area</option>
                                            <option>Maryland</option>
                                            <option>Virginia</option>
                                            <option>DC</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100/50 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <h4 className="font-bold text-lg mb-2">Are you a Pro?</h4>
                                        <p className="text-indigo-100/80 text-sm mb-6 leading-relaxed">Join 500+ top-tier contractors growing their business on Kealee.</p>
                                        <button className="w-full bg-white text-indigo-600 font-bold py-3.5 rounded-xl text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                            Join the Network
                                            <ArrowUpRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full" />
                                </div>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="lg:col-span-3 space-y-8">
                            <div className="flex items-center justify-between px-2">
                                <p className="text-sm font-bold text-neutral-400">
                                    {loading ? (
                                        'Loading...'
                                    ) : (
                                        <>Showing <span className="text-neutral-900">{vendors.length}{totalResults > vendors.length ? ` of ${totalResults}` : ''} results</span></>
                                    )}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-neutral-400">Sort by:</span>
                                    <select className="bg-transparent border-none text-sm font-bold text-neutral-900 outline-none cursor-pointer">
                                        <option>Highest Rated</option>
                                        <option>Most Projects</option>
                                        <option>Verified First</option>
                                    </select>
                                </div>
                            </div>

                            {/* Error State */}
                            {error && (
                                <div className="rounded-3xl p-6 flex items-center gap-4 bg-red-50 border border-red-200">
                                    <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-500" />
                                    <div className="flex-1">
                                        <p className="text-sm text-red-700 font-bold">Unable to load vendors</p>
                                        <p className="text-xs text-red-600 mt-0.5">{error}</p>
                                    </div>
                                    <button
                                        onClick={fetchVendors}
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
                                    <p className="text-sm text-neutral-500">Loading vendors...</p>
                                </div>
                            )}

                            {/* Vendor Grid */}
                            {!loading && vendors.length > 0 && (
                                <motion.div
                                    variants={container}
                                    initial="hidden"
                                    animate="show"
                                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                                >
                                    {vendors.map((vendor) => (
                                        <motion.div
                                            key={vendor.id}
                                            variants={item}
                                            className="bg-white rounded-[2.5rem] overflow-hidden border border-neutral-100 shadow-sm hover:shadow-2xl hover:shadow-neutral-200/50 hover:border-indigo-100 transition-all group"
                                        >
                                            <div className="relative h-56 overflow-hidden bg-gradient-to-br from-indigo-100 to-slate-200">
                                                {vendor.image ? (
                                                    <img
                                                        src={vendor.image}
                                                        alt={vendor.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-5xl font-black text-indigo-300">
                                                            {vendor.name.substring(0, 2).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                {vendor.verified && (
                                                    <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white shadow-sm">
                                                        <ShieldCheck className="w-4 h-4 text-green-500" />
                                                        <span className="text-[10px] font-black text-neutral-900 uppercase tracking-wider">Verified Pro</span>
                                                    </div>
                                                )}
                                                {vendor.rating > 0 && (
                                                    <div className="absolute bottom-6 right-6 flex items-center gap-1 bg-neutral-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl">
                                                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                        <span className="text-xs font-bold text-white">{vendor.rating.toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-8">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors mb-1">{vendor.name}</h3>
                                                        {vendor.location && (
                                                            <p className="flex items-center gap-1 text-sm font-medium text-neutral-400">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                {vendor.location}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mb-8">
                                                    {vendor.specialties.slice(0, 4).map(s => (
                                                        <span key={s} className="bg-neutral-50 text-[10px] font-black text-neutral-500 uppercase tracking-widest px-3 py-1.5 rounded-lg border border-neutral-100">
                                                            {s}
                                                        </span>
                                                    ))}
                                                    {vendor.specialties.length > 4 && (
                                                        <span className="text-xs text-neutral-400">+{vendor.specialties.length - 4}</span>
                                                    )}
                                                </div>

                                                <Link
                                                    href={`/vendor/${vendor.id}`}
                                                    className="flex items-center justify-between w-full bg-neutral-50 group-hover:bg-indigo-600 group-hover:text-white p-5 rounded-2xl transition-all"
                                                >
                                                    <span className="font-bold text-sm tracking-tight text-neutral-700 group-hover:text-white">View Full Profile</span>
                                                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            {/* Empty State */}
                            {!loading && vendors.length === 0 && !error && (
                                <div className="text-center py-20">
                                    <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-neutral-700 mb-2">No vendors found</h3>
                                    <p className="text-neutral-500 text-sm">
                                        {search ? 'Try adjusting your search query.' : 'There are no vendors to display at this time.'}
                                    </p>
                                </div>
                            )}

                            {/* Load More */}
                            {!loading && vendors.length > 0 && totalResults > vendors.length && (
                                <div className="pt-12 text-center">
                                    <button className="px-12 py-5 rounded-2xl bg-white border border-neutral-200 text-neutral-400 font-bold hover:text-indigo-600 hover:border-indigo-600 shadow-sm transition-all active:scale-95">
                                        Discover More Pros
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
