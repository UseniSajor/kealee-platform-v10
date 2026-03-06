'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCheck,
  Clock,
  DollarSign,
  Building2,
  Ruler,
  Users,
  Download,
  ChevronDown,
  ChevronUp,
  Shield,
  TreePine,
} from 'lucide-react';

const brand = {
  navy: '#1A2B4A',
  teal: '#0D9488',
  orange: '#C8882A',
  green: '#059669',
};

interface ZoningReport {
  id: string;
  address: string;
  zoningDistrict: string;
  districtType: string;
  complianceScore: number;
  maxHeight: number;
  maxStories: number;
  maxFAR: number;
  maxLotCoverage: number;
  maxDensity: number;
  frontSetback: number;
  sideSetback: number;
  rearSetback: number;
  parkingRequired: number;
  nepaExemption: string;
  violations: Array<{ rule: string; status: 'violation' | 'warning' | 'pass'; detail: string }>;
  permits: Array<{ name: string; fee: number; timeline: string; required: boolean }>;
  densityBonus: { eligible: boolean; bonusPercent: number; reason: string } | null;
}

// Mock data for display
const mockReport: ZoningReport = {
  id: 'demo',
  address: '1234 Main Street, Bethesda, MD 20814',
  zoningDistrict: 'R-60',
  districtType: 'R2_TWO_FAMILY',
  complianceScore: 78,
  maxHeight: 35,
  maxStories: 3,
  maxFAR: 0.75,
  maxLotCoverage: 35,
  maxDensity: 12,
  frontSetback: 25,
  sideSetback: 8,
  rearSetback: 20,
  parkingRequired: 2,
  nepaExemption: 'INFILL_DEVELOPMENT',
  violations: [
    { rule: 'Front Setback', status: 'pass', detail: 'Proposed 30ft meets minimum 25ft' },
    { rule: 'Side Setback', status: 'pass', detail: 'Proposed 10ft meets minimum 8ft' },
    { rule: 'Building Height', status: 'warning', detail: 'Proposed 34ft is within 1ft of 35ft max' },
    { rule: 'Lot Coverage', status: 'violation', detail: 'Proposed 38% exceeds 35% maximum' },
    { rule: 'Parking Spaces', status: 'pass', detail: '4 spaces provided, 2 required' },
    { rule: 'FAR', status: 'pass', detail: 'Proposed 0.65 within 0.75 limit' },
  ],
  permits: [
    { name: 'Building Permit', fee: 2500, timeline: '4-6 weeks', required: true },
    { name: 'Grading Permit', fee: 800, timeline: '2-3 weeks', required: true },
    { name: 'Stormwater Management', fee: 1200, timeline: '3-4 weeks', required: true },
    { name: 'Sediment Control', fee: 500, timeline: '2 weeks', required: true },
    { name: 'Tree Conservation', fee: 350, timeline: '2 weeks', required: false },
  ],
  densityBonus: {
    eligible: true,
    bonusPercent: 15,
    reason: '10% affordable units qualifies for Sec 209 density bonus of 15%',
  },
};

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? brand.green : score >= 60 ? brand.orange : '#DC2626';
  const label = score >= 80 ? 'Compliant' : score >= 60 ? 'Needs Review' : 'Non-Compliant';
  return (
    <div className="text-center">
      <div className="relative w-32 h-32 mx-auto mb-3">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#E5E7EB" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10" strokeDasharray={`${(score / 100) * 314} 314`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

export default function ZoningReportPage({ params }: { params: { id: string } }) {
  const [report] = useState<ZoningReport>(mockReport);
  const [expandedPermits, setExpandedPermits] = useState(true);

  const totalFees = report.permits.filter(p => p.required).reduce((sum, p) => sum + p.fee, 0);
  const violationCount = report.violations.filter(v => v.status === 'violation').length;
  const warningCount = report.violations.filter(v => v.status === 'warning').length;
  const passCount = report.violations.filter(v => v.status === 'pass').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/zoning" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Back to Zoning
          </Link>
          <button className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-2">
            <MapPin className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: brand.teal }} />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: brand.navy }}>{report.address}</h1>
              <p className="text-gray-500">Zoning District: <span className="font-semibold text-gray-900">{report.zoningDistrict}</span> ({report.districtType.replace(/_/g, ' ')})</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Score + Violations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score + Summary */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-start gap-8">
                <ScoreGauge score={report.complianceScore} />
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-4" style={{ color: brand.navy }}>Compliance Summary</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-green-50">
                      <div className="text-2xl font-bold text-green-700">{passCount}</div>
                      <div className="text-xs text-green-600">Passing</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-amber-50">
                      <div className="text-2xl font-bold text-amber-700">{warningCount}</div>
                      <div className="text-xs text-amber-600">Warnings</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-50">
                      <div className="text-2xl font-bold text-red-700">{violationCount}</div>
                      <div className="text-xs text-red-600">Violations</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Violation Details */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-bold mb-4" style={{ color: brand.navy }}>Compliance Details</h2>
              <div className="space-y-3">
                {report.violations.map((v) => (
                  <div key={v.rule} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    {v.status === 'pass' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                    {v.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />}
                    {v.status === 'violation' && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900">{v.rule}</h4>
                      <p className="text-xs text-gray-600">{v.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* NEPA Assessment */}
            {report.nepaExemption !== 'NONE' && (
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-start gap-3">
                  <TreePine className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-green-900">NEPA Exemption: Eligible</h3>
                    <p className="text-sm text-green-700 mt-1">
                      This project qualifies for a <strong>{report.nepaExemption.replace(/_/g, ' ').toLowerCase()}</strong> categorical exclusion under the 21st Century Housing Act.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Density Bonus */}
            {report.densityBonus?.eligible && (
              <div className="bg-teal-50 rounded-xl p-6 border border-teal-200">
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-teal-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-teal-900">Density Bonus: +{report.densityBonus.bonusPercent}%</h3>
                    <p className="text-sm text-teal-700 mt-1">{report.densityBonus.reason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Dimensional Standards + Permits */}
          <div className="space-y-6">
            {/* Dimensional Standards */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Ruler className="w-5 h-5" style={{ color: brand.teal }} /> Zoning Standards
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Max Height', value: `${report.maxHeight} ft` },
                  { label: 'Max Stories', value: String(report.maxStories) },
                  { label: 'Max FAR', value: String(report.maxFAR) },
                  { label: 'Lot Coverage', value: `${report.maxLotCoverage}%` },
                  { label: 'Max Density', value: `${report.maxDensity} units/acre` },
                  { label: 'Front Setback', value: `${report.frontSetback} ft` },
                  { label: 'Side Setback', value: `${report.sideSetback} ft` },
                  { label: 'Rear Setback', value: `${report.rearSetback} ft` },
                  { label: 'Parking Required', value: `${report.parkingRequired} spaces/unit` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Permit Checklist */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <button
                onClick={() => setExpandedPermits(!expandedPermits)}
                className="w-full flex items-center justify-between mb-4"
              >
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5" style={{ color: brand.green }} /> Permit Checklist
                </h3>
                {expandedPermits ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              {expandedPermits && (
                <div className="space-y-3">
                  {report.permits.map(p => (
                    <div key={p.name} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${p.required ? 'text-green-600' : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-sm text-gray-900">{p.name}</h4>
                          <span className="text-sm font-medium text-gray-900">${p.fee.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{p.timeline}</span>
                          {!p.required && <span className="text-xs text-gray-400 ml-1">(if applicable)</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-200 flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Estimated Total Fees</span>
                    <span className="text-lg font-bold" style={{ color: brand.navy }}>${totalFees.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/permits/new"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: brand.green }}
              >
                <FileCheck className="w-5 h-5" /> Start Permit Application
              </Link>
              <Link
                href="/zoning/analyze"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Run Another Analysis
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
