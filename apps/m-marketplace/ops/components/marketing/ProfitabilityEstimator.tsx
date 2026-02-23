"use client";

import { useState } from "react";

interface EstimatorInputs {
  contractValue: number;
  laborCostPercent: number;
  materialCostPercent: number;
  overheadPercent: number;
  designPackageTier: "basic" | "standard" | "premium";
}

interface ProfitabilityResults {
  // Project Owner Costs
  designPackageFee: number;
  totalProjectCost: number;

  // Contractor Analysis
  contractorGrossRevenue: number;
  platformCommission: number;
  contractorNetRevenue: number;
  laborCost: number;
  materialCost: number;
  overhead: number;
  contractorProfit: number;
  contractorMargin: number;

  // Platform Revenue
  platformDesignFee: number;
  platformCommissionFee: number;
  totalPlatformRevenue: number;

  // Profitability Assessment
  isContractorProfitable: boolean;
  isPlatformProfitable: boolean;
  recommendedMinContract: number;
}

const DESIGN_PACKAGE_FEES = {
  basic: 199,
  standard: 499,
  premium: 999,
};

const PLATFORM_COMMISSION_RATE = 0.035; // 3.5%
const PLATFORM_MIN_VIABLE_REVENUE = 100; // Minimum platform revenue to be viable

