import { z } from "zod";

export const intakeSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  company: z.string().min(1, "Company/Organization is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  role: z.enum([
    "Owner",
    "Developer",
    "Investor",
    "Asset Manager",
    "Non-profit",
    "Other"
  ]),
  location: z.string().min(2, "Location is required"),
  assetType: z.enum([
    "Multifamily",
    "Mixed-use",
    "Townhomes",
    "SFD",
    "Commercial",
    "Industrial",
    "Other"
  ]),
  units: z.string().min(1, "Units or N/A is required"),
  notUnitBased: z.boolean().default(false),
  projectStage: z.enum([
    "Pre-acquisition",
    "Under contract",
    "Design",
    "Permitting",
    "Bidding",
    "In construction",
    "Stalled/Rescue"
  ]),
  budgetRange: z.enum([
    "< $1M",
    "$1–5M",
    "$5–15M",
    "$15–50M",
    "$50M+"
  ]),
  timeline: z.enum([
    "0–3 mo",
    "3–6 mo",
    "6–12 mo",
    "12+ mo"
  ]),
  needsHelp: z.array(z.string()).min(1, "Select at least one area where you need help"),
  message: z.string().min(10, "Please provide a project summary (minimum 10 characters)"),
  consent: z.boolean().refine(val => val === true, {
    message: "You must accept the consent agreement"
  }),
  // Honeypot field - should always be empty
  website: z.string().max(0).optional(),
  // Timestamp for spam prevention
  submittedAt: z.number()
});

export type IntakeFormData = z.infer<typeof intakeSchema>;
