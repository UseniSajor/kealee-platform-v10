import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ClientToaster } from "../components/client-toaster";
import "./globals.css";

export const dynamic = "force-dynamic";

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
    <ClerkProvider>
      <html lang="en">
        <body className="font-sans antialiased">
          <ErrorBoundary>
            {children}
            <ClientToaster />
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
