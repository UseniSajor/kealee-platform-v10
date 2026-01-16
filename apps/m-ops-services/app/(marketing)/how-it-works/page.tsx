import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>How it works</h1>
      <ol style={{ marginTop: 12, paddingLeft: 18 }}>
        <li>Pick a package (A–D) during signup.</li>
        <li>Connect your first project and submit service requests.</li>
        <li>Kealee handles ops tasks and shares weekly reports.</li>
      </ol>
      <p style={{ marginTop: 16 }}>
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}

