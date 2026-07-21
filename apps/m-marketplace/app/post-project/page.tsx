'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase,
    MapPin,
    DollarSign,
    Clock,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Construction,
    Paintbrush,
    Zap,
    Droplets,
    Hammer
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const STEPS = [
    { id: 'details', title: 'Project Details', icon: Briefcase },
    { id: 'scope', title: 'Scope of Work', icon: Construction },
    { id: 'budget', title: 'Budget & Timeline', icon: DollarSign },
    { id: 'review', title: 'Review', icon: CheckCircle2 },
];

const CATEGORIES = [
    { id: 'renovation', name: 'General Renovation', icon: Hammer },
    { id: 'interior', name: 'Interior Design', icon: Paintbrush },
    { id: 'electrical', name: 'Electrical Work', icon: Zap },
    { id: 'plumbing', name: 'Plumbing', icon: Droplets },
    { id: 'construction', name: 'New Construction', icon: Construction },
];

export default function PostProjectPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        location: '',
        city: '',
        state: '',
        budget: '',
        timeline: '',
        servicesNeeded: [] as string[],
    });

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCategorySelect = (categoryId: string) => {
        setFormData((prev) => ({ ...prev, category: categoryId }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsSubmitting(false);
        setIsComplete(true);
    };

    if (isComplete) {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col">
                <Header />
                <main className="flex-grow flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-neutral-100"
                    >
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Project Posted!</h1>
                        <p className="text-neutral-600 mb-8">
                            Your project "{formData.title}" has been successfully posted. We're matching you with the best pros right now.
                        </p>
                        <div className="space-y-4">
                            <button className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                                View Your Dashboard
                            </button>
                            <button className="w-full bg-white text-neutral-600 font-semibold py-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-all">
                                Post Another Project
                            </button>
                        </div>
                    </motion.div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
            <Header />

            <main className="flex-grow pt-12 pb-24 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Progress Header */}
                    <div className="mb-12">
                        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Post Your Project</h1>
                        <p className="text-neutral-600">Connect with qualified professionals in minutes.</p>

                        <div className="mt-8 flex items-center justify-between relative">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-neutral-200 -translate-y-1/2 z-0" />
                            <div
                                className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500"
                                style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                            />

                            {STEPS.map((step, idx) => {
                                const Icon = step.icon;
                                const isActive = idx <= currentStep;
                                const isCurrent = idx === currentStep;

                                return (
                                    <div key={idx} className="relative z-10 flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-lg' :
                                                isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-neutral-400 border border-neutral-200'
                                            }`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className={`absolute top-12 whitespace-nowrap text-sm font-medium ${isCurrent ? 'text-indigo-600' : 'text-neutral-500'
                                            }`}>
                                            {step.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-neutral-200/50 border border-neutral-100 p-8 md:p-12 overflow-hidden min-h-[500px] flex flex-col">
                        <AnimatePresence mode="wait">
                            {currentStep === 0 && (
                                <motion.div
                                    key="step0"
                                    initial={{ x: 50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -50, opacity: 0 }}
                                    className="space-y-8 flex-grow"
                                >
                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-900 mb-3">Project Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Modern Kitchen Remodel in Bethesda"
                                            className="w-full px-5 py-4 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all placeholder:text-neutral-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-900 mb-4">Project Category</label>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            {CATEGORIES.map((cat) => {
                                                const Icon = cat.icon;
                                                const isSelected = formData.category === cat.id;
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => handleCategorySelect(cat.id)}
                                                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all group ${isSelected ? 'border-indigo-600 bg-indigo-50/50' : 'border-neutral-100 hover:border-neutral-200 bg-neutral-50/30'
                                                            }`}
                                                    >
                                                        <Icon className={`w-8 h-8 mb-3 transition-colors ${isSelected ? 'text-indigo-600' : 'text-neutral-400 group-hover:text-neutral-600'}`} />
                                                        <span className={`text-xs font-bold text-center ${isSelected ? 'text-indigo-700' : 'text-neutral-500'}`}>{cat.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-900 mb-3">City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                placeholder="Bethesda"
                                                className="w-full px-5 py-4 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-900 mb-3">State</label>
                                            <select
                                                name="state"
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                className="w-full px-5 py-4 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all bg-white appearance-none"
                                            >
                                                <option value="">Select State</option>
                                                <option value="MD">Maryland</option>
                                                <option value="VA">Virginia</option>
                                                <option value="DC">District of Columbia</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ x: 50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -50, opacity: 0 }}
                                    className="space-y-8 flex-grow"
                                >
                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-900 mb-3">Describe your project goals</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={6}
                                            placeholder="Tell us what you want to achieve, any specific requirements, or materials you have in mind..."
                                            className="w-full px-5 py-4 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all placeholder:text-neutral-400 resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-900 mb-3">Full Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5 transition-colors group-focus-within:text-indigo-600" />
                                            <input
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                                placeholder="123 Main St, Unit 4..."
                                                className="w-full pl-14 pr-5 py-4 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ x: 50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -50, opacity: 0 }}
                                    className="space-y-8 flex-grow"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-900 mb-3">Estimated Budget</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                                <select
                                                    name="budget"
                                                    value={formData.budget}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-14 pr-5 py-4 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all bg-white appearance-none"
                                                >
                                                    <option value="">Select Range</option>
                                                    <option value="5000">Under $5k</option>
                                                    <option value="25000">$5k - $25k</option>
                                                    <option value="50000">$25k - $50k</option>
                                                    <option value="100000">$50k - $100k</option>
                                                    <option value="250000">$100k - $250k</option>
                                                    <option value="500000">$250k+</option>
                                                </select>
                                            </div>
                                            <p className="mt-2 text-xs text-neutral-500 italic">This helps us match you with contractors in your price range.</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-900 mb-3">Target Completion</label>
                                            <div className="relative">
                                                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                                <select
                                                    name="timeline"
                                                    value={formData.timeline}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-14 pr-5 py-4 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all bg-white appearance-none"
                                                >
                                                    <option value="">Desired Timeline</option>
                                                    <option value="asap">As soon as possible</option>
                                                    <option value="1month">Within 1 month</option>
                                                    <option value="3months">1 - 3 months</option>
                                                    <option value="flexible">Flexible</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                                        <div className="flex gap-4">
                                            <div className="p-2 bg-indigo-600 rounded-lg shrink-0 h-fit">
                                                <Zap className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-indigo-900 text-sm mb-1">Kealee Smart Matching</h4>
                                                <p className="text-indigo-700/80 text-xs leading-relaxed">
                                                    By providing accurate budget and timeline info, our matching engine can route your project to professionals with proven track records for this scale and urgency.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ x: 50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -50, opacity: 0 }}
                                    className="space-y-6 flex-grow"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100">
                                            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Project Overview</h4>
                                            <p className="font-bold text-neutral-900 text-lg mb-1">{formData.title || 'Untitled Project'}</p>
                                            <p className="text-neutral-600 text-sm flex items-center gap-2">
                                                <span className="capitalize">{formData.category || 'No category'}</span>
                                                <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                                                {formData.city}, {formData.state}
                                            </p>
                                        </div>
                                        <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100">
                                            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Budget & Timeline</h4>
                                            <div className="flex justify-between items-center">
                                                <p className="font-bold text-indigo-600 tracking-tight text-lg">${Number(formData.budget).toLocaleString()}</p>
                                                <p className="text-neutral-600 text-sm font-medium capitalize">{formData.timeline.replace(/(\d+)/, '$1 ')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100">
                                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Description</h4>
                                        <p className="text-neutral-700 text-sm leading-relaxed italic line-clamp-4">
                                            {formData.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    <p className="text-xs text-neutral-500 text-center px-4">
                                        By submitting, you agree to our Terms of Service and Privacy Policy. Your information will be shared with the qualified professionals matched to your project.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="mt-12 flex items-center justify-between gap-4 pt-8 border-t border-neutral-100">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 0 || isSubmitting}
                                className={`flex items-center gap-2 font-bold py-4 px-8 rounded-xl transition-all ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-neutral-500 hover:bg-neutral-100'
                                    }`}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>

                            {currentStep < STEPS.length - 1 ? (
                                <button
                                    onClick={nextStep}
                                    disabled={!formData.title && currentStep === 0}
                                    className="bg-indigo-600 text-white font-bold py-4 px-10 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    Continue
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="bg-green-600 text-white font-bold py-4 px-12 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center gap-2 active:scale-95 disabled:opacity-50 overflow-hidden relative"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Posting...
                                        </div>
                                    ) : (
                                        <>
                                            Confirm & Post
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
