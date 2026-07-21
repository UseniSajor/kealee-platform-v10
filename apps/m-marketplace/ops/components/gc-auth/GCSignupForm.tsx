"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type CompanyType =
  | "General Contractor"
  | "Custom Home Builder"
  | "Commercial GC"
  | "Remodeler";

type Specialty = "Residential" | "Commercial" | "Mixed-Use";

type RevenueRange =
  | "<$500k"
  | "$500k-$1M"
  | "$1M-$3M"
  | "$3M-$10M"
  | "$10M+";

type ContactRole = "Owner" | "Project Manager" | "Operations Manager";

type PackageKey = "A" | "B" | "C" | "D";
type BillingCycle = "monthly" | "annual";
type Step = 1 | 2 | 3 | 4 | 5;

const PACKAGE_MONTHLY: Record<PackageKey, number> = {
  A: 1750,
  B: 3750,
  C: 9500,
  D: 16500,
};

function annualFromMonthly(monthly: number) {
  return Math.round(monthly * 12 * 0.85);
}

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function isEmailLike(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function StepPill({
  index,
  label,
  active,
  done,
}: {
  index: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={[
          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-black",
          done
            ? "bg-emerald-100 text-emerald-700"
            : active
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "bg-zinc-100 text-zinc-600",
        ].join(" ")}
      >
        {index}
      </div>
      <div
        className={[
          "text-xs font-bold",
          active ? "text-zinc-950" : "text-zinc-600",
        ].join(" ")}
      >
        {label}
      </div>
    </div>
  );
}

export function GCSignupForm() {
  const search = useSearchParams();

  const checkoutState = search.get("checkout"); // success | canceled

  const [step, setStep] = useState<Step>(1);

  // STEP 1 - company info
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState<CompanyType>("General Contractor");
  const [yearsInBusiness, setYearsInBusiness] = useState<number>(5);
  const [employees, setEmployees] = useState<number>(5);
  const [statesLicensedIn, setStatesLicensedIn] = useState<string>("");
  const [annualRevenueRange, setAnnualRevenueRange] = useState<RevenueRange>("$1M-$3M");
  const [specialty, setSpecialty] = useState<Specialty>("Residential");

  // STEP 2 - package
  const [selectedPackage, setSelectedPackage] = useState<PackageKey>("B");

  // STEP 3 - primary contact
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRole, setContactRole] = useState<ContactRole>("Owner");

  // STEP 4 - payment
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // STEP 5 - onboarding questionnaire
  const [onboardingActiveProjects, setOnboardingActiveProjects] = useState<number>(3);
  const [biggestPainPoint, setBiggestPainPoint] = useState<
    "Permits" | "Scheduling" | "Billing" | "Subcontractors" | "Client Comms" | "Other"
  >("Permits");
  const [currentSoftware, setCurrentSoftware] = useState<string>("");
  const [teamInvites, setTeamInvites] = useState<string>("");

  const price = useMemo(() => {
    const monthly = PACKAGE_MONTHLY[selectedPackage];
    return billingCycle === "annual" ? annualFromMonthly(monthly) : monthly;
  }, [billingCycle, selectedPackage]);

  const prevStep = (s: Step): Step => {
    switch (s) {
      case 1:
        return 1;
      case 2:
        return 1;
      case 3:
        return 2;
      case 4:
        return 3;
      case 5:
        return 4;
    }
  };

  const nextStep = (s: Step): Step => {
    switch (s) {
      case 1:
        return 2;
      case 2:
        return 3;
      case 3:
        return 4;
      case 4:
        return 5;
      case 5:
        return 5;
    }
  };

  useEffect(() => {
    // If returning from Stripe, move forward appropriately
    if (checkoutState === "success") setStep(5);
    if (checkoutState === "canceled") setStep(4);
  }, [checkoutState]);

  const step1Valid = companyName.trim().length >= 2;
  const step3Valid =
    contactName.trim().length >= 2 &&
    isEmailLike(contactEmail) &&
    contactPhone.trim().length >= 7;

  async function startStripeCheckout() {
    setPaymentError(null);
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageKey: selectedPackage,
          billingCycle,
          company: {
            name: companyName,
            type: companyType,
            yearsInBusiness,
            employees,
            statesLicensedIn,
            annualRevenueRange,
            specialty,
          },
          primaryContact: {
            name: contactName,
            email: contactEmail,
            phone: contactPhone,
            role: contactRole,
          },
        }),
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to start checkout");
      }
      window.location.href = data.url;
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to start checkout";
      setPaymentError(message);
      setPaymentLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap gap-4">
        <StepPill index={1} label="Company" active={step === 1} done={step > 1} />
        <StepPill index={2} label="Package" active={step === 2} done={step > 2} />
        <StepPill index={3} label="Contact" active={step === 3} done={step > 3} />
        <StepPill index={4} label="Payment" active={step === 4} done={step > 4} />
        <StepPill index={5} label="Onboarding" active={step === 5} done={false} />
      </div>

      <div className="mt-6">
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-black">Step 1: Company Information</div>
              <div className="mt-1 text-sm text-zinc-700">
                Tell us about your GC business so we can configure ops support.
              </div>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-zinc-900">Company Name</span>
              <input
                className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Construction LLC"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-zinc-900">Company Type</span>
                <select
                  className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value as CompanyType)}
                >
                  <option>General Contractor</option>
                  <option>Custom Home Builder</option>
                  <option>Commercial GC</option>
                  <option>Remodeler</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-zinc-900">Specialty</span>
                <select
                  className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value as Specialty)}
                >
                  <option>Residential</option>
                  <option>Commercial</option>
                  <option>Mixed-Use</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-zinc-900">Years in Business</span>
                <input
                  className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  type="number"
                  min={0}
                  value={yearsInBusiness}
                  onChange={(e) => setYearsInBusiness(Number(e.target.value))}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-zinc-900">Number of Employees</span>
                <input
                  className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  type="number"
                  min={1}
                  value={employees}
                  onChange={(e) => setEmployees(Number(e.target.value))}
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-zinc-900">
                  States Licensed In
                </span>
                <input
                  className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  value={statesLicensedIn}
                  onChange={(e) => setStatesLicensedIn(e.target.value)}
                  placeholder="CA, NV, AZ"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-zinc-900">
                  Annual Revenue Range
                </span>
                <select
                  className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  value={annualRevenueRange}
                  onChange={(e) => setAnnualRevenueRange(e.target.value as RevenueRange)}
                >
                  <option>{"<$500k"}</option>
                  <option>$500k-$1M</option>
                  <option>$1M-$3M</option>
                  <option>$3M-$10M</option>
                  <option>$10M+</option>
                </select>
              </label>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-black">Step 2: Package Selection</div>
              <div className="mt-1 text-sm text-zinc-700">
                Choose the ops coverage that matches your current project load.
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {(
                [
                  {
                    key: "A",
                    title: "Package A",
                    desc: "For solo GCs or small teams (1-2 projects)",
                    tag: undefined,
                  },
                  {
                    key: "B",
                    title: "Package B",
                    desc: "For growing GCs (3-5 projects)",
                    tag: "⭐ RECOMMENDED",
                  },
                  {
                    key: "C",
                    title: "Package C",
                    desc: "For established GCs (6-10 projects)",
                    tag: undefined,
                  },
                  {
                    key: "D",
                    title: "Package D",
                    desc: "For large GC firms (10+ projects)",
                    tag: undefined,
                  },
                ] as const
              ).map((p) => {
                const active = selectedPackage === p.key;
                const monthly = PACKAGE_MONTHLY[p.key];
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setSelectedPackage(p.key)}
                    className={[
                      "text-left rounded-2xl border p-4 shadow-sm transition",
                      active
                        ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/15"
                        : "border-black/10 hover:bg-zinc-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-zinc-950">{p.title}</div>
                        <div className="mt-1 text-sm text-zinc-700">{p.desc}</div>
                      </div>
                      {p.tag ? (
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-black text-sky-700">
                          {p.tag}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 text-sm font-extrabold text-zinc-950">
                      {formatMoney(monthly)}/mo{" "}
                      <span className="font-semibold text-zinc-600">
                        or {formatMoney(annualFromMonthly(monthly))}/yr
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-black">Step 3: Primary Contact</div>
              <div className="mt-1 text-sm text-zinc-700">
                Who should we coordinate with day-to-day?
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-zinc-900">Name</span>
                <input
                  className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-zinc-900">Role</span>
                <select
                  className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value as ContactRole)}
                >
                  <option>Owner</option>
                  <option>Project Manager</option>
                  <option>Operations Manager</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-zinc-900">Email</span>
                <input
                  className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="jane@yourgc.com"
                  inputMode="email"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-zinc-900">Phone</span>
                <input
                  className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  inputMode="tel"
                />
              </label>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-black">Step 4: Payment (Stripe)</div>
              <div className="mt-1 text-sm text-zinc-700">
                14-day free trial. Cancel anytime. Money-back guarantee.
              </div>
            </div>

            {checkoutState === "canceled" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Checkout was canceled. You can try again whenever you&apos;re ready.
              </div>
            ) : null}

            {paymentError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                {paymentError}
              </div>
            ) : null}

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-zinc-950">
                    Package {selectedPackage}
                    {selectedPackage === "B" ? " (Recommended)" : ""}
                  </div>
                  <div className="mt-1 text-sm text-zinc-700">
                    Choose monthly or annual billing.
                  </div>
                </div>
                <div className="inline-flex overflow-hidden rounded-xl border border-black/10 bg-white">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("monthly")}
                    className={[
                      "px-3 py-2 text-sm font-extrabold",
                      billingCycle === "monthly"
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-white text-zinc-800",
                    ].join(" ")}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("annual")}
                    className={[
                      "px-3 py-2 text-sm font-extrabold",
                      billingCycle === "annual"
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-white text-zinc-800",
                    ].join(" ")}
                  >
                    Annual (save 15%)
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <div className="text-xs font-semibold text-zinc-600">Price</div>
                  <div className="mt-1 text-xl font-black text-zinc-950">
                    {formatMoney(price)}
                    <span className="text-sm font-bold text-zinc-600">
                      {billingCycle === "annual" ? "/yr" : "/mo"}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <div className="text-xs font-semibold text-zinc-600">Trial</div>
                  <div className="mt-1 text-xl font-black text-zinc-950">14 days</div>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <div className="text-xs font-semibold text-zinc-600">Guarantee</div>
                  <div className="mt-1 text-xl font-black text-zinc-950">Money-back</div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={startStripeCheckout}
                  disabled={paymentLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-95 disabled:opacity-60"
                >
                  {paymentLoading ? "Redirecting to Stripe…" : "Continue to Secure Checkout"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-black">Step 5: Onboarding Questionnaire</div>
              <div className="mt-1 text-sm text-zinc-700">
                A few quick questions so we can tailor ops support to your workflow.
              </div>
            </div>

            {checkoutState === "success" ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Payment confirmed. Let&apos;s finish setup.
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-zinc-900">
                  How many active projects do you have?
                </span>
                <input
                  className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  type="number"
                  min={0}
                  value={onboardingActiveProjects}
                  onChange={(e) => setOnboardingActiveProjects(Number(e.target.value))}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-zinc-900">
                  What&apos;s your biggest pain point?
                </span>
                <select
                  className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  value={biggestPainPoint}
                  onChange={(e) =>
                    setBiggestPainPoint(
                      e.target.value as typeof biggestPainPoint
                    )
                  }
                >
                  <option>Permits</option>
                  <option>Scheduling</option>
                  <option>Billing</option>
                  <option>Subcontractors</option>
                  <option>Client Comms</option>
                  <option>Other</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-zinc-900">
                Current software used? (BuilderTrend, CoConstruct, etc.)
              </span>
              <input
                className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                value={currentSoftware}
                onChange={(e) => setCurrentSoftware(e.target.value)}
                placeholder="BuilderTrend, QuickBooks, Google Drive…"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-zinc-900">
                Team members to invite? (emails, one per line)
              </span>
              <textarea
                className="min-h-[92px] rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                value={teamInvites}
                onChange={(e) => setTeamInvites(e.target.value)}
                placeholder={"pm@yourgc.com\nops@yourgc.com"}
              />
            </label>

            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-800">
              <div className="font-black text-zinc-950">Next</div>
              <div className="mt-1 text-sm text-zinc-700">
                We&apos;ll use these answers to set up reporting, templates, and the
                first ops tasks for your team.
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          onClick={() => setStep((s) => prevStep(s))}
          disabled={step === 1 || paymentLoading}
        >
          Back
        </button>

        <div className="flex items-center gap-2">
          {step < 5 ? (
            <button
              type="button"
              className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95 disabled:opacity-50"
              onClick={() => setStep((s) => nextStep(s))}
              disabled={
                paymentLoading ||
                (step === 1 && !step1Valid) ||
                (step === 3 && !step3Valid) ||
                step === 4 // Step 4 advances via Stripe
              }
              title={
                step === 1 && !step1Valid
                  ? "Enter a company name"
                  : step === 3 && !step3Valid
                    ? "Enter name, valid email, and phone"
                    : undefined
              }
            >
              Next
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