export function ProfitabilityEstimator() {
  const [inputs, setInputs] = useState<EstimatorInputs>({
    contractValue: 50000,
    laborCostPercent: 35,
    materialCostPercent: 30,
    overheadPercent: 10,
    designPackageTier: "standard",
  });

  const calculateProfitability = (): ProfitabilityResults => {
    const {
      contractValue,
      laborCostPercent,
      materialCostPercent,
      overheadPercent,
      designPackageTier,
    } = inputs;

    // Design package fee
    const designPackageFee = DESIGN_PACKAGE_FEES[designPackageTier];

    // Platform commission (3.5%)
    const platformCommission = contractValue * PLATFORM_COMMISSION_RATE;

    // Contractor receives contract value minus platform commission
    const contractorNetRevenue = contractValue - platformCommission;

    // Contractor costs
    const laborCost = contractValue * (laborCostPercent / 100);
    const materialCost = contractValue * (materialCostPercent / 100);
    const overhead = contractValue * (overheadPercent / 100);
    const totalCosts = laborCost + materialCost + overhead;

    // Contractor profit
    const contractorProfit = contractorNetRevenue - totalCosts;
    const contractorMargin = (contractorProfit / contractValue) * 100;

    // Platform revenue
    const totalPlatformRevenue = designPackageFee + platformCommission;

    // Profitability checks
    const isContractorProfitable = contractorProfit > 0;
    const isPlatformProfitable = totalPlatformRevenue >= PLATFORM_MIN_VIABLE_REVENUE;

    // Calculate minimum viable contract for contractor to break even
    const totalCostPercent = laborCostPercent + materialCostPercent + overheadPercent;
    const netMarginPercent = 100 - PLATFORM_COMMISSION_RATE * 100 - totalCostPercent;
    const recommendedMinContract = netMarginPercent > 0 ? 5000 : 0; // Base minimum

    return {
      designPackageFee,
      totalProjectCost: designPackageFee + contractValue,
      contractorGrossRevenue: contractValue,
      platformCommission,
      contractorNetRevenue,
      laborCost,
      materialCost,
      overhead,
      contractorProfit,
      contractorMargin,
      platformDesignFee: designPackageFee,
      platformCommissionFee: platformCommission,
      totalPlatformRevenue,
      isContractorProfitable,
      isPlatformProfitable,
      recommendedMinContract,
    };
  };

  const results = calculateProfitability();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-8">
      <h2 className="text-2xl font-black mb-2">Profitability Estimator</h2>
      <p className="text-zinc-500 mb-8">
        Verify that package tier pricing is profitable for both vendors and the platform
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold border-b pb-2">Project Parameters</h3>

          {/* Contract Value */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Contract Value
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
              <input
                type="number"
                value={inputs.contractValue}
                onChange={(e) => setInputs({ ...inputs, contractValue: Number(e.target.value) })}
                className="w-full pl-8 pr-4 py-3 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-2 flex gap-2">
              {[25000, 50000, 100000, 250000].map((v) => (
                <button
                  key={v}
                  onClick={() => setInputs({ ...inputs, contractValue: v })}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    inputs.contractValue === v
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {formatCurrency(v)}
                </button>
              ))}
            </div>
          </div>

          {/* Design Package Tier */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Design Package Tier
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["basic", "standard", "premium"] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setInputs({ ...inputs, designPackageTier: tier })}
                  className={`p-3 rounded-lg border text-center ${
                    inputs.designPackageTier === tier
                      ? "border-blue-500 bg-blue-50"
                      : "border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <div className="font-bold capitalize">{tier}</div>
                  <div className="text-sm text-zinc-500">
                    {formatCurrency(DESIGN_PACKAGE_FEES[tier])}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cost Percentages */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Labor Cost: {inputs.laborCostPercent}%
            </label>
            <input
              type="range"
              min="20"
              max="50"
              value={inputs.laborCostPercent}
              onChange={(e) => setInputs({ ...inputs, laborCostPercent: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Material Cost: {inputs.materialCostPercent}%
            </label>
            <input
              type="range"
              min="15"
              max="45"
              value={inputs.materialCostPercent}
              onChange={(e) => setInputs({ ...inputs, materialCostPercent: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Overhead: {inputs.overheadPercent}%
            </label>
            <input
              type="range"
              min="5"
              max="20"
              value={inputs.overheadPercent}
              onChange={(e) => setInputs({ ...inputs, overheadPercent: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold border-b pb-2">Profitability Analysis</h3>

          {/* Project Owner View */}
          <div className="bg-zinc-50 rounded-xl p-4">
            <h4 className="text-sm font-bold text-zinc-500 uppercase mb-3">Project Owner Costs</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Design Package Fee</span>
                <span className="font-semibold">{formatCurrency(results.designPackageFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Contract Value</span>
                <span className="font-semibold">{formatCurrency(inputs.contractValue)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-200 font-bold">
                <span>Total Project Cost</span>
                <span>{formatCurrency(results.totalProjectCost)}</span>
              </div>
            </div>
          </div>

          {/* Contractor View */}
          <div className={`rounded-xl p-4 ${results.isContractorProfitable ? "bg-emerald-50" : "bg-red-50"}`}>
            <h4 className="text-sm font-bold text-zinc-500 uppercase mb-3">Contractor Analysis</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Contract Value</span>
                <span className="font-semibold">{formatCurrency(results.contractorGrossRevenue)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Platform Commission (3.5%)</span>
                <span className="font-semibold">-{formatCurrency(results.platformCommission)}</span>
              </div>
              <div className="flex justify-between">
                <span>Net Revenue</span>
                <span className="font-semibold">{formatCurrency(results.contractorNetRevenue)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>- Labor ({inputs.laborCostPercent}%)</span>
                <span>-{formatCurrency(results.laborCost)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>- Materials ({inputs.materialCostPercent}%)</span>
                <span>-{formatCurrency(results.materialCost)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>- Overhead ({inputs.overheadPercent}%)</span>
                <span>-{formatCurrency(results.overhead)}</span>
              </div>
              <div className={`flex justify-between pt-2 border-t font-bold ${
                results.isContractorProfitable ? "text-emerald-700 border-emerald-200" : "text-red-700 border-red-200"
              }`}>
                <span>Contractor Profit</span>
                <span>{formatCurrency(results.contractorProfit)} ({formatPercent(results.contractorMargin)})</span>
              </div>
            </div>
          </div>

          {/* Platform View */}
          <div className={`rounded-xl p-4 ${results.isPlatformProfitable ? "bg-blue-50" : "bg-amber-50"}`}>
            <h4 className="text-sm font-bold text-zinc-500 uppercase mb-3">Platform Revenue</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Design Package Fee</span>
                <span className="font-semibold text-emerald-600">+{formatCurrency(results.platformDesignFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Commission (3.5%)</span>
                <span className="font-semibold text-emerald-600">+{formatCurrency(results.platformCommissionFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200 font-bold text-blue-700">
                <span>Total Platform Revenue</span>
                <span>{formatCurrency(results.totalPlatformRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl text-center ${
              results.isContractorProfitable ? "bg-emerald-100" : "bg-red-100"
            }`}>
              <div className="text-2xl mb-1">
                {results.isContractorProfitable ? "✅" : "❌"}
              </div>
              <div className={`text-sm font-bold ${
                results.isContractorProfitable ? "text-emerald-700" : "text-red-700"
              }`}>
                Contractor {results.isContractorProfitable ? "Profitable" : "Not Profitable"}
              </div>
            </div>
            <div className={`p-4 rounded-xl text-center ${
              results.isPlatformProfitable ? "bg-blue-100" : "bg-amber-100"
            }`}>
              <div className="text-2xl mb-1">
                {results.isPlatformProfitable ? "✅" : "⚠️"}
              </div>
              <div className={`text-sm font-bold ${
                results.isPlatformProfitable ? "text-blue-700" : "text-amber-700"
              }`}>
                Platform {results.isPlatformProfitable ? "Viable" : "Low Revenue"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-8 p-4 bg-zinc-50 rounded-xl">
        <h4 className="font-bold mb-2">Recommendations</h4>
        <ul className="text-sm text-zinc-600 space-y-1">
          {!results.isContractorProfitable && (
            <li className="text-red-600">
              • Contractor costs are too high. Consider reducing labor/material costs or increasing contract value.
            </li>
          )}
          {results.contractorMargin < 10 && results.isContractorProfitable && (
            <li className="text-amber-600">
              • Contractor margin is thin ({formatPercent(results.contractorMargin)}). Target 15-20% for healthy operations.
            </li>
          )}
          {results.contractorMargin >= 15 && (
            <li className="text-emerald-600">
              • Contractor margin is healthy at {formatPercent(results.contractorMargin)}.
            </li>
          )}
          <li>
            • Platform earns {formatCurrency(results.totalPlatformRevenue)} total per project
            ({formatCurrency(results.platformDesignFee)} design + {formatCurrency(results.platformCommissionFee)} commission)
          </li>
        </ul>
      </div>
    </div>
  );
}

export default ProfitabilityEstimator;
