"use client";

import Link from "next/link";
import { ServiceRequestWizard } from "@/components/portal/ServiceRequestWizard";

export default function NewServiceRequestPage() {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">New service request</h1>
          <p className="mt-2 text-sm text-zinc-700">
            Request help from the Kealee PM team (permits, inspections, coordination, billing, and more).
          </p>
        </div>
        <Link
          href="/portal/service-requests"
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
        >
          Back to requests
        </Link>
      </div>

      <ServiceRequestWizard packageName="Package B" slaText="Package B: 40 service hours/month" />
    </section>
  );
}

