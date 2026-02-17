import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kealee - Admin Console",
  description: "Internal admin console for Kealee staff",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    images: [{ url: 'https://kealee.com/kealee-og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
          <Toaster position="top-right" />
        </ErrorBoundary>
      </body>
    </html>
  );
}
