'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  HardHat,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Clock,
  Users,
  CheckCircle2,
  ChevronDown,
  BarChart3,
  Layers,
  Wrench,
  MapPin,
  Sparkles,
  MessageSquare,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { sectionImages } from '@kealee/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectType {
  id: string;
  label: string;
}

interface AssemblyLineItem {
  assembly: string;
  quantity: number;
  unit: string;
  materialCost: number;
  laborCost: number;
  totalCost: number;
}

interface Assumption {
  text: string;
  impact: 'low' | 'medium' | 'high';
}

interface ClarifyingQuestion {
  id: string;
  question: string;
  type: 'text' | 'select';
  options?: string[];
}

interface EstimateResult {
  summary: string;
  lowEstimate: number;
  midEstimate: number;
  highEstimate: number;
  confidence: number;
  assemblies: AssemblyLineItem[];
  assumptions: Assumption[];
  clarifyingQuestions: ClarifyingQuestion[];
  estimatedDuration: string;
  tradesRequired: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUALITY_TIERS = ['Budget', 'Standard', 'Premium'] as const;
type QualityTier = (typeof QUALITY_TIERS)[number];

const PROCESSING_STEPS = [
  'Analyzing your project scope...',
  'Mapping to our assembly library...',
  'Calculating material and labor costs...',
  'Generating your estimate...',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDollars(value: number): string {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function confidenceColor(confidence: number): string {
  if (confidence >= 80) return 'bg-green-500';
  if (confidence >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

function impactBadge(impact: 'low' | 'medium' | 'high') {
  const map: Record<string, string> = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };
  return map[impact] ?? 'bg-gray-100 text-gray-700';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SmartEstimatePage() {
  // ---- Form state ----
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [location, setLocation] = useState('Baltimore');
  const [qualityTier, setQualityTier] = useState<QualityTier>('Standard');

  // ---- Project types from API ----
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [projectTypesLoading, setProjectTypesLoading] = useState(true);

  // ---- Flow state ----
  const [step, setStep] = useState<'form' | 'processing' | 'results'>('form');
  const [processingIndex, setProcessingIndex] = useState(0);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ---- Clarifying question answers ----
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const resultsTopRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------------------------------
  // Fetch project types on mount
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/v1/scope-analysis/project-types');
        if (!res.ok) throw new Error('Failed to load project types');
        const data = await res.json();
        if (!cancelled) {
          // Expect an array of { id, label } or plain strings
          const types: ProjectType[] = Array.isArray(data)
            ? data.map((d: string | ProjectType) =>
                typeof d === 'string' ? { id: d, label: d.replace(/_/g, ' ') } : d,
              )
            : [];
          setProjectTypes(types);
        }
      } catch {
        // Fallback project types if API is unavailable
        if (!cancelled) {
          setProjectTypes([
            { id: 'kitchen_renovation', label: 'Kitchen Renovation' },
            { id: 'bathroom_remodel', label: 'Bathroom Remodel' },
            { id: 'basement_finishing', label: 'Basement Finishing' },
            { id: 'room_addition', label: 'Room Addition' },
            { id: 'whole_house_renovation', label: 'Whole House Renovation' },
            { id: 'deck_patio', label: 'Deck / Patio' },
            { id: 'roof_replacement', label: 'Roof Replacement' },
            { id: 'siding_exterior', label: 'Siding / Exterior' },
            { id: 'new_construction', label: 'New Construction' },
            { id: 'commercial_buildout', label: 'Commercial Build-Out' },
          ]);
        }
      } finally {
        if (!cancelled) setProjectTypesLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ------------------------------------------------------------------
  // Processing animation — cycle through steps
  // ------------------------------------------------------------------
  useEffect(() => {
    if (step !== 'processing') return;
    if (processingIndex >= PROCESSING_STEPS.length) return;

    const timer = setTimeout(() => {
      setProcessingIndex((i) => i + 1);
    }, 1800);

    return () => clearTimeout(timer);
  }, [step, processingIndex]);

  // ------------------------------------------------------------------
  // Submit the estimate request
  // ------------------------------------------------------------------
  const handleSubmit = useCallback(async () => {
    if (!description.trim()) return;

    setError(null);
    setStep('processing');
    setProcessingIndex(0);
    setResult(null);
    setAnswers({});

    try {
      const body: Record<string, unknown> = {
        description: description.trim(),
        location: location.trim() || 'Baltimore',
        qualityTier: qualityTier.toLowerCase(),
      };
      if (projectType) body.projectType = projectType;
      if (squareFootage) body.squareFootage = Number(squareFootage);

      const res = await fetch('/api/v1/scope-analysis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.message ?? `Request failed (${res.status})`);
      }

      const data: EstimateResult = await res.json();
      setResult(data);
      setStep('results');

      // Scroll to results
      setTimeout(() => resultsTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
      setStep('form');
    }
  }, [description, projectType, squareFootage, location, qualityTier]);

  // ------------------------------------------------------------------
  // Reset
  // ------------------------------------------------------------------
  const handleStartOver = () => {
    setStep('form');
    setResult(null);
    setError(null);
    setAnswers({});
    setProcessingIndex(0);
  };

  // ------------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------------

  const allQuestionsAnswered =
    result?.clarifyingQuestions &&
    result.clarifyingQuestions.length > 0 &&
    result.clarifyingQuestions.every((q) => answers[q.id]?.trim());

  // ====================================================================
  // STEP 1 — FORM
  // ====================================================================
  const renderForm = () => (
    <div className="max-w-3xl mx-auto">
      {/* Hero text */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          AI-Powered Construction Estimates
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Get a Smart Estimate in Seconds
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Describe your project in plain English and our AI will generate a detailed cost
          breakdown using real assembly data.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Estimate failed</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 md:p-8 space-y-6">
        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
            Describe Your Project <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us about your project. For example: 'I want to renovate my 150 sqft kitchen with granite countertops, new cabinets, and stainless steel appliances...'"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition resize-none placeholder:text-gray-400 text-gray-800"
          />
          <p className="text-xs text-gray-400 mt-1">
            Be as detailed as you like — the more info, the better the estimate.
          </p>
        </div>

        {/* Optional fields grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Project type */}
          <div>
            <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-1.5">
              Project Type <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <div className="relative">
              <select
                id="projectType"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                disabled={projectTypesLoading}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white appearance-none pr-10 text-gray-800 disabled:opacity-50"
              >
                <option value="">
                  {projectTypesLoading ? 'Loading types...' : 'Select a project type'}
                </option>
                {projectTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Square footage */}
          <div>
            <label htmlFor="sqft" className="block text-sm font-medium text-gray-700 mb-1.5">
              Square Footage <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              id="sqft"
              type="number"
              min={0}
              value={squareFootage}
              onChange={(e) => setSquareFootage(e.target.value)}
              placeholder="e.g. 150"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-gray-800 placeholder:text-gray-400"
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
              Location <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Baltimore"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-gray-800 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Quality tier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Quality Tier <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <div className="flex gap-2">
              {QUALITY_TIERS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setQualityTier(tier)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition border ${
                    qualityTier === tier
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!description.trim()}
          className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-6 py-3.5 font-medium transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
        >
          <Sparkles className="w-5 h-5" />
          Get My Estimate
        </button>
      </div>

      {/* Trust strip */}
      <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          No sign-up required
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          Free instant estimate
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          Real assembly pricing
        </span>
      </div>
    </div>
  );

  // ====================================================================
  // STEP 2 — PROCESSING
  // ====================================================================
  const renderProcessing = () => (
    <div className="max-w-lg mx-auto text-center py-20">
      {/* Pulsing icon */}
      <div className="relative mx-auto w-24 h-24 mb-10">
        <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center shadow-lg">
            <HardHat className="w-10 h-10 text-blue-600 animate-pulse" />
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-8">Building Your Estimate</h2>

      <div className="space-y-4 text-left max-w-sm mx-auto">
        {PROCESSING_STEPS.map((label, idx) => {
          const isDone = idx < processingIndex;
          const isCurrent = idx === processingIndex;
          return (
            <div key={idx} className="flex items-center gap-3">
              {isDone ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  isDone
                    ? 'text-gray-500 line-through'
                    : isCurrent
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ====================================================================
  // STEP 3 — RESULTS
  // ====================================================================
  const renderResults = () => {
    if (!result) return null;

    return (
      <div className="max-w-5xl mx-auto space-y-8" ref={resultsTopRef}>
        {/* Back / Start over */}
        <button
          onClick={handleStartOver}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Start a new estimate
        </button>

        {/* ---- Summary Card ---- */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI Estimate Summary</h2>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">{result.summary}</p>
            </div>
          </div>
        </div>

        {/* ---- Price Range ---- */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
            Estimated Cost Range
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            {/* Low */}
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Low</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-700">
                {formatDollars(result.lowEstimate)}
              </p>
            </div>
            {/* Mid (highlighted) */}
            <div className="rounded-xl bg-blue-50 border-2 border-blue-200 p-5 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                Best Estimate
              </div>
              <p className="text-xs font-semibold text-blue-500 uppercase mb-1">Mid</p>
              <p className="text-3xl md:text-4xl font-bold text-blue-600">
                {formatDollars(result.midEstimate)}
              </p>
            </div>
            {/* High */}
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">High</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-700">
                {formatDollars(result.highEstimate)}
              </p>
            </div>
          </div>

          {/* Confidence meter */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                Confidence
              </span>
              <span className="text-sm font-bold text-gray-900">{result.confidence}%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${confidenceColor(result.confidence)}`}
                style={{ width: `${result.confidence}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {result.confidence >= 80
                ? 'High confidence based on detailed scope'
                : result.confidence >= 60
                ? 'Moderate confidence — answering the questions below will improve accuracy'
                : 'Low confidence — more details are needed for a reliable estimate'}
            </p>
          </div>
        </div>

        {/* ---- Duration & Trades ---- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Estimated Duration
              </h4>
              <p className="text-lg font-bold text-gray-900">{result.estimatedDuration}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Trades Required
              </h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {result.tradesRequired.map((trade) => (
                  <span
                    key={trade}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg"
                  >
                    <Wrench className="w-3 h-3" />
                    {trade}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ---- Assembly Breakdown Table ---- */}
        {result.assemblies.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-bold text-gray-900">Assembly Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Assembly</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3 text-right">Material</th>
                    <th className="px-4 py-3 text-right">Labor</th>
                    <th className="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.assemblies.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`border-t border-gray-50 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-3 font-medium text-gray-900">{item.assembly}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {item.quantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatDollars(item.materialCost)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatDollars(item.laborCost)}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-gray-900">
                        {formatDollars(item.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-6 py-3 font-bold text-gray-900" colSpan={3}>
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {formatDollars(
                        result.assemblies.reduce((sum, a) => sum + a.materialCost, 0),
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {formatDollars(
                        result.assemblies.reduce((sum, a) => sum + a.laborCost, 0),
                      )}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-blue-600 text-base">
                      {formatDollars(
                        result.assemblies.reduce((sum, a) => sum + a.totalCost, 0),
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ---- Assumptions ---- */}
        {result.assumptions.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-400" />
              Assumptions Made
            </h3>
            <ul className="space-y-3">
              {result.assumptions.map((a, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${impactBadge(a.impact)}`}
                  >
                    {a.impact}
                  </span>
                  <span className="text-sm text-gray-700">{a.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ---- Clarifying Questions ---- */}
        {result.clarifyingQuestions.length > 0 && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Help Us Improve Your Estimate
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Answering these questions will increase the accuracy of your estimate.
            </p>

            <div className="space-y-5">
              {result.clarifyingQuestions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-gray-200 bg-white p-4"
                >
                  <label
                    htmlFor={`q-${q.id}`}
                    className="block text-sm font-medium text-gray-800 mb-2"
                  >
                    {q.question}
                  </label>
                  {q.type === 'select' && q.options ? (
                    <div className="relative">
                      <select
                        id={`q-${q.id}`}
                        value={answers[q.id] ?? ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white appearance-none pr-10 text-gray-800"
                      >
                        <option value="">Select an option</option>
                        {q.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  ) : (
                    <input
                      id={`q-${q.id}`}
                      type="text"
                      value={answers[q.id] ?? ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="Type your answer..."
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-gray-800 placeholder:text-gray-400"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Refine CTA — requires auth so we show sign-up CTA instead */}
            {allQuestionsAnswered && (
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-100/60 p-5 text-center">
                <p className="text-sm text-blue-800 font-medium mb-3">
                  Sign up for a free Kealee account to refine your estimate with these answers.
                </p>
                <a
                  href="https://app.kealee.com/signup"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-6 py-3 font-medium transition text-sm"
                >
                  Sign Up to Refine Your Estimate
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* ---- Main CTA ---- */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 md:p-10 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-3">Ready to Get Started?</h3>
          <p className="text-blue-100 mb-6 max-w-lg mx-auto">
            Create your project on Kealee to get matched with vetted contractors, manage bids, and
            track your project from start to finish.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://app.kealee.com/signup"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 rounded-xl px-8 py-3.5 font-semibold transition text-base"
            >
              Create Your Project on Kealee
              <ArrowRight className="w-5 h-5" />
            </a>
            <button
              onClick={handleStartOver}
              className="inline-flex items-center justify-center gap-2 bg-blue-500/30 text-white hover:bg-blue-500/50 rounded-xl px-6 py-3.5 font-medium transition text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              New Estimate
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ====================================================================
  // MAIN RENDER
  // ====================================================================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Hero Banner */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <Image
          src={sectionImages.tapeMeasure.src}
          alt={sectionImages.tapeMeasure.alt}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative text-center px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Smart Estimate
          </h1>
          <p className="text-lg text-white/85 max-w-xl mx-auto">
            AI-powered construction cost estimates using real assembly data.
          </p>
        </div>
      </section>

      <main className="flex-grow pb-20 pt-8 px-4 md:px-6">
        {step === 'form' && renderForm()}
        {step === 'processing' && renderProcessing()}
        {step === 'results' && renderResults()}
      </main>

      <Footer />
    </div>
  );
}
