'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Building2,
  DollarSign,
  FileCheck,
  Shield,
  BarChart3,
  Download,
  Check,
  AlertTriangle,
  XCircle,
  ChevronRight,
  ArrowRight,
  Leaf,
  Layers,
  Home,
  Scale,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { brand } from '@kealee/ui';

// ── Demo Package Data ────────────────────────────────────

const demoPackage = {
  id: 'demo-pkg-001',
  address: '1234 Main Street, Denver, CO 80202',
  housingType: 'Fourplex',
  totalSqft: 4800,
  units: 4,
  stories: 2,
  affordablePercent: 20,
  status: 'READY',
  createdAt: '2026-03-07',
  zoning: {
    district: 'R-3',
    districtName: 'Multi-Family Residential',
    maxHeight: '35 ft',
    maxLotCoverage: '60%',
    maxFAR: '1.5',
    frontSetback: '20 ft',
    sideSetback: '5 ft',
    rearSetback: '15 ft',
    parkingRequired: '1.5 per unit (6 total)',
    densityAllowed: '25 units/acre',
    densityBonusEligible: true,
    densityBonusPercent: 20,
    confidence: 94,
  },
  compliance: {
    score: 87,
    status: 'COMPLIANT_WITH_CONDITIONS',
    items: [
      { rule: 'Height Limit (35 ft)', proposed: '28 ft', status: 'pass' },
      { rule: 'Front Setback (20 ft)', proposed: '22 ft', status: 'pass' },
      { rule: 'Side Setback (5 ft)', proposed: '5 ft', status: 'pass' },
      { rule: 'Rear Setback (15 ft)', proposed: '18 ft', status: 'pass' },
      { rule: 'Lot Coverage (60%)', proposed: '52%', status: 'pass' },
      { rule: 'FAR (1.5)', proposed: '1.2', status: 'pass' },
      { rule: 'Parking (6 spaces)', proposed: '4 spaces', status: 'warning' },
      { rule: 'Open Space (200 SF/unit)', proposed: '180 SF/unit', status: 'warning' },
    ],
  },
  nepa: {
    exempt: true,
    type: 'INFILL_DEVELOPMENT',
    reason: 'Project qualifies as infill development on previously developed land within an existing urban area. Categorical exclusion applies under 21st Century Housing Act.',
  },
  costEstimate: {
    totalCost: 842400,
    costPerSqft: 175.50,
    breakdown: [
      { category: 'Site Work & Foundation', amount: 96000 },
      { category: 'Framing & Structure', amount: 168000 },
      { category: 'Roofing & Exterior', amount: 72000 },
      { category: 'MEP (Mechanical/Electrical/Plumbing)', amount: 144000 },
      { category: 'Interior Finishes', amount: 192000 },
      { category: 'Kitchens (4)', amount: 68000 },
      { category: 'Bathrooms (8)', amount: 56000 },
      { category: 'Soft Costs (Design, Permits, Fees)', amount: 46400 },
    ],
  },
  proForma: {
    monthlyRentPerUnit: 1900,
    grossAnnualRent: 91200,
    vacancy: 5,
    effectiveGrossIncome: 86640,
    operatingExpenses: 18240,
    noi: 68400,
    capRate: 8.12,
    totalProjectCost: 842400,
    loanAmount: 673920,
    ltv: 80,
    interestRate: 6.5,
    annualDebtService: 51120,
    cashOnCash: 10.27,
    dscr: 1.34,
    breakEvenOccupancy: 80,
  },
  permits: [
    { name: 'Building Permit', fee: '$2,400', timeline: '6-8 weeks', required: true },
    { name: 'Mechanical Permit', fee: '$800', timeline: '2-3 weeks', required: true },
    { name: 'Electrical Permit', fee: '$600', timeline: '2-3 weeks', required: true },
    { name: 'Plumbing Permit', fee: '$500', timeline: '2-3 weeks', required: true },
  ],
  grantEligibility: [
    { program: 'Housing Innovation Fund (Sec 209)', eligible: true, reason: 'Missing-middle fourplex with 20% affordable units qualifies for up to $500K' },
    { program: 'HOME Program', eligible: true, reason: '20% affordable units at 80% AMI meets HOME threshold' },
    { program: 'CDBG', eligible: false, reason: 'Requires 51%+ LMI benefit — project at 20%' },
    { program: 'LIHTC (4%/9%)', eligible: false, reason: 'Requires 5+ units — project has 4 units' },
  ],
};

