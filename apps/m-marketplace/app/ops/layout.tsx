import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Kealee Ops Services - Professional Project Management for General Contractors",
  description: "Outsource your operations department with packages from $1,750/month. Permits tracking, weekly reporting, vendor management, and project coordination.",
};

export default function OpsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}

