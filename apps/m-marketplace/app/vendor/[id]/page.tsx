'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
    X,
    Send,
    Loader2,
    AlertCircle,
    Building2,
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getContractor, createConversation, sendMessage, getConversation, type Conversation, type Message } from '@/lib/api';

interface VendorProfile {
    id: string;
    businessName: string;
    description: string;
    rating: number;
    reviewCount: number;
    projectsCompleted: number;
    verified: boolean;
    specialties: string[];
    availableCapacity: string;
    performanceScore: number | null;
    memberSince: string;
    portfolio: { id: string; title: string; category: string; image: string | null }[];
    user?: { name: string; email: string; phone: string; avatar: string | null };
}

/** Map API contractor detail to the vendor shape */
function mapApiToVendor(raw: any): VendorProfile {
    return {
        id: raw.id || '',
        businessName: raw.businessName || 'Unknown Business',
        description: raw.description || '',
        rating: typeof raw.rating === 'number' ? raw.rating : 0,
        reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : 0,
        projectsCompleted: typeof raw.projectsCompleted === 'number' ? raw.projectsCompleted : 0,
        verified: !!raw.verified,
        specialties: Array.isArray(raw.specialties) ? raw.specialties : [],
        availableCapacity: raw.availableCapacity || 'Unknown',
        performanceScore: typeof raw.performanceScore === 'number' ? raw.performanceScore : null,
        memberSince: raw.lastWonAt
            ? new Date(raw.lastWonAt).getFullYear().toString()
            : raw.createdAt
                ? new Date(raw.createdAt).getFullYear().toString()
                : '',
        portfolio: Array.isArray(raw.portfolio) ? raw.portfolio.map((p: any) => ({
            id: p.id,
            title: p.projectName || p.title || 'Untitled',
            category: p.category || p.projectType || '',
            image: (p.imageUrls && p.imageUrls[0]) || null,
        })) : [],
        user: raw.user || undefined,
    };
}

