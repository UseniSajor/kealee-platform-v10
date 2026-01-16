import Link from "next/link";

export default function CaseStudiesPage() {
  return (
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>Case studies</h1>
      <p style={{ marginTop: 12 }}>
        Placeholder page for GC success stories.
      </p>
      <p style={{ marginTop: 16 }}>
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}

