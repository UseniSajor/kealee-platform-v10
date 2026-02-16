import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kealee Ops Services - Professional Project Management for General Contractors",
  description: "Outsource your operations department with packages from $1,750/month. Permits tracking, weekly reporting, vendor management, and project coordination. Free 14-day trial.",
  keywords: "general contractor operations, construction project management, GC operations outsourcing, permit tracking, construction coordination, contractor services",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/kealee-icon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/kealee-icon-192x192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "Kealee Ops Services - Professional GC Operations Management",
    description: "Let us become your operations department. Permits, inspections, weekly reports, and vendor coordination—all handled professionally.",
    type: "website",
    images: [
      {
        url: '/kealee-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Kealee Construction',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/kealee-og-image.jpg'],
  },
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
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

