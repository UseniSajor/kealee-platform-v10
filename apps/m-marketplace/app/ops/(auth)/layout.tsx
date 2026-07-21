import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/ops">← Back</Link>
      </div>
      {children}
    </main>
  );
}

