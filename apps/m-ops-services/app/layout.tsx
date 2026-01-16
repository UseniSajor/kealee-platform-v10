import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Kealee Ops Services (GC Portal)",
  description: "Customer-facing ops services portal for general contractors.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0ea5e9" />
      </head>
      <body>{children}</body>
    </html>
  );
}

