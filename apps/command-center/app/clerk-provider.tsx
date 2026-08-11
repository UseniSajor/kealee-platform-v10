"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

export function ClerkProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#FF8C22",
          colorText: "#1F2937",
          colorBackground: "#FFFFFF",
          colorInputBorder: "#E5E7EB",
          colorInputText: "#1F2937",
          colorNeutral: "#F3F4F6",
          fontFamily: "'Nunito', sans-serif",
          fontSize: "14px",
        },
        elements: {
          formButtonPrimary: "bg-[#FF8C22] hover:bg-[#E67E1A] text-white font-semibold rounded-lg",
          card: "bg-white border border-[#E5E7EB] rounded-lg shadow-sm",
          headerTitle: "text-2xl font-bold text-[#1F2937]",
          headerSubtitle: "text-[#6B7280]",
          dividerLine: "bg-[#E5E7EB]",
          footerActionLink: "text-[#FF8C22] hover:text-[#E67E1A]",
          formResendCodeLink: "text-[#FF8C22]",
          socialButtonsIconButton: "border-[#E5E7EB]",
          input: "border-[#E5E7EB] rounded-lg focus:border-[#FF8C22] focus:ring-[#FF8C22]",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
