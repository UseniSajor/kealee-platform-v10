import Link from "next/link";

export default function ContractorsPage() {
  return (
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>Why GCs use Kealee</h1>
      <p style={{ marginTop: 12 }}>
        Placeholder page explaining why contractors benefit from ops services.
      </p>
      <p style={{ marginTop: 16 }}>
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}

