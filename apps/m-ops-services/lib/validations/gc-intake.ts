import { z } from "zod";

export const gcIntakeSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  company: z.string().min(1, "Company name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  role: z.enum([
    "Owner",
    "Project Manager",
    "Operations Manager",
    "Foreman",
    "Other"
  ]),
  
  // GC Business Details
  gcType: z.enum([
    "Residential GC",
    "Commercial GC",
    "Multi-Family",
    "Remodeling",
    "Mixed-Use",
    "Specialty"
  ]),
  teamSize: z.enum([
    "Solo (just me)",
    "2-5 people",
    "6-15 people",
    "16-30 people",
    "30+ people"
  ]),
  projectsPerYear: z.enum([
    "1-5 projects",
    "6-15 projects",
    "16-30 projects",
    "30+ projects"
  ]),
  averageProjectValue: z.enum([
    "< $250K",
    "$250K-$1M",
    "$1M-$5M",
    "$5M-$15M",
    "$15M+"
  ]),
  serviceArea: z.string().min(2, "Service area is required"),
  
  // Current Challenges
  challenges: z.array(z.string()).min(1, "Select at least one challenge"),
  packageInterest: z.enum([
    "Package A - Solo GC ($1,750/mo)",
    "Package B - Growing Team ($3,750/mo)",
    "Package C - Multiple Projects ($9,500/mo)",
    "Package D - Enterprise GC ($16,500/mo)",
    "Not sure - need consultation"
  ]),
  
  message: z.string().min(10, "Please tell us about your needs (minimum 10 characters)"),
  consent: z.boolean().refine(val => val === true, {
    message: "You must accept the terms"
  }),
  
  // Honeypot and spam prevention
  website: z.string().max(0).optional(),
  submittedAt: z.number()
});

export type GCIntakeFormData = z.infer<typeof gcIntakeSchema>;
