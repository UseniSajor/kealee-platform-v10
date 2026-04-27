"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function EscrowDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-xl border border-zinc-200 p-10 max-w-md w-full text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-zinc-900 mb-2">Escrow Account</h1>
        <p className="text-sm font-mono text-zinc-500 mb-4">{id}</p>
        <p className="text-sm text-zinc-500 mb-6">
          Escrow account details are loading from the financial system. Please check back shortly or contact your project manager.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50 transition"
        >
          ← Back
        </Link>
      </div>
    </div>
  );
}