const tabs = [
  { key: 'overview', label: 'Overview', icon: Layers },
  { key: 'zoning', label: 'Zoning', icon: MapPin },
  { key: 'compliance', label: 'Compliance', icon: Shield },
  { key: 'cost', label: 'Cost Estimate', icon: DollarSign },
  { key: 'proforma', label: 'Pro Forma', icon: BarChart3 },
  { key: 'permits', label: 'Permits', icon: FileCheck },
  { key: 'grants', label: 'Grants', icon: Scale },
];

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#059669' : score >= 60 ? brand.orange : '#DC2626';
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-28 h-28">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

export default function DevelopmentPackageDetailPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const pkg = demoPackage;

  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Header Bar */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Link href="/development-package" className="hover:text-gray-700">Development Package</Link>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-gray-900 font-medium">{pkg.address}</span>
                </div>
                <h1 className="text-xl font-bold" style={{ color: brand.navy }}>
                  {pkg.housingType} &middot; {pkg.totalSqft.toLocaleString()} SF &middot; {pkg.units} Units
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#059669' }}>
                  Ready
                </span>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex gap-1 overflow-x-auto py-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                      isActive ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    style={isActive ? { backgroundColor: brand.navy } : {}}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Compliance Score', value: `${pkg.compliance.score}/100`, color: '#059669' },
                  { label: 'Est. Total Cost', value: `$${(pkg.costEstimate.totalCost / 1000).toFixed(0)}K`, color: brand.navy },
                  { label: 'NOI', value: `$${pkg.proForma.noi.toLocaleString()}`, color: brand.teal },
                  { label: 'Cap Rate', value: `${pkg.proForma.capRate}%`, color: brand.orange },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4">Zoning Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">District</span>
                      <span className="font-medium">{pkg.zoning.district} — {pkg.zoning.districtName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Max Height</span>
                      <span className="font-medium">{pkg.zoning.maxHeight}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Density Bonus</span>
                      <span className="font-medium text-green-600">Eligible (+{pkg.zoning.densityBonusPercent}%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">NEPA Exempt</span>
                      <span className="font-medium text-green-600">Yes — Infill Development</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4">Grant Eligibility</h3>
                  <div className="space-y-3">
                    {pkg.grantEligibility.map((g) => (
                      <div key={g.program} className="flex items-start gap-2">
                        {g.eligible ? (
                          <Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                        )}
                        <div>
                          <p className={`text-sm font-medium ${g.eligible ? 'text-gray-900' : 'text-gray-400'}`}>
                            {g.program}
                          </p>
                          <p className="text-xs text-gray-500">{g.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Zoning Tab */}
          {activeTab === 'zoning' && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg" style={{ color: brand.navy }}>Zoning Analysis</h3>
                <span className="text-sm text-gray-500">AI Confidence: {pkg.zoning.confidence}%</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Zoning District', value: `${pkg.zoning.district} — ${pkg.zoning.districtName}` },
                  { label: 'Max Height', value: pkg.zoning.maxHeight },
                  { label: 'Max Lot Coverage', value: pkg.zoning.maxLotCoverage },
                  { label: 'Max FAR', value: pkg.zoning.maxFAR },
                  { label: 'Front Setback', value: pkg.zoning.frontSetback },
                  { label: 'Side Setback', value: pkg.zoning.sideSetback },
                  { label: 'Rear Setback', value: pkg.zoning.rearSetback },
                  { label: 'Parking Required', value: pkg.zoning.parkingRequired },
                  { label: 'Density Allowed', value: pkg.zoning.densityAllowed },
                  { label: 'Density Bonus', value: pkg.zoning.densityBonusEligible ? `+${pkg.zoning.densityBonusPercent}% (Sec 209)` : 'Not eligible' },
                ].map((item) => (
                  <div key={item.label} className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-6 mb-8">
                <ScoreGauge score={pkg.compliance.score} />
                <div>
                  <h3 className="font-bold text-lg" style={{ color: brand.navy }}>Compliance Score</h3>
                  <p className="text-sm text-gray-500">Compliant with conditions — 2 items need attention</p>
                </div>
              </div>
              <div className="space-y-3">
                {pkg.compliance.items.map((item) => (
                  <div key={item.rule} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    {item.status === 'pass' && <Check className="w-5 h-5 text-green-600 flex-shrink-0" />}
                    {item.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />}
                    {item.status === 'violation' && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{item.rule}</span>
                      <span className="text-sm text-gray-500">Proposed: {item.proposed}</span>
                    </div>
                  </div>
                ))}
              </div>
              {pkg.nepa.exempt && (
                <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
                  <Leaf className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-900">NEPA Exempt — {pkg.nepa.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-green-700 mt-1">{pkg.nepa.reason}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cost Estimate Tab */}
          {activeTab === 'cost' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-lg" style={{ color: brand.navy }}>Cost Estimate</h3>
                <p className="text-sm text-gray-500">Assembly-level estimate adjusted for Denver, CO market</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-gray-500">Category</th>
                    <th className="text-right py-3 px-6 font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {pkg.costEstimate.breakdown.map((item) => (
                    <tr key={item.category} className="border-t border-gray-100">
                      <td className="py-3 px-6 text-gray-900">{item.category}</td>
                      <td className="py-3 px-6 text-right text-gray-900 font-medium">
                        ${item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-bold">
                  <tr className="border-t-2 border-gray-200">
                    <td className="py-4 px-6" style={{ color: brand.navy }}>Total Estimated Cost</td>
                    <td className="py-4 px-6 text-right" style={{ color: brand.navy }}>
                      ${pkg.costEstimate.totalCost.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="pb-4 px-6 text-sm text-gray-500 font-normal">Cost per SF</td>
                    <td className="pb-4 px-6 text-right text-sm text-gray-500 font-normal">
                      ${pkg.costEstimate.costPerSqft.toFixed(2)}/SF
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Pro Forma Tab */}
          {activeTab === 'proforma' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'NOI', value: `$${pkg.proForma.noi.toLocaleString()}` },
                  { label: 'Cap Rate', value: `${pkg.proForma.capRate}%` },
                  { label: 'Cash-on-Cash', value: `${pkg.proForma.cashOnCash}%` },
                  { label: 'DSCR', value: `${pkg.proForma.dscr}x` },
                ].map((m) => (
                  <div key={m.label} className="bg-white rounded-xl p-5 border border-gray-200 text-center">
                    <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                    <p className="text-2xl font-bold" style={{ color: brand.navy }}>{m.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {[
                  { label: 'Monthly Rent per Unit', value: `$${pkg.proForma.monthlyRentPerUnit.toLocaleString()}` },
                  { label: 'Gross Annual Rent', value: `$${pkg.proForma.grossAnnualRent.toLocaleString()}` },
                  { label: `Vacancy (${pkg.proForma.vacancy}%)`, value: `-$${(pkg.proForma.grossAnnualRent - pkg.proForma.effectiveGrossIncome).toLocaleString()}` },
                  { label: 'Effective Gross Income', value: `$${pkg.proForma.effectiveGrossIncome.toLocaleString()}` },
                  { label: 'Operating Expenses', value: `-$${pkg.proForma.operatingExpenses.toLocaleString()}` },
                  { label: 'Net Operating Income (NOI)', value: `$${pkg.proForma.noi.toLocaleString()}`, bold: true },
                  { label: `Loan Amount (${pkg.proForma.ltv}% LTV)`, value: `$${pkg.proForma.loanAmount.toLocaleString()}` },
                  { label: `Annual Debt Service (${pkg.proForma.interestRate}%)`, value: `-$${pkg.proForma.annualDebtService.toLocaleString()}` },
                  { label: 'Break-Even Occupancy', value: `${pkg.proForma.breakEvenOccupancy}%` },
                ].map((row) => (
                  <div key={row.label} className={`p-4 flex justify-between ${(row as any).bold ? 'bg-gray-50' : ''}`}>
                    <span className={`text-sm ${(row as any).bold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{row.label}</span>
                    <span className={`text-sm ${(row as any).bold ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permits Tab */}
          {activeTab === 'permits' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-lg" style={{ color: brand.navy }}>Permit Requirements</h3>
                <p className="text-sm text-gray-500">Denver, CO — estimated fees and timelines</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-gray-500">Permit</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-500">Est. Fee</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-500">Timeline</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pkg.permits.map((p) => (
                    <tr key={p.name} className="border-t border-gray-100">
                      <td className="py-3 px-6 font-medium text-gray-900">{p.name}</td>
                      <td className="py-3 px-6 text-gray-600">{p.fee}</td>
                      <td className="py-3 px-6 text-gray-600">{p.timeline}</td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          Required
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-sm text-gray-500">Total estimated permit fees</span>
                <span className="text-lg font-bold" style={{ color: brand.navy }}>$4,300</span>
              </div>
            </div>
          )}

          {/* Grants Tab */}
          {activeTab === 'grants' && (
            <div className="space-y-4">
              {pkg.grantEligibility.map((g) => (
                <div
                  key={g.program}
                  className={`bg-white rounded-xl p-6 border ${
                    g.eligible ? 'border-green-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {g.eligible ? (
                      <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h3 className={`font-bold text-lg ${g.eligible ? 'text-gray-900' : 'text-gray-400'}`}>
                        {g.program}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{g.reason}</p>
                      {g.eligible && (
                        <Link
                          href="/finance/hud/eligibility"
                          className="inline-flex items-center gap-1 text-sm font-medium mt-3 hover:underline"
                          style={{ color: brand.teal }}
                        >
                          Check Full Eligibility <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
