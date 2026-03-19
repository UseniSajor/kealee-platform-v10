"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PACKAGE_TIERS } from "@kealee/shared/intake";

function PayContent() {
  const params = useSearchParams();
  const router = useRouter();
  const intakeId = params.get("intakeId") ?? "";
  const [selectedTier, setSelectedTier] = useState<string>("professional");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (!intakeId) {
      setError("No intake ID found. Please go back and resubmit.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const appUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL ?? "";
      const res = await fetch("/api/concepts/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeId,
          packageTier: selectedTier,
          successUrl: `${appUrl}/concepts/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${appUrl}/concepts/pay?intakeId=${intakeId}`,
        }),
      });
      if (!res.ok) throw new Error("Failed to create checkout session");
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Choose Your Package</h1>
        <p className="mt-2 text-slate-500">
          Select the concept package that fits your project needs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PACKAGE_TIERS.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => setSelectedTier(pkg.id)}
            className={`relative rounded-2xl border-2 p-6 text-left transition-all ${
              selectedTier === pkg.id
                ? "border-black shadow-lg"
                : "border-slate-200 hover:border-slate-300"
            } ${pkg.highlighted ? "ring-2 ring-black ring-offset-2" : ""}`}
          >
            {pkg.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-black px-3 py-0.5 text-xs font-medium text-white">
                Most Popular
              </div>
            )}
            <div className="mb-4">
              <div className="text-lg font-semibold">{pkg.name}</div>
              <div className="mt-1 text-3xl font-bold">
                ${pkg.price.toLocaleString()}
              </div>
            </div>
            <ul className="space-y-2">
              {pkg.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            {selectedTier === pkg.id && (
              <div className="mt-4 rounded-xl bg-black py-1.5 text-center text-xs font-medium text-white">
                Selected
              </div>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border px-5 py-2.5 text-sm hover:bg-slate-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={isLoading || !intakeId}
          className="rounded-xl bg-black px-8 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Redirecting to checkout..." : "Pay with Stripe →"}
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Secure payment powered by Stripe. No subscription. One-time payment only.
      </p>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-400">Loading...</div>}>
      <PayContent />
    </Suspense>
  );
}
