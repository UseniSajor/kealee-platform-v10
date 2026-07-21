"use client";

import Link from "next/link";
import { useState } from "react";

const paymentMethods = [
  { id: "ach", name: "Bank Account (ACH)", icon: "🏦", fee: "Free", time: "2-3 business days" },
  { id: "wire", name: "Wire Transfer", icon: "💸", fee: "$25", time: "Same day" },
  { id: "card", name: "Credit/Debit Card", icon: "💳", fee: "2.9% + $0.30", time: "Instant" },
];

const savedAccounts = [
  { id: "bank-1", type: "ach", name: "Chase Checking", last4: "4521", default: true },
  { id: "bank-2", type: "ach", name: "Wells Fargo Savings", last4: "8832", default: false },
  { id: "card-1", type: "card", name: "Visa", last4: "4242", default: false },
];

const projects = [
  { id: "proj-1", name: "Modern Kitchen Remodel", balance: "$45,000.00" },
  { id: "proj-2", name: "Home Addition", balance: "$125,000.00" },
  { id: "proj-3", name: "Backyard Renovation", balance: "$32,500.00" },
  { id: "proj-4", name: "Master Bath Upgrade", balance: "$18,750.00" },
];

export default function DepositPage() {
  const [step, setStep] = useState(1);
  const [selectedProject, setSelectedProject] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ach");
  const [selectedAccount, setSelectedAccount] = useState("bank-1");

  const selectedMethodInfo = paymentMethods.find((m) => m.id === paymentMethod);
  const parsedAmount = parseFloat(amount) || 0;
  const fee = paymentMethod === "card" ? parsedAmount * 0.029 + 0.3 : paymentMethod === "wire" ? 25 : 0;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-500 hover:text-zinc-700">
              ← Back
            </Link>
            <div>
              <h1 className="text-2xl font-black">Deposit Funds</h1>
              <p className="text-sm text-zinc-500">Add funds to your escrow account</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: "Select Project" },
            { num: 2, label: "Enter Amount" },
            { num: 3, label: "Payment Method" },
            { num: 4, label: "Confirm" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                step >= s.num ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-500"
              }`}>
                {step > s.num ? "✓" : s.num}
              </div>
              <span className={`ml-2 text-sm font-medium ${step >= s.num ? "text-zinc-900" : "text-zinc-500"}`}>
                {s.label}
              </span>
              {i < 3 && <div className={`w-12 h-0.5 mx-4 ${step > s.num ? "bg-emerald-600" : "bg-zinc-200"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Project */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="text-lg font-bold mb-4">Select Project</h2>
            <p className="text-sm text-zinc-500 mb-6">Choose which project escrow account to fund</p>
            <div className="space-y-3">
              {projects.map((project) => (
                <label
                  key={project.id}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition ${
                    selectedProject === project.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="project"
                      value={project.id}
                      checked={selectedProject === project.id}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="font-medium">{project.name}</span>
                  </div>
                  <span className="text-sm text-zinc-500">Balance: {project.balance}</span>
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedProject}
                className="px-6 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Enter Amount */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="text-lg font-bold mb-4">Enter Deposit Amount</h2>
            <p className="text-sm text-zinc-500 mb-6">
              Project: {projects.find((p) => p.id === selectedProject)?.name}
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-zinc-400">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-4 text-3xl font-bold border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="mt-4 flex gap-2">
              {["5,000", "10,000", "25,000", "50,000"].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset.replace(",", ""))}
                  className="px-4 py-2 text-sm font-medium border border-zinc-200 rounded-lg hover:bg-zinc-50"
                >
                  ${preset}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!amount || parsedAmount <= 0}
                className="px-6 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment Method */}
        {step === 3 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="text-lg font-bold mb-4">Select Payment Method</h2>
            <div className="space-y-3 mb-6">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition ${
                    paymentMethod === method.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="method"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="text-xl">{method.icon}</span>
                    <div>
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-zinc-500">{method.time}</div>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${method.fee === "Free" ? "text-emerald-600" : "text-zinc-600"}`}>
                    {method.fee}
                  </span>
                </label>
              ))}
            </div>

            {paymentMethod !== "wire" && (
              <>
                <h3 className="text-sm font-semibold text-zinc-700 mb-3">Select Account</h3>
                <div className="space-y-2">
                  {savedAccounts
                    .filter((a) => a.type === paymentMethod || (paymentMethod === "ach" && a.type === "ach") || (paymentMethod === "card" && a.type === "card"))
                    .map((account) => (
                      <label
                        key={account.id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${
                          selectedAccount === account.id
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="account"
                            value={account.id}
                            checked={selectedAccount === account.id}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="w-4 h-4 text-emerald-600"
                          />
                          <div>
                            <div className="font-medium">{account.name} •••• {account.last4}</div>
                            {account.default && <span className="text-xs text-emerald-600">Default</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  <button className="w-full p-3 text-sm font-semibold text-emerald-600 border border-dashed border-zinc-300 rounded-lg hover:bg-zinc-50">
                    + Add New {paymentMethod === "card" ? "Card" : "Bank Account"}
                  </button>
                </div>
              </>
            )}

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-6 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="text-lg font-bold mb-4">Confirm Deposit</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-3 border-b border-zinc-100">
                <span className="text-zinc-500">Project</span>
                <span className="font-medium">{projects.find((p) => p.id === selectedProject)?.name}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-zinc-100">
                <span className="text-zinc-500">Payment Method</span>
                <span className="font-medium">{selectedMethodInfo?.name}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-zinc-100">
                <span className="text-zinc-500">Processing Time</span>
                <span className="font-medium">{selectedMethodInfo?.time}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-zinc-100">
                <span className="text-zinc-500">Deposit Amount</span>
                <span className="font-medium">${parsedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-zinc-100">
                <span className="text-zinc-500">Processing Fee</span>
                <span className={`font-medium ${fee === 0 ? "text-emerald-600" : ""}`}>
                  {fee === 0 ? "Free" : `$${fee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="font-bold">Total</span>
                <span className="text-xl font-black">${(parsedAmount + fee).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <span className="text-emerald-600">🔒</span>
                <div className="text-sm">
                  <div className="font-semibold text-emerald-800">Secure & Protected</div>
                  <div className="text-emerald-700">
                    Your funds are held in FDIC-insured trust accounts and released only upon your approval.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50"
              >
                Back
              </button>
              <button
                className="px-8 py-3 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Confirm Deposit
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
