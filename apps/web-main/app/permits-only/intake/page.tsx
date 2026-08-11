import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Permit Path Intake | Kealee",
  description:
    "Organize your project, jurisdiction, plans, and supporting permit evidence.",
};

export default function PermitPathIntakePage() {
  redirect("/intake/permit_path_only");
}
