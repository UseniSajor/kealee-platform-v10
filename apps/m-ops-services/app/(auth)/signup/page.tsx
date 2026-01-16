import { GCSignupForm } from "@/components/gc-auth/GCSignupForm";
import { Suspense } from "react";

export default function SignupPage() {
  return (
    <section className="space-y-3">
      <div>
        <h1 className="text-3xl font-black tracking-tight">GC Company Signup</h1>
        <p className="mt-2 text-sm text-zinc-700">
          Start your 14-day free trial and get back to building while we handle
          operations.
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-zinc-700">Loading…</div>}>
        <GCSignupForm />
      </Suspense>
    </section>
  );
}