export default function VendorProfilePage() {
    const params = useParams();
    const vendorId = params?.id as string;

    const [vendor, setVendor] = useState<VendorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Messaging state
    const [chatOpen, setChatOpen] = useState(false);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch vendor profile from API
    useEffect(() => {
        if (!vendorId) return;
        setLoading(true);
        setError(null);

        getContractor(vendorId)
            .then((result) => {
                if (result.success && result.data) {
                    const raw = result.data.profile || result.data;
                    setVendor(mapApiToVendor(raw));
                } else {
                    setError(result.error || 'Failed to load vendor profile');
                }
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : 'Network error');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [vendorId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleOpenChat = async () => {
        if (!vendor) return;
        setChatOpen(true);
        setChatError(null);

        if (conversation) return;

        setChatLoading(true);
        try {
            const result = await createConversation({
                type: 'DIRECT',
                participantIds: [vendor.id],
            });

            if (result.success && result.data) {
                setConversation(result.data);
                setMessages(result.data.messages || []);
            } else {
                setChatError(result.error || 'Could not start conversation');
            }
        } catch (err) {
            setChatError(err instanceof Error ? err.message : 'Network error');
        } finally {
            setChatLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !conversation) return;

        const content = messageInput.trim();
        setMessageInput('');
        setSendingMessage(true);
        setChatError(null);

        try {
            const result = await sendMessage(conversation.id, { content, type: 'TEXT' });
            if (result.success && result.data) {
                setMessages((prev) => [...prev, result.data!]);
            } else {
                setChatError(result.error || 'Failed to send message');
                setMessageInput(content);
            }
        } catch (err) {
            setChatError(err instanceof Error ? err.message : 'Network error');
            setMessageInput(content);
        } finally {
            setSendingMessage(false);
        }
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

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
                <Header />
                <main className="flex-grow flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mb-4" />
                    <p className="text-sm text-neutral-500">Loading vendor profile...</p>
                </main>
                <Footer />
            </div>
        );
    }

    // Error state
    if (error || !vendor) {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
                <Header />
                <main className="flex-grow flex flex-col items-center justify-center py-20 px-4">
                    {error ? (
                        <div className="rounded-3xl p-8 flex flex-col items-center gap-4 bg-red-50 border border-red-200 max-w-md w-full">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                            <div className="text-center">
                                <p className="text-sm text-red-700 font-bold mb-1">Unable to load vendor profile</p>
                                <p className="text-xs text-red-600">{error}</p>
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-sm font-bold text-red-600 hover:text-red-800 underline"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-neutral-700 mb-2">Vendor Not Found</h3>
                            <p className="text-neutral-500 text-sm mb-6">This vendor profile could not be found.</p>
                            <Link href="/vendors" className="text-indigo-600 font-bold text-sm hover:underline">
                                Back to Directory
                            </Link>
                        </div>
                    )}
                </main>
                <Footer />
            </div>
        );
    }

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
                                        <span className="text-4xl font-black text-indigo-600">
                                            {vendor.businessName.substring(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                    {vendor.verified && (
                                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-2xl shadow-lg border-4 border-white">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 mb-6">
                                    <h1 className="text-2xl font-bold text-neutral-900 leading-tight">{vendor.businessName}</h1>
                                    <div className="flex items-center gap-2 text-amber-500">
                                        <Star className="w-5 h-5 fill-amber-500" />
                                        <span className="font-bold">{vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}</span>
                                        <span className="text-neutral-400 text-sm font-medium">({vendor.reviewCount} reviews)</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-8">
                                    {vendor.specialties.map((s) => (
                                        <span key={s} className="bg-neutral-50 text-neutral-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-neutral-100">
                                            {s}
                                        </span>
                                    ))}
                                    {vendor.specialties.length === 0 && (
                                        <span className="text-xs text-neutral-400">No specialties listed</span>
                                    )}
                                </div>

                                <div className="space-y-4 pt-6 border-t border-neutral-50">
                                    {vendor.memberSince && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-neutral-500 text-sm font-medium">
                                                <Calendar className="w-4 h-4" />
                                                Member Since
                                            </div>
                                            <span className="font-bold text-neutral-900">{vendor.memberSince}</span>
                                        </div>
                                    )}
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
                                    <button
                                        onClick={handleOpenChat}
                                        className="w-full bg-white text-neutral-600 font-bold py-4 rounded-2xl border border-neutral-200 hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
                                    >
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
                                    <p className="text-2xl font-bold text-neutral-900">{vendor.projectsCompleted > 0 ? `${vendor.projectsCompleted}+` : '--'}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-1">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Perf. Score</p>
                                    <div className="flex items-end gap-2">
                                        {vendor.performanceScore !== null ? (
                                            <>
                                                <p className="text-2xl font-bold text-green-600">{vendor.performanceScore}%</p>
                                                <Award className="w-4 h-4 text-green-600 mb-1" />
                                            </>
                                        ) : (
                                            <p className="text-2xl font-bold text-neutral-300">--</p>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-1 col-span-2 md:col-span-1">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Current Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                                            vendor.availableCapacity === 'Available' ? 'bg-green-500' :
                                            vendor.availableCapacity === 'Limited' ? 'bg-amber-500' : 'bg-red-500'
                                        }`} />
                                        <p className="text-sm font-bold text-neutral-700">{vendor.availableCapacity}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bio Section */}
                            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8 md:p-10">
                                <h2 className="text-xl font-bold text-neutral-900 mb-4">About the Business</h2>
                                <p className="text-neutral-600 leading-relaxed font-normal">
                                    {vendor.description || 'No description available.'}
                                </p>

                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {vendor.verified && (
                                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100">
                                            <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-sm text-neutral-900">Licensed & Insured</p>
                                                <p className="text-xs text-neutral-500">Verified on Kealee</p>
                                            </div>
                                        </div>
                                    )}
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
                                    {vendor.portfolio.length > 4 && (
                                        <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                            View All
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {vendor.portfolio.length > 0 ? (
                                    <motion.div
                                        variants={container}
                                        initial="hidden"
                                        animate="show"
                                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                    >
                                        {vendor.portfolio.map((project) => (
                                            <motion.div
                                                key={project.id}
                                                variants={item}
                                                className="group cursor-pointer"
                                            >
                                                <div className="relative h-64 rounded-[2rem] overflow-hidden mb-4 shadow-sm border border-neutral-200 bg-gradient-to-br from-neutral-100 to-neutral-200">
                                                    {project.image ? (
                                                        <img
                                                            src={project.image}
                                                            alt={project.title}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Building2 className="w-12 h-12 text-neutral-300" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                                        {project.category && (
                                                            <p className="text-white text-xs font-bold uppercase tracking-widest mb-1 italic">{project.category}</p>
                                                        )}
                                                        <p className="text-white font-bold text-lg">{project.title}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <div className="text-center py-12 bg-white rounded-3xl border border-neutral-100">
                                        <Building2 className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                                        <p className="text-sm text-neutral-500">No portfolio projects yet.</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            {/* Chat Drawer */}
            {chatOpen && vendor && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setChatOpen(false)}
                    />

                    {/* Chat Panel */}
                    <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-indigo-900">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold bg-white/15">
                                    {vendor.businessName.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-sm">{vendor.businessName}</h3>
                                    <p className="text-white/60 text-xs">Direct Message</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setChatOpen(false)}
                                className="text-white/70 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-neutral-50">
                            {chatLoading && (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Loader2 className="w-6 h-6 animate-spin text-neutral-400 mb-2" />
                                    <p className="text-sm text-neutral-500">Starting conversation...</p>
                                </div>
                            )}

                            {chatError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                                    {chatError}
                                </div>
                            )}

                            {!chatLoading && messages.length === 0 && !chatError && (
                                <div className="text-center py-16">
                                    <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                                    <p className="text-sm text-neutral-500">
                                        Send your first message to {vendor.businessName}
                                    </p>
                                </div>
                            )}

                            {messages.map((msg) => {
                                const isOwnMessage = msg.senderId !== vendor.id;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                                                isOwnMessage
                                                    ? 'bg-indigo-600 text-white rounded-br-md'
                                                    : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-md'
                                            }`}
                                        >
                                            <p>{msg.content}</p>
                                            <p
                                                className={`text-xs mt-1 ${
                                                    isOwnMessage ? 'text-indigo-200' : 'text-neutral-400'
                                                }`}
                                            >
                                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-neutral-200 px-4 py-3 bg-white">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type a message..."
                                    disabled={!conversation || sendingMessage}
                                    className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-neutral-50 disabled:text-neutral-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!messageInput.trim() || !conversation || sendingMessage}
                                    className="p-2.5 rounded-xl bg-indigo-600 text-white transition-colors disabled:opacity-40 hover:bg-indigo-700"
                                >
                                    {sendingMessage ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
