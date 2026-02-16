'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    Compass,
    ShieldCheck,
    ArrowRight,
    Zap,
    Layers,
    Maximize2,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { heroImages } from '@kealee/ui';

const DESIGN_CATEGORIES = ['All Projects', 'Kitchens', 'Baths', 'ADUs', 'Home Extensions', 'Whole House'];

const MOCK_DESIGNS = [
    {
        id: 'd1',
        title: 'The Bethesda Modern ADU',
        category: 'ADUs',
        sqft: 850,
        price: 2499,
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop',
        includes: ['Full Blueprints', 'Material List', 'Permit Support'],
        rating: 4.9,
        sales: 124
    },
    {
        id: 'd2',
        title: 'Chef\'s Dream Open Kitchen',
        category: 'Kitchens',
        sqft: 450,
        price: 899,
        image: 'https://images.unsplash.com/photo-1556911220-e15224bbbe39?q=80&w=800&auto=format&fit=crop',
        includes: ['3D Renderings', 'Cabinet Plans', 'Electrical Layout'],
        rating: 5.0,
        sales: 312
    },
    {
        id: 'd3',
        title: 'Scandinavian Master Suite',
        category: 'Home Extensions',
        sqft: 600,
        price: 1450,
        image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800&auto=format&fit=crop',
        includes: ['BIM Model', 'Lighting Specification', 'Permit Ready'],
        rating: 4.8,
        sales: 85
    },
    {
        id: 'd4',
        title: 'The Arlington Urban Loft',
        category: 'Whole House',
        sqft: 2200,
        price: 4950,
        image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=800&auto=format&fit=crop',
        includes: ['Full Architectural Set', 'Eng. Review', 'Cost Estimate'],
        rating: 4.9,
        sales: 42
    }
];

export default function DesignHubPage() {
    const [activeCategory, setActiveCategory] = useState('All Projects');

    const handleUnlock = (packageId: string) => {
        // Redirect to contact page for design purchase inquiries
        window.location.href = `/contact?interest=design&package=${packageId}`;
    };

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
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <Header />

            <main className="flex-grow">

                {/* Experimental Hero Section */}
                <section className="relative pt-24 pb-32 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-neutral-50 -z-10" />
                    <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[120%] bg-indigo-600/5 blur-[100px] rounded-full" />

                    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100">
                                <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                                <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">Permit-Ready Designs</span>
                            </div>
                            <h1 className="text-6xl md:text-7xl font-black text-neutral-900 tracking-tight leading-[0.95]">
                                Skip the lines. <br />
                                <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Pre-Designed</span> Excellence.
                            </h1>
                            <p className="text-xl text-neutral-500 max-w-lg font-medium leading-relaxed">
                                Unlock professional-grade blueprints, BIM models, and permit packages from top-tier architects. Start your project with a foundation of gold.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button className="bg-neutral-900 text-white font-bold py-5 px-10 rounded-[2rem] hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 active:scale-95 flex items-center gap-3">
                                    Browse Catalog
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <button className="bg-white text-neutral-900 border border-neutral-200 font-bold py-5 px-10 rounded-[2rem] hover:bg-neutral-50 transition-all active:scale-95">
                                    Request Custom Design
                                </button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative hidden lg:block"
                        >
                            <div className="rounded-[4rem] overflow-hidden shadow-2xl relative">
                                <Image
                                    src={heroImages.modernArchitecture.src}
                                    alt={heroImages.modernArchitecture.alt}
                                    width={1200}
                                    height={800}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-indigo-900/10 mix-blend-overlay" />
                            </div>
                            {/* Floating Asset Card */}
                            <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-3xl shadow-2xl border border-neutral-100 flex items-center gap-6 max-w-sm">
                                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="font-black text-neutral-900 leading-tight">Verified Compliance</p>
                                    <p className="text-sm text-neutral-500 font-medium">State-specific engineering stamps included.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Categories Navigation */}
                <section className="sticky top-20 bg-white/80 backdrop-blur-xl z-40 border-b border-neutral-100 py-6">
                    <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-4 overflow-x-auto no-scrollbar">
                        {DESIGN_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-8 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Design Grid */}
                <section className="py-24 max-w-7xl mx-auto px-4">
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
                    >
                        {MOCK_DESIGNS.map((design) => (
                            <motion.div
                                key={design.id}
                                variants={item}
                                className="group flex flex-col h-full bg-white rounded-[3rem] border border-neutral-100 hover:border-indigo-100 shadow-sm hover:shadow-2xl hover:shadow-neutral-200/50 transition-all overflow-hidden"
                            >
                                <div className="relative h-72 overflow-hidden">
                                    <img
                                        src={design.image}
                                        alt={design.title}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white font-black text-neutral-900 shadow-sm">
                                        ${design.price.toLocaleString()}
                                    </div>
                                    <div className="absolute bottom-6 left-6 inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-900/80 backdrop-blur-md rounded-xl">
                                        <Maximize2 className="w-3.5 h-3.5 text-white" />
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">{design.sqft} SQFT</span>
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col flex-grow">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">{design.category}</p>
                                    <h3 className="text-2xl font-black text-neutral-900 leading-tight mb-4 group-hover:text-indigo-600 transition-colors">{design.title}</h3>

                                    <div className="space-y-3 mb-10 flex-grow">
                                        {design.includes.map((inc) => (
                                            <div key={inc} className="flex items-center gap-3 text-sm text-neutral-500 font-medium">
                                                <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center">
                                                    <Compass className="w-3 h-3 text-green-600" />
                                                </div>
                                                {inc}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-6 border-t border-neutral-50 flex items-center justify-between">
                                        <button
                                            onClick={() => handleUnlock(design.id)}
                                            className="flex items-center gap-2 font-black text-sm text-indigo-600 group-hover:gap-4 transition-all"
                                        >
                                                    Get Started
                                                    <ArrowRight className="w-4 h-4" />
                                        </button>
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-neutral-100" />
                                            ))}
                                            <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 text-[10px] flex items-center justify-center font-bold text-indigo-600">
                                                +{design.sales}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    <div className="mt-24 bg-neutral-900 rounded-[4rem] p-12 md:p-20 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-600 blur-[150px] opacity-20" />

                        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">Need something truly unique?</h2>
                            <p className="text-neutral-400 text-lg font-medium">
                                Our network of elite architects can craft a custom design package tailored exactly to your vision, site constraints, and local building codes.
                            </p>
                            <button className="bg-white text-neutral-900 font-bold py-6 px-12 rounded-[2.5rem] hover:bg-neutral-50 transition-all flex items-center gap-3 mx-auto active:scale-95 shadow-xl shadow-black/20">
                                Launch Custom Request
                                <Layers className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}
