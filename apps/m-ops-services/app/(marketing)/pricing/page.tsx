import Link from "next/link";

export default function PricingPage() {
  return (
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>GC Packages</h1>
      <p style={{ marginTop: 12 }}>
        Placeholder pricing page for packages A–D. (Wiring to real pricing comes
        next.)
      </p>
      <p style={{ marginTop: 16 }}>
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}

