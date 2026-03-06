'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Home,
  Layers,
  MapPin,
  FileCheck,
  BarChart3,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { brand } from '@kealee/ui';

interface EligibilityResults {
  fha: { eligible: boolean; program: string; maxLoanAmount: number; reasons: string[] };
  home: { eligible: boolean; program: string; maxSubsidyAmount: number; affordabilityPeriod: number; reasons: string[] };
  innovationFund: { eligible: boolean; program: string; maxGrantAmount: number; reasons: string[] };
  cdbg: { eligible: boolean; program: string; reasons: string[] };
  proForma: {
    returns: { noi: number; capRate: number; dscr: number; cashOnCash: number; cashFlow: number };
    assumptions: Record<string, string>;
  };
}

type Step = 'project' | 'financials' | 'results';

export default function HUDEligibilityPage() {
  const [step, setStep] = useState<Step>('project');
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<EligibilityResults | null>(null);

  // Project details
  const [housingType, setHousingType] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [affordableUnits, setAffordableUnits] = useState('');
  const [amiTarget, setAmiTarget] = useState('80');
  const [state, setState] = useState('');

  // Financials
  const [totalCost, setTotalCost] = useState('');
  const [landCost, setLandCost] = useState('');
  const [avgAffordableRent, setAvgAffordableRent] = useState('');
  const [avgMarketRent, setAvgMarketRent] = useState('');

  const handleCheck = async () => {
    setIsChecking(true);
    // Simulated API call
    setTimeout(() => {
      const units = parseInt(totalUnits) || 1;
      const affUnits = parseInt(affordableUnits) || 0;
      const cost = parseInt(totalCost) || 0;
      const affPct = units > 0 ? (affUnits / units) * 100 : 0;

      setResults({
        fha: {
          eligible: units >= 2,
          program: units <= 4 ? 'FHA 203(b)' : 'FHA 221(d)(4)',
          maxLoanAmount: units <= 4 ? 809150 : units * 87897,
          reasons: units < 2 ? ['FHA multifamily requires 2+ units'] : [],
        },
        home: {
          eligible: parseInt(amiTarget) <= 80 && affPct >= 20,
          program: 'HOME Investment Partnerships',
          maxSubsidyAmount: affUnits * 40000,
          affordabilityPeriod: affPct >= 50 ? 20 : 15,
          reasons: [
            ...(parseInt(amiTarget) > 80 ? ['AMI target exceeds 80% maximum'] : []),
            ...(affPct < 20 ? [`Need 20%+ affordable units (currently ${affPct.toFixed(0)}%)`] : []),
          ],
        },
        innovationFund: {
          eligible: ['ADU', 'DUPLEX', 'TRIPLEX', 'FOURPLEX', 'TOWNHOUSE', 'SMALL_APARTMENT', 'MODULAR'].includes(housingType) && affPct >= 10,
          program: 'Housing Innovation Fund (Sec 209)',
          maxGrantAmount: Math.min(units * 25000, 500000),
          reasons: affPct < 10 ? [`Need 10%+ affordable units (currently ${affPct.toFixed(0)}%)`] : [],
        },
        cdbg: {
          eligible: parseInt(amiTarget) <= 80 && affPct >= 51,
          program: 'CDBG',
          reasons: affPct < 51 ? ['Less than 51% of units benefit LMI households'] : [],
        },
        proForma: {
          returns: {
            noi: Math.round(cost * 0.065),
            capRate: 6.5,
            dscr: 1.25,
            cashOnCash: 8.2,
            cashFlow: Math.round(cost * 0.02),
          },
          assumptions: { vacancyRate: '5%', interestRate: '6.5%', ltv: '75%' },
        },
      });
      setIsChecking(false);
      setStep('results');
    }, 2000);
  };

  const housingTypes = [
    { value: 'SINGLE_FAMILY', label: 'Single Family' },
    { value: 'ADU', label: 'ADU' },
    { value: 'DUPLEX', label: 'Duplex' },
    { value: 'TRIPLEX', label: 'Triplex' },
    { value: 'FOURPLEX', label: 'Fourplex' },
    { value: 'TOWNHOUSE', label: 'Townhouse' },
    { value: 'SMALL_APARTMENT', label: 'Small Apartment' },
    { value: 'MIXED_USE', label: 'Mixed-Use' },
    { value: 'MODULAR', label: 'Modular' },
  ];

  function EligibilityCard({ title, eligible, details, amount, reasons }: {
    title: string; eligible: boolean; details: string; amount?: string; reasons: string[];
  }) {
    return (
      <div className={`rounded-xl p-5 border-2 ${eligible ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {eligible ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-gray-400" />}
            <h3 className="font-bold text-gray-900">{title}</h3>
          </div>
          {eligible && amount && <span className="text-sm font-bold" style={{ color: brand.teal }}>{amount}</span>}
        </div>
        <p className="text-sm text-gray-600 mb-2">{details}</p>
        {reasons.length > 0 && (
          <ul className="space-y-1">
            {reasons.map((r, i) => (
              <li key={i} className="text-xs text-red-600 flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {r}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-gray-500">
            <Link href="/workforce-housing" className="hover:text-gray-900">Workforce Housing</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Eligibility Check</span>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Step 1: Project Details */}
          {step === 'project' && (
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: brand.navy }}>Project Details</h1>
              <p className="text-gray-600 mb-8">Tell us about your housing project to check program eligibility.</p>

              <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Housing Type</label>
                  <select value={housingType} onChange={e => setHousingType(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:border-teal-500">
                    <option value="">Select type...</option>
                    {housingTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Units</label>
                    <input type="number" placeholder="e.g. 12" value={totalUnits} onChange={e => setTotalUnits(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Affordable Units</label>
                    <input type="number" placeholder="e.g. 4" value={affordableUnits} onChange={e => setAffordableUnits(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">AMI Target (%)</label>
                    <input type="number" placeholder="e.g. 80" value={amiTarget} onChange={e => setAmiTarget(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input type="text" placeholder="e.g. MD" value={state} onChange={e => setState(e.target.value)} maxLength={2} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => housingType && totalUnits && setStep('financials')}
                  disabled={!housingType || !totalUnits}
                  className="px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
                  style={{ backgroundColor: brand.teal }}
                >
                  Next: Financials <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Financials */}
          {step === 'financials' && (
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: brand.navy }}>Project Financials</h1>
              <p className="text-gray-600 mb-8">Enter cost and income details for pro forma analysis.</p>

              <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Development Cost ($)</label>
                  <input type="number" placeholder="e.g. 2000000" value={totalCost} onChange={e => setTotalCost(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Land Cost ($)</label>
                  <input type="number" placeholder="e.g. 300000" value={landCost} onChange={e => setLandCost(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Avg Affordable Rent ($/mo)</label>
                    <input type="number" placeholder="e.g. 1200" value={avgAffordableRent} onChange={e => setAvgAffordableRent(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Avg Market Rent ($/mo)</label>
                    <input type="number" placeholder="e.g. 1800" value={avgMarketRent} onChange={e => setAvgMarketRent(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button onClick={() => setStep('project')} className="px-6 py-3 rounded-xl font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition">Back</button>
                <button
                  onClick={handleCheck}
                  disabled={!totalCost || isChecking}
                  className="px-8 py-3 rounded-xl font-semibold text-white flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
                  style={{ backgroundColor: brand.teal }}
                >
                  {isChecking ? <><Loader2 className="w-5 h-5 animate-spin" /> Checking...</> : <>Check Eligibility <FileCheck className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 'results' && results && (
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: brand.navy }}>Eligibility Results</h1>
              <p className="text-gray-600 mb-8">
                {housingTypes.find(t => t.value === housingType)?.label} · {totalUnits} units · {affordableUnits} affordable · {amiTarget}% AMI
              </p>

              <div className="space-y-4 mb-8">
                <EligibilityCard
                  title={results.fha.program}
                  eligible={results.fha.eligible}
                  details={`Max loan: $${results.fha.maxLoanAmount.toLocaleString()}`}
                  amount={results.fha.eligible ? `$${results.fha.maxLoanAmount.toLocaleString()}` : undefined}
                  reasons={results.fha.reasons}
                />
                <EligibilityCard
                  title={results.home.program}
                  eligible={results.home.eligible}
                  details={`Max subsidy: $${results.home.maxSubsidyAmount.toLocaleString()} · ${results.home.affordabilityPeriod}yr covenant`}
                  amount={results.home.eligible ? `$${results.home.maxSubsidyAmount.toLocaleString()}` : undefined}
                  reasons={results.home.reasons}
                />
                <EligibilityCard
                  title={results.innovationFund.program}
                  eligible={results.innovationFund.eligible}
                  details={`Max grant: $${results.innovationFund.maxGrantAmount.toLocaleString()} from $200M annual fund`}
                  amount={results.innovationFund.eligible ? `$${results.innovationFund.maxGrantAmount.toLocaleString()}` : undefined}
                  reasons={results.innovationFund.reasons}
                />
                <EligibilityCard
                  title={results.cdbg.program}
                  eligible={results.cdbg.eligible}
                  details="Community Development Block Grant — new construction eligible"
                  reasons={results.cdbg.reasons}
                />
              </div>

              {/* Pro Forma Summary */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
                <h2 className="font-bold text-lg mb-4" style={{ color: brand.navy }}>Pro Forma Summary</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'NOI', value: `$${results.proForma.returns.noi.toLocaleString()}` },
                    { label: 'Cap Rate', value: `${results.proForma.returns.capRate}%` },
                    { label: 'DSCR', value: `${results.proForma.returns.dscr}x` },
                    { label: 'Cash-on-Cash', value: `${results.proForma.returns.cashOnCash}%` },
                  ].map(m => (
                    <div key={m.label} className="text-center p-3 rounded-lg bg-gray-50">
                      <div className="text-xl font-bold" style={{ color: brand.navy }}>{m.value}</div>
                      <div className="text-xs text-gray-500">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => { setStep('project'); setResults(null); }} className="flex-1 py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
                  New Check
                </button>
                <Link href="/workforce-housing" className="flex-1 py-3 rounded-xl font-semibold text-white text-center hover:opacity-90 transition" style={{ backgroundColor: brand.teal }}>
                  Browse Programs
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
